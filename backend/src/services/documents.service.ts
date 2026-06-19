import { and, desc, eq } from 'drizzle-orm'
import { documents, subscriptions } from '../db/schema.js'
import { requireDb } from '../db/client.js'
import { AppError } from '../utils/app-error.js'
import { analyzeDocumentWithRules, checkDocumentFraud } from './document-analysis.service.js'
import { notifyDocumentStatusChanged, notifyDocumentSubmitted } from './notifications.service.js'
import { createPrivateSignedUrl, decodeStorageDocumentId, DOCUMENTS_BUCKET, removePrivateObject, parseSubscriptionDocumentStoragePath, uploadSubscriptionDocumentFile } from './storage.service.js'
import type { CreateDocumentInput, ManualReviewInput, ResubmitDocumentInput, UpdateDocumentStatusInput } from '../validation/document.schemas.js'
import { evaluateSubscriptionWorkflow, normalizeDocumentType, reconcileSubscriptionWorkflow } from './subscription-workflow.service.js'

type DocumentRow = typeof documents.$inferSelect

const documentSelection = {
  id: documents.id,
  subscriptionId: documents.subscriptionId,
  ownerId: documents.ownerId,
  type: documents.type,
  fileUrl: documents.fileUrl,
  storageBucket: documents.storageBucket,
  storagePath: documents.storagePath,
  originalFilename: documents.originalFilename,
  mimeType: documents.mimeType,
  sizeBytes: documents.sizeBytes,
  status: documents.status,
  analysisResult: documents.analysisResult,
  analyzedAt: documents.analyzedAt,
  rejectionReason: documents.rejectionReason,
  createdAt: documents.createdAt,
  updatedAt: documents.updatedAt,
}

async function findSubscriptionForAccess(userId: string, role: string, subscriptionId: string) {
  const where = role === 'admin'
    ? eq(subscriptions.id, subscriptionId)
    : and(eq(subscriptions.id, subscriptionId), eq(subscriptions.userId, userId))

  const [subscription] = await requireDb()
    .select()
    .from(subscriptions)
    .where(where)
    .limit(1)

  if (!subscription) throw new AppError(404, 'Souscription introuvable.')
  return subscription
}

async function findDocumentForAccess(userId: string, role: string, id: string) {
  if (id.startsWith('storage_')) throw new AppError(404, 'Document introuvable.')

  const [row] = await requireDb()
    .select({ document: documentSelection, subscriptionUserId: subscriptions.userId })
    .from(documents)
    .innerJoin(subscriptions, eq(documents.subscriptionId, subscriptions.id))
    .where(eq(documents.id, id))
    .limit(1)

  if (!row || (role !== 'admin' && row.subscriptionUserId !== userId)) throw new AppError(404, 'Document introuvable.')
  return row.document
}

async function findStorageDocumentForAccess(userId: string, role: string, id: string) {
  const path = decodeStorageDocumentId(id)
  const parsed = path ? parseSubscriptionDocumentStoragePath(path) : null
  if (!parsed) throw new AppError(404, 'Document introuvable.')

  const subscription = await findSubscriptionForAccess(userId, role, parsed.subscriptionId)
  if (subscription.userId !== parsed.userId) throw new AppError(404, 'Document introuvable.')

  return {
    id,
    subscriptionId: parsed.subscriptionId,
    ownerId: parsed.userId,
    type: parsed.type,
    fileUrl: path,
    storageBucket: DOCUMENTS_BUCKET,
    storagePath: path,
    originalFilename: parsed.filename,
    mimeType: null,
    sizeBytes: null,
    status: 'pending',
    analysisResult: {
      provider: 'storage-fallback',
      warnings: ['Fichier present dans Supabase Storage sans ligne document associee.'],
    },
    analyzedAt: null,
    rejectionReason: null,
    createdAt: null,
    updatedAt: null,
  }
}

async function publicDocument(document: DocumentRow) {
  return {
    document: {
      ...document,
      signedUrl: await createPrivateSignedUrl(document.storageBucket, document.storagePath),
    },
  }
}

async function publicDocuments(rows: DocumentRow[]) {
  return Promise.all(rows.map(async (document) => ({
    ...document,
    signedUrl: await createPrivateSignedUrl(document.storageBucket, document.storagePath),
  })))
}

export async function createDocument(
  userId: string,
  role: string,
  subscriptionId: string,
  input: CreateDocumentInput,
  file: Express.Multer.File | undefined,
) {
  const subscription = await findSubscriptionForAccess(userId, role, subscriptionId)
  if (!file) throw new AppError(400, 'Aucun fichier fourni.')
  if (role !== 'admin') {
    const workflow = await evaluateSubscriptionWorkflow(subscriptionId)
    if (!workflow.replaceableDocumentTypes.includes(normalizeDocumentType(input.type))) {
      throw new AppError(409, "Ce document ne peut pas être déposé à cette étape du dossier.")
    }
  }
  const [existing] = await requireDb().select({ id: documents.id }).from(documents)
    .where(and(eq(documents.subscriptionId, subscriptionId), eq(documents.type, input.type)))
    .limit(1)
  if (existing) throw new AppError(409, 'Ce type de document existe déjà. Utilisez le remplacement.')

  const uploaded = await uploadSubscriptionDocumentFile(subscription.userId, subscriptionId, input.type, file)
  let created: DocumentRow

  try {
    const [row] = await requireDb()
      .insert(documents)
      .values({
        subscriptionId,
        ownerId: subscription.userId,
        type: input.type,
        fileUrl: uploaded.path,
        storageBucket: uploaded.bucket,
        storagePath: uploaded.path,
        originalFilename: uploaded.originalFilename,
        mimeType: uploaded.mimeType,
        sizeBytes: uploaded.sizeBytes,
        status: 'pending',
        analysisResult: {
          provider: 'pending-final-submission',
          message: "L'analyse sera lancée lors de l'envoi final du dossier.",
        },
        analyzedAt: null,
        rejectionReason: null,
      })
      .returning(documentSelection)

    if (!row) throw new AppError(500, "Le document n'a pas pu etre cree.")
    created = row
  } catch (error) {
    await removePrivateObject(uploaded.bucket, uploaded.path)
    throw error
  }

  await notifyDocumentSubmitted({
    userId: subscription.userId,
    subscriptionId,
    documentId: created.id,
    documentType: created.type,
  })
  await reconcileSubscriptionWorkflow(subscriptionId)
  return publicDocument(created)
}

export async function listDocumentsForSubscription(userId: string, role: string, subscriptionId: string) {
  await findSubscriptionForAccess(userId, role, subscriptionId)
  const rows = await requireDb()
    .select(documentSelection)
    .from(documents)
    .where(eq(documents.subscriptionId, subscriptionId))
    .orderBy(desc(documents.updatedAt))

  return { documents: await publicDocuments(rows) }
}

export async function getDocument(userId: string, role: string, id: string) {
  return publicDocument(await findDocumentForAccess(userId, role, id))
}

export async function getDocumentSignedUrl(userId: string, role: string, id: string) {
  if (id.startsWith('storage_')) {
    const document = await findStorageDocumentForAccess(userId, role, id)
    return {
      documentId: document.id,
      signedUrl: await createPrivateSignedUrl(document.storageBucket, document.storagePath),
    }
  }

  const document = await findDocumentForAccess(userId, role, id)
  return {
    documentId: document.id,
    signedUrl: await createPrivateSignedUrl(document.storageBucket, document.storagePath),
  }
}

export async function deleteDocument(userId: string, role: string, id: string) {
  if (id.startsWith('storage_')) {
    const document = await findStorageDocumentForAccess(userId, role, id)
    await removePrivateObject(document.storageBucket, document.storagePath)
    return { deleted: true, id }
  }

  const document = await findDocumentForAccess(userId, role, id)
  await requireDb().delete(documents).where(eq(documents.id, id))
  await removePrivateObject(document.storageBucket, document.storagePath)
  await reconcileSubscriptionWorkflow(document.subscriptionId)
  return { deleted: true, id }
}

export async function updateDocumentStatus(userId: string, role: string, id: string, input: UpdateDocumentStatusInput) {
  const current = await findDocumentForAccess(userId, role, id)
  const [updated] = await requireDb()
    .update(documents)
    .set({
      status: input.status,
      rejectionReason: input.status === 'rejected' ? input.rejectionReason : null,
      updatedAt: new Date(),
    })
    .where(eq(documents.id, id))
    .returning(documentSelection)

  if (!updated) throw new AppError(500, "Le statut du document n'a pas pu etre mis a jour.")
  await notifyDocumentStatusChanged({
    userId: updated.ownerId,
    subscriptionId: updated.subscriptionId,
    documentId: updated.id,
    documentType: updated.type,
    previousStatus: current.status,
    status: updated.status,
    rejectionReason: updated.rejectionReason,
  })
  await reconcileSubscriptionWorkflow(updated.subscriptionId)
  return publicDocument(updated)
}

export async function resubmitDocument(
  userId: string,
  role: string,
  id: string,
  input: ResubmitDocumentInput,
  file: Express.Multer.File | undefined,
) {
  const current = await findDocumentForAccess(userId, role, id)
  if (!file) throw new AppError(400, 'Aucun fichier fourni.')
  const subscription = await findSubscriptionForAccess(userId, role, current.subscriptionId)
  const nextType = input.type ?? current.type
  if (role !== 'admin' && subscription.submittedAt) {
    const workflow = await evaluateSubscriptionWorkflow(current.subscriptionId)
    if (!workflow.replaceableDocumentTypes.includes(normalizeDocumentType(nextType))) {
      throw new AppError(409, 'Seul un document refusé ou manquant peut être remplacé après envoi.')
    }
  }
  const ownerId = current.ownerId ?? userId
  const uploaded = await uploadSubscriptionDocumentFile(ownerId, current.subscriptionId, nextType, file)
  let updated: DocumentRow

  try {
    const [row] = await requireDb()
      .update(documents)
      .set({
        type: nextType,
        ownerId,
        fileUrl: uploaded.path,
        storageBucket: uploaded.bucket,
        storagePath: uploaded.path,
        originalFilename: uploaded.originalFilename,
        mimeType: uploaded.mimeType,
        sizeBytes: uploaded.sizeBytes,
        status: 'pending',
        analysisResult: {
          provider: 'pending-final-submission',
          message: "L'analyse sera lancée lors de l'envoi final du dossier.",
        },
        analyzedAt: null,
        rejectionReason: null,
        updatedAt: new Date(),
      })
      .where(eq(documents.id, id))
      .returning(documentSelection)

    if (!row) throw new AppError(500, "Le document n'a pas pu etre renvoye.")
    updated = row
  } catch (error) {
    await removePrivateObject(uploaded.bucket, uploaded.path)
    throw error
  }

  await removePrivateObject(current.storageBucket, current.storagePath)
  await notifyDocumentSubmitted({
    userId: ownerId,
    subscriptionId: updated.subscriptionId,
    documentId: updated.id,
    documentType: updated.type,
    resubmitted: true,
  })
  await reconcileSubscriptionWorkflow(updated.subscriptionId)
  return publicDocument(updated)
}

async function applyRuleAnalysis(document: DocumentRow) {
  const analysis = analyzeDocumentWithRules({ type: document.type, fileUrl: document.originalFilename ?? document.fileUrl })
  const [updated] = await requireDb()
    .update(documents)
    .set({
      status: analysis.suggestedStatus,
      analysisResult: analysis,
      analyzedAt: new Date(analysis.analyzedAt),
      rejectionReason: analysis.suggestedStatus === 'rejected' ? 'Suspicion de fraude detectee par le prototype.' : null,
      updatedAt: new Date(),
    })
    .where(eq(documents.id, document.id))
    .returning(documentSelection)

  if (!updated) throw new AppError(500, "Le document n'a pas pu etre analyse.")
  await notifyDocumentStatusChanged({
    userId: updated.ownerId,
    subscriptionId: updated.subscriptionId,
    documentId: updated.id,
    documentType: updated.type,
    previousStatus: document.status,
    status: updated.status,
    rejectionReason: updated.rejectionReason,
  })
  await reconcileSubscriptionWorkflow(updated.subscriptionId)
  return { document: updated, analysis }
}

export async function analyzeDocument(userId: string, role: string, id: string) {
  if (role !== 'admin') {
    throw new AppError(403, "L'analyse est lancée automatiquement lors de l'envoi final du dossier.")
  }
  const document = await findDocumentForAccess(userId, role, id)
  const result = await applyRuleAnalysis(document)
  return { ...(await publicDocument(result.document)), analysis: result.analysis }
}

export async function analyzeSubscriptionDocumentsForSubmission(userId: string, subscriptionId: string) {
  await findSubscriptionForAccess(userId, 'user', subscriptionId)
  const pendingDocuments = await requireDb()
    .select(documentSelection)
    .from(documents)
    .where(and(eq(documents.subscriptionId, subscriptionId), eq(documents.status, 'pending')))
    .orderBy(desc(documents.updatedAt))

  for (const document of pendingDocuments) {
    await applyRuleAnalysis(document)
  }

  return { analyzedCount: pendingDocuments.length }
}

export async function getDocumentAnalysis(userId: string, role: string, id: string) {
  const document = await findDocumentForAccess(userId, role, id)
  return {
    documentId: document.id,
    analysis: document.analysisResult,
    analyzedAt: document.analyzedAt,
  }
}

export async function fraudCheckDocument(userId: string, role: string, id: string) {
  const document = await findDocumentForAccess(userId, role, id)
  return {
    documentId: document.id,
    fraudCheck: checkDocumentFraud({ type: document.type, fileUrl: document.originalFilename ?? document.fileUrl }),
  }
}

export async function manualReviewDocument(userId: string, role: string, id: string, input: ManualReviewInput) {
  const current = await findDocumentForAccess(userId, role, id)
  const status = input.decision === 'validate'
    ? 'validated'
    : input.decision === 'reject'
      ? 'rejected'
      : 'needs_manual_review'
  const [updated] = await requireDb()
    .update(documents)
    .set({
      status,
      rejectionReason: input.decision === 'reject' ? input.rejectionReason : null,
      analysisResult: {
        provider: 'rules-prototype-free',
        manualReview: true,
        note: input.note ?? null,
        reviewedAt: new Date().toISOString(),
      },
      updatedAt: new Date(),
    })
    .where(eq(documents.id, id))
    .returning(documentSelection)

  if (!updated) throw new AppError(500, "La revue manuelle n'a pas pu etre enregistree.")
  await notifyDocumentStatusChanged({
    userId: updated.ownerId,
    subscriptionId: updated.subscriptionId,
    documentId: updated.id,
    documentType: updated.type,
    previousStatus: current.status,
    status: updated.status,
    rejectionReason: updated.rejectionReason,
  })
  await reconcileSubscriptionWorkflow(updated.subscriptionId)
  return publicDocument(updated)
}

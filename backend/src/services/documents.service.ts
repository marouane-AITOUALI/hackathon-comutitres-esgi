import { and, desc, eq } from 'drizzle-orm'
import { documents, subscriptions } from '../db/schema.js'
import { requireDb } from '../db/client.js'
import { AppError } from '../utils/app-error.js'
import { analyzeDocumentWithRules, checkDocumentFraud } from './document-analysis.service.js'
import { notifyDocumentStatusChanged, notifyDocumentSubmitted } from './notifications.service.js'
import { createPrivateSignedUrl, removePrivateObject, uploadSubscriptionDocumentFile } from './storage.service.js'
import type { CreateDocumentInput, ManualReviewInput, ResubmitDocumentInput, UpdateDocumentStatusInput } from '../validation/document.schemas.js'

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
  const [row] = await requireDb()
    .select({ document: documentSelection, subscriptionUserId: subscriptions.userId })
    .from(documents)
    .innerJoin(subscriptions, eq(documents.subscriptionId, subscriptions.id))
    .where(eq(documents.id, id))
    .limit(1)

  if (!row || (role !== 'admin' && row.subscriptionUserId !== userId)) throw new AppError(404, 'Document introuvable.')
  return row.document
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
  const document = await findDocumentForAccess(userId, role, id)
  return {
    documentId: document.id,
    signedUrl: await createPrivateSignedUrl(document.storageBucket, document.storagePath),
  }
}

export async function deleteDocument(userId: string, role: string, id: string) {
  const document = await findDocumentForAccess(userId, role, id)
  await requireDb().delete(documents).where(eq(documents.id, id))
  await removePrivateObject(document.storageBucket, document.storagePath)
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
  const ownerId = current.ownerId ?? userId
  const uploaded = await uploadSubscriptionDocumentFile(ownerId, current.subscriptionId, input.type ?? current.type, file)
  let updated: DocumentRow

  try {
    const [row] = await requireDb()
      .update(documents)
      .set({
        type: input.type ?? current.type,
        ownerId,
        fileUrl: uploaded.path,
        storageBucket: uploaded.bucket,
        storagePath: uploaded.path,
        originalFilename: uploaded.originalFilename,
        mimeType: uploaded.mimeType,
        sizeBytes: uploaded.sizeBytes,
        status: 'pending',
        analysisResult: {},
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
  return publicDocument(updated)
}

export async function analyzeDocument(userId: string, role: string, id: string) {
  const document = await findDocumentForAccess(userId, role, id)
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
    .where(eq(documents.id, id))
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
  return { ...(await publicDocument(updated)), analysis }
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
  const [updated] = await requireDb()
    .update(documents)
    .set({
      status: input.accepted ? 'validated' : 'rejected',
      rejectionReason: input.accepted ? null : input.rejectionReason,
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
  return publicDocument(updated)
}

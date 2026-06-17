import { and, desc, eq } from 'drizzle-orm'
import { documents, subscriptions } from '../db/schema.js'
import { requireDb } from '../db/client.js'
import { AppError } from '../utils/app-error.js'
import { analyzeDocumentWithRules, checkDocumentFraud } from './document-analysis.service.js'
import type { CreateDocumentInput, ManualReviewInput, ResubmitDocumentInput, UpdateDocumentStatusInput } from '../validation/document.schemas.js'

type DocumentRow = typeof documents.$inferSelect

const documentSelection = {
  id: documents.id,
  subscriptionId: documents.subscriptionId,
  type: documents.type,
  fileUrl: documents.fileUrl,
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

function publicDocument(document: DocumentRow) {
  return { document }
}

export async function createDocument(userId: string, role: string, subscriptionId: string, input: CreateDocumentInput) {
  await findSubscriptionForAccess(userId, role, subscriptionId)
  const [created] = await requireDb()
    .insert(documents)
    .values({ subscriptionId, type: input.type, fileUrl: input.fileUrl, status: 'pending' })
    .returning(documentSelection)

  if (!created) throw new AppError(500, "Le document n'a pas pu etre cree.")
  return publicDocument(created)
}

export async function listDocumentsForSubscription(userId: string, role: string, subscriptionId: string) {
  await findSubscriptionForAccess(userId, role, subscriptionId)
  const rows = await requireDb()
    .select(documentSelection)
    .from(documents)
    .where(eq(documents.subscriptionId, subscriptionId))
    .orderBy(desc(documents.updatedAt))

  return { documents: rows }
}

export async function getDocument(userId: string, role: string, id: string) {
  return publicDocument(await findDocumentForAccess(userId, role, id))
}

export async function deleteDocument(userId: string, role: string, id: string) {
  await findDocumentForAccess(userId, role, id)
  await requireDb().delete(documents).where(eq(documents.id, id))
  return { deleted: true, id }
}

export async function updateDocumentStatus(userId: string, role: string, id: string, input: UpdateDocumentStatusInput) {
  await findDocumentForAccess(userId, role, id)
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
  return publicDocument(updated)
}

export async function resubmitDocument(userId: string, role: string, id: string, input: ResubmitDocumentInput) {
  const current = await findDocumentForAccess(userId, role, id)
  const [updated] = await requireDb()
    .update(documents)
    .set({
      type: input.type ?? current.type,
      fileUrl: input.fileUrl,
      status: 'pending',
      analysisResult: {},
      analyzedAt: null,
      rejectionReason: null,
      updatedAt: new Date(),
    })
    .where(eq(documents.id, id))
    .returning(documentSelection)

  if (!updated) throw new AppError(500, "Le document n'a pas pu etre renvoye.")
  return publicDocument(updated)
}

export async function analyzeDocument(userId: string, role: string, id: string) {
  const document = await findDocumentForAccess(userId, role, id)
  const analysis = analyzeDocumentWithRules(document)
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
  return { document: updated, analysis }
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
    fraudCheck: checkDocumentFraud(document),
  }
}

export async function manualReviewDocument(userId: string, role: string, id: string, input: ManualReviewInput) {
  await findDocumentForAccess(userId, role, id)
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
  return publicDocument(updated)
}

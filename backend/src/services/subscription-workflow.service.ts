import { and, desc, eq, inArray, ne } from 'drizzle-orm'
import { requireDb } from '../db/client.js'
import { documents, offers, payments, subscriptions } from '../db/schema.js'
import { AppError } from '../utils/app-error.js'
import { notifySubscriptionStatusChanged } from './notifications.service.js'

export const OPEN_SUBSCRIPTION_STATUSES = [
  'draft',
  'pending_documents',
  'pending_payment',
  'pending_validation',
  'accepted',
  'suspended',
] as const

type SubscriptionStatus = typeof subscriptions.$inferSelect.status
type DocumentStatus = typeof documents.$inferSelect.status

type WorkflowDocument = {
  type: string
  status: DocumentStatus
}

export type SubscriptionWorkflowState =
  | 'documents_required'
  | 'payment_required'
  | 'ready_to_submit'
  | 'under_review'
  | 'needs_action'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'suspended'

const DOCUMENT_TYPE_ALIASES: Record<string, string> = {
  identity: 'identity',
  "piece d'identite": 'identity',
  'piece identite': 'identity',
  "photo d'identite": 'identity',
  proof_of_address: 'proof_of_address',
  'justificatif de domicile': 'proof_of_address',
  eligibility: 'eligibility',
  'justificatif de situation sociale': 'eligibility',
  'notification de bourse': 'eligibility',
  school_certificate: 'school_certificate',
  'certificat de scolarite': 'school_certificate',
  'justificatif de scolarite': 'school_certificate',
  tax_notice: 'tax_notice',
  "avis d'imposition": 'tax_notice',
  rib: 'other',
  other: 'other',
}

function normalizedKey(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’]/g, "'")
    .trim()
    .toLowerCase()
}

export function normalizeDocumentType(value: string) {
  return DOCUMENT_TYPE_ALIASES[normalizedKey(value)] ?? value
}

export function isSchoolCertificateBlocking(now = new Date()) {
  return now.getMonth() === 11
}

export function buildSubscriptionWorkflow(input: {
  status: SubscriptionStatus
  submittedAt: Date | null
  requiredDocuments: string[]
  documents: WorkflowDocument[]
  payments: Array<{ status: string }>
  now?: Date
}) {
  const now = input.now ?? new Date()
  const requiredDocumentTypes = [...new Set(input.requiredDocuments.map(normalizeDocumentType))]
  const blockingDocumentTypes = requiredDocumentTypes.filter(
    (type) => type !== 'school_certificate' || isSchoolCertificateBlocking(now),
  )

  const latestByType = new Map<string, WorkflowDocument>()
  for (const document of input.documents) {
    const type = normalizeDocumentType(document.type)
    if (!latestByType.has(type)) latestByType.set(type, document)
  }

  const missingBlockingDocuments = blockingDocumentTypes.filter((type) => !latestByType.has(type))
  const missingRequiredDocuments = requiredDocumentTypes.filter((type) => !latestByType.has(type))
  const rejectedBlockingDocuments = blockingDocumentTypes.filter((type) => latestByType.get(type)?.status === 'rejected')
  const rejectedRequiredDocuments = requiredDocumentTypes.filter((type) => latestByType.get(type)?.status === 'rejected')
  const pendingBlockingDocuments = blockingDocumentTypes.filter((type) => {
    const status = latestByType.get(type)?.status
    return status === 'pending' || status === 'analyzing' || status === 'needs_manual_review'
  })
  const reviewDocumentTypes = requiredDocumentTypes.filter((type) => {
    const status = latestByType.get(type)?.status
    return status === 'pending' || status === 'analyzing' || status === 'needs_manual_review'
  })
  const invalidBlockingDocuments = blockingDocumentTypes.filter((type) => {
    const status = latestByType.get(type)?.status
    return status !== undefined && status !== 'validated'
  })
  const documentsReady = missingBlockingDocuments.length === 0 && invalidBlockingDocuments.length === 0
  const documentsUploaded = missingRequiredDocuments.length === 0
  const requiresDocumentReview = reviewDocumentTypes.length > 0
  const hasAcceptedPayment = input.payments.some((payment) => payment.status === 'accepted' || payment.status === 'regularized')

  let state: SubscriptionWorkflowState
  if (input.status === 'accepted') state = 'approved'
  else if (input.status === 'rejected') state = 'rejected'
  else if (input.status === 'cancelled') state = 'cancelled'
  else if (input.status === 'suspended') state = 'suspended'
  else if (input.submittedAt && rejectedBlockingDocuments.length > 0) state = 'needs_action'
  else if (input.submittedAt && missingBlockingDocuments.length > 0) state = 'documents_required'
  else if (input.submittedAt && !hasAcceptedPayment) state = 'payment_required'
  else if (input.submittedAt) state = 'under_review'
  else if (rejectedBlockingDocuments.length > 0) state = 'needs_action'
  else if (missingBlockingDocuments.length > 0) state = 'documents_required'
  else if (!hasAcceptedPayment) state = 'payment_required'
  else state = 'ready_to_submit'

  const terminal = ['accepted', 'rejected', 'cancelled', 'suspended'].includes(input.status)
  const editableBeforeSubmission = !input.submittedAt && !terminal
  const correctionTypes = [...new Set([...missingBlockingDocuments, ...rejectedBlockingDocuments])]
  const replaceableDocumentTypes = editableBeforeSubmission ? requiredDocumentTypes : correctionTypes
  const canUpload = replaceableDocumentTypes.length > 0 && state !== 'under_review' && !terminal
  const canPay = !hasAcceptedPayment && !terminal && state !== 'under_review'
  const canSubmit = !input.submittedAt
    && missingBlockingDocuments.length === 0
    && rejectedBlockingDocuments.length === 0
    && hasAcceptedPayment
    && input.status === 'draft'
  const canCancel = ['draft', 'pending_documents', 'pending_payment', 'pending_validation'].includes(input.status)

  const blockingReasons = [
    ...missingBlockingDocuments.map((type) => `Document obligatoire manquant : ${type}`),
    ...rejectedBlockingDocuments.map((type) => `Document refusé à remplacer : ${type}`),
    ...(!hasAcceptedPayment ? ['Paiement requis'] : []),
  ]

  const desiredStatus: SubscriptionStatus = !input.submittedAt
    ? 'draft'
    : missingBlockingDocuments.length > 0 || rejectedBlockingDocuments.length > 0
      ? 'pending_documents'
      : !hasAcceptedPayment
        ? 'pending_payment'
        : 'pending_validation'

  return {
    state,
    requiredDocumentTypes,
    blockingDocumentTypes,
    missingBlockingDocuments,
    rejectedBlockingDocuments,
    pendingBlockingDocuments,
    reviewDocumentTypes,
    missingRequiredDocuments,
    rejectedRequiredDocuments,
    documentsReady,
    documentsUploaded,
    requiresDocumentReview,
    hasAcceptedPayment,
    canUpload,
    canPay,
    canSubmit,
    canCancel,
    replaceableDocumentTypes,
    blockingReasons,
    desiredStatus,
    schoolCertificateBlocking: isSchoolCertificateBlocking(now),
  }
}

export async function evaluateSubscriptionWorkflow(subscriptionId: string, now = new Date()) {
  const database = requireDb()
  const [subscription] = await database.select().from(subscriptions).where(eq(subscriptions.id, subscriptionId)).limit(1)
  if (!subscription) throw new AppError(404, 'Souscription introuvable.')

  const [offer] = subscription.offerId
    ? await database.select().from(offers).where(eq(offers.id, subscription.offerId)).limit(1)
    : []
  const documentRows = await database
    .select({ type: documents.type, status: documents.status })
    .from(documents)
    .where(eq(documents.subscriptionId, subscriptionId))
    .orderBy(desc(documents.updatedAt))
  const paymentRows = await database
    .select({ status: payments.status })
    .from(payments)
    .where(eq(payments.subscriptionId, subscriptionId))

  return buildSubscriptionWorkflow({
    status: subscription.status,
    submittedAt: subscription.submittedAt,
    requiredDocuments: offer?.requiredDocuments ?? [],
    documents: documentRows,
    payments: paymentRows,
    now,
  })
}

export async function reconcileSubscriptionWorkflow(subscriptionId: string, now = new Date()) {
  const database = requireDb()
  const [current] = await database.select().from(subscriptions).where(eq(subscriptions.id, subscriptionId)).limit(1)
  if (!current) throw new AppError(404, 'Souscription introuvable.')

  const workflow = await evaluateSubscriptionWorkflow(subscriptionId, now)
  if (!current.submittedAt || ['accepted', 'rejected', 'cancelled', 'suspended'].includes(current.status)) return workflow
  if (current.status === workflow.desiredStatus) return workflow

  const [updated] = await database
    .update(subscriptions)
    .set({ status: workflow.desiredStatus, updatedAt: new Date() })
    .where(eq(subscriptions.id, subscriptionId))
    .returning()
  if (!updated) throw new AppError(500, "Le workflow de la souscription n'a pas pu être mis à jour.")

  await notifySubscriptionStatusChanged({
    userId: updated.userId,
    subscriptionId: updated.id,
    previousStatus: current.status,
    status: updated.status,
  })
  return evaluateSubscriptionWorkflow(subscriptionId, now)
}

export async function findOpenSubscription(userId: string, excludedId?: string) {
  const conditions = [
    eq(subscriptions.userId, userId),
    inArray(subscriptions.status, [...OPEN_SUBSCRIPTION_STATUSES]),
    excludedId ? ne(subscriptions.id, excludedId) : undefined,
  ].filter((condition) => condition !== undefined)

  const [subscription] = await requireDb()
    .select()
    .from(subscriptions)
    .where(and(...conditions))
    .orderBy(desc(subscriptions.updatedAt))
    .limit(1)
  return subscription ?? null
}

export async function assertNoOpenSubscription(userId: string, excludedId?: string) {
  const existing = await findOpenSubscription(userId, excludedId)
  if (existing) {
    throw new AppError(409, 'Un dossier est déjà actif pour ce compte.', {
      subscriptionId: existing.id,
      status: existing.status,
    })
  }
}

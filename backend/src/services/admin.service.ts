import { asc, desc, eq, inArray } from 'drizzle-orm'
import { requireDb } from '../db/client.js'
import { documents, offers, onboardingSessions, payments, profiles, subscriptions, users } from '../db/schema.js'
import { AppError } from '../utils/app-error.js'
import { createPrivateSignedUrl } from './storage.service.js'
import type { AdminCreateOfferInput, AdminListSubscriptionsQuery, AdminReviewDocumentInput, AdminUpdateOfferInput, AdminUpdateSubscriptionStatusInput } from '../validation/admin.schemas.js'

type SubscriptionRow = typeof subscriptions.$inferSelect
type DocumentRow = typeof documents.$inferSelect
type PaymentRow = typeof payments.$inferSelect

function uniqueValues(values: Array<string | null | undefined>) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))]
}

const publicUserSelection = {
  id: users.id,
  firstName: users.firstName,
  lastName: users.lastName,
  email: users.email,
  role: users.role,
  rgpdConsent: users.rgpdConsent,
  createdAt: users.createdAt,
  updatedAt: users.updatedAt,
}

const subscriptionSelection = {
  id: subscriptions.id,
  userId: subscriptions.userId,
  bearerProfileId: subscriptions.bearerProfileId,
  payerProfileId: subscriptions.payerProfileId,
  offerId: subscriptions.offerId,
  onboardingSessionId: subscriptions.onboardingSessionId,
  status: subscriptions.status,
  createdAt: subscriptions.createdAt,
  updatedAt: subscriptions.updatedAt,
}

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

async function withSignedDocument(document: DocumentRow) {
  return {
    ...document,
    signedUrl: await createPrivateSignedUrl(document.storageBucket, document.storagePath),
  }
}

async function withSignedDocuments(rows: DocumentRow[]) {
  return Promise.all(rows.map(withSignedDocument))
}

const offerSelection = {
  id: offers.id,
  code: offers.code,
  name: offers.name,
  description: offers.description,
  target: offers.target,
  requiredDocuments: offers.requiredDocuments,
  isActive: offers.isActive,
  createdAt: offers.createdAt,
  updatedAt: offers.updatedAt,
}

const paymentSelection = {
  id: payments.id,
  userId: payments.userId,
  subscriptionId: payments.subscriptionId,
  type: payments.type,
  status: payments.status,
  amountCents: payments.amountCents,
  currency: payments.currency,
  provider: payments.provider,
  externalReference: payments.externalReference,
  metadata: payments.metadata,
  processedAt: payments.processedAt,
  createdAt: payments.createdAt,
  updatedAt: payments.updatedAt,
}

function countStatuses<T extends string>(items: Array<{ status: T }>, values: readonly T[]) {
  const counters = Object.fromEntries(values.map((value) => [value, 0])) as Record<T, number>
  for (const item of items) counters[item.status] = (counters[item.status] ?? 0) + 1
  return counters
}

async function enrichSubscription(subscription: SubscriptionRow) {
  const database = requireDb()
  const [user] = await database.select(publicUserSelection).from(users).where(eq(users.id, subscription.userId)).limit(1)
  const [offer] = subscription.offerId ? await database.select(offerSelection).from(offers).where(eq(offers.id, subscription.offerId)).limit(1) : []
  const [bearerProfile] = subscription.bearerProfileId ? await database.select().from(profiles).where(eq(profiles.id, subscription.bearerProfileId)).limit(1) : []
  const [payerProfile] = subscription.payerProfileId ? await database.select().from(profiles).where(eq(profiles.id, subscription.payerProfileId)).limit(1) : []
  const [onboardingSession] = subscription.onboardingSessionId ? await database.select().from(onboardingSessions).where(eq(onboardingSessions.id, subscription.onboardingSessionId)).limit(1) : []
  const subscriptionDocuments = await database.select(documentSelection).from(documents).where(eq(documents.subscriptionId, subscription.id)).orderBy(desc(documents.updatedAt))
  const subscriptionPayments = await database.select(paymentSelection).from(payments).where(eq(payments.subscriptionId, subscription.id)).orderBy(desc(payments.updatedAt))

  return {
    subscription,
    user: user ?? null,
    offer: offer ?? null,
    bearerProfile: bearerProfile ?? null,
    payerProfile: payerProfile ?? null,
    onboardingSession: onboardingSession ? {
      id: onboardingSession.id,
      currentStep: onboardingSession.currentStep,
      subscriptionFor: onboardingSession.subscriptionFor,
      isBearerPayer: onboardingSession.isBearerPayer,
    } : null,
    documents: await withSignedDocuments(subscriptionDocuments),
    payments: subscriptionPayments,
  }
}

async function enrichSubscriptionList(subscriptionRows: SubscriptionRow[]) {
  if (subscriptionRows.length === 0) return []

  const database = requireDb()
  const subscriptionIds = subscriptionRows.map((subscription) => subscription.id)
  const userIds = uniqueValues(subscriptionRows.map((subscription) => subscription.userId))
  const offerIds = uniqueValues(subscriptionRows.map((subscription) => subscription.offerId))
  const profileIds = uniqueValues(subscriptionRows.flatMap((subscription) => [subscription.bearerProfileId, subscription.payerProfileId]))
  const onboardingSessionIds = uniqueValues(subscriptionRows.map((subscription) => subscription.onboardingSessionId))

  const [userRows, offerRows, profileRows, onboardingRows, documentRows, paymentRows] = await Promise.all([
    userIds.length ? database.select(publicUserSelection).from(users).where(inArray(users.id, userIds)) : [],
    offerIds.length ? database.select(offerSelection).from(offers).where(inArray(offers.id, offerIds)) : [],
    profileIds.length ? database.select().from(profiles).where(inArray(profiles.id, profileIds)) : [],
    onboardingSessionIds.length ? database.select().from(onboardingSessions).where(inArray(onboardingSessions.id, onboardingSessionIds)) : [],
    database.select(documentSelection).from(documents).where(inArray(documents.subscriptionId, subscriptionIds)),
    database.select(paymentSelection).from(payments).where(inArray(payments.subscriptionId, subscriptionIds)),
  ])

  const usersById = new Map(userRows.map((user) => [user.id, user]))
  const offersById = new Map(offerRows.map((offer) => [offer.id, offer]))
  const profilesById = new Map(profileRows.map((profile) => [profile.id, profile]))
  const onboardingById = new Map(onboardingRows.map((session) => [session.id, session]))
  const documentsBySubscriptionId = new Map<string, DocumentRow[]>()
  const paymentsBySubscriptionId = new Map<string, PaymentRow[]>()

  for (const document of documentRows) {
    const rows = documentsBySubscriptionId.get(document.subscriptionId) ?? []
    rows.push(document)
    documentsBySubscriptionId.set(document.subscriptionId, rows)
  }

  for (const payment of paymentRows) {
    const rows = paymentsBySubscriptionId.get(payment.subscriptionId) ?? []
    rows.push(payment)
    paymentsBySubscriptionId.set(payment.subscriptionId, rows)
  }

  return subscriptionRows.map((subscription) => {
    const onboardingSession = subscription.onboardingSessionId ? onboardingById.get(subscription.onboardingSessionId) : null

    return {
      subscription,
      user: usersById.get(subscription.userId) ?? null,
      offer: subscription.offerId ? offersById.get(subscription.offerId) ?? null : null,
      bearerProfile: subscription.bearerProfileId ? profilesById.get(subscription.bearerProfileId) ?? null : null,
      payerProfile: subscription.payerProfileId ? profilesById.get(subscription.payerProfileId) ?? null : null,
      onboardingSession: onboardingSession ? {
        id: onboardingSession.id,
        currentStep: onboardingSession.currentStep,
        subscriptionFor: onboardingSession.subscriptionFor,
        isBearerPayer: onboardingSession.isBearerPayer,
      } : null,
      documents: documentsBySubscriptionId.get(subscription.id) ?? [],
      payments: paymentsBySubscriptionId.get(subscription.id) ?? [],
    }
  })
}

async function findSubscription(id: string) {
  const [subscription] = await requireDb().select(subscriptionSelection).from(subscriptions).where(eq(subscriptions.id, id)).limit(1)
  if (!subscription) throw new AppError(404, 'Souscription introuvable.')
  return subscription
}

async function findDocument(id: string) {
  const [document] = await requireDb().select(documentSelection).from(documents).where(eq(documents.id, id)).limit(1)
  if (!document) throw new AppError(404, 'Document introuvable.')
  return document
}

async function findOfferById(id: string) {
  const [offer] = await requireDb().select(offerSelection).from(offers).where(eq(offers.id, id)).limit(1)
  if (!offer) throw new AppError(404, 'Offre introuvable.')
  return offer
}

async function loadSupportAlerts() {
  const database = requireDb()
  const subscriptionRows = await database.select(subscriptionSelection).from(subscriptions).orderBy(desc(subscriptions.updatedAt))
  const offerRows = await database.select(offerSelection).from(offers)
  const documentRows = await database.select(documentSelection).from(documents)
  const paymentRows = await database.select().from(payments)
  const offerById = new Map(offerRows.map((offer) => [offer.id, offer]))
  const documentsBySubscription = new Map<string, DocumentRow[]>()

  for (const document of documentRows) {
    const rows = documentsBySubscription.get(document.subscriptionId) ?? []
    rows.push(document)
    documentsBySubscription.set(document.subscriptionId, rows)
  }

  const alerts = []
  for (const subscription of subscriptionRows) {
    const offer = subscription.offerId ? offerById.get(subscription.offerId) : null
    const subscriptionDocuments = documentsBySubscription.get(subscription.id) ?? []
    const requiredDocuments = offer?.requiredDocuments ?? []

    if (subscription.status === 'pending_documents' && subscriptionDocuments.length < requiredDocuments.length) {
      alerts.push({
        id: `missing-documents-${subscription.id}`,
        type: 'missing_documents',
        severity: 'warning',
        subscriptionId: subscription.id,
        title: 'Justificatifs manquants',
        message: `${Math.max(0, requiredDocuments.length - subscriptionDocuments.length)} justificatif(s) attendu(s) pour ${offer?.name ?? 'cette offre'}.`,
        createdAt: subscription.updatedAt,
      })
    }

    if (subscription.status === 'pending_payment') {
      alerts.push({
        id: `pending-payment-${subscription.id}`,
        type: 'pending_payment',
        severity: 'info',
        subscriptionId: subscription.id,
        title: 'Paiement attendu',
        message: 'Le dossier attend une simulation, un paiement direct ou un mandat SEPA prototype.',
        createdAt: subscription.updatedAt,
      })
    }

    if (subscription.status === 'rejected' || subscription.status === 'suspended') {
      alerts.push({
        id: `blocked-subscription-${subscription.id}`,
        type: 'blocked_subscription',
        severity: 'error',
        subscriptionId: subscription.id,
        title: 'Dossier bloque',
        message: 'Une action backoffice ou une explication client est necessaire.',
        createdAt: subscription.updatedAt,
      })
    }
  }

  for (const document of documentRows) {
    if (document.status === 'needs_manual_review' || document.status === 'pending') {
      alerts.push({
        id: `document-review-${document.id}`,
        type: 'document_review',
        severity: document.status === 'needs_manual_review' ? 'warning' : 'info',
        subscriptionId: document.subscriptionId,
        documentId: document.id,
        title: document.status === 'needs_manual_review' ? 'Document a revoir' : 'Document en attente',
        message: document.status === 'needs_manual_review' ? 'La verification automatique demande une revue humaine.' : 'Un justificatif attend une analyse ou une validation.',
        createdAt: document.updatedAt,
      })
    }
  }

  for (const payment of paymentRows) {
    if (payment.status === 'rejected' || payment.status === 'cancelled') {
      alerts.push({
        id: `payment-issue-${payment.id}`,
        type: 'payment_issue',
        severity: 'error',
        subscriptionId: payment.subscriptionId,
        paymentId: payment.id,
        title: 'Paiement a regulariser',
        message: `Paiement ${payment.status} de ${payment.amountCents / 100} ${payment.currency}.`,
        createdAt: payment.updatedAt,
      })
    }
  }

  return alerts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 25)
}

export async function getAdminStats() {
  const database = requireDb()
  const userRows = await database.select(publicUserSelection).from(users)
  const subscriptionRows = await database.select({ status: subscriptions.status }).from(subscriptions)
  const documentRows = await database.select({ status: documents.status }).from(documents)
  const offerRows = await database.select({ isActive: offers.isActive }).from(offers)
  const paymentRows = await database.select({ status: payments.status }).from(payments)
  const supportAlertsCount =
    subscriptionRows.filter((subscription) => ['pending_documents', 'pending_payment', 'rejected', 'suspended'].includes(subscription.status)).length
    + documentRows.filter((document) => ['pending', 'needs_manual_review'].includes(document.status)).length
    + paymentRows.filter((payment) => ['rejected', 'cancelled'].includes(payment.status)).length

  return {
    users: {
      total: userRows.length,
      admins: userRows.filter((user) => user.role === 'admin').length,
    },
    subscriptions: {
      total: subscriptionRows.length,
      ...countStatuses(subscriptionRows, ['draft', 'pending_documents', 'pending_payment', 'pending_validation', 'accepted', 'rejected', 'cancelled', 'suspended'] as const),
    },
    documents: {
      total: documentRows.length,
      ...countStatuses(documentRows, ['pending', 'analyzing', 'validated', 'rejected', 'needs_manual_review'] as const),
    },
    offers: {
      total: offerRows.length,
      active: offerRows.filter((offer) => offer.isActive).length,
    },
    payments: {
      total: paymentRows.length,
      ...countStatuses(paymentRows, ['simulated', 'pending', 'accepted', 'rejected', 'cancelled', 'regularized'] as const),
    },
    supportAlerts: supportAlertsCount,
  }
}

export async function listAdminSubscriptions(query: AdminListSubscriptionsQuery) {
  const where = query.status ? eq(subscriptions.status, query.status) : undefined
  const request = requireDb().select(subscriptionSelection).from(subscriptions).where(where).orderBy(desc(subscriptions.updatedAt))
  const rows = query.limit ? await request.limit(query.limit) : await request
  return enrichSubscriptionList(rows)
}

export async function getAdminSubscription(id: string) {
  return enrichSubscription(await findSubscription(id))
}

export async function updateAdminSubscriptionStatus(id: string, input: AdminUpdateSubscriptionStatusInput) {
  await findSubscription(id)
  const [updated] = await requireDb()
    .update(subscriptions)
    .set({ status: input.status, updatedAt: new Date() })
    .where(eq(subscriptions.id, id))
    .returning(subscriptionSelection)

  if (!updated) throw new AppError(500, "Le statut de la souscription n'a pas pu etre mis a jour.")
  return enrichSubscription(updated)
}

export async function listPendingDocuments() {
  const database = requireDb()
  const rows = await database
    .select(documentSelection)
    .from(documents)
    .where(inArray(documents.status, ['pending', 'analyzing', 'needs_manual_review']))
    .orderBy(asc(documents.createdAt))
    .limit(50)

  const subscriptionIds = uniqueValues(rows.map((document) => document.subscriptionId))
  const subscriptionRows = subscriptionIds.length
    ? await database.select(subscriptionSelection).from(subscriptions).where(inArray(subscriptions.id, subscriptionIds))
    : []
  const subscriptionsById = new Map((await enrichSubscriptionList(subscriptionRows)).map((item) => [item.subscription.id, item]))

  return rows
    .map((document) => {
      const subscription = subscriptionsById.get(document.subscriptionId)
      return subscription ? { document, subscription } : null
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
}

export async function reviewAdminDocument(id: string, input: AdminReviewDocumentInput) {
  await findDocument(id)
  const [updated] = await requireDb()
    .update(documents)
    .set({
      status: input.accepted ? 'validated' : 'rejected',
      rejectionReason: input.accepted ? null : input.rejectionReason,
      analysisResult: {
        provider: 'rules-prototype-free',
        manualReview: true,
        accepted: input.accepted,
        note: input.note ?? null,
        reviewedAt: new Date().toISOString(),
      },
      updatedAt: new Date(),
    })
    .where(eq(documents.id, id))
    .returning(documentSelection)

  if (!updated) throw new AppError(500, "La revue du document n'a pas pu etre enregistree.")
  return { document: await withSignedDocument(updated) }
}

export async function listAdminUsers() {
  const database = requireDb()
  const userRows = await database.select(publicUserSelection).from(users).orderBy(desc(users.createdAt))
  const subscriptionRows = await database.select({ userId: subscriptions.userId }).from(subscriptions)

  return userRows.map((user) => ({
    ...user,
    subscriptionCount: subscriptionRows.filter((subscription) => subscription.userId === user.id).length,
  }))
}

export async function listAdminOffers() {
  return requireDb().select(offerSelection).from(offers).orderBy(asc(offers.name))
}

export async function createAdminOffer(input: AdminCreateOfferInput) {
  const [existing] = await requireDb().select(offerSelection).from(offers).where(eq(offers.code, input.code)).limit(1)
  if (existing) throw new AppError(409, 'Une offre utilise deja ce code.')

  const [created] = await requireDb()
    .insert(offers)
    .values(input)
    .returning(offerSelection)

  if (!created) throw new AppError(500, "L'offre n'a pas pu etre creee.")
  return created
}

export async function updateAdminOffer(id: string, input: AdminUpdateOfferInput) {
  const current = await findOfferById(id)
  if (input.code && input.code !== current.code) {
    const [existing] = await requireDb().select(offerSelection).from(offers).where(eq(offers.code, input.code)).limit(1)
    if (existing && existing.id !== id) throw new AppError(409, 'Une offre utilise deja ce code.')
  }

  const [updated] = await requireDb()
    .update(offers)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(offers.id, id))
    .returning(offerSelection)

  if (!updated) throw new AppError(500, "L'offre n'a pas pu etre mise a jour.")
  return updated
}

export async function getSupportAlerts() {
  return loadSupportAlerts()
}

export async function getAuditLogs() {
  const database = requireDb()
  const subscriptionRows = await database.select(subscriptionSelection).from(subscriptions).orderBy(desc(subscriptions.updatedAt))
  const documentRows = await database.select(documentSelection).from(documents).orderBy(desc(documents.updatedAt))
  const paymentRows = await database.select().from(payments).orderBy(desc(payments.updatedAt))

  return [
    ...subscriptionRows.map((subscription) => ({
      id: `subscription-${subscription.id}-${subscription.status}`,
      entityType: 'subscription',
      entityId: subscription.id,
      action: `status:${subscription.status}`,
      summary: `Souscription ${subscription.status}`,
      createdAt: subscription.updatedAt,
    })),
    ...documentRows.map((document) => ({
      id: `document-${document.id}-${document.status}`,
      entityType: 'document',
      entityId: document.id,
      action: `status:${document.status}`,
      summary: `Document ${document.type} ${document.status}`,
      createdAt: document.updatedAt,
    })),
    ...paymentRows.map((payment) => ({
      id: `payment-${payment.id}-${payment.status}`,
      entityType: 'payment',
      entityId: payment.id,
      action: `status:${payment.status}`,
      summary: `Paiement ${payment.type} ${payment.status}`,
      createdAt: payment.updatedAt,
    })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 50)
}

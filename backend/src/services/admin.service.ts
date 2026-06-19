import { and, asc, desc, eq, inArray, isNotNull, isNull } from 'drizzle-orm'
import { requireDb } from '../db/client.js'
import { documents, offers, onboardingSessions, payments, profiles, subscriptions, terminationRequests, users } from '../db/schema.js'
import { AppError } from '../utils/app-error.js'
import { notifyDocumentStatusChanged, notifySubscriptionStatusChanged } from './notifications.service.js'
import { createPrivateSignedUrl, encodeStorageDocumentId, listSubscriptionDocumentObjects } from './storage.service.js'
import type { AdminCreateOfferInput, AdminListSubscriptionsQuery, AdminReviewDocumentInput, AdminUpdateOfferInput, AdminUpdateSubscriptionStatusInput, AdminUpdateUserArchiveInput, AdminUpdateUserRoleInput } from '../validation/admin.schemas.js'
import { evaluateSubscriptionWorkflow, reconcileSubscriptionWorkflow } from './subscription-workflow.service.js'

type SubscriptionRow = typeof subscriptions.$inferSelect
type DocumentRow = typeof documents.$inferSelect
type PaymentRow = typeof payments.$inferSelect
type AdminDocumentRow = DocumentRow & { source?: 'database' | 'storage' }

function uniqueValues(values: Array<string | null | undefined>) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))]
}

const publicUserSelection = {
  id: users.id,
  firstName: users.firstName,
  lastName: users.lastName,
  email: users.email,
  role: users.role,
  archivedAt: users.archivedAt,
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
  submittedAt: subscriptions.submittedAt,
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

async function withSignedDocument(document: AdminDocumentRow) {
  return {
    ...document,
    signedUrl: await createPrivateSignedUrl(document.storageBucket, document.storagePath),
  }
}

async function withSignedDocuments(rows: AdminDocumentRow[]) {
  return Promise.all(rows.map(withSignedDocument))
}

async function loadStorageOnlyDocuments(subscription: SubscriptionRow, existingDocuments: DocumentRow[]): Promise<AdminDocumentRow[]> {
  const existingPaths = new Set(existingDocuments.map((document) => document.storagePath))
  const storageObjects = await listSubscriptionDocumentObjects(subscription.userId, subscription.id)
  const now = new Date()

  return storageObjects
    .filter((object) => !existingPaths.has(object.path))
    .map((object) => {
      const createdAt = object.createdAt ? new Date(object.createdAt) : now
      const updatedAt = object.updatedAt ? new Date(object.updatedAt) : createdAt

      return {
        id: encodeStorageDocumentId(object.path),
        subscriptionId: subscription.id,
        ownerId: subscription.userId,
        type: object.type as DocumentRow['type'],
        fileUrl: object.path,
        storageBucket: object.bucket,
        storagePath: object.path,
        originalFilename: object.name,
        mimeType: object.mimeType ?? 'application/octet-stream',
        sizeBytes: object.sizeBytes ?? 0,
        status: 'pending',
        analysisResult: {
          provider: 'storage-fallback',
          warnings: ['Fichier present dans Supabase Storage sans ligne document associee.'],
        },
        analyzedAt: null,
        rejectionReason: null,
        createdAt,
        updatedAt,
        source: 'storage',
      } satisfies AdminDocumentRow
    })
}

const offerSelection = {
  id: offers.id,
  code: offers.code,
  name: offers.name,
  description: offers.description,
  target: offers.target,
  requiredDocuments: offers.requiredDocuments,
  priceCents: offers.priceCents,
  monthlyInstallmentCount: offers.monthlyInstallmentCount,
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
  const workflow = await reconcileSubscriptionWorkflow(subscription.id)
  const effectiveSubscription = subscription.submittedAt && !['accepted', 'rejected', 'cancelled', 'suspended'].includes(subscription.status)
    ? { ...subscription, status: workflow.desiredStatus }
    : subscription
  const [userRows, offerRows, bearerRows, payerRows, onboardingRows, subscriptionDocuments, subscriptionPayments, subscriptionTerminations] = await Promise.all([
    database.select(publicUserSelection).from(users).where(eq(users.id, subscription.userId)).limit(1),
    subscription.offerId ? database.select(offerSelection).from(offers).where(eq(offers.id, subscription.offerId)).limit(1) : [],
    subscription.bearerProfileId ? database.select().from(profiles).where(eq(profiles.id, subscription.bearerProfileId)).limit(1) : [],
    subscription.payerProfileId ? database.select().from(profiles).where(eq(profiles.id, subscription.payerProfileId)).limit(1) : [],
    subscription.onboardingSessionId ? database.select().from(onboardingSessions).where(eq(onboardingSessions.id, subscription.onboardingSessionId)).limit(1) : [],
    database.select(documentSelection).from(documents).where(eq(documents.subscriptionId, subscription.id)).orderBy(desc(documents.updatedAt)),
    database.select(paymentSelection).from(payments).where(eq(payments.subscriptionId, subscription.id)).orderBy(desc(payments.updatedAt)),
    database.select().from(terminationRequests).where(eq(terminationRequests.subscriptionId, subscription.id)).orderBy(desc(terminationRequests.createdAt)),
  ])
  const [user] = userRows
  const [offer] = offerRows
  const [bearerProfile] = bearerRows
  const [payerProfile] = payerRows
  const [onboardingSession] = onboardingRows
  const storageOnlyDocuments = await loadStorageOnlyDocuments(subscription, subscriptionDocuments)

  return {
    subscription: effectiveSubscription,
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
    documents: await withSignedDocuments([...subscriptionDocuments, ...storageOnlyDocuments].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())),
    payments: subscriptionPayments,
    terminationRequests: subscriptionTerminations,
    workflow,
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
      terminationRequests: [],
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
        message: 'Le dossier attend un paiement par carte ou la validation d’un mandat SEPA.',
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
  const current = await findSubscription(id)
  if (input.status === 'accepted') {
    const workflow = await evaluateSubscriptionWorkflow(id)
    if (current.status !== 'pending_validation' || workflow.state !== 'under_review') {
      throw new AppError(409, "Le dossier ne peut être validé qu'après envoi final et contrôle des prérequis.", {
        blockingReasons: workflow.blockingReasons,
      })
    }
  }
  const [updated] = await requireDb()
    .update(subscriptions)
    .set({ status: input.status, updatedAt: new Date() })
    .where(eq(subscriptions.id, id))
    .returning(subscriptionSelection)

  if (!updated) throw new AppError(500, "Le statut de la souscription n'a pas pu etre mis a jour.")
  await notifySubscriptionStatusChanged({
    userId: updated.userId,
    subscriptionId: updated.id,
    previousStatus: current.status,
    status: updated.status,
  })
  return enrichSubscription(updated)
}

export async function listPendingDocuments() {
  const database = requireDb()
  const rows = await database
    .select(documentSelection)
    .from(documents)
    .innerJoin(subscriptions, eq(documents.subscriptionId, subscriptions.id))
    .where(and(
      inArray(documents.status, ['pending', 'analyzing', 'needs_manual_review']),
      isNotNull(subscriptions.submittedAt),
    ))
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
  const current = await findDocument(id)
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
        decision: input.decision,
        note: input.note ?? null,
        reviewedAt: new Date().toISOString(),
      },
      updatedAt: new Date(),
    })
    .where(eq(documents.id, id))
    .returning(documentSelection)

  if (!updated) throw new AppError(500, "La revue du document n'a pas pu etre enregistree.")
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

export async function updateAdminUserRole(id: string, input: AdminUpdateUserRoleInput, actorId: string) {
  if (id === actorId && input.role !== 'admin') {
    throw new AppError(400, 'Vous ne pouvez pas retirer votre propre acces administrateur.')
  }

  const database = requireDb()
  const [current] = await database.select(publicUserSelection).from(users).where(eq(users.id, id)).limit(1)
  if (!current) throw new AppError(404, 'Utilisateur introuvable.')

  if (current.role === 'admin' && input.role !== 'admin' && !current.archivedAt) {
    const admins = await database.select({ id: users.id }).from(users).where(and(eq(users.role, 'admin'), isNull(users.archivedAt)))
    if (admins.length <= 1) throw new AppError(400, 'Au moins un administrateur doit rester actif.')
  }

  const [updated] = await database
    .update(users)
    .set({ role: input.role, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning(publicUserSelection)

  if (!updated) throw new AppError(500, "Le role de l'utilisateur n'a pas pu etre mis a jour.")
  const subscriptionRows = await database.select({ userId: subscriptions.userId }).from(subscriptions).where(eq(subscriptions.userId, id))
  return { ...updated, subscriptionCount: subscriptionRows.length }
}

export async function updateAdminUserArchive(id: string, input: AdminUpdateUserArchiveInput, actorId: string) {
  if (id === actorId && input.archived) {
    throw new AppError(400, 'Vous ne pouvez pas archiver votre propre compte administrateur.')
  }

  const database = requireDb()
  const [current] = await database.select(publicUserSelection).from(users).where(eq(users.id, id)).limit(1)
  if (!current) throw new AppError(404, 'Utilisateur introuvable.')

  if (input.archived && current.role === 'admin' && !current.archivedAt) {
    const activeAdmins = await database
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.role, 'admin'), isNull(users.archivedAt)))
    if (activeAdmins.length <= 1) throw new AppError(400, 'Au moins un administrateur actif doit être conservé.')
  }

  const [updated] = await database
    .update(users)
    .set({ archivedAt: input.archived ? new Date() : null, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning(publicUserSelection)
  if (!updated) throw new AppError(500, "Le statut d'archivage n'a pas pu être mis à jour.")

  const subscriptionRows = await database
    .select({ userId: subscriptions.userId })
    .from(subscriptions)
    .where(eq(subscriptions.userId, id))
  return { ...updated, subscriptionCount: subscriptionRows.length }
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

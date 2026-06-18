import { and, desc, eq, or } from 'drizzle-orm'
import { requireDb } from '../db/client.js'
import { documents, offers, onboardingSessions, payments, profiles, subscriptions } from '../db/schema.js'
import { AppError } from '../utils/app-error.js'
import { createPrivateSignedUrl } from './storage.service.js'
import { notifySubscriptionStatusChanged } from './notifications.service.js'
import type { CreateSubscriptionInput, UpdateSubscriptionInput } from '../validation/subscription.schemas.js'

type SubscriptionRow = typeof subscriptions.$inferSelect
type SubscriptionInput = CreateSubscriptionInput | UpdateSubscriptionInput

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

async function findOwnSubscription(userId: string, id: string) {
  const [subscription] = await requireDb()
    .select(subscriptionSelection)
    .from(subscriptions)
    .where(and(eq(subscriptions.id, id), eq(subscriptions.userId, userId)))
    .limit(1)

  if (!subscription) throw new AppError(404, 'Souscription introuvable.')
  return subscription
}

async function findSubscriptionForAccess(userId: string, role: string, id: string) {
  const where = role === 'admin'
    ? eq(subscriptions.id, id)
    : and(eq(subscriptions.id, id), eq(subscriptions.userId, userId))

  const [subscription] = await requireDb()
    .select(subscriptionSelection)
    .from(subscriptions)
    .where(where)
    .limit(1)

  if (!subscription) throw new AppError(404, 'Souscription introuvable.')
  return subscription
}

async function findOffer(input: SubscriptionInput) {
  if (!input.offerId && !input.offerCode) return null

  const [offer] = await requireDb()
    .select()
    .from(offers)
    .where(or(
      input.offerId ? eq(offers.id, input.offerId) : undefined,
      input.offerCode ? eq(offers.code, input.offerCode) : undefined,
    ))
    .limit(1)

  if (!offer) throw new AppError(404, 'Offre introuvable.')
  return offer
}

async function findOwnProfile(userId: string, id: string) {
  const [profile] = await requireDb()
    .select()
    .from(profiles)
    .where(and(eq(profiles.id, id), eq(profiles.userId, userId)))
    .limit(1)

  if (!profile) throw new AppError(404, 'Profil introuvable.')
  return profile
}

async function findOwnOnboardingSession(userId: string, id: string) {
  const [session] = await requireDb()
    .select()
    .from(onboardingSessions)
    .where(and(eq(onboardingSessions.id, id), eq(onboardingSessions.userId, userId)))
    .limit(1)

  if (!session) throw new AppError(404, "Session d'orientation introuvable.")
  return session
}

async function enrich(subscription: SubscriptionRow) {
  const database = requireDb()
  const [offer] = subscription.offerId ? await database.select().from(offers).where(eq(offers.id, subscription.offerId)).limit(1) : []
  const [bearerProfile] = subscription.bearerProfileId ? await database.select().from(profiles).where(eq(profiles.id, subscription.bearerProfileId)).limit(1) : []
  const [payerProfile] = subscription.payerProfileId ? await database.select().from(profiles).where(eq(profiles.id, subscription.payerProfileId)).limit(1) : []
  const [onboardingSession] = subscription.onboardingSessionId ? await database.select().from(onboardingSessions).where(eq(onboardingSessions.id, subscription.onboardingSessionId)).limit(1) : []
  const subscriptionDocuments = await database.select().from(documents).where(eq(documents.subscriptionId, subscription.id)).orderBy(desc(documents.updatedAt))
  const subscriptionPayments = await database.select().from(payments).where(eq(payments.subscriptionId, subscription.id)).orderBy(desc(payments.updatedAt))
  const documentsWithSignedUrls = await Promise.all(subscriptionDocuments.map(async (document) => ({
    ...document,
    signedUrl: await createPrivateSignedUrl(document.storageBucket, document.storagePath),
  })))

  return {
    subscription,
    offer: offer ?? null,
    bearerProfile: bearerProfile ?? null,
    payerProfile: payerProfile ?? null,
    onboardingSession: onboardingSession ? {
      id: onboardingSession.id,
      currentStep: onboardingSession.currentStep,
      subscriptionFor: onboardingSession.subscriptionFor,
      isBearerPayer: onboardingSession.isBearerPayer,
    } : null,
    documents: documentsWithSignedUrls,
    payments: subscriptionPayments,
  }
}

async function resolveSubscriptionValues(userId: string, input: SubscriptionInput) {
  const offer = await findOffer(input)
  const onboardingSession = input.onboardingSessionId ? await findOwnOnboardingSession(userId, input.onboardingSessionId) : null
  const bearerProfileId = input.bearerProfileId ?? onboardingSession?.bearerProfileId ?? null
  const payerProfileId = input.payerProfileId ?? onboardingSession?.payerProfileId ?? bearerProfileId

  if (!bearerProfileId) throw new AppError(400, 'Le profil porteur est requis.')
  await findOwnProfile(userId, bearerProfileId)
  if (payerProfileId) await findOwnProfile(userId, payerProfileId)

  return {
    offerId: offer?.id,
    bearerProfileId,
    payerProfileId,
    onboardingSessionId: onboardingSession?.id ?? input.onboardingSessionId,
  }
}

export async function createSubscription(userId: string, input: CreateSubscriptionInput) {
  const values = await resolveSubscriptionValues(userId, input)
  const [created] = await requireDb()
    .insert(subscriptions)
    .values({ userId, ...values, status: 'draft' })
    .returning(subscriptionSelection)

  if (!created) throw new AppError(500, "La souscription n'a pas pu etre creee.")
  return enrich(created)
}

export async function listSubscriptions(userId: string) {
  const rows = await requireDb()
    .select(subscriptionSelection)
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .orderBy(desc(subscriptions.updatedAt))

  return Promise.all(rows.map(enrich))
}

export async function getSubscription(userId: string, id: string) {
  return enrich(await findOwnSubscription(userId, id))
}

export async function getSubscriptionNextActions(userId: string, role: string, id: string) {
  const subscription = await findSubscriptionForAccess(userId, role, id)
  const [offer] = subscription.offerId ? await requireDb().select().from(offers).where(eq(offers.id, subscription.offerId)).limit(1) : []
  const documentRows = await requireDb().select().from(documents).where(eq(documents.subscriptionId, subscription.id))
  const paymentRows = await requireDb().select().from(payments).where(eq(payments.subscriptionId, subscription.id))
  const actions = []

  const requiredDocuments = offer?.requiredDocuments ?? []
  const providedTypes = new Set(documentRows.map((document) => document.type as string))
  const missingDocuments = requiredDocuments.filter((documentType) => !providedTypes.has(documentType))
  if (missingDocuments.length > 0) {
    actions.push({
      code: 'missing_documents',
      priority: 'high',
      label: 'Demander les justificatifs manquants',
      detail: `${missingDocuments.length} justificatif(s) attendu(s) : ${missingDocuments.join(', ')}.`,
    })
  }

  if (documentRows.some((document) => document.status === 'pending' || document.status === 'needs_manual_review')) {
    actions.push({
      code: 'review_documents',
      priority: 'high',
      label: 'Verifier les documents en attente',
      detail: 'Une revue humaine ou une analyse par regles est necessaire.',
    })
  }

  if (paymentRows.some((payment) => payment.status === 'rejected' || payment.status === 'cancelled')) {
    actions.push({
      code: 'regularize_payment',
      priority: 'high',
      label: 'Regulariser le paiement',
      detail: 'Un paiement bloque la progression du dossier.',
    })
  }

  if (subscription.status === 'pending_validation') {
    actions.push({
      code: 'validate_subscription',
      priority: 'medium',
      label: 'Valider ou refuser la souscription',
      detail: 'Le dossier est pret pour une decision backoffice.',
    })
  }

  if (actions.length === 0) {
    actions.push({
      code: 'no_action',
      priority: 'low',
      label: 'Aucune action prioritaire',
      detail: 'Le dossier ne presente pas de blocage detecte par le prototype.',
    })
  }

  return { subscriptionId: subscription.id, actions }
}

export async function updateSubscription(userId: string, id: string, input: UpdateSubscriptionInput) {
  const current = await findOwnSubscription(userId, id)
  if (current.status !== 'draft') throw new AppError(409, 'Seule une souscription en brouillon peut etre modifiee.')

  const values = await resolveSubscriptionValues(userId, input)
  const [updated] = await requireDb()
    .update(subscriptions)
    .set({ ...values, updatedAt: new Date() })
    .where(and(eq(subscriptions.id, id), eq(subscriptions.userId, userId)))
    .returning(subscriptionSelection)

  if (!updated) throw new AppError(500, "La souscription n'a pas pu etre mise a jour.")
  return enrich(updated)
}

export async function submitSubscription(userId: string, id: string) {
  const current = await findOwnSubscription(userId, id)
  if (current.status !== 'draft') throw new AppError(409, 'La souscription a deja ete soumise.')
  if (!current.offerId) throw new AppError(400, 'Une offre doit etre associee avant soumission.')

  const [offer] = await requireDb().select().from(offers).where(eq(offers.id, current.offerId)).limit(1)
  if (!offer) throw new AppError(404, 'Offre introuvable.')

  const nextStatus = offer.requiredDocuments.length > 0 ? 'pending_documents' : 'pending_payment'
  const [updated] = await requireDb()
    .update(subscriptions)
    .set({ status: nextStatus, updatedAt: new Date() })
    .where(and(eq(subscriptions.id, id), eq(subscriptions.userId, userId)))
    .returning(subscriptionSelection)

  if (!updated) throw new AppError(500, "La souscription n'a pas pu etre soumise.")
  await notifySubscriptionStatusChanged({
    userId: updated.userId,
    subscriptionId: updated.id,
    previousStatus: current.status,
    status: updated.status,
  })
  return enrich(updated)
}

export async function cancelSubscription(userId: string, id: string) {
  const current = await findOwnSubscription(userId, id)
  const [updated] = await requireDb()
    .update(subscriptions)
    .set({ status: 'cancelled', updatedAt: new Date() })
    .where(and(eq(subscriptions.id, id), eq(subscriptions.userId, userId)))
    .returning(subscriptionSelection)

  if (!updated) throw new AppError(500, "La souscription n'a pas pu etre annulee.")
  await notifySubscriptionStatusChanged({
    userId: updated.userId,
    subscriptionId: updated.id,
    previousStatus: current.status,
    status: updated.status,
  })
  return enrich(updated)
}

export async function suspendSubscription(userId: string, id: string) {
  const current = await findOwnSubscription(userId, id)
  const [updated] = await requireDb()
    .update(subscriptions)
    .set({ status: 'suspended', updatedAt: new Date() })
    .where(and(eq(subscriptions.id, id), eq(subscriptions.userId, userId)))
    .returning(subscriptionSelection)

  if (!updated) throw new AppError(500, "La souscription n'a pas pu etre suspendue.")
  await notifySubscriptionStatusChanged({
    userId: updated.userId,
    subscriptionId: updated.id,
    previousStatus: current.status,
    status: updated.status,
  })
  return enrich(updated)
}

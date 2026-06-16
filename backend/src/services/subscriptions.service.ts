import { and, desc, eq, or } from 'drizzle-orm'
import { requireDb } from '../db/client.js'
import { offers, onboardingSessions, profiles, subscriptions } from '../db/schema.js'
import { AppError } from '../utils/app-error.js'
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
  return enrich(updated)
}

export async function cancelSubscription(userId: string, id: string) {
  await findOwnSubscription(userId, id)
  const [updated] = await requireDb()
    .update(subscriptions)
    .set({ status: 'cancelled', updatedAt: new Date() })
    .where(and(eq(subscriptions.id, id), eq(subscriptions.userId, userId)))
    .returning(subscriptionSelection)

  if (!updated) throw new AppError(500, "La souscription n'a pas pu etre annulee.")
  return enrich(updated)
}

export async function suspendSubscription(userId: string, id: string) {
  await findOwnSubscription(userId, id)
  const [updated] = await requireDb()
    .update(subscriptions)
    .set({ status: 'suspended', updatedAt: new Date() })
    .where(and(eq(subscriptions.id, id), eq(subscriptions.userId, userId)))
    .returning(subscriptionSelection)

  if (!updated) throw new AppError(500, "La souscription n'a pas pu etre suspendue.")
  return enrich(updated)
}

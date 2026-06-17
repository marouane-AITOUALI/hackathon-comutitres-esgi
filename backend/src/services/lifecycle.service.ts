import { desc, eq, inArray, or } from 'drizzle-orm'
import { requireDb } from '../db/client.js'
import { documents, onboardingSessions, payments, profiles, renewalEvents, subscriptions, users } from '../db/schema.js'
import { AppError } from '../utils/app-error.js'

type TimelineEvent = {
  id: string
  type: string
  title: string
  date: Date
  metadata: Record<string, unknown>
}

const publicUserSelection = {
  id: users.id,
  firstName: users.firstName,
  lastName: users.lastName,
  email: users.email,
  role: users.role,
  createdAt: users.createdAt,
  updatedAt: users.updatedAt,
}

function ensureUserAccess(authUserId: string, role: string, requestedUserId: string) {
  if (role !== 'admin' && authUserId !== requestedUserId) throw new AppError(403, 'Acces interdit a cette timeline.')
}

function sortEvents(events: TimelineEvent[]) {
  return events.sort((a, b) => b.date.getTime() - a.date.getTime()).map((event) => ({
    ...event,
    date: event.date.toISOString(),
  }))
}

async function findProfileForAccess(authUserId: string, role: string, profileId: string) {
  const [profile] = await requireDb().select().from(profiles).where(eq(profiles.id, profileId)).limit(1)
  if (!profile || (role !== 'admin' && profile.userId !== authUserId)) throw new AppError(404, 'Profil introuvable.')
  return profile
}

export async function getUserTimeline(authUserId: string, role: string, requestedUserId: string) {
  ensureUserAccess(authUserId, role, requestedUserId)
  const database = requireDb()
  const [user] = await database.select(publicUserSelection).from(users).where(eq(users.id, requestedUserId)).limit(1)
  if (!user) throw new AppError(404, 'Utilisateur introuvable.')

  const profileRows = await database.select().from(profiles).where(eq(profiles.userId, requestedUserId))
  const onboardingRows = await database.select().from(onboardingSessions).where(eq(onboardingSessions.userId, requestedUserId))
  const subscriptionRows = await database.select().from(subscriptions).where(eq(subscriptions.userId, requestedUserId))
  const paymentRows = await database.select().from(payments).where(eq(payments.userId, requestedUserId))
  const renewalRows = await database.select().from(renewalEvents).where(eq(renewalEvents.userId, requestedUserId))
  const subscriptionIds = subscriptionRows.map((subscription) => subscription.id)
  const documentRows = subscriptionIds.length
    ? await database.select().from(documents).where(inArray(documents.subscriptionId, subscriptionIds))
    : []

  const events: TimelineEvent[] = [
    {
      id: `user-created-${user.id}`,
      type: 'user_created',
      title: 'Compte cree',
      date: user.createdAt,
      metadata: { email: user.email },
    },
    ...profileRows.map((profile) => ({
      id: `profile-${profile.id}`,
      type: 'profile',
      title: `Profil ${profile.type} cree`,
      date: profile.createdAt,
      metadata: { profileId: profile.id, status: profile.status },
    })),
    ...onboardingRows.map((session) => ({
      id: `onboarding-${session.id}`,
      type: 'onboarding',
      title: `Parcours ${session.subscriptionFor}`,
      date: session.createdAt,
      metadata: { onboardingSessionId: session.id, currentStep: session.currentStep },
    })),
    ...subscriptionRows.map((subscription) => ({
      id: `subscription-${subscription.id}-${subscription.status}`,
      type: 'subscription',
      title: `Souscription ${subscription.status}`,
      date: subscription.updatedAt,
      metadata: { subscriptionId: subscription.id, offerId: subscription.offerId },
    })),
    ...documentRows.map((document) => ({
      id: `document-${document.id}-${document.status}`,
      type: 'document',
      title: `Justificatif ${document.status}`,
      date: document.updatedAt,
      metadata: { documentId: document.id, subscriptionId: document.subscriptionId, documentType: document.type },
    })),
    ...paymentRows.map((payment) => ({
      id: `payment-${payment.id}-${payment.status}`,
      type: 'payment',
      title: `Paiement ${payment.status}`,
      date: payment.updatedAt,
      metadata: { paymentId: payment.id, subscriptionId: payment.subscriptionId, amountCents: payment.amountCents },
    })),
    ...renewalRows.map((event) => ({
      id: `renewal-${event.id}`,
      type: 'renewal',
      title: `Renouvellement ${event.action}`,
      date: event.effectiveAt,
      metadata: { renewalEventId: event.id, subscriptionId: event.subscriptionId, reason: event.reason },
    })),
  ]

  return { user, events: sortEvents(events) }
}

export async function getProfileLifecycleEvents(authUserId: string, role: string, profileId: string) {
  const database = requireDb()
  const profile = await findProfileForAccess(authUserId, role, profileId)
  const subscriptionRows = await database
    .select()
    .from(subscriptions)
    .where(or(eq(subscriptions.bearerProfileId, profile.id), eq(subscriptions.payerProfileId, profile.id)))
    .orderBy(desc(subscriptions.updatedAt))

  const subscriptionIds = subscriptionRows.map((subscription) => subscription.id)
  const paymentRows = subscriptionIds.length ? await database.select().from(payments).where(inArray(payments.subscriptionId, subscriptionIds)) : []
  const renewalRows = subscriptionIds.length ? await database.select().from(renewalEvents).where(inArray(renewalEvents.subscriptionId, subscriptionIds)) : []
  const documentRows = subscriptionIds.length ? await database.select().from(documents).where(inArray(documents.subscriptionId, subscriptionIds)) : []

  const events: TimelineEvent[] = [
    {
      id: `profile-created-${profile.id}`,
      type: 'profile',
      title: `Profil ${profile.type} cree`,
      date: profile.createdAt,
      metadata: { profileId: profile.id, status: profile.status },
    },
    ...subscriptionRows.map((subscription) => ({
      id: `profile-subscription-${subscription.id}`,
      type: 'subscription',
      title: `Souscription ${subscription.status}`,
      date: subscription.updatedAt,
      metadata: { subscriptionId: subscription.id, asBearer: subscription.bearerProfileId === profile.id, asPayer: subscription.payerProfileId === profile.id },
    })),
    ...documentRows.map((document) => ({
      id: `profile-document-${document.id}`,
      type: 'document',
      title: `Justificatif ${document.status}`,
      date: document.updatedAt,
      metadata: { documentId: document.id, subscriptionId: document.subscriptionId, documentType: document.type },
    })),
    ...paymentRows.map((payment) => ({
      id: `profile-payment-${payment.id}`,
      type: 'payment',
      title: `Paiement ${payment.status}`,
      date: payment.updatedAt,
      metadata: { paymentId: payment.id, subscriptionId: payment.subscriptionId, amountCents: payment.amountCents },
    })),
    ...renewalRows.map((event) => ({
      id: `profile-renewal-${event.id}`,
      type: 'renewal',
      title: `Renouvellement ${event.action}`,
      date: event.effectiveAt,
      metadata: { renewalEventId: event.id, subscriptionId: event.subscriptionId, reason: event.reason },
    })),
  ]

  return { profile, events: sortEvents(events) }
}

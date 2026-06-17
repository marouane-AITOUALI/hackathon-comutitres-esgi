import { and, eq, or } from 'drizzle-orm'
import { requireDb } from '../db/client.js'
import { onboardingSessions, profiles, subscriptions } from '../db/schema.js'
import { AppError } from '../utils/app-error.js'
import type { CreateProfileInput, UpdateProfileInput } from '../validation/profiles.schemas.js'

const profileSelection = {
  id: profiles.id,
  userId: profiles.userId,
  type: profiles.type,
  status: profiles.status,
  firstName: profiles.firstName,
  lastName: profiles.lastName,
  birthDate: profiles.birthDate,
  email: profiles.email,
  relationshipToBearer: profiles.relationshipToBearer,
  createdAt: profiles.createdAt,
  updatedAt: profiles.updatedAt,
}

async function findOwnProfile(userId: string, id: string) {
  const [profile] = await requireDb().select(profileSelection).from(profiles).where(and(eq(profiles.id, id), eq(profiles.userId, userId))).limit(1)
  if (!profile) throw new AppError(404, 'Profil introuvable.')
  return profile
}

async function findLinkedRecords(profileId: string) {
  const database = requireDb()
  const subscriptionsLinked = await database.select().from(subscriptions).where(or(eq(subscriptions.bearerProfileId, profileId), eq(subscriptions.payerProfileId, profileId)))
  const onboardingLinked = await database.select().from(onboardingSessions).where(or(eq(onboardingSessions.bearerProfileId, profileId), eq(onboardingSessions.payerProfileId, profileId)))
  return { subscriptionsLinked, onboardingLinked }
}

async function buildLifecycle(userId: string, profileId: string) {
  const database = requireDb()
  const profile = await findOwnProfile(userId, profileId)
  const { subscriptionsLinked, onboardingLinked } = await findLinkedRecords(profileId)
  const siblingProfiles = await database.select(profileSelection).from(profiles).where(and(eq(profiles.userId, userId), or(eq(profiles.type, 'bearer'), eq(profiles.type, 'payer'))))

  const counterpartProfiles = siblingProfiles.filter((candidate) => candidate.id !== profile.id && candidate.type !== profile.type)

  return {
    profile,
    counterpartProfiles,
    onboardingSessions: onboardingLinked.map((session) => ({
      id: session.id,
      currentStep: session.currentStep,
      subscriptionFor: session.subscriptionFor,
      isBearerPayer: session.isBearerPayer,
      bearerProfileId: session.bearerProfileId,
      payerProfileId: session.payerProfileId,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    })),
    subscriptions: subscriptionsLinked.map((subscription) => ({
      id: subscription.id,
      status: subscription.status,
      offerId: subscription.offerId,
      onboardingSessionId: subscription.onboardingSessionId,
      bearerProfileId: subscription.bearerProfileId,
      payerProfileId: subscription.payerProfileId,
      createdAt: subscription.createdAt,
      updatedAt: subscription.updatedAt,
    })),
    summary: {
      hasBearer: siblingProfiles.some((candidate) => candidate.type === 'bearer'),
      hasPayer: siblingProfiles.some((candidate) => candidate.type === 'payer'),
      isSamePersonFlow: profile.type === 'bearer' && counterpartProfiles.length === 0,
      relation: profile.type === 'payer' ? profile.relationshipToBearer ?? 'other' : null,
    },
  }
}

export async function listProfiles(userId: string) {
  return requireDb().select(profileSelection).from(profiles).where(eq(profiles.userId, userId))
}

export async function createProfile(userId: string, input: CreateProfileInput) {
  const values = {
    userId,
    type: input.type,
    status: input.status ?? 'other',
    firstName: input.firstName,
    lastName: input.lastName,
    birthDate: input.birthDate,
    email: input.email,
    relationshipToBearer: input.type === 'payer' ? input.relationshipToBearer : undefined,
  }

  const [created] = await requireDb().insert(profiles).values(values).returning(profileSelection)
  if (!created) throw new AppError(500, "Le profil n'a pas pu etre cree.")
  return created
}

export async function getProfile(userId: string, id: string) {
  return findOwnProfile(userId, id)
}

export async function updateProfile(userId: string, id: string, input: UpdateProfileInput) {
  await findOwnProfile(userId, id)
  const [updated] = await requireDb()
    .update(profiles)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(profiles.id, id), eq(profiles.userId, userId)))
    .returning(profileSelection)

  if (!updated) throw new AppError(500, "Le profil n'a pas pu etre mis a jour.")
  return updated
}

export async function deleteProfile(userId: string, id: string) {
  await findOwnProfile(userId, id)
  const { subscriptionsLinked, onboardingLinked } = await findLinkedRecords(id)
  if (subscriptionsLinked.length || onboardingLinked.length) {
    throw new AppError(409, 'Impossible de supprimer un profil deja lie a une souscription ou une session onboarding.')
  }

  const [deleted] = await requireDb().delete(profiles).where(and(eq(profiles.id, id), eq(profiles.userId, userId))).returning(profileSelection)
  if (!deleted) throw new AppError(500, "Le profil n'a pas pu etre supprime.")
  return deleted
}

export async function getProfileLifecycle(userId: string, id: string) {
  return buildLifecycle(userId, id)
}
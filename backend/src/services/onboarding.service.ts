import { and, eq } from 'drizzle-orm'
import { requireDb } from '../db/client.js'
import { onboardingSessions, profiles } from '../db/schema.js'
import type { OnboardingInput } from '../validation/onboarding.schemas.js'
import { AppError } from '../utils/app-error.js'

export async function createOnboardingSession(userId: string, input: OnboardingInput) {
  return requireDb().transaction(async (tx) => {
    const [bearer] = await tx.insert(profiles).values({ userId, type: 'bearer', status: input.bearer.status, firstName: input.bearer.firstName, lastName: input.bearer.lastName, birthDate: input.bearer.birthDate }).returning()
    if (!bearer) throw new AppError(500, "Le profil porteur n'a pas pu etre cree.")
    let payerProfileId = bearer.id
    if (!input.isBearerPayer && input.payer) {
      const [payer] = await tx.insert(profiles).values({ userId, type: 'payer', status: 'other', firstName: input.payer.firstName, lastName: input.payer.lastName, email: input.payer.email, relationshipToBearer: input.payer.relationshipToBearer }).returning()
      if (!payer) throw new AppError(500, "Le profil payeur n'a pas pu etre cree.")
      payerProfileId = payer.id
    }
    const [created] = await tx.insert(onboardingSessions).values({ userId, bearerProfileId: bearer.id, payerProfileId, isBearerPayer: input.isBearerPayer, currentStep: input.currentStep, subscriptionFor: input.subscriptionFor, answers: input.answers }).returning()
    if (!created) throw new AppError(500, "La session d'orientation n'a pas pu etre creee.")
    return { session: created, bearer, payerProfileId }
  })
}

export async function getOnboardingSession(userId: string, id: string) {
  const database = requireDb()
  const [session] = await database.select().from(onboardingSessions).where(and(eq(onboardingSessions.id, id), eq(onboardingSessions.userId, userId))).limit(1)
  if (!session) throw new AppError(404, "Session d'orientation introuvable.")
  const bearerProfile = session.bearerProfileId ? (await database.select().from(profiles).where(eq(profiles.id, session.bearerProfileId)).limit(1))[0] ?? null : null
  const payerProfile = session.payerProfileId ? (await database.select().from(profiles).where(eq(profiles.id, session.payerProfileId)).limit(1))[0] ?? null : null
  return { ...session, bearerProfile, payerProfile }
}

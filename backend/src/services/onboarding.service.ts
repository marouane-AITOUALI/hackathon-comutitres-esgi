import { and, eq } from 'drizzle-orm'
import { requireDb } from '../db/client.js'
import { onboardingSessions, profiles, users } from '../db/schema.js'
import type { CompleteOnboardingStepInput, OnboardingInput, UpdateOnboardingInput } from '../validation/onboarding.schemas.js'
import type { RecommendationInput } from '../validation/recommendation.schemas.js'
import { recommendOffer } from './recommendation.service.js'
import { AppError } from '../utils/app-error.js'
import { assertNoOpenSubscription } from './subscription-workflow.service.js'

type BearerInput = NonNullable<OnboardingInput['bearer']>
type PayerInput = NonNullable<OnboardingInput['payer']>
type OnboardingSession = typeof onboardingSessions.$inferSelect
type DatabaseExecutor = Pick<ReturnType<typeof requireDb>, 'insert' | 'update'>

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

function mergeAnswers(current: Record<string, unknown>, incoming?: Record<string, unknown>) {
  return { ...current, ...(incoming ?? {}) }
}

function yearsBetween(dateValue: string | null | undefined, now = new Date()) {
  if (!dateValue) return 0
  const birthDate = new Date(`${dateValue}T00:00:00.000Z`)
  if (Number.isNaN(birthDate.getTime())) return 0
  let age = now.getUTCFullYear() - birthDate.getUTCFullYear()
  const currentMonth = now.getUTCMonth()
  const birthMonth = birthDate.getUTCMonth()
  if (currentMonth < birthMonth || (currentMonth === birthMonth && now.getUTCDate() < birthDate.getUTCDate())) age -= 1
  return Math.max(0, age)
}

function stringAnswer(answers: Record<string, unknown>, key: string) {
  const value = answers[key]
  return typeof value === 'string' ? value : undefined
}

function booleanAnswer(answers: Record<string, unknown>, key: string) {
  const value = answers[key]
  return typeof value === 'boolean' ? value : undefined
}

async function upsertBearerProfile(tx: DatabaseExecutor, userId: string, profileId: string | null | undefined, input: BearerInput) {
  if (profileId) {
    const [updated] = await tx.update(profiles)
      .set({ status: input.status, firstName: input.firstName, lastName: input.lastName, birthDate: input.birthDate, updatedAt: new Date() })
      .where(and(eq(profiles.id, profileId), eq(profiles.userId, userId), eq(profiles.type, 'bearer')))
      .returning(profileSelection)
    if (!updated) throw new AppError(404, 'Profil porteur introuvable.')
    return updated
  }

  const [created] = await tx.insert(profiles)
    .values({ userId, type: 'bearer', status: input.status, firstName: input.firstName, lastName: input.lastName, birthDate: input.birthDate })
    .returning(profileSelection)
  if (!created) throw new AppError(500, "Le profil porteur n'a pas pu etre cree.")
  return created
}

async function upsertPayerProfile(tx: DatabaseExecutor, userId: string, profileId: string | null | undefined, input: PayerInput) {
  if (profileId) {
    const [updated] = await tx.update(profiles)
      .set({ status: 'other', firstName: input.firstName, lastName: input.lastName, email: input.email, relationshipToBearer: input.relationshipToBearer, updatedAt: new Date() })
      .where(and(eq(profiles.id, profileId), eq(profiles.userId, userId), eq(profiles.type, 'payer')))
      .returning(profileSelection)
    if (!updated) throw new AppError(404, 'Profil payeur introuvable.')
    return updated
  }

  const [created] = await tx.insert(profiles)
    .values({ userId, type: 'payer', status: 'other', firstName: input.firstName, lastName: input.lastName, email: input.email, relationshipToBearer: input.relationshipToBearer })
    .returning(profileSelection)
  if (!created) throw new AppError(500, "Le profil payeur n'a pas pu etre cree.")
  return created
}

async function findOwnSession(userId: string, id: string) {
  const [session] = await requireDb().select().from(onboardingSessions).where(and(eq(onboardingSessions.id, id), eq(onboardingSessions.userId, userId))).limit(1)
  if (!session) throw new AppError(404, "Session d'orientation introuvable.")
  return session
}

async function hydrateSession(session: OnboardingSession) {
  const database = requireDb()
  const bearerProfile = session.bearerProfileId ? (await database.select(profileSelection).from(profiles).where(eq(profiles.id, session.bearerProfileId)).limit(1))[0] ?? null : null
  const payerProfile = session.payerProfileId ? (await database.select(profileSelection).from(profiles).where(eq(profiles.id, session.payerProfileId)).limit(1))[0] ?? null : null
  return { ...session, bearerProfile, payerProfile }
}

function buildRecommendationInput(session: OnboardingSession, bearerProfile: Awaited<ReturnType<typeof hydrateSession>>['bearerProfile']): RecommendationInput {
  const answers = session.answers ?? {}
  return {
    age: yearsBetween(bearerProfile?.birthDate),
    status: (stringAnswer(answers, 'status') ?? bearerProfile?.status ?? 'other') as RecommendationInput['status'],
    frequency: (stringAnswer(answers, 'frequency') ?? 'regular') as RecommendationInput['frequency'],
    planPreference: (stringAnswer(answers, 'planPreference') ?? 'unsure') as RecommendationInput['planPreference'],
    socialSituation: (stringAnswer(answers, 'socialSituation') ?? 'other') as RecommendationInput['socialSituation'],
    support: (stringAnswer(answers, 'support') ?? 'unsure') as RecommendationInput['support'],
    isBearerPayer: session.isBearerPayer,
    scholarship: booleanAnswer(answers, 'scholarship') ?? false,
    solidarity: booleanAnswer(answers, 'solidarity') ?? false,
    department: stringAnswer(answers, 'department'),
  }
}

function getMissingFields(session: OnboardingSession, bearerProfile: unknown, payerProfile: unknown) {
  const answers = session.answers ?? {}
  const missing: string[] = []
  if (!bearerProfile) missing.push('bearer')
  if (!session.isBearerPayer && !payerProfile) missing.push('payer')
  for (const key of ['frequency', 'planPreference', 'socialSituation', 'support']) {
    if (!answers[key]) missing.push(`answers.${key}`)
  }
  return missing
}

export async function createOnboardingSession(userId: string, input: OnboardingInput) {
  await assertNoOpenSubscription(userId)
  return requireDb().transaction(async (tx) => {
    await tx.update(users).set({
      ...input.address,
      addressLine2: input.address.addressLine2 ?? null,
      profileUpdatedAt: new Date(),
      updatedAt: new Date(),
    }).where(eq(users.id, userId))
    const bearer = input.bearer ? await upsertBearerProfile(tx, userId, null, input.bearer) : null
    let payerProfileId = input.isBearerPayer ? bearer?.id ?? null : null
    if (!input.isBearerPayer && input.payer) {
      const payer = await upsertPayerProfile(tx, userId, null, input.payer)
      payerProfileId = payer.id
    }
    const [created] = await tx.insert(onboardingSessions).values({ userId, bearerProfileId: bearer?.id ?? null, payerProfileId, isBearerPayer: input.isBearerPayer, currentStep: input.currentStep, subscriptionFor: input.subscriptionFor, answers: input.answers }).returning()
    if (!created) throw new AppError(500, "La session d'orientation n'a pas pu etre creee.")
    return hydrateSession(created)
  })
}

export async function getOnboardingSession(userId: string, id: string) {
  return hydrateSession(await findOwnSession(userId, id))
}

export async function updateOnboardingSession(userId: string, id: string, input: UpdateOnboardingInput) {
  const current = await findOwnSession(userId, id)
  return requireDb().transaction(async (tx) => {
    if (input.address) {
      await tx.update(users).set({
        ...input.address,
        addressLine2: input.address.addressLine2 ?? null,
        profileUpdatedAt: new Date(),
        updatedAt: new Date(),
      }).where(eq(users.id, userId))
    }
    const bearer = input.bearer ? await upsertBearerProfile(tx, userId, current.bearerProfileId, input.bearer) : null
    const nextIsBearerPayer = input.isBearerPayer ?? current.isBearerPayer
    let payerProfileId = current.payerProfileId

    if (nextIsBearerPayer) {
      payerProfileId = bearer?.id ?? current.bearerProfileId
    } else if (input.payer) {
      const payer = await upsertPayerProfile(tx, userId, current.payerProfileId === current.bearerProfileId ? null : current.payerProfileId, input.payer)
      payerProfileId = payer.id
    } else if (input.payer === null) {
      payerProfileId = null
    }

    const [updated] = await tx.update(onboardingSessions)
      .set({
        bearerProfileId: bearer?.id ?? current.bearerProfileId,
        payerProfileId,
        isBearerPayer: nextIsBearerPayer,
        currentStep: input.currentStep ?? current.currentStep,
        subscriptionFor: input.subscriptionFor ?? current.subscriptionFor,
        answers: mergeAnswers(current.answers, input.answers),
        updatedAt: new Date(),
      })
      .where(and(eq(onboardingSessions.id, id), eq(onboardingSessions.userId, userId)))
      .returning()

    if (!updated) throw new AppError(500, "La session d'orientation n'a pas pu etre mise a jour.")
    return hydrateSession(updated)
  })
}

export async function completeOnboardingStep(userId: string, id: string, input: CompleteOnboardingStepInput) {
  const current = await findOwnSession(userId, id)
  const currentAnswers = current.answers ?? {}
  const currentStepAnswers = typeof currentAnswers[input.step] === 'object' && currentAnswers[input.step] !== null ? currentAnswers[input.step] as Record<string, unknown> : {}
  const completedSteps = Array.isArray(currentAnswers.completedSteps) ? currentAnswers.completedSteps.filter((step): step is string => typeof step === 'string') : []
  const answers = {
    ...currentAnswers,
    ...input.answers,
    [input.step]: { ...currentStepAnswers, ...input.answers },
    completedSteps: Array.from(new Set([...completedSteps, input.step])),
  }

  const [updated] = await requireDb().update(onboardingSessions)
    .set({ currentStep: input.nextStep ?? input.step, answers, updatedAt: new Date() })
    .where(and(eq(onboardingSessions.id, id), eq(onboardingSessions.userId, userId)))
    .returning()

  if (!updated) throw new AppError(500, "L'etape n'a pas pu etre enregistree.")
  return hydrateSession(updated)
}

export async function getOnboardingSummary(userId: string, id: string) {
  const session = await getOnboardingSession(userId, id)
  const missingFields = getMissingFields(session, session.bearerProfile, session.payerProfile)
  return {
    sessionId: session.id,
    currentStep: session.currentStep,
    subscriptionFor: session.subscriptionFor,
    isBearerPayer: session.isBearerPayer,
    bearer: session.bearerProfile,
    payer: session.payerProfile,
    answers: session.answers,
    missingFields,
    canSubscribe: missingFields.length === 0,
    recommendationReady: !!session.bearerProfile,
  }
}

export async function createOnboardingRecommendation(userId: string, id: string) {
  const session = await getOnboardingSession(userId, id)
  if (!session.bearerProfile) throw new AppError(409, 'Le profil porteur est requis pour generer une recommandation.')
  const recommendationInput = buildRecommendationInput(session, session.bearerProfile)
  const recommendation = await recommendOffer(recommendationInput)
  return { sessionId: session.id, input: recommendationInput, recommendation }
}

export async function getOnboardingHelp(userId: string, id: string) {
  const summary = await getOnboardingSummary(userId, id)
  const nextActions = summary.missingFields.map((field) => {
    if (field === 'bearer') return 'Completer le profil du porteur.'
    if (field === 'payer') return 'Completer le profil du payeur.'
    if (field.startsWith('answers.')) return `Renseigner ${field.replace('answers.', '')}.`
    return `Completer ${field}.`
  })

  return {
    sessionId: summary.sessionId,
    currentStep: summary.currentStep,
    nextActions,
    messages: nextActions.length ? nextActions : ['Le parcours est pret pour le recapitulatif et la recommandation.'],
  }
}

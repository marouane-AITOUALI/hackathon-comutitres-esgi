import bcrypt from 'bcryptjs'
import { desc, eq, or } from 'drizzle-orm'
import { requireDb } from '../db/client.js'
import { onboardingSessions, offers, profiles, subscriptions, users } from '../db/schema.js'
import type { AuthSession, PublicUser, SubscriptionSummary } from '../types/auth.js'
import type { LoginInput, RegisterInput, RegisterWithOnboardingInput } from '../validation/auth.schemas.js'
import { AppError } from '../utils/app-error.js'
import { createAuthToken } from '../utils/jwt.js'

const selection = { id: users.id, firstName: users.firstName, lastName: users.lastName, email: users.email, role: users.role }
type DatabaseExecutor = Pick<ReturnType<typeof requireDb>, 'select' | 'insert'>

async function getLatestSubscription(database: DatabaseExecutor, userId: string): Promise<SubscriptionSummary | null> {
  const [subscription] = await database
    .select({ id: subscriptions.id, status: subscriptions.status, offerId: subscriptions.offerId, onboardingSessionId: subscriptions.onboardingSessionId })
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1)
  return subscription ?? null
}

const session = async (database: DatabaseExecutor, user: PublicUser): Promise<AuthSession> => ({
  user,
  token: createAuthToken({ sub: user.id, email: user.email, role: user.role }),
  subscription: await getLatestSubscription(database, user.id),
})

async function createUser(database: DatabaseExecutor, input: RegisterInput) {
  const [existing] = await database.select({ id: users.id }).from(users).where(eq(users.email, input.email)).limit(1)
  if (existing) throw new AppError(409, 'Un compte existe deja avec cette adresse email.')
  const [user] = await database.insert(users).values({
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    passwordHash: await bcrypt.hash(input.password, 12),
    rgpdConsent: input.rgpdConsent,
    rgpdConsentedAt: new Date(),
  }).returning(selection)
  if (!user) throw new AppError(500, "Le compte n'a pas pu etre cree.")
  return user
}

async function createOnboardingBundle(
  database: DatabaseExecutor,
  userId: string,
  input: RegisterWithOnboardingInput['onboarding'],
) {
  const [bearer] = await database.insert(profiles).values({
    userId,
    type: 'bearer',
    status: input.bearer.status,
    firstName: input.bearer.firstName,
    lastName: input.bearer.lastName,
    birthDate: input.bearer.birthDate,
  }).returning()
  if (!bearer) throw new AppError(500, "Le profil porteur n'a pas pu etre cree.")

  let payerProfileId = bearer.id
  if (!input.isBearerPayer && input.payer) {
    const [payer] = await database.insert(profiles).values({
      userId,
      type: 'payer',
      status: 'other',
      firstName: input.payer.firstName,
      lastName: input.payer.lastName,
      email: input.payer.email,
      relationshipToBearer: input.payer.relationshipToBearer,
    }).returning()
    if (!payer) throw new AppError(500, "Le profil payeur n'a pas pu etre cree.")
    payerProfileId = payer.id
  }

  const [createdSession] = await database.insert(onboardingSessions).values({
    userId,
    bearerProfileId: bearer.id,
    payerProfileId,
    isBearerPayer: input.isBearerPayer,
    currentStep: input.currentStep,
    subscriptionFor: input.subscriptionFor,
    answers: input.answers,
  }).returning()
  if (!createdSession) throw new AppError(500, "La session d'orientation n'a pas pu etre creee.")

  return { bearer, payerProfileId, onboardingSession: createdSession }
}

export async function registerUser(input: RegisterInput) {
  const database = requireDb()
  const user = await createUser(database, input)
  return session(database, user)
}

export async function registerUserWithOnboarding(input: RegisterWithOnboardingInput) {
  return requireDb().transaction(async (tx) => {
    const user = await createUser(tx, input)
    const bundle = await createOnboardingBundle(tx, user.id, input.onboarding)
    const offerConditions = [
      input.recommendedOffer.offerId ? eq(offers.id, input.recommendedOffer.offerId) : undefined,
      input.recommendedOffer.offerCode ? eq(offers.code, input.recommendedOffer.offerCode) : undefined,
    ].filter((condition) => condition !== undefined)
    const [offer] = await tx.select({ id: offers.id }).from(offers).where(or(...offerConditions)).limit(1)
    if (!offer) throw new AppError(400, 'Offre recommandee introuvable.')

    const [subscription] = await tx.insert(subscriptions).values({
      userId: user.id,
      bearerProfileId: bundle.bearer.id,
      payerProfileId: bundle.payerProfileId,
      offerId: offer.id,
      onboardingSessionId: bundle.onboardingSession.id,
      status: 'draft',
    }).returning()

    if (!subscription) throw new AppError(500, "La souscription n'a pas pu etre creee.")

    return {
      ...(await session(tx, user)),
      onboardingSession: bundle.onboardingSession,
      subscription,
    }
  })
}

export async function loginUser(input: LoginInput) {
  const database = requireDb()
  const [user] = await database.select({ ...selection, passwordHash: users.passwordHash }).from(users).where(eq(users.email, input.email)).limit(1)
  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) throw new AppError(401, 'Email ou mot de passe incorrect.')
  const { passwordHash: _passwordHash, ...publicUser } = user
  return session(database, publicUser)
}

export async function getUserById(id: string) {
  const database = requireDb()
  const [user] = await database.select(selection).from(users).where(eq(users.id, id)).limit(1)
  if (!user) throw new AppError(404, 'Utilisateur introuvable.')
  return { user, subscription: await getLatestSubscription(database, id) }
}

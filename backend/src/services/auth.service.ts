import bcrypt from 'bcryptjs'
import { and, desc, eq, ne, or } from 'drizzle-orm'
import { requireDb } from '../db/client.js'
import { onboardingSessions, offers, profiles, subscriptions, userAvatars, users } from '../db/schema.js'
import type { AuthSession, PublicUser, SubscriptionSummary } from '../types/auth.js'
import type { LoginInput, RegisterInput, RegisterWithOnboardingInput, UpdateCurrentUserInput } from '../validation/auth.schemas.js'
import { AppError } from '../utils/app-error.js'
import { createAuthToken } from '../utils/jwt.js'
import { notifyAccountCreated } from './notifications.service.js'
import { createPrivateSignedUrl } from './storage.service.js'

const selection = {
  id: users.id,
  firstName: users.firstName,
  lastName: users.lastName,
  email: users.email,
  role: users.role,
  archivedAt: users.archivedAt,
  phone: users.phone,
  addressLine1: users.addressLine1,
  addressLine2: users.addressLine2,
  postalCode: users.postalCode,
  city: users.city,
  country: users.country,
  preferredContact: users.preferredContact,
  accessibilityPreference: users.accessibilityPreference,
  marketingOptIn: users.marketingOptIn,
  marketingOptInAt: users.marketingOptInAt,
  rgpdConsent: users.rgpdConsent,
  rgpdConsentedAt: users.rgpdConsentedAt,
  profileUpdatedAt: users.profileUpdatedAt,
  updatedAt: users.updatedAt,
}
type DatabaseExecutor = Pick<ReturnType<typeof requireDb>, 'select' | 'insert' | 'update'>

async function getLatestSubscription(database: DatabaseExecutor, userId: string): Promise<SubscriptionSummary | null> {
  const [subscription] = await database
    .select({ id: subscriptions.id, status: subscriptions.status, offerId: subscriptions.offerId, onboardingSessionId: subscriptions.onboardingSessionId, submittedAt: subscriptions.submittedAt })
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1)
  return subscription ?? null
}

async function withAvatar(database: DatabaseExecutor, user: PublicUser): Promise<PublicUser> {
  const [avatar] = await database
    .select({ storageBucket: userAvatars.storageBucket, storagePath: userAvatars.storagePath })
    .from(userAvatars)
    .where(eq(userAvatars.ownerId, user.id))
    .limit(1)

  if (!avatar) return { ...user, avatarUrl: null }
  return { ...user, avatarUrl: await createPrivateSignedUrl(avatar.storageBucket, avatar.storagePath) }
}

const session = async (database: DatabaseExecutor, user: PublicUser): Promise<AuthSession> => ({
  user: await withAvatar(database, user),
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
  const result = await session(database, user)
  await notifyAccountCreated({ userId: user.id, firstName: user.firstName }).catch((error) => {
    console.error('[notifications] Notification de bienvenue non créée.', error)
  })
  return result
}

export async function registerUserWithOnboarding(input: RegisterWithOnboardingInput) {
  const result = await requireDb().transaction(async (tx) => {
    const createdUser = await createUser(tx, input)
    const [user] = await tx.update(users).set({
      ...input.onboarding.address,
      addressLine2: input.onboarding.address.addressLine2 ?? null,
      profileUpdatedAt: new Date(),
      updatedAt: new Date(),
    }).where(eq(users.id, createdUser.id)).returning(selection)
    if (!user) throw new AppError(500, "L'adresse du compte n'a pas pu être enregistrée.")
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

  await notifyAccountCreated({
    userId: result.user.id,
    firstName: result.user.firstName,
    subscriptionId: result.subscription.id,
  }).catch((error) => {
    console.error('[notifications] Notification de bienvenue non créée.', error)
  })

  return result
}

export async function loginUser(input: LoginInput) {
  const database = requireDb()
  const [user] = await database.select({ ...selection, passwordHash: users.passwordHash }).from(users).where(eq(users.email, input.email)).limit(1)
  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) throw new AppError(401, 'Email ou mot de passe incorrect.')
  if (user.archivedAt) throw new AppError(403, 'Ce compte est archivé. Contactez un administrateur pour le réactiver.')
  const { passwordHash: _passwordHash, ...publicUser } = user
  return session(database, publicUser)
}

export async function getUserById(id: string) {
  const database = requireDb()
  const [user] = await database.select(selection).from(users).where(eq(users.id, id)).limit(1)
  if (!user) throw new AppError(404, 'Utilisateur introuvable.')
  if (user.archivedAt) throw new AppError(403, 'Ce compte est archivé.')
  return { user: await withAvatar(database, user), subscription: await getLatestSubscription(database, id) }
}

export async function updateCurrentUser(id: string, input: UpdateCurrentUserInput) {
  const database = requireDb()
  const [currentUser] = await database.select(selection).from(users).where(eq(users.id, id)).limit(1)
  if (!currentUser) throw new AppError(404, 'Utilisateur introuvable.')

  if (input.email && input.email !== currentUser.email) {
    const [existing] = await database.select({ id: users.id }).from(users).where(and(eq(users.email, input.email), ne(users.id, id))).limit(1)
    if (existing) throw new AppError(409, 'Un compte existe deja avec cette adresse email.')
  }

  const preferredContact = input.preferredContact ?? currentUser.preferredContact
  const phone = input.phone === undefined ? currentUser.phone : input.phone
  if ((preferredContact === 'phone' || preferredContact === 'sms') && !phone) {
    throw new AppError(400, 'Un numero de telephone est requis pour ce canal de contact.')
  }

  const marketingOptIn = input.marketingOptIn ?? currentUser.marketingOptIn
  const [updated] = await database
    .update(users)
    .set({
      ...input,
      phone,
      country: 'FR',
      marketingOptInAt: marketingOptIn ? currentUser.marketingOptInAt ?? new Date() : null,
      profileUpdatedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(users.id, id))
    .returning(selection)

  if (!updated) throw new AppError(500, "Le profil n'a pas pu etre mis a jour.")
  return { user: updated, subscription: await getLatestSubscription(database, id) }
}

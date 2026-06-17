import bcrypt from 'bcryptjs'
import { and, eq } from 'drizzle-orm'
import { closeDb, requireDb } from '../db/client.js'
import { documents, offers, onboardingSessions, payments, profiles, subscriptions, users } from '../db/schema.js'
import { seedAdmin } from './admin.seed.js'

const demoOffers = [
  { code: 'NAVIGO_ANNUEL', name: 'Navigo Annuel', target: 'Adulte voyageant quotidiennement', requiredDocuments: ['identity', 'proof_of_address'] },
  { code: 'NAVIGO_SENIOR', name: 'Navigo Annuel Senior', target: 'Personne de 62 ans ou plus', requiredDocuments: ['identity', 'tax_notice'] },
  { code: 'NAVIGO_MOIS', name: 'Navigo Mois', target: 'Voyageur regulier', requiredDocuments: ['identity'] },
  { code: 'NAVIGO_SEMAINE', name: 'Navigo Semaine', target: 'Besoin hebdomadaire', requiredDocuments: ['identity'] },
  { code: 'IMAGINE_R_JUNIOR', name: 'Imagine R Junior', target: 'Enfant de moins de 11 ans', requiredDocuments: ['identity', 'school_certificate'] },
  { code: 'IMAGINE_R_SCOLAIRE', name: 'Imagine R Scolaire', target: 'Scolaire', requiredDocuments: ['identity', 'school_certificate'] },
  { code: 'IMAGINE_R_ETUDIANT', name: 'Imagine R Etudiant', target: 'Etudiant', requiredDocuments: ['identity', 'school_certificate'] },
  { code: 'LIBERTE_PLUS', name: 'Liberte+', target: 'Voyageur occasionnel', requiredDocuments: ['identity'] },
  { code: 'TST_50', name: 'TST Reduction 50%', target: 'Beneficiaire solidarite', requiredDocuments: ['identity', 'eligibility'] },
  { code: 'TST_75', name: 'TST Solidarite 75%', target: 'Beneficiaire solidarite', requiredDocuments: ['identity', 'eligibility'] },
  { code: 'TST_GRATUITE', name: 'TST Solidarite Gratuite', target: 'Beneficiaire social', requiredDocuments: ['identity', 'eligibility'] },
  { code: 'AMETHYSTE', name: 'Amethyste', target: 'Profil eligible selon departement', requiredDocuments: ['identity', 'tax_notice'] },
]

async function ensureUser() {
  const database = requireDb()
  const email = 'parent.demo@example.com'
  const passwordHash = await bcrypt.hash('Demo123!', 12)
  const [existing] = await database.select().from(users).where(eq(users.email, email)).limit(1)

  if (existing) {
    const [updated] = await database
      .update(users)
      .set({
        firstName: 'Parent',
        lastName: 'Demo',
        passwordHash,
        role: 'user',
        rgpdConsent: true,
        rgpdConsentedAt: existing.rgpdConsentedAt ?? new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, existing.id))
      .returning()

    if (!updated) throw new Error("L'utilisateur demo n'a pas pu etre mis a jour.")
    return updated
  }

  const [created] = await database
    .insert(users)
    .values({
      firstName: 'Parent',
      lastName: 'Demo',
      email,
      passwordHash,
      role: 'user',
      rgpdConsent: true,
      rgpdConsentedAt: new Date(),
    })
    .returning()

  if (!created) throw new Error("L'utilisateur demo n'a pas pu etre cree.")
  return created
}

async function seedOffers() {
  const database = requireDb()
  for (const offer of demoOffers) {
    await database
      .insert(offers)
      .values({ ...offer, isActive: true })
      .onConflictDoUpdate({
        target: offers.code,
        set: { ...offer, isActive: true, updatedAt: new Date() },
      })
  }

  const [schoolOffer] = await database.select().from(offers).where(eq(offers.code, 'IMAGINE_R_SCOLAIRE')).limit(1)
  if (!schoolOffer) throw new Error("L'offre IMAGINE_R_SCOLAIRE est introuvable apres seed.")
  return schoolOffer
}

async function ensureBearerProfile(userId: string) {
  const database = requireDb()
  const existingRows = await database.select().from(profiles).where(and(eq(profiles.userId, userId), eq(profiles.type, 'bearer')))
  const existing = existingRows.find((profile) => profile.firstName === 'Adam' && profile.lastName === 'Demo')

  if (existing) {
    const [updated] = await database
      .update(profiles)
      .set({ status: 'school', birthDate: '2013-09-12', updatedAt: new Date() })
      .where(eq(profiles.id, existing.id))
      .returning()
    if (!updated) throw new Error("Le profil porteur demo n'a pas pu etre mis a jour.")
    return updated
  }

  const [created] = await database
    .insert(profiles)
    .values({ userId, type: 'bearer', status: 'school', firstName: 'Adam', lastName: 'Demo', birthDate: '2013-09-12' })
    .returning()

  if (!created) throw new Error("Le profil porteur demo n'a pas pu etre cree.")
  return created
}

async function ensurePayerProfile(userId: string) {
  const database = requireDb()
  const existingRows = await database.select().from(profiles).where(and(eq(profiles.userId, userId), eq(profiles.type, 'payer')))
  const existing = existingRows.find((profile) => profile.email === 'parent.demo@example.com')

  if (existing) {
    const [updated] = await database
      .update(profiles)
      .set({ firstName: 'Parent', lastName: 'Demo', relationshipToBearer: 'parent', updatedAt: new Date() })
      .where(eq(profiles.id, existing.id))
      .returning()
    if (!updated) throw new Error("Le profil payeur demo n'a pas pu etre mis a jour.")
    return updated
  }

  const [created] = await database
    .insert(profiles)
    .values({ userId, type: 'payer', status: 'other', firstName: 'Parent', lastName: 'Demo', email: 'parent.demo@example.com', relationshipToBearer: 'parent' })
    .returning()

  if (!created) throw new Error("Le profil payeur demo n'a pas pu etre cree.")
  return created
}

async function ensureOnboarding(userId: string, bearerProfileId: string, payerProfileId: string) {
  const database = requireDb()
  const answers = {
    frequency: 'daily',
    socialSituation: 'school',
    support: 'navigo_pass',
    demo: true,
  }
  const [existing] = await database.select().from(onboardingSessions).where(eq(onboardingSessions.userId, userId)).limit(1)

  if (existing) {
    const [updated] = await database
      .update(onboardingSessions)
      .set({
        bearerProfileId,
        payerProfileId,
        isBearerPayer: false,
        currentStep: 'result',
        subscriptionFor: 'child',
        answers,
        updatedAt: new Date(),
      })
      .where(eq(onboardingSessions.id, existing.id))
      .returning()
    if (!updated) throw new Error("La session onboarding demo n'a pas pu etre mise a jour.")
    return updated
  }

  const [created] = await database
    .insert(onboardingSessions)
    .values({ userId, bearerProfileId, payerProfileId, isBearerPayer: false, currentStep: 'result', subscriptionFor: 'child', answers })
    .returning()

  if (!created) throw new Error("La session onboarding demo n'a pas pu etre creee.")
  return created
}

async function ensureSubscription(userId: string, bearerProfileId: string, payerProfileId: string, offerId: string, onboardingSessionId: string) {
  const database = requireDb()
  const [existing] = await database
    .select()
    .from(subscriptions)
    .where(and(eq(subscriptions.userId, userId), eq(subscriptions.offerId, offerId)))
    .limit(1)

  if (existing) {
    const [updated] = await database
      .update(subscriptions)
      .set({ bearerProfileId, payerProfileId, onboardingSessionId, status: 'pending_documents', updatedAt: new Date() })
      .where(eq(subscriptions.id, existing.id))
      .returning()
    if (!updated) throw new Error("La souscription demo n'a pas pu etre mise a jour.")
    return updated
  }

  const [created] = await database
    .insert(subscriptions)
    .values({ userId, bearerProfileId, payerProfileId, offerId, onboardingSessionId, status: 'pending_documents' })
    .returning()

  if (!created) throw new Error("La souscription demo n'a pas pu etre creee.")
  return created
}

async function ensureDocument(subscriptionId: string, type: 'identity' | 'school_certificate', status: 'pending' | 'validated', fileUrl: string) {
  const database = requireDb()
  const [subscription] = await database.select().from(subscriptions).where(eq(subscriptions.id, subscriptionId)).limit(1)
  if (!subscription) throw new Error(`La souscription ${subscriptionId} est introuvable pour le document demo.`)
  const analysisResult = status === 'validated'
    ? {
        provider: 'rules-prototype-free',
        detectedDocumentType: type,
        confidence: 94,
        suggestedStatus: 'validated',
        extractedFields: {},
        reasons: ['Document demo deja valide pour accelerer la presentation.'],
        warnings: [],
        fraudSignals: [],
        analyzedAt: new Date().toISOString(),
      }
    : {}
  const [existing] = await database.select().from(documents).where(and(eq(documents.subscriptionId, subscriptionId), eq(documents.type, type))).limit(1)

  if (existing) {
    const [updated] = await database
      .update(documents)
      .set({
        ownerId: subscription.userId,
        status,
        fileUrl,
        storageBucket: 'subscription-documents',
        storagePath: fileUrl,
        originalFilename: fileUrl.split('/').at(-1) ?? fileUrl,
        mimeType: 'application/pdf',
        sizeBytes: 0,
        analysisResult,
        analyzedAt: status === 'validated' ? new Date() : null,
        rejectionReason: null,
        updatedAt: new Date(),
      })
      .where(eq(documents.id, existing.id))
      .returning()
    if (!updated) throw new Error(`Le document demo ${type} n'a pas pu etre mis a jour.`)
    return updated
  }

  const [created] = await database
    .insert(documents)
    .values({
      subscriptionId,
      ownerId: subscription.userId,
      type,
      status,
      fileUrl,
      storageBucket: 'subscription-documents',
      storagePath: fileUrl,
      originalFilename: fileUrl.split('/').at(-1) ?? fileUrl,
      mimeType: 'application/pdf',
      sizeBytes: 0,
      analysisResult,
      analyzedAt: status === 'validated' ? new Date() : null,
    })
    .returning()

  if (!created) throw new Error(`Le document demo ${type} n'a pas pu etre cree.`)
  return created
}

async function ensurePayment(userId: string, subscriptionId: string, status: 'accepted' | 'rejected', externalReference: string) {
  const database = requireDb()
  const [existing] = await database.select().from(payments).where(eq(payments.externalReference, externalReference)).limit(1)
  const values = {
    userId,
    subscriptionId,
    type: 'direct' as const,
    status,
    amountCents: 38240,
    currency: 'EUR',
    provider: 'prototype-free',
    externalReference,
    metadata: { demo: true, scenario: status === 'accepted' ? 'paid' : 'failed' },
    processedAt: new Date(),
    updatedAt: new Date(),
  }

  if (existing) {
    const [updated] = await database.update(payments).set(values).where(eq(payments.id, existing.id)).returning()
    if (!updated) throw new Error(`Le paiement demo ${externalReference} n'a pas pu etre mis a jour.`)
    return updated
  }

  const [created] = await database.insert(payments).values(values).returning()
  if (!created) throw new Error(`Le paiement demo ${externalReference} n'a pas pu etre cree.`)
  return created
}

async function seedDemo() {
  const admin = await seedAdmin()
  const offer = await seedOffers()
  const user = await ensureUser()
  const bearer = await ensureBearerProfile(user.id)
  const payer = await ensurePayerProfile(user.id)
  const onboarding = await ensureOnboarding(user.id, bearer.id, payer.id)
  const subscription = await ensureSubscription(user.id, bearer.id, payer.id, offer.id, onboarding.id)
  await ensureDocument(subscription.id, 'school_certificate', 'pending', 'demo/justificatif_adam_demo.pdf')
  await ensureDocument(subscription.id, 'identity', 'validated', 'demo/identite_adam_demo.pdf')
  await ensurePayment(user.id, subscription.id, 'accepted', 'DEMO-PAID-IMAGINE-R')
  await ensurePayment(user.id, subscription.id, 'rejected', 'DEMO-FAILED-IMAGINE-R')

  return { admin, user, offer, subscription }
}

try {
  const result = await seedDemo()
  console.log(`Demo prete : admin=${result.admin.email}, user=${result.user.email}, subscription=${result.subscription.id}`)
} finally {
  await closeDb()
}

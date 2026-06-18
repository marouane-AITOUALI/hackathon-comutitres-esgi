import bcrypt from 'bcryptjs'
import { and, eq } from 'drizzle-orm'
import { closeDb, requireDb } from '../db/client.js'
import { communications, documents, notifications, offers, onboardingSessions, payments, profiles, subscriptions, users } from '../db/schema.js'
import { seedAdmin } from './admin.seed.js'

const storageDemoUserId = 'feb4f4b8-ea46-4e06-95d2-c8ede6059e3e'

const demoOffers = [
  { code: 'NAVIGO_ANNUEL', name: 'Navigo Annuel', target: 'Adulte voyageant quotidiennement', requiredDocuments: ['identity', 'proof_of_address'], priceCents: 97600, monthlyInstallmentCount: 12 },
  { code: 'NAVIGO_SENIOR', name: 'Navigo Annuel Senior', target: 'Personne de 62 ans ou plus', requiredDocuments: ['identity', 'tax_notice'], priceCents: 42000, monthlyInstallmentCount: 12 },
  { code: 'NAVIGO_MOIS', name: 'Navigo Mois', target: 'Voyageur regulier', requiredDocuments: ['identity'], priceCents: 8800, monthlyInstallmentCount: null },
  { code: 'NAVIGO_SEMAINE', name: 'Navigo Semaine', target: 'Besoin hebdomadaire', requiredDocuments: ['identity'], priceCents: 3080, monthlyInstallmentCount: null },
  { code: 'IMAGINE_R_JUNIOR', name: 'Imagine R Junior', target: 'Enfant de moins de 11 ans', requiredDocuments: ['identity', 'school_certificate'], priceCents: 2400, monthlyInstallmentCount: 10 },
  { code: 'IMAGINE_R_SCOLAIRE', name: 'Imagine R Scolaire', target: 'Scolaire', requiredDocuments: ['identity', 'school_certificate'], priceCents: 38240, monthlyInstallmentCount: 10 },
  { code: 'IMAGINE_R_ETUDIANT', name: 'Imagine R Etudiant', target: 'Etudiant', requiredDocuments: ['identity', 'school_certificate'], priceCents: 38240, monthlyInstallmentCount: 10 },
  { code: 'LIBERTE_PLUS', name: 'Liberte+', target: 'Voyageur occasionnel', requiredDocuments: ['identity'], priceCents: 0, monthlyInstallmentCount: null },
  { code: 'TST_50', name: 'TST Reduction 50%', target: 'Beneficiaire solidarite', requiredDocuments: ['identity', 'eligibility'], priceCents: 4400, monthlyInstallmentCount: null },
  { code: 'TST_75', name: 'TST Solidarite 75%', target: 'Beneficiaire solidarite', requiredDocuments: ['identity', 'eligibility'], priceCents: 2200, monthlyInstallmentCount: null },
  { code: 'TST_GRATUITE', name: 'TST Solidarite Gratuite', target: 'Beneficiaire social', requiredDocuments: ['identity', 'eligibility'], priceCents: 0, monthlyInstallmentCount: null },
  { code: 'AMETHYSTE', name: 'Amethyste', target: 'Profil eligible selon departement', requiredDocuments: ['identity', 'tax_notice'], priceCents: 0, monthlyInstallmentCount: null },
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

async function ensureStorageDemoUser() {
  const database = requireDb()
  const passwordHash = await bcrypt.hash('Demo123!', 12)
  const [existing] = await database.select().from(users).where(eq(users.id, storageDemoUserId)).limit(1)

  if (existing) {
    const [updated] = await database
      .update(users)
      .set({
        firstName: 'Storage',
        lastName: 'Demo',
        email: 'storage.demo@example.com',
        passwordHash,
        role: 'user',
        rgpdConsent: true,
        rgpdConsentedAt: existing.rgpdConsentedAt ?? new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, storageDemoUserId))
      .returning()

    if (!updated) throw new Error("L'utilisateur storage demo n'a pas pu etre mis a jour.")
    return updated
  }

  const [created] = await database
    .insert(users)
    .values({
      id: storageDemoUserId,
      firstName: 'Storage',
      lastName: 'Demo',
      email: 'storage.demo@example.com',
      passwordHash,
      role: 'user',
      rgpdConsent: true,
      rgpdConsentedAt: new Date(),
    })
    .returning()

  if (!created) throw new Error("L'utilisateur storage demo n'a pas pu etre cree.")
  return created
}

async function ensureStorageDemoSubscription(userId: string, offerId: string) {
  const database = requireDb()
  const [existing] = await database
    .select()
    .from(subscriptions)
    .where(and(eq(subscriptions.userId, userId), eq(subscriptions.offerId, offerId)))
    .limit(1)

  if (existing) {
    const [updated] = await database
      .update(subscriptions)
      .set({ status: 'pending_documents', updatedAt: new Date() })
      .where(eq(subscriptions.id, existing.id))
      .returning()

    if (!updated) throw new Error('La souscription storage demo n a pas pu etre mise a jour.')
    return updated
  }

  const [created] = await database
    .insert(subscriptions)
    .values({ userId, offerId, status: 'pending_documents' })
    .returning()

  if (!created) throw new Error('La souscription storage demo n a pas pu etre creee.')
  return created
}

async function resetStorageDemoDocuments(userId: string, subscriptionId: string) {
  const database = requireDb()
  await database.delete(documents).where(eq(documents.subscriptionId, subscriptionId))

  const basePath = `users/${userId}/subscriptions/${subscriptionId}`
  const rows = [
    {
      subscriptionId,
      ownerId: userId,
      type: 'identity' as const,
      status: 'pending' as const,
      fileUrl: `${basePath}/identity/demo-identite.pdf`,
      storageBucket: 'subscription-documents',
      storagePath: `${basePath}/identity/demo-identite.pdf`,
      originalFilename: 'demo-identite.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 184320,
      analysisResult: {},
    },
    {
      subscriptionId,
      ownerId: userId,
      type: 'proof_of_address' as const,
      status: 'needs_manual_review' as const,
      fileUrl: `${basePath}/proof_of_address/demo-justificatif-domicile.png`,
      storageBucket: 'subscription-documents',
      storagePath: `${basePath}/proof_of_address/demo-justificatif-domicile.png`,
      originalFilename: 'demo-justificatif-domicile.png',
      mimeType: 'image/png',
      sizeBytes: 356000,
      analysisResult: {
        provider: 'rules-prototype-free',
        detectedDocumentType: 'proof_of_address',
        confidence: 62,
        suggestedStatus: 'needs_manual_review',
        extractedFields: {},
        reasons: ['Document de test pour la revue backoffice.'],
        warnings: ['Objet Storage de demonstration a remplacer par un vrai upload.'],
        fraudSignals: [],
        analyzedAt: new Date().toISOString(),
      },
      analyzedAt: new Date(),
    },
  ]

  await database.insert(documents).values(rows)
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

async function ensureDemoNotification(input: {
  userId: string
  subscriptionId?: string | null
  communicationId?: string | null
  type: string
  category: 'subscription' | 'document' | 'payment' | 'renewal' | 'communication' | 'system'
  priority?: 'low' | 'normal' | 'high'
  title: string
  message: string
  data: Record<string, unknown>
  read?: boolean
  minutesAgo?: number
}) {
  const database = requireDb()
  const [existing] = await database
    .select()
    .from(notifications)
    .where(and(eq(notifications.userId, input.userId), eq(notifications.type, input.type)))
    .limit(1)
  const createdAt = new Date(Date.now() - (input.minutesAgo ?? 0) * 60_000)
  const values = {
    subscriptionId: input.subscriptionId ?? null,
    communicationId: input.communicationId ?? null,
    category: input.category,
    priority: input.priority ?? 'normal' as const,
    title: input.title,
    message: input.message,
    data: { ...input.data, demo: true },
    readAt: input.read ? createdAt : null,
    createdAt,
    updatedAt: createdAt,
  }

  if (existing) {
    const [updated] = await database
      .update(notifications)
      .set(values)
      .where(eq(notifications.id, existing.id))
      .returning()
    if (!updated) throw new Error(`La notification demo ${input.type} n'a pas pu être mise à jour.`)
    return updated
  }

  const [created] = await database
    .insert(notifications)
    .values({ userId: input.userId, type: input.type, ...values })
    .returning()
  if (!created) throw new Error(`La notification demo ${input.type} n'a pas pu être créée.`)
  return created
}

async function ensureDemoCommunication(adminId: string, recipientCount: number) {
  const database = requireDb()
  const title = 'Information réseau de démonstration'
  const [existing] = await database.select().from(communications).where(eq(communications.title, title)).limit(1)
  const values = {
    createdBy: adminId,
    audience: 'everyone' as const,
    title,
    message: 'Une maintenance de démonstration est prévue ce soir. Aucun impact réel sur vos déplacements.',
    priority: 'low' as const,
    actionLabel: 'Consulter mon tableau de bord',
    actionPath: '/dashboard',
    recipientCount,
    publishedAt: new Date(Date.now() - 90 * 60_000),
    updatedAt: new Date(),
  }

  if (existing) {
    const [updated] = await database.update(communications).set(values).where(eq(communications.id, existing.id)).returning()
    if (!updated) throw new Error("La communication demo n'a pas pu être mise à jour.")
    return updated
  }

  const [created] = await database.insert(communications).values(values).returning()
  if (!created) throw new Error("La communication demo n'a pas pu être créée.")
  return created
}

async function seedDemoNotifications(input: {
  adminId: string
  userId: string
  subscriptionId: string
  storageUserId: string
  storageSubscriptionId: string
}) {
  const communication = await ensureDemoCommunication(input.adminId, 3)

  await Promise.all([
    ensureDemoNotification({
      userId: input.userId,
      subscriptionId: input.subscriptionId,
      type: 'demo_welcome',
      category: 'system',
      title: 'Bienvenue dans votre espace Comutitres',
      message: 'Votre compte de démonstration est prêt. Retrouvez ici les étapes importantes de votre dossier.',
      data: { actionLabel: 'Voir mon dossier', actionPath: `/subscriptions/${input.subscriptionId}` },
      read: true,
      minutesAgo: 180,
    }),
    ensureDemoNotification({
      userId: input.userId,
      subscriptionId: input.subscriptionId,
      type: 'demo_payment_rejected',
      category: 'payment',
      priority: 'high',
      title: 'Paiement à régulariser',
      message: 'Le dernier paiement de démonstration a été refusé. Choisissez un autre moyen de paiement.',
      data: { actionLabel: 'Régulariser', actionPath: `/subscriptions/${input.subscriptionId}` },
      minutesAgo: 25,
    }),
    ensureDemoNotification({
      userId: input.userId,
      subscriptionId: input.subscriptionId,
      type: 'demo_renewal_reminder',
      category: 'renewal',
      title: 'Renouvellement à anticiper',
      message: 'Vérifiez vos justificatifs avant votre prochaine échéance de renouvellement.',
      data: { actionLabel: 'Préparer mon renouvellement', actionPath: `/subscriptions/${input.subscriptionId}` },
      minutesAgo: 55,
    }),
    ensureDemoNotification({
      userId: input.storageUserId,
      subscriptionId: input.storageSubscriptionId,
      type: 'demo_documents_required',
      category: 'document',
      priority: 'high',
      title: 'Justificatifs à compléter',
      message: 'Un document est en attente et un autre nécessite une vérification manuelle.',
      data: { actionLabel: 'Voir mes documents', actionPath: `/subscriptions/${input.storageSubscriptionId}` },
      minutesAgo: 15,
    }),
    ensureDemoNotification({
      userId: input.adminId,
      subscriptionId: input.storageSubscriptionId,
      type: 'demo_admin_document_review',
      category: 'document',
      priority: 'high',
      title: 'Document à revoir manuellement',
      message: 'Le justificatif de domicile du compte Storage Demo nécessite une décision.',
      data: { actionLabel: 'Traiter le document', actionPath: '/documents' },
      minutesAgo: 10,
    }),
    ensureDemoNotification({
      userId: input.adminId,
      subscriptionId: input.subscriptionId,
      type: 'demo_admin_payment_issue',
      category: 'payment',
      priority: 'high',
      title: 'Paiement client refusé',
      message: 'Un paiement de démonstration bloque la progression du dossier Parent Demo.',
      data: { actionLabel: 'Ouvrir le dossier', actionPath: `/subscriptions/${input.subscriptionId}` },
      minutesAgo: 20,
    }),
    ...[input.userId, input.storageUserId, input.adminId].map((userId) => ensureDemoNotification({
      userId,
      communicationId: communication.id,
      type: 'demo_general_communication',
      category: 'communication' as const,
      priority: 'low' as const,
      title: communication.title,
      message: communication.message,
      data: { actionLabel: communication.actionLabel, actionPath: communication.actionPath },
      minutesAgo: 90,
    })),
  ])
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
  const storageUser = await ensureStorageDemoUser()
  const storageSubscription = await ensureStorageDemoSubscription(storageUser.id, offer.id)
  await resetStorageDemoDocuments(storageUser.id, storageSubscription.id)
  await seedDemoNotifications({
    adminId: admin.id,
    userId: user.id,
    subscriptionId: subscription.id,
    storageUserId: storageUser.id,
    storageSubscriptionId: storageSubscription.id,
  })

  return { admin, user, offer, subscription }
}

if (process.env.NODE_ENV === 'production') {
  throw new Error('Le seed de démonstration est interdit en production.')
}

try {
  const result = await seedDemo()
  console.log(`Demo prete : admin=${result.admin.email}, user=${result.user.email}, subscription=${result.subscription.id}`)
} finally {
  await closeDb()
}

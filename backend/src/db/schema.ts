import { relations, sql } from 'drizzle-orm'
import { boolean, date, index, integer, jsonb, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'

export const userRole = pgEnum('user_role', ['user', 'admin'])
export const contactPreference = pgEnum('contact_preference', ['email', 'phone', 'sms'])
export const accessibilityPreference = pgEnum('accessibility_preference', ['none', 'screen_reader', 'large_text', 'reduced_motion', 'plain_language', 'human_support'])
export const profileType = pgEnum('profile_type', ['bearer', 'payer'])
export const profileStatus = pgEnum('profile_status', ['junior', 'school', 'student', 'active', 'senior', 'solidarity', 'other'])
export const relationshipToBearer = pgEnum('relationship_to_bearer', ['parent', 'guardian', 'association', 'employer', 'other'])
export const subscriptionFor = pgEnum('subscription_for', ['self', 'child', 'other', 'organization_beneficiary'])
export const subscriptionStatus = pgEnum('subscription_status', ['draft', 'pending_documents', 'pending_payment', 'pending_validation', 'accepted', 'rejected', 'cancelled', 'suspended'])
export const documentStatus = pgEnum('document_status', ['pending', 'analyzing', 'validated', 'rejected', 'needs_manual_review'])
export const documentType = pgEnum('document_type', ['identity', 'proof_of_address', 'eligibility', 'school_certificate', 'tax_notice', 'other'])
export const paymentType = pgEnum('payment_type', ['simulation', 'direct', 'mandate', 'regularization'])
export const paymentStatus = pgEnum('payment_status', ['simulated', 'pending', 'accepted', 'rejected', 'cancelled', 'regularized'])
export const renewalAction = pgEnum('renewal_action', ['accepted', 'refused', 'suspended', 'requested', 'cancelled'])
export const terminationRequestStatus = pgEnum('termination_request_status', ['requested', 'cancelled', 'processed', 'rejected'])
export const notificationCategory = pgEnum('notification_category', ['subscription', 'document', 'payment', 'renewal', 'communication', 'system'])
export const notificationPriority = pgEnum('notification_priority', ['low', 'normal', 'high'])
export const communicationAudience = pgEnum('communication_audience', ['clients', 'admins', 'everyone'])

export interface DocumentAnalysisResult {
  provider: 'rules-prototype-free'
  detectedDocumentType: string
  confidence: number
  suggestedStatus: 'validated' | 'needs_manual_review' | 'rejected'
  extractedFields: Record<string, unknown>
  reasons: string[]
  warnings: string[]
  fraudSignals: string[]
  analyzedAt: string
}

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email').notNull(),
  passwordHash: text('password_hash').notNull(),
  role: userRole('role').default('user').notNull(),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
  phone: text('phone'),
  addressLine1: text('address_line1'),
  addressLine2: text('address_line2'),
  postalCode: text('postal_code'),
  city: text('city'),
  country: text('country').default('FR').notNull(),
  preferredContact: contactPreference('preferred_contact').default('email').notNull(),
  accessibilityPreference: accessibilityPreference('accessibility_preference').default('none').notNull(),
  marketingOptIn: boolean('marketing_opt_in').default(false).notNull(),
  marketingOptInAt: timestamp('marketing_opt_in_at', { withTimezone: true }),
  rgpdConsent: boolean('rgpd_consent').notNull(),
  rgpdConsentedAt: timestamp('rgpd_consented_at', { withTimezone: true }),
  profileUpdatedAt: timestamp('profile_updated_at', { withTimezone: true }),
  ...timestamps,
}, (table) => [uniqueIndex('users_email_idx').on(table.email)])

export const userAvatars = pgTable('user_avatars', {
  id: uuid('id').defaultRandom().primaryKey(),
  ownerId: uuid('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  storageBucket: text('storage_bucket').default('user-avatars').notNull(),
  storagePath: text('storage_path').notNull(),
  originalFilename: text('original_filename').notNull(),
  mimeType: text('mime_type').notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  status: text('status').default('active').notNull(),
  ...timestamps,
}, (table) => [
  uniqueIndex('user_avatars_owner_id_idx').on(table.ownerId),
  index('user_avatars_storage_path_idx').on(table.storagePath),
])

export const profiles = pgTable('profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: profileType('type').notNull(),
  status: profileStatus('status').default('other').notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  birthDate: date('birth_date'),
  email: text('email'),
  relationshipToBearer: relationshipToBearer('relationship_to_bearer'),
  ...timestamps,
}, (table) => [index('profiles_user_id_idx').on(table.userId), index('profiles_type_idx').on(table.type)])

export const onboardingSessions = pgTable('onboarding_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  bearerProfileId: uuid('bearer_profile_id').references(() => profiles.id, { onDelete: 'set null' }),
  payerProfileId: uuid('payer_profile_id').references(() => profiles.id, { onDelete: 'set null' }),
  isBearerPayer: boolean('is_bearer_payer').default(true).notNull(),
  currentStep: text('current_step').default('profile').notNull(),
  subscriptionFor: subscriptionFor('subscription_for').notNull(),
  answers: jsonb('answers').$type<Record<string, unknown>>().default({}).notNull(),
  ...timestamps,
}, (table) => [
  index('onboarding_sessions_user_id_idx').on(table.userId),
  index('onboarding_sessions_bearer_profile_id_idx').on(table.bearerProfileId),
  index('onboarding_sessions_payer_profile_id_idx').on(table.payerProfileId),
])

export const offers = pgTable('offers', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: text('code').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  target: text('target').notNull(),
  requiredDocuments: jsonb('required_documents').$type<string[]>().default([]).notNull(),
  priceCents: integer('price_cents').default(0).notNull(),
  monthlyInstallmentCount: integer('monthly_installment_count'),
  isActive: boolean('is_active').default(true).notNull(),
  ...timestamps,
}, (table) => [uniqueIndex('offers_code_idx').on(table.code)])

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  bearerProfileId: uuid('bearer_profile_id').references(() => profiles.id, { onDelete: 'set null' }),
  payerProfileId: uuid('payer_profile_id').references(() => profiles.id, { onDelete: 'set null' }),
  offerId: uuid('offer_id').references(() => offers.id, { onDelete: 'restrict' }),
  onboardingSessionId: uuid('onboarding_session_id').references(() => onboardingSessions.id, { onDelete: 'set null' }),
  status: subscriptionStatus('status').default('draft').notNull(),
  submittedAt: timestamp('submitted_at', { withTimezone: true }),
  ...timestamps,
}, (table) => [
  index('subscriptions_user_id_idx').on(table.userId),
  index('subscriptions_bearer_profile_id_idx').on(table.bearerProfileId),
  index('subscriptions_payer_profile_id_idx').on(table.payerProfileId),
  index('subscriptions_offer_id_idx').on(table.offerId),
  index('subscriptions_onboarding_session_id_idx').on(table.onboardingSessionId),
  index('subscriptions_status_idx').on(table.status),
])

export const documents = pgTable('documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  subscriptionId: uuid('subscription_id').notNull().references(() => subscriptions.id, { onDelete: 'cascade' }),
  ownerId: uuid('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: documentType('type').default('other').notNull(),
  fileUrl: text('file_url').notNull(),
  storageBucket: text('storage_bucket').default('subscription-documents').notNull(),
  storagePath: text('storage_path').notNull(),
  originalFilename: text('original_filename').notNull(),
  mimeType: text('mime_type').notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  status: documentStatus('status').default('pending').notNull(),
  analysisResult: jsonb('analysis_result').$type<DocumentAnalysisResult | Record<string, unknown>>().default({}).notNull(),
  analyzedAt: timestamp('analyzed_at', { withTimezone: true }),
  rejectionReason: text('rejection_reason'),
  ...timestamps,
}, (table) => [
  index('documents_subscription_id_idx').on(table.subscriptionId),
  index('documents_owner_id_idx').on(table.ownerId),
  index('documents_storage_path_idx').on(table.storagePath),
])

export const payments = pgTable('payments', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  subscriptionId: uuid('subscription_id').notNull().references(() => subscriptions.id, { onDelete: 'cascade' }),
  type: paymentType('type').notNull(),
  status: paymentStatus('status').default('pending').notNull(),
  amountCents: integer('amount_cents').notNull(),
  currency: text('currency').default('EUR').notNull(),
  provider: text('provider').default('prototype-free').notNull(),
  externalReference: text('external_reference'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}).notNull(),
  processedAt: timestamp('processed_at', { withTimezone: true }),
  ...timestamps,
}, (table) => [
  index('payments_user_id_idx').on(table.userId),
  index('payments_subscription_id_idx').on(table.subscriptionId),
  index('payments_status_idx').on(table.status),
])

export const renewalEvents = pgTable('renewal_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  subscriptionId: uuid('subscription_id').notNull().references(() => subscriptions.id, { onDelete: 'cascade' }),
  action: renewalAction('action').notNull(),
  reason: text('reason'),
  effectiveAt: timestamp('effective_at', { withTimezone: true }).defaultNow().notNull(),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}).notNull(),
  ...timestamps,
}, (table) => [
  index('renewal_events_user_id_idx').on(table.userId),
  index('renewal_events_subscription_id_idx').on(table.subscriptionId),
  index('renewal_events_action_idx').on(table.action),
])

export const terminationRequests = pgTable('termination_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  subscriptionId: uuid('subscription_id').notNull().references(() => subscriptions.id, { onDelete: 'cascade' }),
  status: terminationRequestStatus('status').default('requested').notNull(),
  reason: text('reason'),
  effectiveAt: timestamp('effective_at', { withTimezone: true }).notNull(),
  processedAt: timestamp('processed_at', { withTimezone: true }),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}).notNull(),
  ...timestamps,
}, (table) => [
  index('termination_requests_user_id_idx').on(table.userId),
  index('termination_requests_subscription_id_idx').on(table.subscriptionId),
  index('termination_requests_status_idx').on(table.status),
  uniqueIndex('termination_requests_one_pending_idx').on(table.subscriptionId).where(sql`${table.status} = 'requested'`),
])

export const communications = pgTable('communications', {
  id: uuid('id').defaultRandom().primaryKey(),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  audience: communicationAudience('audience').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  priority: notificationPriority('priority').default('normal').notNull(),
  actionLabel: text('action_label'),
  actionPath: text('action_path'),
  recipientCount: integer('recipient_count').default(0).notNull(),
  publishedAt: timestamp('published_at', { withTimezone: true }).defaultNow().notNull(),
  ...timestamps,
}, (table) => [
  index('communications_created_by_idx').on(table.createdBy),
  index('communications_audience_idx').on(table.audience),
  index('communications_published_at_idx').on(table.publishedAt),
])

export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  subscriptionId: uuid('subscription_id').references(() => subscriptions.id, { onDelete: 'cascade' }),
  communicationId: uuid('communication_id').references(() => communications.id, { onDelete: 'set null' }),
  type: text('type').notNull(),
  category: notificationCategory('category').default('system').notNull(),
  priority: notificationPriority('priority').default('normal').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  data: jsonb('data').$type<Record<string, unknown>>().default({}).notNull(),
  readAt: timestamp('read_at', { withTimezone: true }),
  ...timestamps,
}, (table) => [
  index('notifications_user_id_idx').on(table.userId),
  index('notifications_subscription_id_idx').on(table.subscriptionId),
  index('notifications_communication_id_idx').on(table.communicationId),
  index('notifications_category_idx').on(table.category),
  index('notifications_read_at_idx').on(table.readAt),
  index('notifications_created_at_idx').on(table.createdAt),
])

export const usersRelations = relations(users, ({ many, one }) => ({
  profiles: many(profiles),
  onboardingSessions: many(onboardingSessions),
  subscriptions: many(subscriptions),
  payments: many(payments),
  renewalEvents: many(renewalEvents),
  terminationRequests: many(terminationRequests),
  communications: many(communications),
  notifications: many(notifications),
  avatar: one(userAvatars, { fields: [users.id], references: [userAvatars.ownerId] }),
}))
export const userAvatarsRelations = relations(userAvatars, ({ one }) => ({ owner: one(users, { fields: [userAvatars.ownerId], references: [users.id] }) }))
export const profilesRelations = relations(profiles, ({ one }) => ({ user: one(users, { fields: [profiles.userId], references: [users.id] }) }))
export const offersRelations = relations(offers, ({ many }) => ({ subscriptions: many(subscriptions) }))
export const documentsRelations = relations(documents, ({ one }) => ({
  owner: one(users, { fields: [documents.ownerId], references: [users.id] }),
  subscription: one(subscriptions, { fields: [documents.subscriptionId], references: [subscriptions.id] }),
}))
export const paymentsRelations = relations(payments, ({ one }) => ({
  user: one(users, { fields: [payments.userId], references: [users.id] }),
  subscription: one(subscriptions, { fields: [payments.subscriptionId], references: [subscriptions.id] }),
}))
export const renewalEventsRelations = relations(renewalEvents, ({ one }) => ({
  user: one(users, { fields: [renewalEvents.userId], references: [users.id] }),
  subscription: one(subscriptions, { fields: [renewalEvents.subscriptionId], references: [subscriptions.id] }),
}))
export const terminationRequestsRelations = relations(terminationRequests, ({ one }) => ({
  user: one(users, { fields: [terminationRequests.userId], references: [users.id] }),
  subscription: one(subscriptions, { fields: [terminationRequests.subscriptionId], references: [subscriptions.id] }),
}))
export const communicationsRelations = relations(communications, ({ many, one }) => ({
  author: one(users, { fields: [communications.createdBy], references: [users.id] }),
  notifications: many(notifications),
}))
export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
  subscription: one(subscriptions, { fields: [notifications.subscriptionId], references: [subscriptions.id] }),
  communication: one(communications, { fields: [notifications.communicationId], references: [communications.id] }),
}))

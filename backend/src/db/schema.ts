import { relations } from 'drizzle-orm'
import { boolean, date, index, jsonb, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'

export const userRole = pgEnum('user_role', ['user', 'admin'])
export const profileType = pgEnum('profile_type', ['bearer', 'payer'])
export const profileStatus = pgEnum('profile_status', ['junior', 'school', 'student', 'active', 'senior', 'solidarity', 'other'])
export const relationshipToBearer = pgEnum('relationship_to_bearer', ['parent', 'guardian', 'association', 'employer', 'other'])
export const subscriptionFor = pgEnum('subscription_for', ['self', 'child', 'other', 'organization_beneficiary'])
export const subscriptionStatus = pgEnum('subscription_status', ['draft', 'pending_documents', 'pending_validation', 'accepted', 'rejected', 'cancelled', 'suspended'])
export const documentStatus = pgEnum('document_status', ['pending', 'validated', 'rejected'])
export const documentType = pgEnum('document_type', ['identity', 'proof_of_address', 'eligibility', 'school_certificate', 'tax_notice', 'other'])

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
  rgpdConsent: boolean('rgpd_consent').notNull(),
  rgpdConsentedAt: timestamp('rgpd_consented_at', { withTimezone: true }),
  ...timestamps,
}, (table) => [uniqueIndex('users_email_idx').on(table.email)])

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
  type: documentType('type').default('other').notNull(),
  fileUrl: text('file_url').notNull(),
  status: documentStatus('status').default('pending').notNull(),
  rejectionReason: text('rejection_reason'),
  ...timestamps,
}, (table) => [index('documents_subscription_id_idx').on(table.subscriptionId)])

export const usersRelations = relations(users, ({ many }) => ({ profiles: many(profiles), onboardingSessions: many(onboardingSessions), subscriptions: many(subscriptions) }))
export const profilesRelations = relations(profiles, ({ one }) => ({ user: one(users, { fields: [profiles.userId], references: [users.id] }) }))
export const offersRelations = relations(offers, ({ many }) => ({ subscriptions: many(subscriptions) }))
export const documentsRelations = relations(documents, ({ one }) => ({ subscription: one(subscriptions, { fields: [documents.subscriptionId], references: [subscriptions.id] }) }))

import { relations } from 'drizzle-orm'
import {
  boolean,
  date,
  index,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

export const subscriptionStatus = pgEnum('subscription_status', [
  'pending',
  'accepted',
  'rejected',
])

export const documentStatus = pgEnum('document_status', [
  'pending',
  'validated',
  'rejected',
])

export const documentType = pgEnum('document_type', [
  'identity',
  'proof_of_address',
  'eligibility',
  'other',
])

export const offerAudience = pgEnum('offer_audience', [
  'general',
  'student',
  'senior',
  'solidarity',
])

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}

export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    supabaseAuthId: uuid('supabase_auth_id').unique(),
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    email: text('email').notNull(),
    birthDate: date('birth_date'),
    phone: text('phone'),
    ...timestamps,
  },
  (table) => [uniqueIndex('users_email_idx').on(table.email)],
)

export const offers = pgTable(
  'offers',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    monthlyPrice: numeric('monthly_price', { precision: 10, scale: 2 }),
    audience: offerAudience('audience').default('general').notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex('offers_slug_idx').on(table.slug)],
)

export const subscriptions = pgTable(
  'subscriptions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    offerId: uuid('offer_id')
      .notNull()
      .references(() => offers.id, { onDelete: 'restrict' }),
    status: subscriptionStatus('status').default('pending').notNull(),
    submittedAt: timestamp('submitted_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index('subscriptions_user_id_idx').on(table.userId),
    index('subscriptions_offer_id_idx').on(table.offerId),
    index('subscriptions_status_idx').on(table.status),
  ],
)

export const documents = pgTable(
  'documents',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    subscriptionId: uuid('subscription_id')
      .notNull()
      .references(() => subscriptions.id, { onDelete: 'cascade' }),
    type: documentType('type').default('other').notNull(),
    status: documentStatus('status').default('pending').notNull(),
    storagePath: text('storage_path').notNull(),
    originalName: text('original_name').notNull(),
    mimeType: text('mime_type').notNull(),
    ...timestamps,
  },
  (table) => [index('documents_subscription_id_idx').on(table.subscriptionId)],
)

export const usersRelations = relations(users, ({ many }) => ({
  subscriptions: many(subscriptions),
}))

export const offersRelations = relations(offers, ({ many }) => ({
  subscriptions: many(subscriptions),
}))

export const subscriptionsRelations = relations(
  subscriptions,
  ({ many, one }) => ({
    user: one(users, {
      fields: [subscriptions.userId],
      references: [users.id],
    }),
    offer: one(offers, {
      fields: [subscriptions.offerId],
      references: [offers.id],
    }),
    documents: many(documents),
  }),
)

export const documentsRelations = relations(documents, ({ one }) => ({
  subscription: one(subscriptions, {
    fields: [documents.subscriptionId],
    references: [subscriptions.id],
  }),
}))

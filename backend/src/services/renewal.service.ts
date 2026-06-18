import { and, desc, eq } from 'drizzle-orm'
import { requireDb } from '../db/client.js'
import { offers, payments, renewalEvents, subscriptions } from '../db/schema.js'
import { AppError } from '../utils/app-error.js'
import type { RenewalDecisionInput } from '../validation/renewal.schemas.js'
import { notifyRenewalDecision, notifySubscriptionStatusChanged } from './notifications.service.js'

type RenewalSubscriptionStatus = (typeof subscriptions.$inferSelect)['status']

type RenewalSubscription = {
  id: string
  userId: string
  offerId: string | null
  status: RenewalSubscriptionStatus
  createdAt: Date
  updatedAt: Date
}

const subscriptionSelection = {
  id: subscriptions.id,
  userId: subscriptions.userId,
  offerId: subscriptions.offerId,
  status: subscriptions.status,
  createdAt: subscriptions.createdAt,
  updatedAt: subscriptions.updatedAt,
}

const renewalSelection = {
  id: renewalEvents.id,
  userId: renewalEvents.userId,
  subscriptionId: renewalEvents.subscriptionId,
  action: renewalEvents.action,
  reason: renewalEvents.reason,
  effectiveAt: renewalEvents.effectiveAt,
  metadata: renewalEvents.metadata,
  createdAt: renewalEvents.createdAt,
  updatedAt: renewalEvents.updatedAt,
}

const paymentSelection = {
  id: payments.id,
  type: payments.type,
  status: payments.status,
  amountCents: payments.amountCents,
  currency: payments.currency,
  createdAt: payments.createdAt,
  updatedAt: payments.updatedAt,
}

async function findOwnSubscription(userId: string, subscriptionId: string) {
  const [subscription] = await requireDb()
    .select(subscriptionSelection)
    .from(subscriptions)
    .where(and(eq(subscriptions.id, subscriptionId), eq(subscriptions.userId, userId)))
    .limit(1)

  if (!subscription) throw new AppError(404, 'Souscription introuvable.')
  return subscription
}

async function getOffer(subscription: RenewalSubscription) {
  if (!subscription.offerId) return null
  const [offer] = await requireDb().select().from(offers).where(eq(offers.id, subscription.offerId)).limit(1)
  return offer ?? null
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function renewalPeriodDays(offerCode: string | null) {
  if (!offerCode) return 365
  if (offerCode.includes('SEMAINE')) return 7
  if (offerCode.includes('MOIS') || offerCode === 'LIBERTE_PLUS') return 30
  return 365
}

async function buildRenewal(subscription: RenewalSubscription) {
  const database = requireDb()
  const offer = await getOffer(subscription)
  const eventRows = await database.select(renewalSelection).from(renewalEvents).where(eq(renewalEvents.subscriptionId, subscription.id)).orderBy(desc(renewalEvents.createdAt))
  const paymentRows = await database.select(paymentSelection).from(payments).where(eq(payments.subscriptionId, subscription.id)).orderBy(desc(payments.createdAt))
  const periodDays = renewalPeriodDays(offer?.code ?? null)
  const nextRenewalDate = addDays(subscription.createdAt, periodDays)
  const lastPayment = paymentRows[0] ?? null
  const hasPaymentIssue = paymentRows.some((payment) => payment.status === 'rejected' || payment.status === 'cancelled')

  return {
    subscription,
    offer: offer ? { id: offer.id, code: offer.code, name: offer.name } : null,
    renewal: {
      canRenew: !['cancelled', 'rejected', 'suspended'].includes(subscription.status),
      nextRenewalDate: nextRenewalDate.toISOString(),
      periodDays,
      recommendedAction: hasPaymentIssue ? 'regularize_payment' : 'accept_or_refuse',
      reasons: [
        'Renouvellement calcule a partir du type de forfait.',
        lastPayment ? `Dernier paiement: ${lastPayment.status}.` : 'Aucun paiement encore rattache.',
      ],
      warnings: hasPaymentIssue ? ['Un paiement refuse ou annule doit etre regularise avant validation finale.'] : [],
    },
    payments: paymentRows,
    events: eventRows,
  }
}

async function insertRenewalEvent(userId: string, subscriptionId: string, action: 'accepted' | 'refused' | 'suspended', input: RenewalDecisionInput) {
  const [created] = await requireDb()
    .insert(renewalEvents)
    .values({
      userId,
      subscriptionId,
      action,
      reason: input.reason,
      metadata: { source: 'prototype', action },
      effectiveAt: new Date(),
    })
    .returning(renewalSelection)

  if (!created) throw new AppError(500, "L'evenement de renouvellement n'a pas pu etre cree.")
  return created
}

export async function getSubscriptionRenewal(userId: string, subscriptionId: string) {
  return buildRenewal(await findOwnSubscription(userId, subscriptionId))
}

export async function acceptSubscriptionRenewal(userId: string, subscriptionId: string, input: RenewalDecisionInput) {
  const subscription = await findOwnSubscription(userId, subscriptionId)
  const event = await insertRenewalEvent(userId, subscriptionId, 'accepted', input)

  const [updated] = await requireDb()
    .update(subscriptions)
    .set({ status: 'pending_payment', updatedAt: new Date() })
    .where(eq(subscriptions.id, subscription.id))
    .returning(subscriptionSelection)

  if (!updated) throw new AppError(500, "Le renouvellement n'a pas pu mettre à jour la souscription.")
  await notifySubscriptionStatusChanged({ userId, subscriptionId, previousStatus: subscription.status, status: updated.status })
  await notifyRenewalDecision({ userId, subscriptionId, action: 'accepted', reason: input.reason })
  return { event, renewal: await getSubscriptionRenewal(userId, subscriptionId) }
}

export async function refuseSubscriptionRenewal(userId: string, subscriptionId: string, input: RenewalDecisionInput) {
  const subscription = await findOwnSubscription(userId, subscriptionId)
  const event = await insertRenewalEvent(userId, subscriptionId, 'refused', input)

  const [updated] = await requireDb()
    .update(subscriptions)
    .set({ status: 'cancelled', updatedAt: new Date() })
    .where(eq(subscriptions.id, subscription.id))
    .returning(subscriptionSelection)

  if (!updated) throw new AppError(500, "Le refus de renouvellement n'a pas pu mettre à jour la souscription.")
  await notifySubscriptionStatusChanged({ userId, subscriptionId, previousStatus: subscription.status, status: updated.status })
  await notifyRenewalDecision({ userId, subscriptionId, action: 'refused', reason: input.reason })
  return { event, renewal: await getSubscriptionRenewal(userId, subscriptionId) }
}

export async function suspendSubscriptionRenewal(userId: string, subscriptionId: string, input: RenewalDecisionInput) {
  const subscription = await findOwnSubscription(userId, subscriptionId)
  const event = await insertRenewalEvent(userId, subscriptionId, 'suspended', input)

  const [updated] = await requireDb()
    .update(subscriptions)
    .set({ status: 'suspended', updatedAt: new Date() })
    .where(eq(subscriptions.id, subscription.id))
    .returning(subscriptionSelection)

  if (!updated) throw new AppError(500, "La suspension du renouvellement n'a pas pu mettre à jour la souscription.")
  await notifySubscriptionStatusChanged({ userId, subscriptionId, previousStatus: subscription.status, status: updated.status })
  await notifyRenewalDecision({ userId, subscriptionId, action: 'suspended', reason: input.reason })
  return { event, renewal: await getSubscriptionRenewal(userId, subscriptionId) }
}

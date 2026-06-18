import { and, desc, eq } from 'drizzle-orm'
import { requireDb } from '../db/client.js'
import { offers, payments, subscriptions } from '../db/schema.js'
import { AppError } from '../utils/app-error.js'
import type { DirectPaymentInput, MandatePaymentInput, PaymentSimulationInput, RegularizePaymentInput } from '../validation/payment.schemas.js'
import { notifyPaymentStatus, notifySubscriptionStatusChanged } from './notifications.service.js'

type SubscriptionRow = typeof subscriptions.$inferSelect
type PaymentRow = typeof payments.$inferSelect

const paymentSelection = {
  id: payments.id,
  userId: payments.userId,
  subscriptionId: payments.subscriptionId,
  type: payments.type,
  status: payments.status,
  amountCents: payments.amountCents,
  currency: payments.currency,
  provider: payments.provider,
  externalReference: payments.externalReference,
  metadata: payments.metadata,
  processedAt: payments.processedAt,
  createdAt: payments.createdAt,
  updatedAt: payments.updatedAt,
}

const subscriptionSelection = {
  id: subscriptions.id,
  userId: subscriptions.userId,
  offerId: subscriptions.offerId,
  status: subscriptions.status,
  createdAt: subscriptions.createdAt,
  updatedAt: subscriptions.updatedAt,
}

const offerAmounts: Record<string, number> = {
  NAVIGO_ANNUEL: 97600,
  NAVIGO_SENIOR: 42000,
  NAVIGO_MOIS: 8800,
  NAVIGO_SEMAINE: 3080,
  IMAGINE_R_JUNIOR: 2400,
  IMAGINE_R_SCOLAIRE: 38240,
  IMAGINE_R_ETUDIANT: 38240,
  LIBERTE_PLUS: 0,
  TST_50: 4400,
  TST_75: 2200,
  TST_GRATUITE: 0,
  AMETHYSTE: 0,
}

function reference(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
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

async function findPaymentForAccess(userId: string, role: string, id: string) {
  const [payment] = await requireDb().select(paymentSelection).from(payments).where(eq(payments.id, id)).limit(1)
  if (!payment || (role !== 'admin' && payment.userId !== userId)) throw new AppError(404, 'Paiement introuvable.')
  return payment
}

async function resolveOfferCode(subscription?: Pick<SubscriptionRow, 'offerId'> | null, explicitOfferCode?: string) {
  if (explicitOfferCode) return explicitOfferCode
  if (!subscription?.offerId) return null

  const [offer] = await requireDb().select({ code: offers.code }).from(offers).where(eq(offers.id, subscription.offerId)).limit(1)
  return offer?.code ?? null
}

async function resolveAmount(input: { amountCents?: number; offerCode?: string }, subscription?: Pick<SubscriptionRow, 'offerId'> | null) {
  if (input.amountCents) return input.amountCents
  const code = await resolveOfferCode(subscription, input.offerCode)
  return code ? offerAmounts[code] ?? 5000 : 5000
}

function paymentResponse(payment: PaymentRow) {
  return { payment }
}

async function markSubscriptionAfterPayment(subscriptionId: string, accepted: boolean) {
  const [current] = await requireDb()
    .select(subscriptionSelection)
    .from(subscriptions)
    .where(eq(subscriptions.id, subscriptionId))
    .limit(1)
  if (!current) throw new AppError(404, 'Souscription introuvable.')

  const [updated] = await requireDb()
    .update(subscriptions)
    .set({ status: accepted ? 'pending_validation' : 'pending_payment', updatedAt: new Date() })
    .where(eq(subscriptions.id, subscriptionId))
    .returning(subscriptionSelection)

  if (!updated) throw new AppError(500, "Le statut de la souscription n'a pas pu être mis à jour.")
  await notifySubscriptionStatusChanged({
    userId: updated.userId,
    subscriptionId: updated.id,
    previousStatus: current.status,
    status: updated.status,
  })
}

export async function simulatePayment(userId: string, input: PaymentSimulationInput) {
  const subscription = input.subscriptionId ? await findOwnSubscription(userId, input.subscriptionId) : null
  const offerCode = await resolveOfferCode(subscription, input.offerCode)
  const amountCents = await resolveAmount({ amountCents: input.amountCents, offerCode: offerCode ?? undefined }, subscription)
  const feesCents = input.paymentMode === 'monthly' && amountCents > 0 ? Math.round(amountCents * 0.01) : 0
  const totalCents = amountCents + feesCents

  const simulation = {
    amountCents,
    feesCents,
    totalCents,
    currency: 'EUR',
    paymentMode: input.paymentMode,
    provider: 'prototype-free',
    offerCode,
    warnings: amountCents === 0 ? ['Aucun encaissement immediat estime pour ce forfait.'] : [],
  }

  if (!subscription) return { simulation, payment: null }

  const [created] = await requireDb()
    .insert(payments)
    .values({
      userId,
      subscriptionId: subscription.id,
      type: 'simulation',
      status: 'simulated',
      amountCents: totalCents,
      metadata: simulation,
      processedAt: new Date(),
      externalReference: reference('SIM'),
    })
    .returning(paymentSelection)

  if (!created) throw new AppError(500, "La simulation de paiement n'a pas pu etre enregistree.")
  return { simulation, payment: created }
}

export async function createDirectPayment(userId: string, input: DirectPaymentInput) {
  const subscription = await findOwnSubscription(userId, input.subscriptionId)
  const amountCents = await resolveAmount(input, subscription)
  const accepted = !input.simulateFailure

  const [created] = await requireDb()
    .insert(payments)
    .values({
      userId,
      subscriptionId: subscription.id,
      type: 'direct',
      status: accepted ? 'accepted' : 'rejected',
      amountCents,
      externalReference: reference(accepted ? 'PAY' : 'FAIL'),
      metadata: {
        method: 'card',
        cardTokenPreview: input.cardToken ? `${input.cardToken.slice(0, 2)}***` : null,
        prototype: true,
      },
      processedAt: new Date(),
    })
    .returning(paymentSelection)

  if (!created) throw new AppError(500, "Le paiement direct n'a pas pu etre cree.")
  await markSubscriptionAfterPayment(subscription.id, accepted)
  await notifyPaymentStatus({
    userId: created.userId,
    subscriptionId: created.subscriptionId,
    paymentId: created.id,
    status: created.status,
    amountCents: created.amountCents,
    currency: created.currency,
  })
  return paymentResponse(created)
}

export async function createMandatePayment(userId: string, input: MandatePaymentInput) {
  const subscription = await findOwnSubscription(userId, input.subscriptionId)
  const amountCents = await resolveAmount(input, subscription)
  const accepted = input.mandateAccepted

  const [created] = await requireDb()
    .insert(payments)
    .values({
      userId,
      subscriptionId: subscription.id,
      type: 'mandate',
      status: accepted ? 'accepted' : 'rejected',
      amountCents,
      externalReference: reference(accepted ? 'MANDATE' : 'MANDATE-REFUSED'),
      metadata: {
        method: 'sepa_mandate',
        holderName: input.holderName,
        ibanLast4: input.ibanLast4,
        mandateAccepted: input.mandateAccepted,
        prototype: true,
      },
      processedAt: new Date(),
    })
    .returning(paymentSelection)

  if (!created) throw new AppError(500, "Le mandat de paiement n'a pas pu etre cree.")
  await markSubscriptionAfterPayment(subscription.id, accepted)
  await notifyPaymentStatus({
    userId: created.userId,
    subscriptionId: created.subscriptionId,
    paymentId: created.id,
    status: created.status,
    amountCents: created.amountCents,
    currency: created.currency,
  })
  return paymentResponse(created)
}

export async function getPayment(userId: string, role: string, id: string) {
  return paymentResponse(await findPaymentForAccess(userId, role, id))
}

export async function cancelPayment(userId: string, role: string, id: string) {
  const payment = await findPaymentForAccess(userId, role, id)
  if (!['pending', 'simulated'].includes(payment.status)) {
    throw new AppError(409, 'Seuls les paiements en attente ou simules peuvent etre annules.')
  }

  const [updated] = await requireDb()
    .update(payments)
    .set({ status: 'cancelled', updatedAt: new Date() })
    .where(eq(payments.id, id))
    .returning(paymentSelection)

  if (!updated) throw new AppError(500, "Le paiement n'a pas pu etre annule.")
  await notifyPaymentStatus({
    userId: updated.userId,
    subscriptionId: updated.subscriptionId,
    paymentId: updated.id,
    status: updated.status,
    amountCents: updated.amountCents,
    currency: updated.currency,
  })
  return paymentResponse(updated)
}

export async function regularizePayment(userId: string, role: string, id: string, input: RegularizePaymentInput) {
  const payment = await findPaymentForAccess(userId, role, id)
  if (!['rejected', 'cancelled', 'pending'].includes(payment.status)) {
    throw new AppError(409, 'Ce paiement ne necessite pas de regularisation.')
  }

  const [updated] = await requireDb()
    .update(payments)
    .set({
      type: 'regularization',
      status: 'regularized',
      amountCents: input.amountCents ?? payment.amountCents,
      metadata: {
        ...payment.metadata,
        regularizationNote: input.note ?? null,
        regularizedAt: new Date().toISOString(),
      },
      processedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(payments.id, id))
    .returning(paymentSelection)

  if (!updated) throw new AppError(500, "Le paiement n'a pas pu etre regularise.")
  await markSubscriptionAfterPayment(payment.subscriptionId, true)
  await notifyPaymentStatus({
    userId: updated.userId,
    subscriptionId: updated.subscriptionId,
    paymentId: updated.id,
    status: updated.status,
    amountCents: updated.amountCents,
    currency: updated.currency,
  })
  return paymentResponse(updated)
}

export async function listPaymentsForSubscription(subscriptionId: string) {
  return requireDb()
    .select(paymentSelection)
    .from(payments)
    .where(eq(payments.subscriptionId, subscriptionId))
    .orderBy(desc(payments.createdAt))
}

import { and, desc, eq, inArray } from 'drizzle-orm'
import { requireDb } from '../db/client.js'
import { offers, payments, subscriptions } from '../db/schema.js'
import { AppError } from '../utils/app-error.js'
import type { DirectPaymentInput, MandatePaymentInput, PaymentSimulationInput, RegularizePaymentInput } from '../validation/payment.schemas.js'
import { notifyPaymentStatus } from './notifications.service.js'
import { reconcileSubscriptionWorkflow } from './subscription-workflow.service.js'

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

async function resolveOffer(subscription?: Pick<SubscriptionRow, 'offerId'> | null, explicitOfferCode?: string) {
  const where = explicitOfferCode
    ? eq(offers.code, explicitOfferCode)
    : subscription?.offerId
      ? eq(offers.id, subscription.offerId)
      : undefined
  if (!where) return null
  const [offer] = await requireDb().select({
    code: offers.code,
    priceCents: offers.priceCents,
    monthlyInstallmentCount: offers.monthlyInstallmentCount,
  }).from(offers).where(where).limit(1)
  return offer ?? null
}

export function createInstallmentSchedule(totalCents: number, installmentCount: number, start = new Date()) {
  const safeCount = Math.max(1, installmentCount)
  const installmentAmountCents = Math.floor(totalCents / safeCount)
  const lastInstallmentAmountCents = totalCents - installmentAmountCents * (safeCount - 1)
  const schedule = Array.from({ length: safeCount }, (_, index) => {
    const dueDate = new Date(start)
    dueDate.setUTCMonth(dueDate.getUTCMonth() + index)
    return {
      installmentNumber: index + 1,
      dueDate: dueDate.toISOString().slice(0, 10),
      amountCents: index === safeCount - 1 ? lastInstallmentAmountCents : installmentAmountCents,
    }
  })
  return { installmentCount: safeCount, installmentAmountCents, lastInstallmentAmountCents, schedule }
}

async function resolvePaymentPlan(
  input: { amountCents?: number; offerCode?: string; paymentMode: 'one_time' | 'monthly' | 'weekly' | 'usage' },
  subscription?: Pick<SubscriptionRow, 'offerId'> | null,
) {
  const offer = await resolveOffer(subscription, input.offerCode)
  const amountCents = input.amountCents !== undefined ? input.amountCents : offer?.priceCents ?? 0
  const feesCents = input.paymentMode === 'monthly' && amountCents > 0 ? Math.round(amountCents * 0.01) : 0
  const totalCents = amountCents + feesCents
  if (input.paymentMode === 'monthly' && !offer?.monthlyInstallmentCount) {
    throw new AppError(409, 'Cette offre ne propose pas la mensualisation.')
  }
  return {
    amountCents,
    feesCents,
    totalCents,
    currency: 'EUR',
    paymentMode: input.paymentMode,
    provider: 'prototype-free',
    offerCode: offer?.code ?? input.offerCode ?? null,
    ...createInstallmentSchedule(totalCents, input.paymentMode === 'monthly' ? offer?.monthlyInstallmentCount ?? 1 : 1),
    warnings: amountCents === 0 ? ['Aucun encaissement immédiat pour ce forfait.'] : [],
  }
}

function paymentResponse(payment: PaymentRow) {
  return { payment }
}

export async function simulatePayment(userId: string, input: PaymentSimulationInput) {
  const subscription = input.subscriptionId ? await findOwnSubscription(userId, input.subscriptionId) : null
  const simulation = await resolvePaymentPlan(input, subscription)
  return { simulation, payment: null }
}

async function findAcceptedPayment(subscriptionId: string) {
  const [payment] = await requireDb()
    .select(paymentSelection)
    .from(payments)
    .where(and(eq(payments.subscriptionId, subscriptionId), inArray(payments.status, ['accepted', 'regularized'])))
    .orderBy(desc(payments.createdAt))
    .limit(1)
  return payment ?? null
}

export async function createDirectPayment(userId: string, input: DirectPaymentInput) {
  const subscription = await findOwnSubscription(userId, input.subscriptionId)
  const existingPayment = await findAcceptedPayment(subscription.id)
  if (existingPayment) return paymentResponse(existingPayment)
  const plan = await resolvePaymentPlan(input, subscription)
  const accepted = !input.simulateFailure

  const [created] = await requireDb()
    .insert(payments)
    .values({
      userId,
      subscriptionId: subscription.id,
      type: 'direct',
      status: accepted ? 'accepted' : 'rejected',
      amountCents: plan.totalCents,
      externalReference: reference(accepted ? 'PAY' : 'FAIL'),
      metadata: {
        method: 'card',
        cardTokenPreview: input.cardToken ? `${input.cardToken.slice(0, 2)}***` : null,
        prototype: true,
        ...plan,
      },
      processedAt: new Date(),
    })
    .returning(paymentSelection)

  if (!created) throw new AppError(500, "Le paiement direct n'a pas pu etre cree.")
  await reconcileSubscriptionWorkflow(subscription.id)
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
  const existingPayment = await findAcceptedPayment(subscription.id)
  if (existingPayment) return paymentResponse(existingPayment)
  const plan = await resolvePaymentPlan(input, subscription)
  const accepted = input.mandateAccepted

  const [created] = await requireDb()
    .insert(payments)
    .values({
      userId,
      subscriptionId: subscription.id,
      type: 'mandate',
      status: accepted ? 'accepted' : 'rejected',
      amountCents: plan.totalCents,
      externalReference: reference(accepted ? 'MANDATE' : 'MANDATE-REFUSED'),
      metadata: {
        method: 'sepa_mandate',
        holderName: input.holderName,
        ibanLast4: input.ibanLast4,
        bic: input.bic,
        mandateAccepted: input.mandateAccepted,
        prototype: true,
        ...plan,
      },
      processedAt: new Date(),
    })
    .returning(paymentSelection)

  if (!created) throw new AppError(500, "Le mandat de paiement n'a pas pu etre cree.")
  await reconcileSubscriptionWorkflow(subscription.id)
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
  await reconcileSubscriptionWorkflow(payment.subscriptionId)
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

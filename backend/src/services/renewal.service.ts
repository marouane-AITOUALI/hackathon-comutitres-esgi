import { and, desc, eq } from 'drizzle-orm'
import { requireDb } from '../db/client.js'
import { offers, payments, renewalEvents, subscriptions, terminationRequests } from '../db/schema.js'
import { AppError } from '../utils/app-error.js'
import type { RenewalDecisionInput } from '../validation/renewal.schemas.js'
import { notifyRenewalDecision } from './notifications.service.js'

type RenewalSubscription = Pick<
  typeof subscriptions.$inferSelect,
  'id' | 'userId' | 'offerId' | 'status' | 'createdAt' | 'updatedAt'
>

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

const annualOfferCodes = new Set([
  'NAVIGO_ANNUEL',
  'NAVIGO_SENIOR',
  'IMAGINE_R_JUNIOR',
  'IMAGINE_R_SCOLAIRE',
  'IMAGINE_R_ETUDIANT',
])

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

function addYears(date: Date, years: number) {
  const next = new Date(date)
  next.setUTCFullYear(next.getUTCFullYear() + years)
  return next
}

export function addMonths(date: Date, months: number) {
  const next = new Date(date)
  next.setUTCMonth(next.getUTCMonth() + months)
  return next
}

export function nextAnnualRenewalDate(start: Date, now = new Date()) {
  let next = addYears(start, 1)
  while (next.getTime() <= now.getTime()) next = addYears(next, 1)
  return next
}

export function annualRenewalWindow(start: Date, now = new Date()) {
  const nextRenewalDate = nextAnnualRenewalDate(start, now)
  const renewalWindowStartsAt = addMonths(nextRenewalDate, -3)
  return {
    nextRenewalDate,
    renewalWindowStartsAt,
    isOpen: now.getTime() >= renewalWindowStartsAt.getTime() && now.getTime() < nextRenewalDate.getTime(),
  }
}

function latestRequestState(events: Array<typeof renewalEvents.$inferSelect>) {
  const latest = events.find((event) => ['requested', 'cancelled', 'refused', 'suspended'].includes(event.action))
  return {
    activeRequest: latest?.action === 'requested' ? latest : null,
    lastRequestEvent: latest ?? null,
  }
}

async function buildRenewal(subscription: RenewalSubscription, now = new Date()) {
  const database = requireDb()
  const offer = await getOffer(subscription)
  const eventRows = await database.select(renewalSelection).from(renewalEvents).where(eq(renewalEvents.subscriptionId, subscription.id)).orderBy(desc(renewalEvents.createdAt))
  const paymentRows = await database.select(paymentSelection).from(payments).where(eq(payments.subscriptionId, subscription.id)).orderBy(desc(payments.createdAt))
  const [terminationRequest] = await database
    .select({ id: terminationRequests.id })
    .from(terminationRequests)
    .where(and(eq(terminationRequests.subscriptionId, subscription.id), eq(terminationRequests.status, 'requested')))
    .limit(1)

  const annual = annualOfferCodes.has(offer?.code ?? '')
  const { nextRenewalDate, renewalWindowStartsAt, isOpen: windowOpen } = annualRenewalWindow(subscription.createdAt, now)
  const hasPaymentIssue = paymentRows.some((payment) => payment.status === 'rejected' || payment.status === 'cancelled')
  const { activeRequest, lastRequestEvent } = latestRequestState(eventRows)
  const eligibleStatus = subscription.status === 'accepted'
  const canRenew = annual && eligibleStatus && windowOpen && !activeRequest && !terminationRequest

  const warnings: string[] = []
  if (!annual) warnings.push("Cette offre n'utilise pas le renouvellement annuel.")
  if (annual && !windowOpen) warnings.push(`La demande sera disponible à partir du ${renewalWindowStartsAt.toLocaleDateString('fr-FR')}.`)
  if (!eligibleStatus) warnings.push('Seul un forfait actif et validé peut être renouvelé.')
  if (hasPaymentIssue) warnings.push('Un paiement refusé ou annulé devra être régularisé.')
  if (terminationRequest) warnings.push('Une demande de résiliation est déjà en cours.')

  return {
    subscription,
    offer: offer ? { id: offer.id, code: offer.code, name: offer.name } : null,
    renewal: {
      annual,
      canRenew,
      canCancelRequest: Boolean(activeRequest),
      requestStatus: activeRequest ? 'requested' as const : lastRequestEvent ? 'cancelled' as const : 'none' as const,
      activeRequestId: activeRequest?.id ?? null,
      nextRenewalDate: nextRenewalDate.toISOString(),
      renewalWindowStartsAt: renewalWindowStartsAt.toISOString(),
      periodDays: 365,
      recommendedAction: hasPaymentIssue ? 'regularize_payment' as const : 'request_or_cancel' as const,
      reasons: [
        'Une demande de renouvellement annuel est possible trois mois avant l’échéance.',
        'Le forfait actuel reste actif tant que son échéance ou une résiliation effective ne l’arrête pas.',
      ],
      warnings,
    },
    payments: paymentRows,
    events: eventRows,
  }
}

async function insertRenewalEvent(
  userId: string,
  subscriptionId: string,
  action: 'requested' | 'cancelled' | 'refused' | 'suspended',
  input: RenewalDecisionInput,
  effectiveAt: Date,
) {
  const [created] = await requireDb()
    .insert(renewalEvents)
    .values({
      userId,
      subscriptionId,
      action,
      reason: input.reason,
      metadata: { source: 'client', action },
      effectiveAt,
    })
    .returning(renewalSelection)

  if (!created) throw new AppError(500, "L'événement de renouvellement n'a pas pu être créé.")
  return created
}

export async function getSubscriptionRenewal(userId: string, subscriptionId: string) {
  return buildRenewal(await findOwnSubscription(userId, subscriptionId))
}

export async function acceptSubscriptionRenewal(userId: string, subscriptionId: string, input: RenewalDecisionInput) {
  const subscription = await findOwnSubscription(userId, subscriptionId)
  const current = await buildRenewal(subscription)
  if (!current.renewal.canRenew) {
    throw new AppError(409, "La demande de renouvellement n'est pas disponible.", {
      renewalWindowStartsAt: current.renewal.renewalWindowStartsAt,
      warnings: current.renewal.warnings,
    })
  }

  const event = await insertRenewalEvent(
    userId,
    subscriptionId,
    'requested',
    input,
    new Date(current.renewal.nextRenewalDate),
  )
  await notifyRenewalDecision({ userId, subscriptionId, action: 'requested', reason: input.reason })
  return { event, renewal: await getSubscriptionRenewal(userId, subscriptionId) }
}

export async function cancelSubscriptionRenewal(userId: string, subscriptionId: string, input: RenewalDecisionInput) {
  const subscription = await findOwnSubscription(userId, subscriptionId)
  const current = await buildRenewal(subscription)
  if (!current.renewal.canCancelRequest) throw new AppError(409, 'Aucune demande de renouvellement active à annuler.')

  const event = await insertRenewalEvent(userId, subscriptionId, 'cancelled', input, new Date())
  await notifyRenewalDecision({ userId, subscriptionId, action: 'cancelled', reason: input.reason })
  return { event, renewal: await getSubscriptionRenewal(userId, subscriptionId) }
}

// Compatibilité des anciennes routes : ces choix concernent uniquement la demande future.
export async function refuseSubscriptionRenewal(userId: string, subscriptionId: string, input: RenewalDecisionInput) {
  return cancelSubscriptionRenewal(userId, subscriptionId, input)
}

export async function suspendSubscriptionRenewal(userId: string, subscriptionId: string, input: RenewalDecisionInput) {
  const subscription = await findOwnSubscription(userId, subscriptionId)
  const current = await buildRenewal(subscription)
  if (!current.renewal.canCancelRequest) throw new AppError(409, 'Aucune demande de renouvellement active à suspendre.')
  const event = await insertRenewalEvent(userId, subscriptionId, 'suspended', input, new Date())
  await notifyRenewalDecision({ userId, subscriptionId, action: 'suspended', reason: input.reason })
  return { event, renewal: await getSubscriptionRenewal(userId, subscriptionId) }
}

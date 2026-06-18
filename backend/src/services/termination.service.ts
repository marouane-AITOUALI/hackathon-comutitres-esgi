import { and, desc, eq } from 'drizzle-orm'
import { requireDb } from '../db/client.js'
import { offers, subscriptions, terminationRequests } from '../db/schema.js'
import { AppError } from '../utils/app-error.js'
import type { TerminationDecisionInput } from '../validation/termination.schemas.js'
import { notifyTerminationRequest } from './notifications.service.js'

const annualTerminableOffers = new Set([
  'NAVIGO_ANNUEL',
  'NAVIGO_SENIOR',
  'IMAGINE_R_JUNIOR',
  'IMAGINE_R_SCOLAIRE',
  'IMAGINE_R_ETUDIANT',
])
const atAnyTimeOffers = new Set(['NAVIGO_ANNUEL', 'NAVIGO_SENIOR'])

const requestSelection = {
  id: terminationRequests.id,
  userId: terminationRequests.userId,
  subscriptionId: terminationRequests.subscriptionId,
  status: terminationRequests.status,
  reason: terminationRequests.reason,
  effectiveAt: terminationRequests.effectiveAt,
  processedAt: terminationRequests.processedAt,
  metadata: terminationRequests.metadata,
  createdAt: terminationRequests.createdAt,
  updatedAt: terminationRequests.updatedAt,
}

export function endOfCurrentMonth(now = new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999))
}

export function terminationEffectiveAt(effectiveMonth: string | undefined, now = new Date()) {
  if (!effectiveMonth) return endOfCurrentMonth(now)
  const [yearValue, monthValue] = effectiveMonth.split('-').map(Number)
  const selected = new Date(Date.UTC(yearValue!, monthValue! - 1, 1))
  const current = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  const latest = new Date(Date.UTC(now.getUTCFullYear() + 1, now.getUTCMonth(), 1))
  if (selected < current || selected > latest) {
    throw new AppError(400, 'Le mois de résiliation doit être compris entre le mois courant et les douze prochains mois.')
  }
  return new Date(Date.UTC(yearValue!, monthValue!, 0, 23, 59, 59, 999))
}

async function findContext(userId: string, subscriptionId: string) {
  const [row] = await requireDb()
    .select({ subscription: subscriptions, offerCode: offers.code, offerName: offers.name })
    .from(subscriptions)
    .leftJoin(offers, eq(offers.id, subscriptions.offerId))
    .where(and(eq(subscriptions.id, subscriptionId), eq(subscriptions.userId, userId)))
    .limit(1)
  if (!row) throw new AppError(404, 'Souscription introuvable.')
  return row
}

async function latestRequest(subscriptionId: string) {
  const [request] = await requireDb()
    .select(requestSelection)
    .from(terminationRequests)
    .where(eq(terminationRequests.subscriptionId, subscriptionId))
    .orderBy(desc(terminationRequests.createdAt))
    .limit(1)
  return request ?? null
}

export async function getSubscriptionTermination(userId: string, subscriptionId: string) {
  const context = await findContext(userId, subscriptionId)
  const request = await latestRequest(subscriptionId)
  const activeRequest = request?.status === 'requested' ? request : null
  const eligibleOffer = annualTerminableOffers.has(context.offerCode ?? '')
  const requiresManualReview = eligibleOffer && !atAnyTimeOffers.has(context.offerCode ?? '')
  return {
    subscriptionId,
    offer: context.offerCode ? { code: context.offerCode, name: context.offerName } : null,
    termination: {
      canRequest: context.subscription.status === 'accepted' && eligibleOffer && !activeRequest,
      canCancelRequest: Boolean(activeRequest),
      requestStatus: activeRequest ? 'requested' as const : request?.status ?? 'none' as const,
      effectiveAt: activeRequest?.effectiveAt.toISOString() ?? null,
      currentMonthDue: true,
      refundReviewRequired: true,
      requiresManualReview,
      message: eligibleOffer
        ? requiresManualReview
          ? 'La demande de résiliation Imagine R sera étudiée selon votre motif et les conditions du forfait. Elle ne met pas fin automatiquement aux droits.'
          : 'La résiliation est définitive. Le mois en cours reste dû et un éventuel trop-perçu est traité après contrôle.'
        : 'La résiliation en ligne est réservée aux forfaits annuels.',
    },
    request,
  }
}

export async function requestSubscriptionTermination(
  userId: string,
  subscriptionId: string,
  input: TerminationDecisionInput,
) {
  const summary = await getSubscriptionTermination(userId, subscriptionId)
  if (!summary.termination.canRequest) throw new AppError(409, summary.termination.message)
  const effectiveAt = terminationEffectiveAt(input.effectiveMonth)
  const [request] = await requireDb()
    .insert(terminationRequests)
    .values({
      userId,
      subscriptionId,
      status: 'requested',
      reason: input.reason,
      effectiveAt,
      metadata: {
        source: 'client',
        currentMonthDue: true,
        refundReviewRequired: true,
        requiresManualReview: summary.termination.requiresManualReview,
      },
    })
    .returning(requestSelection)
  if (!request) throw new AppError(500, "La demande de résiliation n'a pas pu être créée.")
  await notifyTerminationRequest({ userId, subscriptionId, action: 'requested', effectiveAt, reason: input.reason })
  return getSubscriptionTermination(userId, subscriptionId)
}

export async function cancelSubscriptionTermination(
  userId: string,
  subscriptionId: string,
  input: TerminationDecisionInput,
) {
  const summary = await getSubscriptionTermination(userId, subscriptionId)
  if (!summary.termination.canCancelRequest || !summary.request) {
    throw new AppError(409, 'Aucune demande de résiliation active à annuler.')
  }
  const [request] = await requireDb()
    .update(terminationRequests)
    .set({
      status: 'cancelled',
      reason: input.reason ?? summary.request.reason,
      updatedAt: new Date(),
    })
    .where(and(eq(terminationRequests.id, summary.request.id), eq(terminationRequests.userId, userId)))
    .returning(requestSelection)
  if (!request) throw new AppError(500, "La demande de résiliation n'a pas pu être annulée.")
  await notifyTerminationRequest({ userId, subscriptionId, action: 'cancelled', effectiveAt: request.effectiveAt, reason: input.reason })
  return getSubscriptionTermination(userId, subscriptionId)
}

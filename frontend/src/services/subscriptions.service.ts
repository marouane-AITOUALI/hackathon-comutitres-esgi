import type { RenewalSummary, SubscriptionNextAction, SubscriptionSummary, SubscriptionsResponse, TerminationSummary } from '../types'
import { apiRequest } from './api'

export const listSubscriptions = () =>
  apiRequest<SubscriptionsResponse>('/subscriptions').then(({ subscriptions }) => subscriptions)

export const getSubscriptionById = (id: string) =>
  apiRequest<SubscriptionSummary>(`/subscriptions/${id}`)

export const createSubscription = (payload: { onboardingSessionId?: string; offerCode?: string; offerId?: string }) =>
  apiRequest<SubscriptionSummary>('/subscriptions', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const submitSubscription = (id: string) =>
  apiRequest<SubscriptionSummary>(`/subscriptions/${id}/submit`, { method: 'POST' })

export const cancelSubscription = (id: string) =>
  apiRequest<SubscriptionSummary>(`/subscriptions/${id}/cancel`, { method: 'POST' })

export const getSubscriptionNextActions = (id: string) =>
  apiRequest<{ subscriptionId: string; actions: SubscriptionNextAction[] }>(`/subscriptions/${id}/next-actions`)

export const getSubscriptionRenewal = (id: string) =>
  apiRequest<RenewalSummary>(`/subscriptions/${id}/renewal`)

export const acceptSubscriptionRenewal = (id: string, reason?: string) =>
  apiRequest<{ event: RenewalSummary['events'][number]; renewal: RenewalSummary }>(`/subscriptions/${id}/renewal/accept`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  })

export const cancelSubscriptionRenewal = (id: string, reason?: string) =>
  apiRequest<{ event: RenewalSummary['events'][number]; renewal: RenewalSummary }>(`/subscriptions/${id}/renewal/cancel`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  })

export const getSubscriptionTermination = (id: string) =>
  apiRequest<TerminationSummary>(`/subscriptions/${id}/termination`)

export const requestSubscriptionTermination = (id: string, payload: { reason: string; effectiveMonth: string }) =>
  apiRequest<TerminationSummary>(`/subscriptions/${id}/termination`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const cancelSubscriptionTermination = (id: string, reason?: string) =>
  apiRequest<TerminationSummary>(`/subscriptions/${id}/termination/cancel`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  })

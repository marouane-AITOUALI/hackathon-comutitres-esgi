import type { RenewalSummary, SubscriptionNextAction, SubscriptionSummary, SubscriptionsResponse } from '../types'
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

export const refuseSubscriptionRenewal = (id: string, reason?: string) =>
  apiRequest<{ event: RenewalSummary['events'][number]; renewal: RenewalSummary }>(`/subscriptions/${id}/renewal/refuse`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  })

export const suspendSubscriptionRenewal = (id: string, reason?: string) =>
  apiRequest<{ event: RenewalSummary['events'][number]; renewal: RenewalSummary }>(`/subscriptions/${id}/renewal/suspend`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  })

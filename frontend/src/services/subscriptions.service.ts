import type { SubscriptionNextAction, SubscriptionSummary, SubscriptionsResponse } from '../types'
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

export const getSubscriptionNextActions = (id: string) =>
  apiRequest<{ subscriptionId: string; actions: SubscriptionNextAction[] }>(`/subscriptions/${id}/next-actions`)

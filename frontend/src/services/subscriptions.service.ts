import type { SubscriptionSummary, SubscriptionsResponse } from '../types'
import { apiRequest } from './api'

export const listSubscriptions = () =>
  apiRequest<SubscriptionsResponse>('/subscriptions').then(({ subscriptions }) => subscriptions)

export const getSubscriptionById = (id: string) =>
  apiRequest<SubscriptionSummary>(`/subscriptions/${id}`)
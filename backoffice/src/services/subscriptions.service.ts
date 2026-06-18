import { apiRequest } from './api'
import type { AdminSubscriptionItem, SubscriptionNextAction, SubscriptionStatus } from '../types/subscription'

export const getAdminSubscriptions = (status?: SubscriptionStatus | '', limit?: number) => {
  const params = new URLSearchParams()
  if (status) params.set('status', status)
  if (limit) params.set('limit', String(limit))
  const query = params.toString() ? `?${params.toString()}` : ''
  return apiRequest<{ subscriptions: AdminSubscriptionItem[] }>(`/admin/subscriptions${query}`)
}

export const getAdminSubscription = (id: string) => apiRequest<AdminSubscriptionItem>(`/admin/subscriptions/${id}`)

export const updateAdminSubscriptionStatus = (id: string, status: SubscriptionStatus) =>
  apiRequest<AdminSubscriptionItem>(`/admin/subscriptions/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })

export const getSubscriptionNextActions = (id: string) =>
  apiRequest<{ subscriptionId: string; actions: SubscriptionNextAction[] }>(`/subscriptions/${id}/next-actions`, {
    redirectOnUnauthorized: false,
  })

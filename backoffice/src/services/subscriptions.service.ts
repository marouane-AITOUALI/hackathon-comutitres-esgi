import { apiRequest } from './api'
import type { AdminSubscriptionItem, SubscriptionStatus } from '../types/subscription'

export const getAdminSubscriptions = (status?: SubscriptionStatus | '') => {
  const query = status ? `?status=${status}` : ''
  return apiRequest<{ subscriptions: AdminSubscriptionItem[] }>(`/admin/subscriptions${query}`)
}

export const getAdminSubscription = (id: string) => apiRequest<AdminSubscriptionItem>(`/admin/subscriptions/${id}`)

export const updateAdminSubscriptionStatus = (id: string, status: SubscriptionStatus) =>
  apiRequest<AdminSubscriptionItem>(`/admin/subscriptions/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })

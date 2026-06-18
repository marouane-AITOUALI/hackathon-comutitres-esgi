import type { UserNotification } from '../types'
import { apiRequest } from './api'

export const listNotifications = (options: {
  limit?: number
  status?: 'all' | 'unread' | 'read'
  category?: UserNotification['category']
} = {}) => {
  const query = new URLSearchParams({
    limit: String(options.limit ?? 50),
    status: options.status ?? 'all',
  })
  if (options.category) query.set('category', options.category)
  return apiRequest<{ notifications: UserNotification[]; unreadCount: number }>(`/notifications?${query}`)
}

export const markNotificationRead = (id: string) =>
  apiRequest<{ notification: UserNotification }>(`/notifications/${id}/read`, { method: 'PATCH' })

export const markNotificationUnread = (id: string) =>
  apiRequest<{ notification: UserNotification }>(`/notifications/${id}/unread`, { method: 'PATCH' })

export const markAllNotificationsRead = () =>
  apiRequest<{ updatedCount: number }>('/notifications/read-all', { method: 'PATCH' })

export const deleteNotification = (id: string) =>
  apiRequest<{ deleted: true; id: string }>(`/notifications/${id}`, { method: 'DELETE' })

import type { UserNotification } from '../types'
import { apiRequest } from './api'

export const listNotifications = (limit = 50) =>
  apiRequest<{ notifications: UserNotification[]; unreadCount: number }>(`/notifications?limit=${limit}`)

export const markNotificationRead = (id: string) =>
  apiRequest<{ notification: UserNotification }>(`/notifications/${id}/read`, { method: 'PATCH' })

export const markAllNotificationsRead = () =>
  apiRequest<{ updatedCount: number }>('/notifications/read-all', { method: 'PATCH' })

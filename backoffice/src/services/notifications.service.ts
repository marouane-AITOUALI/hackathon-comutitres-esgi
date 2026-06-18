import type { AdminNotification, Communication, CreateCommunicationPayload } from '../types/notification'
import { apiRequest } from './api'

export const listNotifications = () =>
  apiRequest<{ notifications: AdminNotification[]; unreadCount: number }>('/notifications?limit=100&status=all')

export const markNotificationRead = (id: string) =>
  apiRequest<{ notification: AdminNotification }>(`/notifications/${id}/read`, { method: 'PATCH' })

export const markNotificationUnread = (id: string) =>
  apiRequest<{ notification: AdminNotification }>(`/notifications/${id}/unread`, { method: 'PATCH' })

export const markAllNotificationsRead = () =>
  apiRequest<{ updatedCount: number }>('/notifications/read-all', { method: 'PATCH' })

export const deleteNotification = (id: string) =>
  apiRequest<{ deleted: true; id: string }>(`/notifications/${id}`, { method: 'DELETE' })

export const listCommunications = () =>
  apiRequest<{ communications: Communication[] }>('/admin/communications')

export const publishCommunication = (payload: CreateCommunicationPayload) =>
  apiRequest<{ communication: Communication }>('/admin/communications', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

import { createContext } from 'react'
import type { AdminNotification } from '../types/notification'

export interface NotificationsContextValue {
  notifications: AdminNotification[]
  unreadCount: number
  connected: boolean
  markRead: (id: string) => Promise<void>
  markUnread: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
  remove: (id: string) => Promise<void>
}

export const NotificationsContext = createContext<NotificationsContextValue | null>(null)

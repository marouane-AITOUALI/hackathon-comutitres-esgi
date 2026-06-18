import { createContext } from 'react'
import type { UserNotification } from '../types'

export interface NotificationsContextValue {
  notifications: UserNotification[]
  unreadCount: number
  connected: boolean
  latestNotification: UserNotification | null
  markRead: (id: string) => Promise<void>
  markUnread: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
  remove: (id: string) => Promise<void>
  closeLatestNotification: () => void
}

export const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined)

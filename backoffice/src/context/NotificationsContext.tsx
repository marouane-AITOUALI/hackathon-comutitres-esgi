import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { NotificationsContext } from './notifications-context'
import { useAuth } from '../hooks/useAuth'
import { getWebSocketUrl } from '../services/api'
import { deleteNotification, listNotifications, markAllNotificationsRead, markNotificationRead, markNotificationUnread } from '../services/notifications.service'
import type { AdminNotification } from '../types/notification'

interface RealtimeMessage {
  event: string
  payload: unknown
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<AdminNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [connected, setConnected] = useState(false)
  const [notificationUserId, setNotificationUserId] = useState<string | null>(null)
  const reconnectTimer = useRef<number | null>(null)

  useEffect(() => {
    if (!user) return

    let disposed = false
    let socket: WebSocket | null = null

    void listNotifications()
      .then((result) => {
        if (disposed) return
        setNotificationUserId(user.id)
        setNotifications(result.notifications)
        setUnreadCount(result.unreadCount)
      })
      .catch(() => undefined)

    const connect = () => {
      if (disposed) return
      socket = new WebSocket(getWebSocketUrl(), ['comutitres'])
      socket.onopen = () => setConnected(true)
      socket.onclose = () => {
        setConnected(false)
        if (!disposed) reconnectTimer.current = window.setTimeout(connect, 3_000)
      }
      socket.onerror = () => socket?.close()
      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as RealtimeMessage
          if (message.event !== 'notification.created') return
          const notification = message.payload as AdminNotification
          setNotificationUserId(user.id)
          setNotifications((current) => [notification, ...current.filter((item) => item.id !== notification.id)].slice(0, 100))
          setUnreadCount((count) => count + 1)
        } catch {
          // Une trame mal formée ne doit pas interrompre les notifications suivantes.
        }
      }
    }

    connect()
    return () => {
      disposed = true
      if (reconnectTimer.current) window.clearTimeout(reconnectTimer.current)
      socket?.close()
    }
  }, [user])

  const markRead = useCallback(async (id: string) => {
    const { notification } = await markNotificationRead(id)
    setNotifications((current) => {
      if (current.some((item) => item.id === id && !item.readAt)) setUnreadCount((count) => Math.max(0, count - 1))
      return current.map((item) => item.id === id ? notification : item)
    })
  }, [])

  const markUnread = useCallback(async (id: string) => {
    const { notification } = await markNotificationUnread(id)
    setNotifications((current) => {
      if (current.some((item) => item.id === id && item.readAt)) setUnreadCount((count) => count + 1)
      return current.map((item) => item.id === id ? notification : item)
    })
  }, [])

  const markAllRead = useCallback(async () => {
    await markAllNotificationsRead()
    const readAt = new Date().toISOString()
    setNotifications((current) => current.map((item) => item.readAt ? item : { ...item, readAt }))
    setUnreadCount(0)
  }, [])

  const remove = useCallback(async (id: string) => {
    await deleteNotification(id)
    setNotifications((current) => {
      const deleted = current.find((item) => item.id === id)
      if (deleted && !deleted.readAt) setUnreadCount((count) => Math.max(0, count - 1))
      return current.filter((item) => item.id !== id)
    })
  }, [])

  const value = useMemo(() => {
    const ownsNotifications = Boolean(user && notificationUserId === user.id)
    return {
      notifications: ownsNotifications ? notifications : [],
      unreadCount: ownsNotifications ? unreadCount : 0,
      connected: Boolean(user) && connected,
      markRead,
      markUnread,
      markAllRead,
      remove,
    }
  }, [connected, markAllRead, markRead, markUnread, notificationUserId, notifications, remove, unreadCount, user])

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
}

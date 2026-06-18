import { Alert, Snackbar } from '@mui/material'
import { useCallback, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react'
import { AUTH_TOKEN_KEY, getWebSocketUrl } from '../services/api'
import { deleteNotification, listNotifications, markAllNotificationsRead, markNotificationRead, markNotificationUnread } from '../services/notifications.service'
import type { UserNotification } from '../types'
import { useAuth } from './useAuth'
import { NotificationsContext } from './notifications-context'
import { subscriptionUpdatedEvent, type SubscriptionUpdatedDetail } from './useSubscriptionRealtime'

interface RealtimeMessage {
  event: string
  payload: unknown
}

function subscriptionDetail(notification: UserNotification): SubscriptionUpdatedDetail | null {
  if (notification.type !== 'subscription_status_changed' || !notification.subscriptionId) return null
  return {
    subscriptionId: notification.subscriptionId,
    previousStatus: typeof notification.data.previousStatus === 'string' ? notification.data.previousStatus as SubscriptionUpdatedDetail['previousStatus'] : undefined,
    status: typeof notification.data.status === 'string' ? notification.data.status as SubscriptionUpdatedDetail['status'] : undefined,
  }
}

export function NotificationsProvider({ children }: PropsWithChildren) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<UserNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [connected, setConnected] = useState(false)
  const [latestNotification, setLatestNotification] = useState<UserNotification | null>(null)
  const reconnectTimer = useRef<number | null>(null)

  useEffect(() => {
    if (!user) {
      setNotifications([])
      setUnreadCount(0)
      setConnected(false)
      return
    }

    let disposed = false
    let socket: WebSocket | null = null

    void listNotifications()
      .then((result) => {
        if (disposed) return
        setNotifications(result.notifications)
        setUnreadCount(result.unreadCount)
      })
      .catch(() => undefined)

    const connect = () => {
      const token = localStorage.getItem(AUTH_TOKEN_KEY)
      if (!token || disposed) return

      socket = new WebSocket(getWebSocketUrl(), ['comutitres', `comutitres.jwt.${token}`])
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
          const notification = message.payload as UserNotification
          setNotifications((current) => [notification, ...current.filter((item) => item.id !== notification.id)].slice(0, 100))
          setUnreadCount((current) => current + 1)
          setLatestNotification(notification)

          const detail = subscriptionDetail(notification)
          if (detail) window.dispatchEvent(new CustomEvent(subscriptionUpdatedEvent, { detail }))
        } catch {
          // Ignore malformed realtime messages and keep the connection alive.
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
      const wasUnread = current.some((item) => item.id === id && !item.readAt)
      if (wasUnread) setUnreadCount((count) => Math.max(0, count - 1))
      return current.map((item) => item.id === id ? notification : item)
    })
  }, [])

  const markUnread = useCallback(async (id: string) => {
    const { notification } = await markNotificationUnread(id)
    setNotifications((current) => {
      const wasRead = current.some((item) => item.id === id && Boolean(item.readAt))
      if (wasRead) setUnreadCount((count) => count + 1)
      return current.map((item) => item.id === id ? notification : item)
    })
  }, [])

  const markAllRead = useCallback(async () => {
    await markAllNotificationsRead()
    const readAt = new Date().toISOString()
    setNotifications((current) => current.map((notification) => notification.readAt ? notification : { ...notification, readAt }))
    setUnreadCount(0)
  }, [])

  const remove = useCallback(async (id: string) => {
    await deleteNotification(id)
    setNotifications((current) => {
      const removed = current.find((item) => item.id === id)
      if (removed && !removed.readAt) setUnreadCount((count) => Math.max(0, count - 1))
      return current.filter((item) => item.id !== id)
    })
  }, [])

  const value = useMemo(() => ({
    notifications,
    unreadCount,
    connected,
    latestNotification,
    markRead,
    markUnread,
    markAllRead,
    remove,
    closeLatestNotification: () => setLatestNotification(null),
  }), [connected, latestNotification, markAllRead, markRead, markUnread, notifications, remove, unreadCount])

  return (
    <NotificationsContext.Provider value={value}>
      {children}
      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        autoHideDuration={6_000}
        open={Boolean(latestNotification)}
        onClose={() => setLatestNotification(null)}
      >
        <Alert onClose={() => setLatestNotification(null)} severity="info" variant="filled" sx={{ width: '100%' }}>
          <strong>{latestNotification?.title}</strong>
          <br />
          {latestNotification?.message}
        </Alert>
      </Snackbar>
    </NotificationsContext.Provider>
  )
}

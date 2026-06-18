import { and, desc, eq, isNull } from 'drizzle-orm'
import { notifications } from '../db/schema.js'
import { requireDb } from '../db/client.js'
import { publishRealtimeEvent } from '../realtime/websocket.server.js'
import { AppError } from '../utils/app-error.js'
import type { SubscriptionStatus } from '../types/auth.js'

const notificationSelection = {
  id: notifications.id,
  userId: notifications.userId,
  subscriptionId: notifications.subscriptionId,
  type: notifications.type,
  title: notifications.title,
  message: notifications.message,
  data: notifications.data,
  readAt: notifications.readAt,
  createdAt: notifications.createdAt,
  updatedAt: notifications.updatedAt,
}

export type NotificationRecord = typeof notifications.$inferSelect

const statusLabels: Record<SubscriptionStatus, string> = {
  draft: 'Brouillon',
  pending_documents: 'Documents attendus',
  pending_payment: 'Paiement attendu',
  pending_validation: 'En cours de validation',
  accepted: 'Abonnement accepté',
  rejected: 'Abonnement refusé',
  cancelled: 'Abonnement annulé',
  suspended: 'Abonnement suspendu',
}

export async function createNotification(input: {
  userId: string
  subscriptionId?: string | null
  type: string
  title: string
  message: string
  data?: Record<string, unknown>
}) {
  const [created] = await requireDb()
    .insert(notifications)
    .values({
      userId: input.userId,
      subscriptionId: input.subscriptionId,
      type: input.type,
      title: input.title,
      message: input.message,
      data: input.data ?? {},
    })
    .returning(notificationSelection)

  if (!created) throw new AppError(500, "La notification n'a pas pu être créée.")
  publishRealtimeEvent(input.userId, 'notification.created', created)
  return created
}

export async function notifySubscriptionStatusChanged(input: {
  userId: string
  subscriptionId: string
  previousStatus: SubscriptionStatus
  status: SubscriptionStatus
}) {
  if (input.previousStatus === input.status) return null
  return createNotification({
    userId: input.userId,
    subscriptionId: input.subscriptionId,
    type: 'subscription_status_changed',
    title: 'Statut de votre abonnement mis à jour',
    message: `Votre dossier est maintenant : ${statusLabels[input.status]}.`,
    data: {
      previousStatus: input.previousStatus,
      status: input.status,
    },
  })
}

export async function listUserNotifications(userId: string, limit = 50) {
  const rows = await requireDb()
    .select(notificationSelection)
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit)

  return {
    notifications: rows,
    unreadCount: rows.filter((notification) => !notification.readAt).length,
  }
}

export async function markNotificationRead(userId: string, id: string) {
  const [updated] = await requireDb()
    .update(notifications)
    .set({ readAt: new Date(), updatedAt: new Date() })
    .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
    .returning(notificationSelection)

  if (!updated) throw new AppError(404, 'Notification introuvable.')
  return { notification: updated }
}

export async function markAllNotificationsRead(userId: string) {
  const updated = await requireDb()
    .update(notifications)
    .set({ readAt: new Date(), updatedAt: new Date() })
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)))
    .returning({ id: notifications.id })

  return { updatedCount: updated.length }
}

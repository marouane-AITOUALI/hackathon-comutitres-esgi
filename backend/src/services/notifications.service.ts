import { and, count, desc, eq, isNotNull, isNull, type SQL } from 'drizzle-orm'
import { communications, notifications, users } from '../db/schema.js'
import { requireDb } from '../db/client.js'
import { publishRealtimeEvent } from '../realtime/websocket.server.js'
import { AppError } from '../utils/app-error.js'
import type { SubscriptionStatus } from '../types/auth.js'
import type { CreateCommunicationInput, NotificationListQuery } from '../validation/notification.schemas.js'

type NotificationCategory = (typeof notifications.$inferInsert)['category']
type NotificationPriority = (typeof notifications.$inferInsert)['priority']
type DocumentStatus = 'pending' | 'analyzing' | 'validated' | 'rejected' | 'needs_manual_review'
type PaymentStatus = 'simulated' | 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'regularized'
type RenewalAction = 'accepted' | 'refused' | 'suspended'

const notificationSelection = {
  id: notifications.id,
  userId: notifications.userId,
  subscriptionId: notifications.subscriptionId,
  communicationId: notifications.communicationId,
  type: notifications.type,
  category: notifications.category,
  priority: notifications.priority,
  title: notifications.title,
  message: notifications.message,
  data: notifications.data,
  readAt: notifications.readAt,
  createdAt: notifications.createdAt,
  updatedAt: notifications.updatedAt,
}

const communicationSelection = {
  id: communications.id,
  createdBy: communications.createdBy,
  audience: communications.audience,
  title: communications.title,
  message: communications.message,
  priority: communications.priority,
  actionLabel: communications.actionLabel,
  actionPath: communications.actionPath,
  recipientCount: communications.recipientCount,
  publishedAt: communications.publishedAt,
  createdAt: communications.createdAt,
  updatedAt: communications.updatedAt,
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

function actionData(actionPath: string, actionLabel: string, extra: Record<string, unknown> = {}) {
  return { actionPath, actionLabel, ...extra }
}

export async function createNotification(input: {
  userId: string
  subscriptionId?: string | null
  communicationId?: string | null
  type: string
  category: NotificationCategory
  priority?: NotificationPriority
  title: string
  message: string
  data?: Record<string, unknown>
}) {
  const [created] = await requireDb()
    .insert(notifications)
    .values({
      userId: input.userId,
      subscriptionId: input.subscriptionId,
      communicationId: input.communicationId,
      type: input.type,
      category: input.category,
      priority: input.priority ?? 'normal',
      title: input.title,
      message: input.message,
      data: input.data ?? {},
    })
    .returning(notificationSelection)

  if (!created) throw new AppError(500, "La notification n'a pas pu être créée.")
  publishRealtimeEvent(input.userId, 'notification.created', created)
  return created
}

async function notifyAdmins(input: Omit<Parameters<typeof createNotification>[0], 'userId'>) {
  const admins = await requireDb().select({ id: users.id }).from(users).where(eq(users.role, 'admin'))
  if (admins.length === 0) return []

  const created = await requireDb()
    .insert(notifications)
    .values(admins.map((admin) => ({
      userId: admin.id,
      subscriptionId: input.subscriptionId,
      communicationId: input.communicationId,
      type: input.type,
      category: input.category,
      priority: input.priority ?? 'normal',
      title: input.title,
      message: input.message,
      data: input.data ?? {},
    })))
    .returning(notificationSelection)

  for (const notification of created) publishRealtimeEvent(notification.userId, 'notification.created', notification)
  return created
}

export async function notifySubscriptionStatusChanged(input: {
  userId: string
  subscriptionId: string
  previousStatus: SubscriptionStatus
  status: SubscriptionStatus
}) {
  if (input.previousStatus === input.status) return null

  const clientNotification = await createNotification({
    userId: input.userId,
    subscriptionId: input.subscriptionId,
    type: 'subscription_status_changed',
    category: 'subscription',
    priority: ['rejected', 'suspended'].includes(input.status) ? 'high' : 'normal',
    title: 'Statut de votre abonnement mis à jour',
    message: `Votre dossier est maintenant : ${statusLabels[input.status]}.`,
    data: actionData(`/subscriptions/${input.subscriptionId}`, 'Voir le dossier', {
      previousStatus: input.previousStatus,
      status: input.status,
    }),
  })

  if (input.status === 'pending_validation') {
    await notifyAdmins({
      subscriptionId: input.subscriptionId,
      type: 'subscription_ready_for_review',
      category: 'subscription',
      priority: 'high',
      title: 'Dossier prêt à valider',
      message: 'Un dossier client a terminé les étapes documents et paiement.',
      data: actionData(`/subscriptions/${input.subscriptionId}`, 'Ouvrir le dossier', {
        status: input.status,
      }),
    })
  }

  return clientNotification
}

export async function notifyDocumentSubmitted(input: {
  userId: string
  subscriptionId: string
  documentId: string
  documentType: string
  resubmitted?: boolean
}) {
  return notifyAdmins({
    subscriptionId: input.subscriptionId,
    type: input.resubmitted ? 'document_resubmitted' : 'document_submitted',
    category: 'document',
    title: input.resubmitted ? 'Document renvoyé par un client' : 'Nouveau document à traiter',
    message: `Un justificatif « ${input.documentType} » attend une analyse ou une validation.`,
    data: actionData('/documents', 'Traiter le document', {
      documentId: input.documentId,
      documentType: input.documentType,
      userId: input.userId,
    }),
  })
}

export async function notifyDocumentStatusChanged(input: {
  userId: string
  subscriptionId: string
  documentId: string
  documentType: string
  previousStatus: DocumentStatus
  status: DocumentStatus
  rejectionReason?: string | null
}) {
  if (input.previousStatus === input.status) return null

  if (input.status === 'needs_manual_review') {
    await notifyAdmins({
      subscriptionId: input.subscriptionId,
      type: 'document_manual_review_required',
      category: 'document',
      priority: 'high',
      title: 'Document à revoir manuellement',
      message: `Le justificatif « ${input.documentType} » nécessite une décision humaine.`,
      data: actionData('/documents', 'Revoir le document', { documentId: input.documentId }),
    })
  }

  if (!['validated', 'rejected', 'needs_manual_review'].includes(input.status)) return null

  const copy = input.status === 'validated'
    ? { title: 'Document validé', message: `Votre justificatif « ${input.documentType} » a été validé.`, priority: 'normal' as const }
    : input.status === 'rejected'
      ? {
          title: 'Document à remplacer',
          message: input.rejectionReason
            ? `Votre justificatif « ${input.documentType} » a été refusé : ${input.rejectionReason}`
            : `Votre justificatif « ${input.documentType} » a été refusé.`,
          priority: 'high' as const,
        }
      : {
          title: 'Document en cours de vérification',
          message: `Votre justificatif « ${input.documentType} » nécessite une vérification complémentaire.`,
          priority: 'normal' as const,
        }

  return createNotification({
    userId: input.userId,
    subscriptionId: input.subscriptionId,
    type: `document_${input.status}`,
    category: 'document',
    priority: copy.priority,
    title: copy.title,
    message: copy.message,
    data: actionData(`/subscriptions/${input.subscriptionId}`, input.status === 'rejected' ? 'Renvoyer un document' : 'Voir le dossier', {
      documentId: input.documentId,
      documentType: input.documentType,
      previousStatus: input.previousStatus,
      status: input.status,
    }),
  })
}

export async function notifyPaymentStatus(input: {
  userId: string
  subscriptionId: string
  paymentId: string
  status: PaymentStatus
  amountCents: number
  currency: string
}) {
  if (!['accepted', 'rejected', 'cancelled', 'regularized'].includes(input.status)) return null

  const amount = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: input.currency }).format(input.amountCents / 100)
  const copies: Record<'accepted' | 'rejected' | 'cancelled' | 'regularized', { title: string; message: string; priority: NotificationPriority }> = {
    accepted: { title: 'Paiement accepté', message: `Votre paiement de ${amount} a été confirmé.`, priority: 'normal' },
    rejected: { title: 'Paiement refusé', message: `Votre paiement de ${amount} a été refusé. Un nouveau moyen de paiement est nécessaire.`, priority: 'high' },
    cancelled: { title: 'Paiement annulé', message: `Le paiement de ${amount} a été annulé.`, priority: 'normal' },
    regularized: { title: 'Paiement régularisé', message: `La régularisation de ${amount} a bien été enregistrée.`, priority: 'normal' },
  }
  const copy = copies[input.status as keyof typeof copies]

  const clientNotification = await createNotification({
    userId: input.userId,
    subscriptionId: input.subscriptionId,
    type: `payment_${input.status}`,
    category: 'payment',
    priority: copy.priority,
    title: copy.title,
    message: copy.message,
    data: actionData(`/subscriptions/${input.subscriptionId}`, input.status === 'rejected' ? 'Régulariser' : 'Voir le paiement', {
      paymentId: input.paymentId,
      status: input.status,
      amountCents: input.amountCents,
      currency: input.currency,
    }),
  })

  if (input.status === 'rejected') {
    await notifyAdmins({
      subscriptionId: input.subscriptionId,
      type: 'payment_issue',
      category: 'payment',
      priority: 'high',
      title: 'Paiement client refusé',
      message: `Un paiement de ${amount} bloque la progression d'un dossier.`,
      data: actionData(`/subscriptions/${input.subscriptionId}`, 'Ouvrir le dossier', {
        paymentId: input.paymentId,
      }),
    })
  }

  return clientNotification
}

export async function notifyRenewalDecision(input: {
  userId: string
  subscriptionId: string
  action: RenewalAction
  reason?: string
}) {
  const copies: Record<RenewalAction, { title: string; message: string; priority: NotificationPriority }> = {
    accepted: {
      title: 'Renouvellement lancé',
      message: 'Votre demande de renouvellement est enregistrée. Le paiement peut maintenant être finalisé.',
      priority: 'normal',
    },
    refused: {
      title: 'Renouvellement refusé',
      message: 'Votre choix de ne pas renouveler a bien été pris en compte.',
      priority: 'normal',
    },
    suspended: {
      title: 'Renouvellement suspendu',
      message: 'Votre renouvellement est suspendu. Vous pourrez contacter le support si nécessaire.',
      priority: 'high',
    },
  }
  const copy = copies[input.action]

  const clientNotification = await createNotification({
    userId: input.userId,
    subscriptionId: input.subscriptionId,
    type: `renewal_${input.action}`,
    category: 'renewal',
    priority: copy.priority,
    title: copy.title,
    message: copy.message,
    data: actionData(`/subscriptions/${input.subscriptionId}`, 'Voir le renouvellement', {
      action: input.action,
      reason: input.reason ?? null,
    }),
  })

  await notifyAdmins({
    subscriptionId: input.subscriptionId,
    type: `renewal_${input.action}`,
    category: 'renewal',
    priority: input.action === 'suspended' ? 'high' : 'normal',
    title: `Renouvellement ${input.action === 'accepted' ? 'accepté' : input.action === 'refused' ? 'refusé' : 'suspendu'}`,
    message: 'Une décision de renouvellement client vient d’être enregistrée.',
    data: actionData(`/subscriptions/${input.subscriptionId}`, 'Voir le dossier', {
      action: input.action,
      reason: input.reason ?? null,
      userId: input.userId,
    }),
  })

  return clientNotification
}

export async function listUserNotifications(userId: string, query: NotificationListQuery) {
  const conditions: SQL[] = [eq(notifications.userId, userId)]
  if (query.status === 'unread') conditions.push(isNull(notifications.readAt))
  if (query.status === 'read') conditions.push(isNotNull(notifications.readAt))
  if (query.category) conditions.push(eq(notifications.category, query.category))

  const [rows, unreadRows] = await Promise.all([
    requireDb()
      .select(notificationSelection)
      .from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt))
      .limit(query.limit),
    requireDb()
      .select({ value: count() })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt))),
  ])

  return {
    notifications: rows,
    unreadCount: unreadRows[0]?.value ?? 0,
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

export async function markNotificationUnread(userId: string, id: string) {
  const [updated] = await requireDb()
    .update(notifications)
    .set({ readAt: null, updatedAt: new Date() })
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

export async function deleteNotification(userId: string, id: string) {
  const [deleted] = await requireDb()
    .delete(notifications)
    .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
    .returning({ id: notifications.id })

  if (!deleted) throw new AppError(404, 'Notification introuvable.')
  return { deleted: true, id: deleted.id }
}

export async function createCommunication(authorId: string, input: CreateCommunicationInput) {
  const database = requireDb()
  const recipientWhere = input.audience === 'clients'
    ? eq(users.role, 'user')
    : input.audience === 'admins'
      ? eq(users.role, 'admin')
      : undefined
  const result = await database.transaction(async (transaction) => {
    const recipients = await transaction.select({ id: users.id }).from(users).where(recipientWhere)
    const [author] = await transaction
      .select({ firstName: users.firstName, lastName: users.lastName })
      .from(users)
      .where(eq(users.id, authorId))
      .limit(1)

    const [communication] = await transaction
      .insert(communications)
      .values({
        createdBy: authorId,
        audience: input.audience,
        title: input.title,
        message: input.message,
        priority: input.priority,
        actionLabel: input.actionLabel,
        actionPath: input.actionPath,
        recipientCount: recipients.length,
      })
      .returning(communicationSelection)

    if (!communication) throw new AppError(500, "La communication n'a pas pu être publiée.")

    const createdNotifications = recipients.length === 0
      ? []
      : await transaction
          .insert(notifications)
          .values(recipients.map((recipient) => ({
            userId: recipient.id,
            communicationId: communication.id,
            type: 'general_communication',
            category: 'communication' as const,
            priority: input.priority,
            title: input.title,
            message: input.message,
            data: {
              actionLabel: input.actionLabel ?? null,
              actionPath: input.actionPath ?? null,
              audience: input.audience,
            },
          })))
          .returning(notificationSelection)

    return {
      communication: {
        ...communication,
        author: author ? `${author.firstName} ${author.lastName}`.trim() : null,
      },
      createdNotifications,
    }
  })

  for (const notification of result.createdNotifications) publishRealtimeEvent(notification.userId, 'notification.created', notification)
  return { communication: result.communication }
}

export async function listCommunications() {
  const rows = await requireDb()
    .select({
      ...communicationSelection,
      authorFirstName: users.firstName,
      authorLastName: users.lastName,
    })
    .from(communications)
    .leftJoin(users, eq(communications.createdBy, users.id))
    .orderBy(desc(communications.publishedAt))
    .limit(100)

  return {
    communications: rows.map(({ authorFirstName, authorLastName, ...communication }) => ({
      ...communication,
      author: authorFirstName || authorLastName ? `${authorFirstName ?? ''} ${authorLastName ?? ''}`.trim() : null,
    })),
  }
}

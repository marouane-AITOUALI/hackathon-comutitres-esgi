export type NotificationCategory = 'subscription' | 'document' | 'payment' | 'renewal' | 'communication' | 'system'
export type NotificationPriority = 'low' | 'normal' | 'high'
export type CommunicationAudience = 'clients' | 'admins' | 'everyone'

export interface AdminNotification {
  id: string
  userId: string
  subscriptionId: string | null
  communicationId: string | null
  type: string
  category: NotificationCategory
  priority: NotificationPriority
  title: string
  message: string
  data: {
    actionPath?: string | null
    actionLabel?: string | null
    [key: string]: unknown
  }
  readAt: string | null
  createdAt: string
  updatedAt: string
}

export interface Communication {
  id: string
  createdBy: string | null
  audience: CommunicationAudience
  title: string
  message: string
  priority: NotificationPriority
  actionLabel: string | null
  actionPath: string | null
  recipientCount: number
  publishedAt: string
  createdAt: string
  updatedAt: string
  author: string | null
}

export interface CreateCommunicationPayload {
  audience: CommunicationAudience
  title: string
  message: string
  priority: NotificationPriority
  actionLabel?: string
  actionPath?: string
}

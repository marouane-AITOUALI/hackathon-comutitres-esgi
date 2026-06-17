import type { DocumentStatus } from './document'
import type { AdminOffer } from './offer'
import type { SubscriptionStatus } from './subscription'
import type { AdminUser } from './auth'

export type SupportAlertRisk = 'low' | 'medium' | 'high'

export interface AdminStats {
  users: { total: number; admins: number }
  subscriptions: Record<SubscriptionStatus | 'total', number>
  documents: Record<DocumentStatus | 'total', number>
  offers: { total: number; active: number }
  payments?: Record<'total' | 'simulated' | 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'regularized', number>
  supportAlerts: number
}

export interface SupportAlert {
  id: string
  type: string
  severity?: 'info' | 'warning' | 'error'
  risk?: SupportAlertRisk
  subscriptionId?: string
  documentId?: string
  paymentId?: string
  title: string
  message: string
  reason?: string
  action?: string
  createdAt?: string
}

export interface AdminUserListItem extends AdminUser {
  rgpdConsent?: boolean
  subscriptionCount?: number
  createdAt?: string
  updatedAt?: string
}

export interface AuditLog {
  id: string
  entityType: string
  entityId: string
  action: string
  summary: string
  createdAt: string
}

export type AdminOfferListItem = AdminOffer

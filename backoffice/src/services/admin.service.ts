import { apiRequest } from './api'
import type { AdminStats, AdminUserListItem, AuditLog, SupportAlert } from '../types/admin'
import type { PendingDocumentItem } from '../types/document'

export const getAdminStats = () => apiRequest<AdminStats>('/admin/stats')
export const getSupportAlerts = () => apiRequest<{ alerts: SupportAlert[] }>('/admin/support-alerts')
export const getPendingDocuments = () => apiRequest<{ documents: PendingDocumentItem[] }>('/admin/documents/pending')
export const getAdminUsers = () => apiRequest<{ users: AdminUserListItem[] }>('/admin/users')
export const getAuditLogs = () => apiRequest<{ logs: AuditLog[] }>('/admin/audit-logs')

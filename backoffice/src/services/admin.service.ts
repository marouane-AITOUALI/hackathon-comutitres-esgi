import { apiRequest } from './api'
import type { AdminStats, AdminUserListItem, SupportAlert } from '../types/admin'
import type { PendingDocumentItem } from '../types/document'

export const getAdminStats = () => apiRequest<AdminStats>('/admin/stats')
export const getSupportAlerts = () => apiRequest<{ alerts: SupportAlert[] }>('/admin/support-alerts')
export const getPendingDocuments = () => apiRequest<{ documents: PendingDocumentItem[] }>('/admin/documents/pending')
export const getAdminUsers = () => apiRequest<{ users: AdminUserListItem[] }>('/admin/users')
export const updateAdminUserRole = (id: string, role: 'user' | 'admin') =>
  apiRequest<{ user: AdminUserListItem }>(`/admin/users/${id}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  })
export const updateAdminUserArchive = (id: string, archived: boolean) =>
  apiRequest<{ user: AdminUserListItem }>(`/admin/users/${id}/archive`, {
    method: 'PATCH',
    body: JSON.stringify({ archived }),
  })

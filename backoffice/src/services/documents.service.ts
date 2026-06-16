import { apiRequest } from './api'
import type { AdminDocument } from '../types/document'

export const reviewDocument = (id: string, accepted: boolean, rejectionReason?: string, note?: string) =>
  apiRequest<{ document: AdminDocument }>(`/admin/documents/${id}/review`, {
    method: 'PATCH',
    body: JSON.stringify({ accepted, rejectionReason, note }),
  })

import { apiRequest } from './api'
import type { AdminDocument } from '../types/document'

export const reviewDocument = (id: string, accepted: boolean, rejectionReason?: string, note?: string) =>
  apiRequest<{ document: AdminDocument }>(`/admin/documents/${id}/review`, {
    method: 'PATCH',
    body: JSON.stringify({ accepted, rejectionReason, note }),
  })

export const analyzeDocument = (id: string) =>
  apiRequest<{ document: AdminDocument; analysis: AdminDocument['analysisResult'] }>(`/documents/${id}/analyze`, {
    method: 'POST',
  })

export const getDocumentAnalysis = (id: string) =>
  apiRequest<{ documentId: string; analysis: AdminDocument['analysisResult']; analyzedAt: string | null }>(`/documents/${id}/analysis`)

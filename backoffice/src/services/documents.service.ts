import { apiRequest } from './api'
import type { AdminDocument } from '../types/document'

export const reviewDocument = (id: string, decision: 'validate' | 'reject' | 'manual_review', rejectionReason?: string, note?: string) =>
  apiRequest<{ document: AdminDocument }>(`/admin/documents/${id}/review`, {
    method: 'PATCH',
    body: JSON.stringify({ decision, rejectionReason, note }),
  })

export const analyzeDocument = (id: string) =>
  apiRequest<{ document: AdminDocument; analysis: AdminDocument['analysisResult'] }>(`/documents/${id}/analyze`, {
    method: 'POST',
  })

export const getDocumentAnalysis = (id: string) =>
  apiRequest<{ documentId: string; analysis: AdminDocument['analysisResult']; analyzedAt: string | null }>(`/documents/${id}/analysis`)

export const getDocumentSignedUrl = (id: string) =>
  apiRequest<{ documentId: string; signedUrl: string | null }>(`/documents/${id}/signed-url`)

export const deleteDocument = (id: string) =>
  apiRequest<{ deleted: boolean; id: string }>(`/documents/${id}`, {
    method: 'DELETE',
  })

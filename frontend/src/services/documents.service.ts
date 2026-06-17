import type { DocumentSummary, DocumentType } from '../types'
import { apiRequest } from './api'

export const createDocument = (subscriptionId: string, payload: { type: DocumentType; fileUrl: string }) =>
  apiRequest<{ document: DocumentSummary }>(`/subscriptions/${subscriptionId}/documents`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const listDocumentsForSubscription = (subscriptionId: string) =>
  apiRequest<{ documents: DocumentSummary[] }>(`/subscriptions/${subscriptionId}/documents`)

export const analyzeDocument = (id: string) =>
  apiRequest<{ document: DocumentSummary; analysis: DocumentSummary['analysisResult'] }>(`/documents/${id}/analyze`, {
    method: 'POST',
  })

export const resubmitDocument = (id: string, payload: { type?: DocumentType; fileUrl: string }) =>
  apiRequest<{ document: DocumentSummary }>(`/documents/${id}/resubmit`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })

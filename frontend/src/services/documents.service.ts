import type { DocumentSummary, DocumentType } from '../types'
import { apiRequest } from './api'

function documentFormData(payload: { type?: DocumentType; file: File }) {
  const formData = new FormData()
  if (payload.type) formData.set('type', payload.type)
  formData.set('file', payload.file)
  return formData
}

export const createDocument = (subscriptionId: string, payload: { type: DocumentType; file: File }) =>
  apiRequest<{ document: DocumentSummary }>(`/subscriptions/${subscriptionId}/documents`, {
    method: 'POST',
    body: documentFormData(payload),
  })

export const listDocumentsForSubscription = (subscriptionId: string) =>
  apiRequest<{ documents: DocumentSummary[] }>(`/subscriptions/${subscriptionId}/documents`)

export const analyzeDocument = (id: string) =>
  apiRequest<{ document: DocumentSummary; analysis: DocumentSummary['analysisResult'] }>(`/documents/${id}/analyze`, {
    method: 'POST',
  })

export const resubmitDocument = (id: string, payload: { type?: DocumentType; file: File }) =>
  apiRequest<{ document: DocumentSummary }>(`/documents/${id}/resubmit`, {
    method: 'POST',
    body: documentFormData(payload),
  })

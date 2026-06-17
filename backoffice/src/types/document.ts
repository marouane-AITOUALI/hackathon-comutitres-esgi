import type { AdminSubscriptionItem } from './subscription'

export type DocumentStatus = 'pending' | 'analyzing' | 'validated' | 'rejected' | 'needs_manual_review' | 'expired'

export interface DocumentAnalysisResult {
  provider?: string
  detectedDocumentType?: string
  confidence?: number
  suggestedStatus?: string
  reasons?: string[]
  warnings?: string[]
  fraudSignals?: string[]
  analyzedAt?: string
}

export interface AdminDocument {
  id: string
  subscriptionId: string
  type: string
  fileUrl: string
  status: DocumentStatus
  analysisResult?: DocumentAnalysisResult | Record<string, unknown>
  analyzedAt?: string | null
  rejectionReason?: string | null
  createdAt: string
  updatedAt: string
}

export interface PendingDocumentItem {
  document: AdminDocument
  subscription: AdminSubscriptionItem
}

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
  manualReview?: boolean
  accepted?: boolean
  note?: string | null
  reviewedAt?: string
}

export interface AdminDocument {
  id: string
  subscriptionId: string
  ownerId?: string | null
  type: string
  fileUrl: string
  storageBucket?: string | null
  storagePath?: string | null
  originalFilename?: string | null
  mimeType?: string | null
  sizeBytes?: number | null
  signedUrl?: string | null
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

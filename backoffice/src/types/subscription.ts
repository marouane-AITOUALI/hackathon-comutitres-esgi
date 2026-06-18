import type { AdminDocument } from './document'
import type { AdminOffer } from './offer'
import type { AdminPayment } from './payment'

export type SubscriptionStatus =
  | 'draft'
  | 'pending_documents'
  | 'pending_payment'
  | 'pending_validation'
  | 'accepted'
  | 'rejected'
  | 'suspended'
  | 'cancelled'

export type SubscriptionFor = 'self' | 'child' | 'other' | 'organization_beneficiary'

export interface AdminProfile {
  id: string
  userId?: string
  type: 'bearer' | 'payer'
  status?: string
  firstName: string
  lastName: string
  email?: string | null
  birthDate?: string | null
  relationshipToBearer?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface AdminSubscription {
  id: string
  userId: string
  bearerProfileId: string | null
  payerProfileId: string | null
  offerId: string | null
  onboardingSessionId: string | null
  status: SubscriptionStatus
  submittedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface AdminSubscriptionItem {
  subscription: AdminSubscription
  user: {
    id?: string
    firstName: string
    lastName: string
    email: string
    role?: string
    rgpdConsent?: boolean
    createdAt?: string
    updatedAt?: string
  } | null
  offer: AdminOffer | null
  bearerProfile: AdminProfile | null
  payerProfile: AdminProfile | null
  onboardingSession: {
    id?: string
    currentStep?: string
    subscriptionFor: SubscriptionFor
    isBearerPayer: boolean
  } | null
  documents: AdminDocument[]
  payments: AdminPayment[]
  workflow?: {
    state: 'documents_required' | 'payment_required' | 'ready_to_submit' | 'under_review' | 'needs_action' | 'approved' | 'rejected' | 'cancelled' | 'suspended'
    blockingReasons: string[]
    documentsReady: boolean
    hasAcceptedPayment: boolean
    canSubmit: boolean
    canCancel: boolean
  }
}

export interface SubscriptionNextAction {
  code: string
  priority: 'low' | 'medium' | 'high'
  label: string
  detail: string
}

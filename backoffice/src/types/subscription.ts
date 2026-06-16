import type { AdminDocument } from './document'
import type { AdminOffer } from './offer'

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
  firstName: string
  lastName: string
  email?: string | null
  birthDate?: string | null
  relationshipToBearer?: string | null
}

export interface AdminSubscription {
  id: string
  userId: string
  bearerProfileId: string | null
  payerProfileId: string | null
  offerId: string | null
  onboardingSessionId: string | null
  status: SubscriptionStatus
  createdAt: string
  updatedAt: string
}

export interface AdminSubscriptionItem {
  subscription: AdminSubscription
  user: { firstName: string; lastName: string; email: string } | null
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
}

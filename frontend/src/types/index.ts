export type UserRole = 'user' | 'admin'
export type ContactPreference = 'email' | 'phone' | 'sms'
export type AccessibilityPreference = 'none' | 'screen_reader' | 'large_text' | 'reduced_motion' | 'plain_language' | 'human_support'
export type ProfileStatus = 'junior' | 'school' | 'student' | 'active' | 'senior' | 'solidarity' | 'other'
export type SubscriptionStatus = 'draft' | 'pending_documents' | 'pending_payment' | 'pending_validation' | 'accepted' | 'rejected' | 'cancelled' | 'suspended'
export type DocumentStatus = 'pending' | 'analyzing' | 'validated' | 'rejected' | 'needs_manual_review'
export type DocumentType = 'identity' | 'proof_of_address' | 'eligibility' | 'school_certificate' | 'tax_notice' | 'other'
export type PaymentStatus = 'simulated' | 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'regularized'
export type PaymentType = 'simulation' | 'direct' | 'mandate' | 'regularization'
export type SubscriptionFor = 'self' | 'child' | 'other' | 'organization_beneficiary'
export type RelationshipToBearer = 'parent' | 'guardian' | 'association' | 'employer' | 'other'
export type Frequency = 'daily' | 'regular' | 'occasional'
export type PlanPreference = 'annual' | 'monthly' | 'weekly' | 'pay_as_you_go' | 'unsure'
export type SocialSituation = 'student' | 'scholarship' | 'job_seeker' | 'social_beneficiary' | 'senior' | 'other'
export type SupportPreference = 'phone' | 'navigo_pass' | 'unsure'

export interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  role: UserRole
  phone: string | null
  addressLine1: string | null
  addressLine2: string | null
  postalCode: string | null
  city: string | null
  country: string
  preferredContact: ContactPreference
  accessibilityPreference: AccessibilityPreference
  marketingOptIn: boolean
  marketingOptInAt: string | null
  rgpdConsent: boolean
  rgpdConsentedAt: string | null
  profileUpdatedAt: string | null
  updatedAt: string
  avatarUrl?: string | null
}

export type AuthUser = User

export interface AuthResponse {
  user: AuthUser
  token: string
  subscription?: SubscriptionEntity | null
  onboardingSession?: OnboardingSessionSummary
}

export interface ApiError {
  message: string
  issues?: unknown[]
}

export interface PorteurProfile {
  firstName: string
  lastName: string
  birthDate: string
  status: ProfileStatus
}

export interface PayeurProfile {
  firstName: string
  lastName: string
  email: string
  relationshipToBearer: RelationshipToBearer
}

export interface OnboardingAnswer {
  subscriptionFor: SubscriptionFor
  isBearerPayer: boolean
  bearer: PorteurProfile
  payer?: PayeurProfile
  frequency: Frequency
  planPreference: PlanPreference
  socialSituation: SocialSituation
  support: SupportPreference
  scholarship: boolean
  solidarity: boolean
  department?: string
  address: {
    addressLine1: string
    addressLine2?: string
    postalCode: string
    city: string
    country: 'FR'
  }
}

export type OnboardingDraft = Partial<OnboardingAnswer>

export interface OfferRecommendation {
  offerId: string | null
  offerCode: string
  offerName: string
  confidencePercent: number
  reasons: string[]
  requiredDocuments: string[]
  priceCents: number
  monthlyInstallmentCount: number | null
  warnings: string[]
}

export interface RecommendationResponse {
  success: boolean
  recommendation: OfferRecommendation
}

export interface OnboardingResponse {
  id: string
  session?: { id: string }
}

export interface OfferSummary {
  id: string
  code: string
  name: string
  description: string | null
  target: string
  requiredDocuments: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ProfileSummary {
  id: string
  type: 'bearer' | 'payer'
  status: ProfileStatus
  firstName: string
  lastName: string
  birthDate: string | null
  email: string | null
  relationshipToBearer: RelationshipToBearer | null
  createdAt: string
  updatedAt: string
}

export interface OnboardingSessionSummary {
  id: string
  currentStep: string
  subscriptionFor: SubscriptionFor
  isBearerPayer: boolean
}

export interface SubscriptionEntity {
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

export interface DocumentSummary {
  id: string
  subscriptionId: string
  ownerId?: string | null
  type: DocumentType
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

export interface PaymentSummary {
  id: string
  userId: string
  subscriptionId: string
  type: PaymentType
  status: PaymentStatus
  amountCents: number
  currency: string
  provider: string
  externalReference?: string | null
  metadata?: Record<string, unknown>
  processedAt?: string | null
  createdAt: string
  updatedAt: string
}

export interface UserNotification {
  id: string
  userId: string
  subscriptionId: string | null
  communicationId: string | null
  type: string
  category: 'subscription' | 'document' | 'payment' | 'renewal' | 'communication' | 'system'
  priority: 'low' | 'normal' | 'high'
  title: string
  message: string
  data: {
    actionPath?: string | null
    actionLabel?: string | null
    [key: string]: unknown
  }
  readAt: string | null
  createdAt: string
  updatedAt: string
}

export interface SubscriptionSummary {
  subscription: SubscriptionEntity
  offer: OfferSummary | null
  bearerProfile: ProfileSummary | null
  payerProfile: ProfileSummary | null
  onboardingSession: OnboardingSessionSummary | null
  documents: DocumentSummary[]
  payments: PaymentSummary[]
  workflow: SubscriptionWorkflow
}

export type SubscriptionWorkflowState =
  | 'documents_required'
  | 'payment_required'
  | 'ready_to_submit'
  | 'under_review'
  | 'needs_action'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'suspended'

export interface SubscriptionWorkflow {
  state: SubscriptionWorkflowState
  requiredDocumentTypes: DocumentType[]
  blockingDocumentTypes: DocumentType[]
  missingBlockingDocuments: DocumentType[]
  rejectedBlockingDocuments: DocumentType[]
  pendingBlockingDocuments: DocumentType[]
  documentsReady: boolean
  hasAcceptedPayment: boolean
  canUpload: boolean
  canPay: boolean
  canSubmit: boolean
  canCancel: boolean
  replaceableDocumentTypes: DocumentType[]
  blockingReasons: string[]
  schoolCertificateBlocking: boolean
}

export interface PaymentSimulation {
  amountCents: number
  feesCents: number
  totalCents: number
  currency: string
  paymentMode: 'one_time' | 'monthly' | 'weekly' | 'usage'
  installmentCount: number
  installmentAmountCents: number
  lastInstallmentAmountCents: number
  schedule: Array<{ installmentNumber: number; dueDate: string; amountCents: number }>
  warnings: string[]
}

export interface SubscriptionNextAction {
  code: string
  priority: 'low' | 'medium' | 'high'
  label: string
  detail: string
}

export interface RenewalEvent {
  id: string
  userId: string
  subscriptionId: string
  action: 'accepted' | 'refused' | 'suspended' | 'requested' | 'cancelled'
  reason?: string | null
  effectiveAt: string
  metadata?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface RenewalSummary {
  subscription: Pick<SubscriptionEntity, 'id' | 'userId' | 'offerId' | 'status' | 'createdAt' | 'updatedAt'>
  offer: Pick<OfferSummary, 'id' | 'code' | 'name'> | null
  renewal: {
    annual: boolean
    canRenew: boolean
    canCancelRequest: boolean
    requestStatus: 'none' | 'requested' | 'cancelled'
    activeRequestId: string | null
    nextRenewalDate: string
    renewalWindowStartsAt: string
    periodDays: number
    recommendedAction: 'regularize_payment' | 'request_or_cancel'
    reasons: string[]
    warnings: string[]
  }
  payments: Array<Pick<PaymentSummary, 'id' | 'type' | 'status' | 'amountCents' | 'currency' | 'createdAt' | 'updatedAt'>>
  events: RenewalEvent[]
}

export interface TerminationRequest {
  id: string
  userId: string
  subscriptionId: string
  status: 'requested' | 'cancelled' | 'processed' | 'rejected'
  reason?: string | null
  effectiveAt: string
  processedAt?: string | null
  metadata?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface TerminationSummary {
  subscriptionId: string
  offer: { code: string; name: string } | null
  termination: {
    canRequest: boolean
    canCancelRequest: boolean
    requestStatus: TerminationRequest['status'] | 'none'
    effectiveAt: string | null
    currentMonthDue: boolean
    refundReviewRequired: boolean
    requiresManualReview: boolean
    message: string
  }
  request: TerminationRequest | null
}

export interface OffersResponse {
  offers: OfferSummary[]
}

export interface SubscriptionsResponse {
  subscriptions: SubscriptionSummary[]
}

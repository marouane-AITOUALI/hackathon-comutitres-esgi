export type UserRole = 'user' | 'admin'
export type ProfileStatus = 'junior' | 'school' | 'student' | 'active' | 'senior' | 'solidarity' | 'other'
export type SubscriptionStatus = 'draft' | 'pending_documents' | 'pending_validation' | 'accepted' | 'rejected' | 'cancelled' | 'suspended'
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
}

export type AuthUser = User

export interface AuthResponse {
  user: AuthUser
  token: string
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
}

export type OnboardingDraft = Partial<OnboardingAnswer>

export interface OfferRecommendation {
  offerId: string | null
  offerCode: string
  offerName: string
  confidencePercent: number
  reasons: string[]
  requiredDocuments: string[]
  warnings: string[]
}

export interface RecommendationResponse {
  success: boolean
  recommendation: OfferRecommendation
}

export interface OnboardingResponse {
  session: { id: string }
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
  createdAt: string
  updatedAt: string
}

export interface SubscriptionSummary {
  subscription: SubscriptionEntity
  offer: OfferSummary | null
  bearerProfile: ProfileSummary | null
  payerProfile: ProfileSummary | null
  onboardingSession: OnboardingSessionSummary | null
}

export interface OffersResponse {
  offers: OfferSummary[]
}

export interface SubscriptionsResponse {
  subscriptions: SubscriptionSummary[]
}

export type UserRole = 'user' | 'admin'
export type ProfileStatus = 'junior' | 'school' | 'student' | 'active' | 'senior' | 'solidarity' | 'other'
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
  offerCode: string
  offerName: string
  confidence: number
  reasons: string[]
  requiredDocuments: string[]
  warnings: string[]
}

export interface OnboardingResponse {
  session: { id: string }
}

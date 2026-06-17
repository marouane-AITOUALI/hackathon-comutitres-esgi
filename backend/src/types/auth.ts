export type UserRole = 'user' | 'admin'
export type ContactPreference = 'email' | 'phone' | 'sms'
export type AccessibilityPreference = 'none' | 'screen_reader' | 'large_text' | 'reduced_motion' | 'plain_language' | 'human_support'
export interface AuthTokenPayload { sub: string; email: string; role: UserRole }
export interface PublicUser {
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
  marketingOptInAt: Date | null
  rgpdConsent: boolean
  rgpdConsentedAt: Date | null
  profileUpdatedAt: Date | null
  updatedAt: Date
}
export type SubscriptionStatus = 'draft' | 'pending_documents' | 'pending_payment' | 'pending_validation' | 'accepted' | 'rejected' | 'cancelled' | 'suspended'
export interface SubscriptionSummary { id: string; status: SubscriptionStatus; offerId: string | null; onboardingSessionId: string | null }
export interface AuthSession { user: PublicUser; token: string; subscription: SubscriptionSummary | null }

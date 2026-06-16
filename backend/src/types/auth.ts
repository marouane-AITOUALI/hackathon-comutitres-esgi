export type UserRole = 'user' | 'admin'
export interface AuthTokenPayload { sub: string; email: string; role: UserRole }
export interface PublicUser { id: string; firstName: string; lastName: string; email: string; role: UserRole }
export type SubscriptionStatus = 'draft' | 'pending_documents' | 'pending_validation' | 'accepted' | 'rejected'
export interface SubscriptionSummary { id: string; status: SubscriptionStatus; offerId: string | null; onboardingSessionId: string | null }
export interface AuthSession { user: PublicUser; token: string; subscription: SubscriptionSummary | null }

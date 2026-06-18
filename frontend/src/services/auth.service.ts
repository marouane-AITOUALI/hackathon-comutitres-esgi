import type { AccessibilityPreference, AuthResponse, AuthUser, ContactPreference, OfferRecommendation, OnboardingAnswer } from '../types'
import { apiRequest } from './api'

export interface RegisterPayload {
  firstName: string
  lastName: string
  email: string
  password: string
  rgpdConsent: boolean
}

export const register = (payload: RegisterPayload) =>
  apiRequest<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(payload) })

export const registerWithOnboarding = (payload: RegisterPayload & { onboarding: OnboardingAnswer; recommendedOffer: OfferRecommendation }) =>
  apiRequest<AuthResponse>('/auth/register-with-onboarding', {
    method: 'POST',
    body: JSON.stringify({
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      password: payload.password,
      rgpdConsent: payload.rgpdConsent,
      onboarding: {
        subscriptionFor: payload.onboarding.subscriptionFor,
        isBearerPayer: payload.onboarding.isBearerPayer,
        currentStep: 'result',
        address: payload.onboarding.address,
        bearer: payload.onboarding.bearer,
        payer: payload.onboarding.isBearerPayer ? undefined : payload.onboarding.payer,
        answers: {
          frequency: payload.onboarding.frequency,
          planPreference: payload.onboarding.planPreference,
          socialSituation: payload.onboarding.socialSituation,
          support: payload.onboarding.support,
          scholarship: payload.onboarding.scholarship,
          solidarity: payload.onboarding.solidarity,
          department: payload.onboarding.department,
        },
      },
      recommendedOffer: {
        offerId: payload.recommendedOffer.offerId ?? undefined,
        offerCode: payload.recommendedOffer.offerCode,
      },
    }),
  })

export const login = (payload: { email: string; password: string }) =>
  apiRequest<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(payload) })

export const getMe = () => apiRequest<{ user: AuthUser }>('/auth/me')

export interface UpdateMePayload {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string | null
  addressLine1?: string | null
  addressLine2?: string | null
  postalCode?: string | null
  city?: string | null
  country?: string
  preferredContact?: ContactPreference
  accessibilityPreference?: AccessibilityPreference
  marketingOptIn?: boolean
}

export const updateMe = (payload: UpdateMePayload) =>
  apiRequest<{ user: AuthUser }>('/auth/me', { method: 'PATCH', body: JSON.stringify(payload) })

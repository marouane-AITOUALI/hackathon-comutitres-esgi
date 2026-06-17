import type { AccessibilityPreference, AuthResponse, AuthUser, ContactPreference } from '../types'
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

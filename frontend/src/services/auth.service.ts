import type { AuthResponse, AuthUser } from '../types'
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

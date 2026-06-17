import { apiRequest, clearAdminToken } from './api'
import type { AuthResponse, MeResponse } from '../types/auth'

export interface LoginPayload {
  email: string
  password: string
}

export async function login(payload: LoginPayload) {
  const response = await apiRequest<AuthResponse>('/auth/login', {
    auth: false,
    method: 'POST',
    body: JSON.stringify(payload),
  })
  clearAdminToken()
  return response
}

export function me() {
  return apiRequest<MeResponse>('/auth/me', { redirectOnUnauthorized: false })
}

export function logout() {
  clearAdminToken()
  return apiRequest<void>('/auth/logout', {
    auth: false,
    method: 'POST',
    redirectOnUnauthorized: false,
  })
}

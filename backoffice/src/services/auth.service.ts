import { apiRequest, setAdminToken } from './api'
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
  setAdminToken(response.token)
  return response
}

export function me() {
  return apiRequest<MeResponse>('/auth/me')
}

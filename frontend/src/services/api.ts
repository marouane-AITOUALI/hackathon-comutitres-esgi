import type { ApiError } from '../types'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'
export const AUTH_TOKEN_KEY = 'comutitres_auth_token'

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem(AUTH_TOKEN_KEY)
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  const body = await response.json().catch(() => ({ message: 'Le serveur a retourne une reponse invalide.' }))
  if (!response.ok) {
    const error = body as ApiError
    throw new Error(error.message ?? 'Une erreur est survenue.')
  }
  return body as T
}

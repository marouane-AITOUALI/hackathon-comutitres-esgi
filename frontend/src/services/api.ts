import type { ApiError } from '../types'

export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'
export const AUTH_TOKEN_KEY = 'comutitres_auth_token'

export function getWebSocketUrl() {
  const url = new URL(API_URL, window.location.origin)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  url.pathname = '/ws'
  url.search = ''
  url.hash = ''
  return url.toString()
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem(AUTH_TOKEN_KEY)
  const headers = new Headers(options.headers)
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  })

  const body = await response.json().catch(() => ({ message: 'Le serveur a retourne une reponse invalide.' }))
  if (!response.ok) {
    const error = body as ApiError
    throw new Error(error.message ?? 'Une erreur est survenue.')
  }
  return body as T
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'

export const ADMIN_TOKEN_KEY = 'comutitres_admin_token'

export function getAdminToken() {
  return localStorage.getItem(ADMIN_TOKEN_KEY)
}

export function setAdminToken(token: string) {
  localStorage.setItem(ADMIN_TOKEN_KEY, token)
}

export function clearAdminToken() {
  localStorage.removeItem(ADMIN_TOKEN_KEY)
}

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: unknown,
  ) {
    super(message)
  }
}

interface ApiRequestOptions extends RequestInit {
  auth?: boolean
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const token = getAdminToken()
  const headers = new Headers(options.headers)

  if (!headers.has('Content-Type') && options.body) headers.set('Content-Type', 'application/json')
  if (options.auth !== false && token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(`${API_URL}${path}`, { ...options, headers })
  const body = await response.json().catch(() => null)

  if (!response.ok) {
    if (response.status === 401) {
      clearAdminToken()
      if (window.location.pathname !== '/login') window.location.assign('/login')
    }
    throw new ApiRequestError(body?.message ?? 'Une erreur API est survenue.', response.status, body?.details)
  }

  return body as T
}

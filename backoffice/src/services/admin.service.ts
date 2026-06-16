export type SubscriptionStatus = 'draft' | 'pending_documents' | 'pending_payment' | 'pending_validation' | 'accepted' | 'rejected' | 'cancelled' | 'suspended'
export type DocumentStatus = 'pending' | 'analyzing' | 'validated' | 'rejected' | 'needs_manual_review'

export interface AdminStats {
  users: { total: number; admins: number }
  subscriptions: Record<SubscriptionStatus | 'total', number>
  documents: Record<DocumentStatus | 'total', number>
  offers: { total: number; active: number }
  supportAlerts: number
}

export interface AdminProfile {
  id: string
  firstName: string
  lastName: string
  type: 'bearer' | 'payer'
}

export interface AdminOffer {
  id: string
  code: string
  name: string
  target: string
}

export interface AdminSubscriptionItem {
  subscription: {
    id: string
    status: SubscriptionStatus
    createdAt: string
    updatedAt: string
  }
  user: { firstName: string; lastName: string; email: string } | null
  offer: AdminOffer | null
  bearerProfile: AdminProfile | null
  payerProfile: AdminProfile | null
  onboardingSession: {
    subscriptionFor: 'self' | 'child' | 'other' | 'organization_beneficiary'
    isBearerPayer: boolean
  } | null
  documents: Array<{ id: string; status: DocumentStatus; type: string }>
}

export const ADMIN_TOKEN_KEYS = ['comutitres_admin_token', 'comutitres_auth_token'] as const

export function getAdminToken() {
  for (const key of ADMIN_TOKEN_KEYS) {
    const token = localStorage.getItem(key)
    if (token) return token
  }
  return null
}

export async function adminRequest<T>(apiUrl: string, path: string): Promise<T> {
  const token = getAdminToken()
  if (!token) throw new Error('Token admin manquant. Connecte-toi avec un compte admin ou ajoute un JWT admin dans localStorage.')

  const response = await fetch(`${apiUrl}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const body = await response.json().catch(() => ({ message: 'Reponse API invalide.' }))
  if (!response.ok) throw new Error(body.message ?? 'Erreur API backoffice.')
  return body as T
}

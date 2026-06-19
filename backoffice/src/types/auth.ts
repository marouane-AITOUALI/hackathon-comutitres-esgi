export type UserRole = 'user' | 'admin'

export interface AdminUser {
  id: string
  firstName: string
  lastName: string
  email: string
  role: UserRole
  archivedAt?: string | null
  avatarUrl?: string | null
}

export interface AuthResponse {
  user: AdminUser
  token: string
}

export interface MeResponse {
  user: AdminUser
}

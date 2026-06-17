import { createContext } from 'react'
import type { AdminUser } from '../types/auth'

export interface AuthContextValue {
  user: AdminUser | null
  loading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  refresh: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

import { useEffect, useMemo, useState, type PropsWithChildren } from 'react'
import { getMe } from '../services/auth.service'
import { AUTH_TOKEN_KEY } from '../services/api'
import type { AuthUser } from '../types'
import { AuthContext } from './auth-context'

const USER_KEY = 'comutitres_auth_user'

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY) ?? 'null') as AuthUser | null
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(Boolean(localStorage.getItem(AUTH_TOKEN_KEY)))

  useEffect(() => {
    if (!localStorage.getItem(AUTH_TOKEN_KEY)) return
    getMe()
      .then(({ user: currentUser }) => {
        setUser(currentUser)
        localStorage.setItem(USER_KEY, JSON.stringify(currentUser))
      })
      .catch(() => {
        localStorage.removeItem(AUTH_TOKEN_KEY)
        localStorage.removeItem(USER_KEY)
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const value = useMemo(() => ({
    user,
    loading,
    setSession: (token: string, currentUser: AuthUser) => {
      localStorage.setItem(AUTH_TOKEN_KEY, token)
      localStorage.setItem(USER_KEY, JSON.stringify(currentUser))
      setUser(currentUser)
    },
    logout: () => {
      localStorage.removeItem(AUTH_TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      setUser(null)
    },
  }), [loading, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

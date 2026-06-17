import { useCallback, useEffect, useMemo, useState, type PropsWithChildren } from 'react'
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

  const refreshUser = useCallback(async () => {
    if (!localStorage.getItem(AUTH_TOKEN_KEY)) return null
    const { user: currentUser } = await getMe()
    setUser(currentUser)
    localStorage.setItem(USER_KEY, JSON.stringify(currentUser))
    return currentUser
  }, [])

  useEffect(() => {
    if (!localStorage.getItem(AUTH_TOKEN_KEY)) return
    refreshUser()
      .catch(() => {
        localStorage.removeItem(AUTH_TOKEN_KEY)
        localStorage.removeItem(USER_KEY)
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [refreshUser])

  const value = useMemo(() => ({
    user,
    loading,
    setSession: (token: string, currentUser: AuthUser) => {
      localStorage.setItem(AUTH_TOKEN_KEY, token)
      localStorage.setItem(USER_KEY, JSON.stringify(currentUser))
      setUser(currentUser)
    },
    refreshUser,
    logout: () => {
      localStorage.removeItem(AUTH_TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      setUser(null)
    },
  }), [loading, refreshUser, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

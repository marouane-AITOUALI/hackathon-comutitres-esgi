import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { AuthContext } from './auth-context'
import { ApiRequestError, clearAdminToken } from '../services/api'
import { login as loginRequest, logout as logoutRequest, me } from '../services/auth.service'
import type { AdminUser } from '../types/auth'

function isAnonymousSession(caught: unknown) {
  return caught instanceof ApiRequestError && caught.status === 401
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const assertAdmin = useCallback((candidate: AdminUser) => {
    if (candidate.role !== 'admin') {
      clearAdminToken()
      throw new Error('Acces refuse')
    }
    return candidate
  }, [])

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await me()
      setUser(assertAdmin(response.user))
    } catch (caught) {
      setUser(null)
      setError(isAnonymousSession(caught) ? null : caught instanceof Error ? caught.message : 'Session backoffice invalide.')
    } finally {
      setLoading(false)
    }
  }, [assertAdmin])

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await loginRequest({ email, password })
      setUser(assertAdmin(response.user))
    } catch (caught) {
      setUser(null)
      setError(caught instanceof Error ? caught.message : 'Connexion impossible.')
      throw caught
    } finally {
      setLoading(false)
    }
  }, [assertAdmin])

  const logout = useCallback(() => {
    clearAdminToken()
    void logoutRequest()
    setUser(null)
  }, [])

  useEffect(() => {
    let mounted = true

    async function loadSession() {
      try {
        const response = await me()
        if (!mounted) return
        setUser(assertAdmin(response.user))
      } catch (caught) {
        if (!mounted) return
        setUser(null)
        setError(isAnonymousSession(caught) ? null : caught instanceof Error ? caught.message : 'Session backoffice invalide.')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    void loadSession()
    return () => { mounted = false }
  }, [assertAdmin])

  const value = useMemo(() => ({ user, loading, error, login, logout, refresh }), [user, loading, error, login, logout, refresh])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

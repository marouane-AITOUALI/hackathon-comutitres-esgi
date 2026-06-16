import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { AuthContext } from './auth-context'
import { clearAdminToken, getAdminToken } from '../services/api'
import { login as loginRequest, me } from '../services/auth.service'
import type { AdminUser } from '../types/auth'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(() => Boolean(getAdminToken()))
  const [error, setError] = useState<string | null>(null)

  const assertAdmin = useCallback((candidate: AdminUser) => {
    if (candidate.role !== 'admin') {
      clearAdminToken()
      throw new Error('Acces refuse : ce compte ne dispose pas du role admin.')
    }
    return candidate
  }, [])

  const refresh = useCallback(async () => {
    if (!getAdminToken()) {
      setUser(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const response = await me()
      setUser(assertAdmin(response.user))
    } catch (caught) {
      setUser(null)
      setError(caught instanceof Error ? caught.message : 'Session backoffice invalide.')
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
    setUser(null)
  }, [])

  useEffect(() => {
    if (!getAdminToken()) return
    let mounted = true

    async function loadSession() {
      try {
        const response = await me()
        if (!mounted) return
        setUser(assertAdmin(response.user))
      } catch (caught) {
        if (!mounted) return
        setUser(null)
        setError(caught instanceof Error ? caught.message : 'Session backoffice invalide.')
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

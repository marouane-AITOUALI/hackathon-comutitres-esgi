import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { LoadingState } from '../common/LoadingState'
import { useAuth } from '../../hooks/useAuth'

export function ProtectedRoute() {
  const { loading, user } = useAuth()
  const location = useLocation()

  if (loading) return <LoadingState label="Verification de la session backoffice..." />
  if (!user) return <Navigate replace state={{ from: location.pathname }} to="/login" />

  return <Outlet />
}

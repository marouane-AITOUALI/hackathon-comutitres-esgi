import { CircularProgress, Stack } from '@mui/material'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function ProtectedRoute() {
  const { loading, user } = useAuth()
  const location = useLocation()
  if (loading) return <Stack sx={{ alignItems: 'center', py: 8 }}><CircularProgress aria-label="Chargement de la session" /></Stack>
  return user ? <Outlet /> : <Navigate replace state={{ from: location.pathname }} to="/auth/login" />
}

import { Box } from '@mui/material'
import { useMemo, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { FloatingSupportChat } from './FloatingSupportChat'
import { useAuth } from '../hooks/useAuth'
import { Header } from '../pages/Header'
import { Sidebar } from '../pages/Sidebar'

const routeByKey: Record<string, string> = {
  dashboard: '/dashboard',
  abonnements: '/subscriptions',
  offres: '/offers',
  paiements: '/paiements',
  documents: '/documents',
  profil: '/profil',
  support: '/support',
}

function getActiveKey(pathname: string) {
  if (pathname.startsWith('/subscriptions')) return 'abonnements'
  if (pathname.startsWith('/offers')) return 'offres'
  if (pathname.startsWith('/paiements')) return 'paiements'
  if (pathname.startsWith('/documents')) return 'documents'
  if (pathname.startsWith('/profil')) return 'profil'
  if (pathname.startsWith('/support')) return 'support'
  return 'dashboard'
}

export function ClientLayout() {
  const { logout, user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const activeKey = useMemo(() => getActiveKey(location.pathname), [location.pathname])

  const handleLogout = () => {
    logout()
    navigate('/auth/login', { replace: true })
  }

  return (
    <Box sx={{ display: 'flex', height: '100vh', minHeight: 0, overflow: 'hidden', bgcolor: 'background.default', pr: { xs: 0, md: 2 } }}>
      <Sidebar
        activeKey={activeKey}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        onNavigate={(key) => {
          navigate(routeByKey[key] ?? '/dashboard')
          setMobileOpen(false)
        }}
      />

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0, height: '100vh', overflow: 'hidden' }}>
        <Header
          avatarUrl={user?.avatarUrl}
          greeting={`Bonjour ${user?.firstName ?? 'Alice'}`}
          userName={user ? `${user.firstName} ${user.lastName}` : 'Alice Dupont'}
          onMenuToggle={() => setMobileOpen(true)}
          onLogout={handleLogout}
          onProfileClick={() => navigate('/profil')}
          onNotificationClick={(subscriptionId) => navigate(subscriptionId ? `/subscriptions/${subscriptionId}` : '/subscriptions')}
        />

        <Box component="main" sx={{ flex: 1, minHeight: 0, p: { xs: 2, md: 4 }, overflowX: 'hidden', overflowY: 'auto' }}>
          <Outlet />
        </Box>
        {activeKey !== 'support' ? <FloatingSupportChat /> : null}
      </Box>
    </Box>
  )
}

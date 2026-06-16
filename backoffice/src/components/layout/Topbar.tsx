import { Box, Button, IconButton, Stack, Typography } from '@mui/material'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/subscriptions': 'Souscriptions',
  '/documents': 'Documents',
  '/support-alerts': 'Alertes support',
  '/users': 'Utilisateurs',
  '/offers': 'Offres',
  '/audit-logs': 'Audit logs',
}

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const title = pageTitles[location.pathname] ?? (location.pathname.startsWith('/subscriptions/') ? 'Detail dossier' : 'Backoffice')

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <Box component="header" sx={{ alignItems: 'center', display: 'flex', gap: 2, justifyContent: 'space-between', mb: 3 }}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
        <IconButton onClick={onMenuClick} sx={{ display: { xs: 'inline-flex', md: 'none' } }} aria-label="Ouvrir le menu">
          <span aria-hidden>Menu</span>
        </IconButton>
        <div>
          <Typography component="h1" variant="h4" sx={{ fontWeight: 900 }}>{title}</Typography>
          <Typography color="text.secondary">Pilotage Comutitres des parcours et dossiers.</Typography>
        </div>
      </Stack>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', display: { xs: 'none', sm: 'flex' } }}>
        <Typography color="text.secondary" variant="body2">
          {user ? `${user.firstName} ${user.lastName}` : 'Admin'}
        </Typography>
        <Button onClick={handleLogout} variant="outlined">Deconnexion</Button>
      </Stack>
    </Box>
  )
}

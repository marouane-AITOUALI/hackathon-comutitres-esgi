import { AppBar, Button, Container, Stack, Toolbar, Typography } from '@mui/material'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function AppLayout() {
  const { logout, user } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const isHome = pathname === '/'

  if (isHome) {
    return <Outlet />
  }

  return (
    <>
      <AppBar color="inherit" position="static" sx={{ borderBottom: 1, borderColor: 'divider', boxShadow: 'none' }}>
        <Toolbar sx={{ gap: 2 }}>
          <Typography color="primary.dark" component={Link} sx={{ flexGrow: 1, fontWeight: 800, textDecoration: 'none' }} to="/" variant="h6">
            Comutitres
          </Typography>
          <Stack direction="row" spacing={1}>
            {user ? (
              <>
                <Button component={Link} to="/onboarding">Mon parcours</Button>
                <Button onClick={() => { logout(); navigate('/') }} variant="outlined">Se deconnecter</Button>
              </>
            ) : (
              <Button component={Link} to="/auth/login" variant="outlined">Se connecter</Button>
            )}
          </Stack>
        </Toolbar>
      </AppBar>
      <Container component="main" maxWidth="lg" sx={{ py: { xs: 3, sm: 5 } }}>
        <Outlet />
      </Container>
    </>
  )
}

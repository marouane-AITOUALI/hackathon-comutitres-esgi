import { Box, Container } from '@mui/material'
import { Outlet, useLocation } from 'react-router-dom'
import { Footer } from './Footer'
import { Header } from './Header'

export function AppLayout() {
  const { pathname } = useLocation()
  const isHome = pathname === '/'

  if (isHome) {
    return <Outlet />
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Box sx={{ bgcolor: '#0d1b2a', pb: 1 }}>
        <Header />
      </Box>
      <Container component="main" maxWidth="lg" sx={{ py: { xs: 4, sm: 6 } }}>
        <Outlet />
      </Container>
      <Footer />
    </Box>
  )
}

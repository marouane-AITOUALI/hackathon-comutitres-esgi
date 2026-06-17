import { Box, Container } from '@mui/material'
import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <Box sx={{ bgcolor: 'background.default', display: 'flex', minHeight: '100vh' }}>
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Container component="main" maxWidth="xl" sx={{ py: { xs: 2, md: 4 } }}>
          <Topbar onMenuClick={() => setMobileOpen(true)} />
          <Outlet />
        </Container>
      </Box>
    </Box>
  )
}

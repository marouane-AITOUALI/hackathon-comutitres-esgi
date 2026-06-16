import { Box, useMediaQuery, useTheme } from '@mui/material'
import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { colors } from '../theme/colors'

export function HomePage() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: colors.appBackground }}>
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Header greeting="Bonjour Alice" onMenuToggle={isMobile ? () => setMobileOpen(true) : undefined} />

        <Box component="main" sx={{ flex: 1, overflow: 'auto' }} />
      </Box>
    </Box>
  )
}

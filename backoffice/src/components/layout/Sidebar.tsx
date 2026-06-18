import { Box, Button, Divider, Drawer, Stack, Typography } from '@mui/material'
import { NavLink } from 'react-router-dom'
import { colors } from '../../theme/colors'

const navItems = [
  { label: 'Dashboard', to: '/dashboard', marker: 'D' },
  { label: 'Souscriptions', to: '/subscriptions', marker: 'S' },
  { label: 'Documents', to: '/documents', marker: 'J' },
  { label: 'Alertes support', to: '/support-alerts', marker: 'A' },
  { label: 'Utilisateurs', to: '/users', marker: 'U' },
  { label: 'Offres', to: '/offers', marker: 'O' },
  { label: 'Communications', to: '/communications', marker: 'C' },
  { label: 'Audit logs', to: '/audit-logs', marker: 'L' },
]

const width = 280

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Stack sx={{ bgcolor: colors.sidebarBackground, height: '100%', p: 2.5 }}>
      <Box sx={{ px: 1, py: 1 }}>
        <Typography sx={{ color: colors.blueFocus, fontWeight: 900, letterSpacing: -0.4 }} variant="h5">
          comutitres
        </Typography>
        <Typography color="text.secondary" variant="body2">Backoffice</Typography>
      </Box>
      <Divider sx={{ my: 2 }} />
      <Stack component="nav" spacing={0.75}>
        {navItems.map((item) => (
          <Button
            key={item.to}
            component={NavLink}
            to={item.to}
            onClick={onNavigate}
            sx={{
              borderRadius: 3,
              color: colors.greyDark,
              justifyContent: 'flex-start',
              px: 1.5,
              py: 1.25,
              '&.active': {
                bgcolor: colors.blueMedium,
                color: colors.blueFocus,
              },
            }}
          >
            <Box sx={{ bgcolor: 'currentColor', borderRadius: 2, height: 28, mr: 1.5, opacity: 0.15, width: 28 }} />
            <Typography sx={{ fontWeight: 800, textTransform: 'none' }}>{item.label}</Typography>
          </Button>
        ))}
      </Stack>
      <Box sx={{ flexGrow: 1 }} />
      <Box sx={{ bgcolor: colors.white, borderRadius: 4, p: 2 }}>
        <Typography sx={{ fontWeight: 800 }}>Prototype hackathon</Typography>
        <Typography color="text.secondary" variant="body2">
          Pilotage des dossiers, documents et alertes avant validation.
        </Typography>
      </Box>
    </Stack>
  )
}

export function Sidebar({ mobileOpen, onMobileClose }: { mobileOpen: boolean; onMobileClose: () => void }) {
  return (
    <>
      <Box component="aside" sx={{ display: { xs: 'none', md: 'block' }, flexShrink: 0, width }}>
        <Box sx={{ height: '100vh', position: 'sticky', top: 0 }}>
          <SidebarContent />
        </Box>
      </Box>
      <Drawer
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width } }}
      >
        <SidebarContent onNavigate={onMobileClose} />
      </Drawer>
    </>
  )
}

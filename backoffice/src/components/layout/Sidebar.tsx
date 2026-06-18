import { Box, Button, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Typography, useMediaQuery, useTheme } from '@mui/material'
import { BellRing, ClipboardList, FileText, FolderOpen, LayoutDashboard, MessageSquare, Package, Users } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import logoUrl from '../../assets/comutitres_v_blanc.svg'
import { colors } from '../../theme/colors'

const width = 303
const desktopMargin = 25

const navItems = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Souscriptions', to: '/subscriptions', icon: ClipboardList },
  { label: 'Documents', to: '/documents', icon: FolderOpen },
  { label: 'Alertes support', to: '/support-alerts', icon: BellRing },
  { label: 'Utilisateurs', to: '/users', icon: Users },
  { label: 'Offres', to: '/offers', icon: Package },
  { label: 'Communications', to: '/communications', icon: MessageSquare },
  { label: 'Audit logs', to: '/audit-logs', icon: FileText },
] as const

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation()

  return (
    <Box
      sx={{
        bgcolor: colors.sidebarBackground,
        borderRadius: { xs: 0, md: '16px' },
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflowY: 'auto',
        px: { xs: 2, md: '21px' },
        py: { xs: 3, md: 3.5 },
        width,
      }}
    >
      <Box sx={{ mb: { xs: 2, md: 2.5 }, pl: { xs: 1, md: 6.75 } }}>
        <Box component="img" src={logoUrl} alt="Comutitres" sx={{ display: 'block', height: 'auto', width: 126 }} />
        <Typography color="text.secondary" sx={{ fontSize: 13, fontWeight: 700, mt: 1 }}>
          Backoffice
        </Typography>
      </Box>

      <List component="nav" disablePadding sx={{ flex: 1 }}>
        {navItems.map((item) => {
          const Icon = item.icon
          const active = item.to === '/subscriptions'
            ? location.pathname.startsWith('/subscriptions')
            : location.pathname === item.to

          return (
            <ListItemButton
              key={item.to}
              component={NavLink}
              onClick={onNavigate}
              to={item.to}
              sx={{
                bgcolor: active ? colors.white : 'transparent',
                borderRadius: '16px',
                color: active ? colors.blueIleDeFrance : colors.greyDark,
                mb: 1,
                minHeight: 43,
                px: 3.5,
                py: 1.25,
                transition: 'background 0.15s ease, color 0.15s ease, transform 0.15s ease',
                '&:hover': {
                  bgcolor: colors.white,
                  color: active ? colors.blueIleDeFrance : colors.blueInteraction,
                  transform: 'translateX(3px)',
                },
                '&.active': {
                  bgcolor: colors.white,
                  color: colors.blueIleDeFrance,
                },
              }}
            >
              <ListItemIcon sx={{ color: 'inherit', minWidth: 32 }}>
                <Icon aria-hidden size={18} strokeWidth={2.2} />
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                sx={{
                  '& .MuiListItemText-primary': {
                    fontSize: 15,
                    fontWeight: active ? 800 : 600,
                  },
                }}
              />
            </ListItemButton>
          )
        })}
      </List>

      <Box
        sx={{
          bgcolor: colors.white,
          borderRadius: '16px',
          flexShrink: 0,
          mt: 'auto',
          p: 2.5,
          textAlign: 'left',
        }}
      >
        <Typography sx={{ color: colors.anthracite, fontSize: 16, fontWeight: 800, lineHeight: 1.25, mb: 0.5 }}>
          Espace admin
        </Typography>
        <Typography sx={{ color: colors.greyDark, fontSize: 14, lineHeight: 1.35, mb: 2 }}>
          Suivi rapide des dossiers et alertes.
        </Typography>
        <Button
          component={NavLink}
          fullWidth
          to="/support-alerts"
          variant="contained"
          sx={{
            bgcolor: colors.blueIleDeFrance,
            borderRadius: '14px',
            boxShadow: 'none',
            color: colors.white,
            fontSize: 13,
            fontWeight: 700,
            minHeight: 42,
            '&:hover': { bgcolor: colors.blueInteraction, boxShadow: 'none' },
          }}
        >
          Voir les alertes
        </Button>
      </Box>
    </Box>
  )
}

export function Sidebar({ mobileOpen, onMobileClose }: { mobileOpen: boolean; onMobileClose: () => void }) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  if (isMobile) {
    return (
      <Drawer
        anchor="left"
        ModalProps={{ keepMounted: true }}
        onClose={onMobileClose}
        open={mobileOpen}
        sx={{ '& .MuiDrawer-paper': { bgcolor: colors.sidebarBackground, boxSizing: 'border-box', width } }}
      >
        <SidebarContent onNavigate={onMobileClose} />
      </Drawer>
    )
  }

  return (
    <Box
      component="aside"
      sx={{
        flexShrink: 0,
        height: `calc(100vh - ${desktopMargin * 2}px)`,
        ml: `${desktopMargin}px`,
        my: `${desktopMargin}px`,
        overflow: 'auto',
        position: 'sticky',
        top: `${desktopMargin}px`,
        width,
      }}
    >
      <SidebarContent />
    </Box>
  )
}

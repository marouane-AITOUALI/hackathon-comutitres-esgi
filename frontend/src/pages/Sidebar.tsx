import { Box, Button, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Typography, useMediaQuery, useTheme } from '@mui/material'
import { LayoutDashboard, BookOpen, CreditCard, FolderOpen, User, HelpCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAccessibility } from '../accessibility/useAccessibility'
import logoUrl from '../assets/comutitres_v_blanc.svg'
import { colors } from '../theme/colors'

const SIDEBAR_WIDTH = 303
const SIDEBAR_DESKTOP_MARGIN = 25

const routeByKey: Record<string, string> = {
  dashboard: '/dashboard',
  abonnements: '/subscriptions',
  paiements: '/paiements',
  documents: '/documents',
  profil: '/profil',
  support: '/support',
}

interface SidebarProps {
  activeKey?: string
  onNavigate?: (key: string) => void
  mobileOpen?: boolean
  onMobileClose?: () => void
}

function SidebarContent({ activeKey = 'dashboard', onNavigate }: Pick<SidebarProps, 'activeKey' | 'onNavigate'>) {
  const { language } = useAccessibility()
  const navigate = useNavigate()
  const navItems = [
    { label: language === 'fr' ? 'Tableau de bord' : 'Dashboard', icon: <LayoutDashboard size={18} />, key: 'dashboard' },
    { label: language === 'fr' ? 'Abonnements' : 'Subscriptions', icon: <BookOpen size={18} />, key: 'abonnements' },
    { label: language === 'fr' ? 'Paiements' : 'Payments', icon: <CreditCard size={18} />, key: 'paiements' },
    { label: 'Documents', icon: <FolderOpen size={18} />, key: 'documents' },
    { label: language === 'fr' ? 'Profil' : 'Profile', icon: <User size={18} />, key: 'profil' },
    { label: 'Support', icon: <HelpCircle size={18} />, key: 'support' },
  ]

  const handleDownload = () => {
    window.open('/mobile-app', '_blank', 'noopener,noreferrer')
  }

  return (
    <Box
      sx={{
        width: SIDEBAR_WIDTH,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        bgcolor: colors.sidebarBackground,
        borderRight: 'none',
        borderRadius: { xs: 0, md: '16px' },
        py: { xs: 3, md: 3.5 },
        px: { xs: 2, md: '21px' },
      }}
    >
      <Box sx={{ pl: { xs: 1, md: 54 / 8 }, mb: { xs: 2, md: 2.5 } }}>
        <Box
          component="img"
          src={logoUrl}
          alt="Comutitres"
          sx={{ display: 'block', width: 126, height: 'auto' }}
        />
      </Box>

      <List disablePadding sx={{ flex: 1, mt: 0 }}>
        {navItems.map((item) => {
          const active = item.key === activeKey
          return (
            <ListItemButton
              key={item.key}
              onClick={() => {
                onNavigate?.(item.key)
                if (!onNavigate) navigate(routeByKey[item.key] ?? '/dashboard')
              }}
              sx={{
                borderRadius: '16px',
                mb: 1,
                px: 3.5,
                py: 1.3,
                minHeight: 39,
                bgcolor: active ? colors.white : 'transparent',
                color: active ? colors.blueIleDeFrance : colors.greyDark,
                '&:hover': {
                  bgcolor: active ? colors.white : colors.white,
                },
                transition: 'background 0.15s',
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 32,
                  color: active ? colors.blueIleDeFrance : colors.greyDark,
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                sx={{
                  '& .MuiListItemText-primary': {
                    fontWeight: active ? 700 : 600,
                    fontSize: 15,
                  },
                }}
              />
            </ListItemButton>
          )
        })}
      </List>

      <Box
        sx={{
          mt: 'auto',
          mb: { xs: 1, md: 0 },
          p: { xs: 2, md: 2.5 },
          borderRadius: '16px',
          bgcolor: colors.white,
          border: 'none',
          textAlign: 'center',
          flexShrink: 0,
        }}
      >
        <Typography variant="body2" sx={{ color: '#111111', fontWeight: 400, mb: 0.5, fontSize: 16, lineHeight: 1.25 }}>
          {language === 'fr' ? 'L’application mobile' : 'Get the app'}
        </Typography>
        <Typography variant="body2" sx={{ color: '#111111', mb: 2, fontSize: 16, lineHeight: 1.25 }}>
          {language === 'fr' ? 'Accès rapide mobile' : 'Quick mobile access'}
        </Typography>
        <Button
          fullWidth
          variant="contained"
          aria-label={language === 'fr' ? "Télécharger l'application" : 'Download the app'}
          onClick={handleDownload}
          sx={{
            bgcolor: colors.blueIleDeFrance,
            color: colors.white,
            borderRadius: '14px',
            minHeight: 44,
            fontWeight: 600,
            fontSize: 13,
            '&:hover': { bgcolor: colors.blueInteraction },
            boxShadow: 'none',
          }}
        >
          {language === 'fr' ? 'Télécharger' : 'Download'}
        </Button>
      </Box>
    </Box>
  )
}

export function Sidebar({ activeKey, onNavigate, mobileOpen = false, onMobileClose }: SidebarProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  if (isMobile) {
    return (
      <Drawer
        anchor="left"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          '& .MuiDrawer-paper': { width: SIDEBAR_WIDTH, boxSizing: 'border-box', bgcolor: colors.sidebarBackground },
        }}
      >
        <SidebarContent activeKey={activeKey} onNavigate={(key) => { onNavigate?.(key); onMobileClose?.() }} />
      </Drawer>
    )
  }

  return (
    <Box
      component="nav"
      sx={{
        width: SIDEBAR_WIDTH,
        flexShrink: 0,
        height: `calc(100vh - ${SIDEBAR_DESKTOP_MARGIN * 2}px)`,
        position: 'sticky',
        top: `${SIDEBAR_DESKTOP_MARGIN}px`,
        ml: `${SIDEBAR_DESKTOP_MARGIN}px`,
        my: `${SIDEBAR_DESKTOP_MARGIN}px`,
        overflow: 'auto',
      }}
    >
      <SidebarContent activeKey={activeKey} onNavigate={onNavigate} />
    </Box>
  )
}

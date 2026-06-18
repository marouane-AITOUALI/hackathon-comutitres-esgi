Dashboardimport {
  AppBar,
  Avatar,
  Box,
  Collapse,
  Divider,
  IconButton,
  MenuItem,
  MenuList,
  Paper,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { colors } from '../../theme/colors'

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/subscriptions': 'Souscriptions',
  '/documents': 'Documents',
  '/support-alerts': 'Alertes support',
  '/users': 'Utilisateurs',
  '/offers': 'Offres',
  '/audit-logs': 'Audit logs',
}

function MenuGlyph() {
  return (
    <Box aria-hidden sx={{ display: 'grid', gap: '4px', width: 18 }}>
      {[0, 1, 2].map((item) => (
        <Box key={item} sx={{ bgcolor: 'currentColor', borderRadius: 99, height: 2 }} />
      ))}
    </Box>
  )
}

function SearchGlyph() {
  return (
    <Box aria-hidden sx={{ height: 18, position: 'relative', width: 18 }}>
      <Box sx={{ border: '2px solid currentColor', borderRadius: '50%', height: 12, left: 1, position: 'absolute', top: 1, width: 12 }} />
      <Box sx={{ bgcolor: 'currentColor', borderRadius: 99, height: 7, left: 12, position: 'absolute', top: 12, transform: 'rotate(-45deg)', transformOrigin: 'top', width: 2 }} />
    </Box>
  )
}

function BellGlyph() {
  return (
    <Box aria-hidden sx={{ height: 18, position: 'relative', width: 18 }}>
      <Box sx={{ border: '2px solid currentColor', borderBottom: 0, borderRadius: '10px 10px 3px 3px', height: 12, left: 4, position: 'absolute', top: 2, width: 10 }} />
      <Box sx={{ bgcolor: 'currentColor', borderRadius: 99, bottom: 1, height: 2, left: 7, position: 'absolute', width: 4 }} />
      <Box sx={{ bgcolor: 'currentColor', borderRadius: 99, bottom: 3, height: 2, left: 3, position: 'absolute', width: 12 }} />
    </Box>
  )
}

function UserGlyph() {
  return (
    <Box aria-hidden sx={{ height: 16, position: 'relative', width: 16 }}>
      <Box sx={{ border: '2px solid currentColor', borderRadius: '50%', height: 6, left: 4, position: 'absolute', top: 1, width: 6 }} />
      <Box sx={{ border: '2px solid currentColor', borderRadius: '8px 8px 0 0', borderBottom: 0, bottom: 1, height: 7, left: 2, position: 'absolute', width: 12 }} />
    </Box>
  )
}

function LogoutGlyph() {
  return (
    <Box aria-hidden sx={{ height: 16, position: 'relative', width: 16 }}>
      <Box sx={{ border: '2px solid currentColor', borderRadius: 0.75, height: 12, left: 1, position: 'absolute', top: 2, width: 8 }} />
      <Box sx={{ bgcolor: 'currentColor', height: 2, position: 'absolute', right: 1, top: 7, width: 9 }} />
      <Box sx={{ borderRight: '2px solid currentColor', borderTop: '2px solid currentColor', height: 6, position: 'absolute', right: 1, top: 5, transform: 'rotate(45deg)', width: 6 }} />
    </Box>
  )
}

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const profileRef = useRef<HTMLDivElement>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [profileOpen, setProfileOpen] = useState(false)

  const title = pageTitles[location.pathname] ?? (location.pathname.startsWith('/subscriptions/') ? 'Detail dossier' : 'Backoffice')
  const userName = user ? `${user.firstName} ${user.lastName}` : 'Administrateur'
  const initials = userName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'A'

  function handleLogout() {
    setProfileOpen(false)
    logout()
    navigate('/login')
  }

  function handleSearchBlur() {
    if (!searchValue) setSearchOpen(false)
  }

  return (
    <AppBar
      component="header"
      elevation={0}
      position="sticky"
      sx={{
        bgcolor: 'background.default',
        color: colors.anthracite,
        mb: 3,
        top: 0,
        zIndex: theme.zIndex.appBar,
      }}
    >
      <Toolbar
        sx={{
          alignItems: { xs: 'center', md: 'flex-start' },
          gap: 1,
          justifyContent: 'space-between',
          minHeight: { xs: 64, md: 104 },
          px: 0,
          pt: { xs: 0, md: 3 },
        }}
      >
        <Box sx={{ alignItems: 'center', display: 'flex', flex: 1, gap: 1, minWidth: 0 }}>
          {isMobile && (
            <IconButton aria-label="Ouvrir le menu" onClick={onMenuClick} size="small" sx={{ color: colors.anthracite }}>
              <MenuGlyph />
            </IconButton>
          )}

          {(!isMobile || !searchOpen) && (
            <Box sx={{ minWidth: 0 }}>
              <Typography
                component="h1"
                sx={{
                  color: colors.anthracite,
                  fontSize: { xs: 18, md: 32 },
                  fontWeight: 800,
                  lineHeight: 1.25,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {title}
              </Typography>
              <Typography color="text.secondary" sx={{ display: { xs: 'none', md: 'block' } }}>
                Pilotage Comutitres des parcours et dossiers.
              </Typography>
            </Box>
          )}
        </Box>

        <Box sx={{ alignItems: 'center', display: 'flex', gap: { xs: 0.75, md: 1 } }}>
          <Box
            aria-label="Rechercher"
            onClick={() => setSearchOpen(true)}
            role="search"
            sx={{
              alignItems: 'center',
              bgcolor: colors.white,
              border: `1.5px solid ${searchOpen ? colors.blueInteraction : colors.greyMedium}`,
              borderRadius: 99,
              color: colors.greyDark,
              cursor: 'pointer',
              display: 'flex',
              height: 40,
              overflow: 'hidden',
              transition: 'width 0.25s ease, border-color 0.2s',
              width: searchOpen ? { xs: 176, md: 260 } : 40,
            }}
          >
            <Box sx={{ alignItems: 'center', display: 'flex', flexShrink: 0, height: 40, justifyContent: 'center', width: 40 }}>
              <SearchGlyph />
            </Box>
            <Collapse in={searchOpen} orientation="horizontal" timeout={200}>
              <Box
                aria-label="Rechercher"
                autoFocus={searchOpen}
                component="input"
                onBlur={handleSearchBlur}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Rechercher..."
                sx={{
                  bgcolor: 'transparent',
                  border: 'none',
                  color: colors.anthracite,
                  fontSize: 14,
                  outline: 'none',
                  pr: 2,
                  width: { xs: 136, md: 216 },
                  '&::placeholder': { color: colors.greyDark },
                }}
                value={searchValue}
              />
            </Collapse>
          </Box>

          <IconButton
            aria-label="Notifications"
            size="small"
            sx={{
              bgcolor: colors.white,
              border: `1.5px solid ${colors.greyMedium}`,
              borderRadius: 99,
              color: colors.greyDark,
              height: 40,
              width: 40,
              '&:hover': { bgcolor: colors.greyLight },
            }}
          >
            <BellGlyph />
          </IconButton>

          <Box ref={profileRef} sx={{ position: 'relative' }}>
            <Box sx={{ alignItems: 'center', display: 'flex', gap: 1 }}>
              <Box
                aria-expanded={profileOpen}
                aria-label="Ouvrir le menu du profil"
                onClick={() => setProfileOpen((current) => !current)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') setProfileOpen((current) => !current)
                  if (event.key === 'Escape') setProfileOpen(false)
                }}
                role="button"
                sx={{
                  alignItems: 'center',
                  bgcolor: colors.white,
                  border: `1.5px solid ${profileOpen ? colors.blueInteraction : colors.greyMedium}`,
                  borderRadius: 99,
                  cursor: 'pointer',
                  display: 'flex',
                  height: 40,
                  justifyContent: 'center',
                  transition: 'border-color 0.2s',
                  width: 40,
                  '&:hover': { borderColor: colors.blueInteraction },
                }}
                tabIndex={0}
              >
                <Avatar sx={{ bgcolor: colors.blueInteraction, fontSize: 13, fontWeight: 800, height: 34, width: 34 }}>
                  {initials}
                </Avatar>
              </Box>

              <Box
                aria-expanded={profileOpen}
                aria-label="Ouvrir le menu du profil"
                onClick={() => setProfileOpen((current) => !current)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') setProfileOpen((current) => !current)
                  if (event.key === 'Escape') setProfileOpen(false)
                }}
                role="button"
                sx={{
                  alignItems: 'center',
                  bgcolor: colors.white,
                  border: `1.5px solid ${profileOpen ? colors.blueInteraction : colors.greyMedium}`,
                  borderRadius: 99,
                  cursor: 'pointer',
                  display: { xs: 'none', sm: 'flex' },
                  gap: 1,
                  height: 40,
                  justifyContent: 'space-between',
                  minWidth: { sm: 150, md: 178 },
                  px: 1.75,
                  transition: 'border-color 0.2s',
                  '&:hover': { borderColor: colors.blueInteraction },
                }}
                tabIndex={0}
              >
                <Typography sx={{ color: colors.anthracite, fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap' }}>
                  {userName}
                </Typography>
                <Typography aria-hidden sx={{ color: colors.greyDark, fontSize: 14, lineHeight: 1 }}>
                  {profileOpen ? 'v' : '>'}
                </Typography>
              </Box>
            </Box>

            {profileOpen && (
              <Paper
                elevation={4}
                sx={{
                  border: `1px solid ${colors.greyMedium}`,
                  borderRadius: 2,
                  minWidth: 190,
                  overflow: 'hidden',
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 8px)',
                  zIndex: 1400,
                }}
              >
                <MenuList dense>
                  <MenuItem disabled sx={{ gap: 1.5, px: 2, py: 1.2 }}>
                    <UserGlyph />
                    Profil admin
                  </MenuItem>
                  <Divider sx={{ my: 0.5 }} />
                  <MenuItem onClick={handleLogout} sx={{ color: colors.redDark, gap: 1.5, px: 2, py: 1.2 }}>
                    <LogoutGlyph />
                    Se deconnecter
                  </MenuItem>
                </MenuList>
              </Paper>
            )}
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  )
}

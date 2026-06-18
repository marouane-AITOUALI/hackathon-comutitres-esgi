import {
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
import { Bell, ChevronDown, LogOut, Menu, Search, User } from 'lucide-react'
import { useRef, useState } from 'react'
import { AccessibilityMenu } from '../accessibility/AccessibilityMenu'
import { useAccessibility } from '../accessibility/useAccessibility'
import { colors } from '../theme/colors'

interface HeaderProps {
  userName?: string
  avatarUrl?: string | null
  greeting?: string
  onMenuToggle?: () => void
  onLogout?: () => void
  onProfileClick?: () => void
}

export function Header({
  userName = 'Alice Dupont',
  avatarUrl,
  greeting = 'Bonjour Alice',
  onMenuToggle,
  onLogout,
  onProfileClick,
}: HeaderProps) {
  const { language } = useAccessibility()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const [searchOpen, setSearchOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  const handleSearchBlur = () => {
    if (!searchValue) setSearchOpen(false)
  }

  const handleProfileToggle = () => setProfileOpen((prev) => !prev)
  const labels = language === 'fr'
    ? {
        menu: 'Ouvrir le menu',
        search: 'Rechercher',
        searchPlaceholder: 'Rechercher…',
        notifications: 'Notifications',
        profile: 'Ouvrir le menu du profil',
        profileItem: 'Profil',
        logout: 'Se déconnecter',
      }
    : {
        menu: 'Open menu',
        search: 'Search',
        searchPlaceholder: 'Search…',
        notifications: 'Notifications',
        profile: 'Open profile menu',
        profileItem: 'Profile',
        logout: 'Sign out',
      }

  const userInitials = userName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'AD'

  // Close profile dropdown when clicking outside
  const handleProfileMenuKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') setProfileOpen(false)
  }

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        top: 0,
        flexShrink: 0,
        bgcolor: 'background.default',
        borderBottom: 'none',
        color: colors.anthracite,
        zIndex: theme.zIndex.appBar,
      }}
    >
      <Toolbar
        sx={{
          minHeight: { xs: 64, md: 116 },
          alignItems: { xs: 'center', md: 'flex-start' },
          pt: { xs: 0, md: 4 },
          px: { xs: 2, md: 4 },
          gap: 1,
          justifyContent: 'space-between',
        }}
      >
        {/* Left: hamburger (mobile) + greeting */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
          {isMobile && (
            <IconButton aria-label={labels.menu} onClick={onMenuToggle} size="small" sx={{ color: colors.anthracite, mr: 0.5 }}>
              <Menu size={20} />
            </IconButton>
          )}
          {(!isMobile || !searchOpen) && (
            <Typography
              variant="h5"
              sx={{
                fontWeight: 800,
                color: colors.anthracite,
                fontSize: { xs: 18, md: 32 },
                lineHeight: 1.25,
                whiteSpace: 'nowrap',
              }}
            >
              {greeting}
            </Typography>
          )}
        </Box>

        {/* Right: search + bell + profile */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, md: 1 }, mr: { xs: 1, md: 2 } }}>
          {/* Search */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              border: `1.5px solid ${searchOpen ? colors.blueInteraction : colors.greyMedium}`,
              borderRadius: 99,
              height: 40,
              overflow: 'hidden',
              transition: 'width 0.25s ease, border-color 0.2s',
              width: searchOpen ? { xs: 180, md: 260 } : 40,
              bgcolor: colors.white,
              cursor: 'pointer',
            }}
            onClick={() => setSearchOpen(true)}
            role="search"
            aria-label={labels.search}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                color: colors.greyDark,
              }}
            >
              <Search size={18} />
            </Box>

            <Collapse in={searchOpen} orientation="horizontal" timeout={200}>
              <Box
                component="input"
                autoFocus={searchOpen}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onBlur={handleSearchBlur}
                aria-label={labels.search}
                placeholder={labels.searchPlaceholder}
                sx={{
                  border: 'none',
                  outline: 'none',
                  fontSize: 14,
                  color: colors.anthracite,
                  bgcolor: 'transparent',
                  width: { xs: 140, md: 216 },
                  pr: 2,
                  '&::placeholder': { color: colors.greyDark },
                }}
              />
            </Collapse>
          </Box>

          {/* Bell */}
          <IconButton
            aria-label={labels.notifications}
            size="small"
            sx={{
              width: 40,
              height: 40,
              border: `1.5px solid ${colors.greyMedium}`,
              borderRadius: 99,
              bgcolor: colors.white,
              color: colors.greyDark,
              '&:hover': { bgcolor: colors.greyLight },
            }}
          >
            <Bell size={18} />
          </IconButton>

          <AccessibilityMenu />

          {/* Profile dropdown */}
          <Box ref={profileRef} sx={{ position: 'relative' }} onKeyDown={handleProfileMenuKeyDown}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                role="button"
                tabIndex={0}
                aria-label={labels.profile}
                aria-expanded={profileOpen}
                  sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `1.5px solid ${profileOpen ? colors.blueInteraction : colors.greyMedium}`,
                  borderRadius: 99,
                  height: 40,
                  width: 40,
                  cursor: 'pointer',
                  bgcolor: colors.white,
                  transition: 'border-color 0.2s',
                  '&:hover': { borderColor: colors.blueInteraction },
                  userSelect: 'none',
                  flexShrink: 0,
                }}
                onClick={handleProfileToggle}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') handleProfileToggle()
                }}
              >
                {avatarUrl ? (
                  <Avatar
                    alt={userName}
                    src={avatarUrl}
                    sx={{ height: 36, width: 36 }}
                  />
                ) : (
                  <Typography sx={{ fontSize: 13, fontWeight: 700, color: colors.anthracite, lineHeight: 1 }}>
                    {userInitials}
                  </Typography>
                )}
              </Box>

              <Box
                role="button"
                tabIndex={0}
                aria-label={labels.profile}
                aria-expanded={profileOpen}
                onClick={handleProfileToggle}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') handleProfileToggle()
                }}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  border: `1.5px solid ${profileOpen ? colors.blueInteraction : colors.greyMedium}`,
                  borderRadius: 99,
                  px: { xs: 1.5, md: 1.75 },
                  height: 40,
                  minWidth: { md: 171 },
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  bgcolor: colors.white,
                  transition: 'border-color 0.2s',
                  '&:hover': { borderColor: colors.blueInteraction },
                  userSelect: 'none',
                }}
              >
                {!isMobile && (
                  <Typography sx={{ fontSize: 14, fontWeight: 500, color: colors.anthracite, whiteSpace: 'nowrap' }}>
                    {userName}
                  </Typography>
                )}
                <ChevronDown
                  size={16}
                  style={{
                    color: colors.greyDark,
                    transform: profileOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s',
                  }}
                />
              </Box>
            </Box>

            {/* Dropdown */}
            {profileOpen && (
              <Paper
                elevation={4}
                sx={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  minWidth: 180,
                  borderRadius: 2,
                  overflow: 'hidden',
                  border: `1px solid ${colors.greyMedium}`,
                  zIndex: 1400,
                }}
                onBlur={() => setProfileOpen(false)}
              >
                <MenuList dense>
                  <MenuItem
                    sx={{ gap: 1.5, py: 1.2, px: 2, fontSize: 14, color: colors.anthracite }}
                    onClick={() => {
                      setProfileOpen(false)
                      onProfileClick?.()
                    }}
                  >
                    <User size={16} color={colors.greyDark} />
                    {labels.profileItem}
                  </MenuItem>
                  <Divider sx={{ my: 0.5 }} />
                  <MenuItem
                    sx={{ gap: 1.5, py: 1.2, px: 2, fontSize: 14, color: colors.redDark }}
                    onClick={() => {
                      setProfileOpen(false)
                      onLogout?.()
                    }}
                  >
                    <LogOut size={16} color={colors.redDark} />
                    {labels.logout}
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

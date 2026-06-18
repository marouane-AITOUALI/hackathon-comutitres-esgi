import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Button,
  Collapse,
  Divider,
  IconButton,
  MenuItem,
  MenuList,
  Paper,
  Popover,
  Stack,
  Toolbar,
  Typography,
  Tooltip,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { Bell, Check, ChevronDown, LogOut, Mail, Menu, Search, Trash2, User } from 'lucide-react'
import { useRef, useState } from 'react'
import { AccessibilityMenu } from '../accessibility/AccessibilityMenu'
import { useAccessibility } from '../accessibility/useAccessibility'
import { colors } from '../theme/colors'
import { useNotifications } from '../hooks/useNotifications'
import type { UserNotification } from '../types'

interface HeaderProps {
  userName?: string
  avatarUrl?: string | null
  greeting?: string
  onMenuToggle?: () => void
  onLogout?: () => void
  onProfileClick?: () => void
  onNotificationClick?: (notification: UserNotification) => void
}

export function Header({
  userName = 'Alice Dupont',
  avatarUrl,
  greeting = 'Bonjour Alice',
  onMenuToggle,
  onLogout,
  onProfileClick,
  onNotificationClick,
}: HeaderProps) {
  const { language } = useAccessibility()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const [searchOpen, setSearchOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [profileOpen, setProfileOpen] = useState(false)
  const [notificationAnchor, setNotificationAnchor] = useState<HTMLElement | null>(null)
  const [notificationFilter, setNotificationFilter] = useState<'all' | 'unread'>('all')
  const profileRef = useRef<HTMLDivElement>(null)
  const { connected, markAllRead, markRead, markUnread, notifications, remove, unreadCount } = useNotifications()
  const visibleNotifications = notificationFilter === 'unread'
    ? notifications.filter((notification) => !notification.readAt)
    : notifications

  const handleSearchBlur = () => {
    setSearchOpen(false)
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
          minHeight: { xs: 128, sm: 136, md: 116 },
          alignItems: { xs: 'center', md: 'flex-start' },
          alignContent: { xs: 'center', md: 'initial' },
          flexWrap: { xs: 'wrap', md: 'nowrap' },
          pt: { xs: 1.5, md: 4 },
          pb: { xs: 1.5, md: 0 },
          px: { xs: 2, md: 4 },
          columnGap: 1,
          rowGap: { xs: 1.5, md: 0 },
          justifyContent: 'space-between',
        }}
      >
        {/* Left: hamburger (mobile) + greeting */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            order: { xs: 2, md: 1 },
            flex: { xs: '1 1 100%', md: '0 0 auto' },
            minWidth: 0,
            width: { xs: '100%', md: 'auto' },
          }}
        >
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              color: colors.anthracite,
              fontSize: { xs: 22, md: 32 },
              lineHeight: 1.25,
              whiteSpace: 'nowrap',
            }}
          >
            {greeting}
          </Typography>
        </Box>

        {/* Right: search + bell + profile */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: { xs: 0.75, md: 1 },
            order: { xs: 1, md: 2 },
            width: { xs: '100%', md: 'auto' },
            flex: { xs: '1 1 100%', md: '1 1 auto' },
            justifyContent: 'flex-end',
            minWidth: 0,
            mr: { xs: 0, md: 2 },
          }}
        >
          {isMobile && (
            <IconButton
              aria-label={labels.menu}
              onClick={onMenuToggle}
              size="small"
              sx={{
                width: 40,
                height: 40,
                color: colors.anthracite,
                flexShrink: 0,
                mr: 'auto',
              }}
            >
              <Menu size={22} />
            </IconButton>
          )}

          {/* Search */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              border: `1.5px solid ${searchOpen ? colors.blueInteraction : colors.greyMedium}`,
              borderRadius: 99,
              height: 40,
              overflow: 'hidden',
              transition: 'width 0.25s ease, border-color 0.2s, flex-grow 0.25s ease',
              width: searchOpen ? 'auto' : 40,
              flex: searchOpen ? '1 1 0' : '0 0 40px',
              minWidth: 40,
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

            <Collapse
              in={searchOpen}
              orientation="horizontal"
              timeout={200}
              sx={{
                flex: searchOpen ? '1 1 auto' : '0 0 auto',
                minWidth: 0,
                '& .MuiCollapse-wrapper': { width: '100%' },
                '& .MuiCollapse-wrapperInner': { width: '100%' },
              }}
            >
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
                  width: { xs: '100%', md: 216 },
                  minWidth: 0,
                  pr: 2,
                  '&::placeholder': { color: colors.greyDark },
                }}
              />
            </Collapse>
          </Box>

          {/* Bell */}
          <Badge badgeContent={unreadCount} color="error" max={99}>
            <IconButton
              aria-label={`${labels.notifications} : ${unreadCount} non lue(s)`}
              onClick={(event) => setNotificationAnchor(event.currentTarget)}
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
          </Badge>
          <Popover
            anchorEl={notificationAnchor}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            onClose={() => setNotificationAnchor(null)}
            open={Boolean(notificationAnchor)}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <Box sx={{ width: { xs: 320, sm: 390 }, maxWidth: 'calc(100vw - 24px)', maxHeight: 480, overflowY: 'auto' }}>
              <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', p: 2, borderBottom: `1px solid ${colors.greyMedium}` }}>
                <Box>
                  <Typography sx={{ fontWeight: 800 }}>Notifications</Typography>
                  <Typography color="text.secondary" variant="caption">
                    {connected ? 'Temps réel actif' : 'Reconnexion en cours'}
                  </Typography>
                </Box>
                {unreadCount > 0 && (
                  <Button onClick={() => void markAllRead()} size="small">
                    Tout lire
                  </Button>
                )}
              </Stack>
              <Stack direction="row" spacing={1} sx={{ p: 1.5, borderBottom: `1px solid ${colors.greyMedium}` }}>
                <Button
                  onClick={() => setNotificationFilter('all')}
                  size="small"
                  variant={notificationFilter === 'all' ? 'contained' : 'text'}
                >
                  Toutes
                </Button>
                <Button
                  onClick={() => setNotificationFilter('unread')}
                  size="small"
                  variant={notificationFilter === 'unread' ? 'contained' : 'text'}
                >
                  Non lues ({unreadCount})
                </Button>
              </Stack>
              {visibleNotifications.length === 0 ? (
                <Typography color="text.secondary" sx={{ p: 3, textAlign: 'center' }}>
                  {notificationFilter === 'unread' ? 'Aucune notification non lue.' : 'Aucune notification pour le moment.'}
                </Typography>
              ) : (
                visibleNotifications.slice(0, 50).map((notification) => (
                  <Box
                    key={notification.id}
                    onClick={() => {
                      if (!notification.readAt) void markRead(notification.id)
                      setNotificationAnchor(null)
                      onNotificationClick?.(notification)
                    }}
                    onKeyDown={(event) => {
                      if (event.target !== event.currentTarget) return
                      if (event.key !== 'Enter' && event.key !== ' ') return
                      event.preventDefault()
                      if (!notification.readAt) void markRead(notification.id)
                      setNotificationAnchor(null)
                      onNotificationClick?.(notification)
                    }}
                    role="button"
                    tabIndex={0}
                    sx={{
                      bgcolor: notification.readAt ? colors.white : colors.blueLight,
                      borderBottom: `1px solid ${colors.greyMedium}`,
                      color: colors.anthracite,
                      cursor: 'pointer',
                      display: 'block',
                      font: 'inherit',
                      p: 2,
                      textAlign: 'left',
                      width: '100%',
                      '&:hover': { bgcolor: colors.greyLight40 },
                    }}
                  >
                    <Stack direction="row" spacing={1.25}>
                      <Box sx={{
                        bgcolor: notification.readAt
                          ? colors.greyMedium
                          : notification.priority === 'high' ? colors.redDark : notification.priority === 'low' ? colors.greyDark : colors.blueInteraction,
                        borderRadius: 99,
                        height: 8,
                        mt: 0.75,
                        width: 8,
                        flexShrink: 0,
                      }} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontWeight: notification.readAt ? 650 : 800, fontSize: 14 }}>
                          {notification.title}
                        </Typography>
                        <Typography color="text.secondary" variant="body2">
                          {notification.message}
                        </Typography>
                        <Typography color="text.secondary" variant="caption">
                          {new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(notification.createdAt))}
                        </Typography>
                        {typeof notification.data.actionLabel === 'string' && (
                          <Typography sx={{ color: colors.blueInteraction, display: 'block', fontWeight: 800, mt: 0.5 }} variant="caption">
                            {notification.data.actionLabel}
                          </Typography>
                        )}
                      </Box>
                      <Stack direction="row" spacing={0.25} sx={{ alignSelf: 'flex-start' }}>
                        <Tooltip title={notification.readAt ? 'Marquer non lue' : 'Marquer comme lue'}>
                          <IconButton
                            aria-label={notification.readAt ? 'Marquer non lue' : 'Marquer comme lue'}
                            onClick={(event) => {
                              event.stopPropagation()
                              void (notification.readAt ? markUnread(notification.id) : markRead(notification.id))
                            }}
                            size="small"
                          >
                            {notification.readAt ? <Mail size={15} /> : <Check size={15} />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Supprimer">
                          <IconButton
                            aria-label="Supprimer la notification"
                            onClick={(event) => {
                              event.stopPropagation()
                              void remove(notification.id)
                            }}
                            size="small"
                          >
                            <Trash2 size={15} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Stack>
                  </Box>
                ))
              )}
            </Box>
          </Popover>

          <AccessibilityMenu />

          {/* Profile dropdown */}
          <Box
            ref={profileRef}
            sx={{
              position: 'relative',
              display: 'block',
              flex: '0 1 auto',
              width: { xs: 144, sm: 160, md: 164 },
              maxWidth: { xs: 'calc(100vw - 174px)', md: 164 },
              minWidth: 0,
            }}
            onKeyDown={handleProfileMenuKeyDown}
          >
            <Box
              role="button"
              tabIndex={0}
              aria-label={labels.profile}
              aria-expanded={profileOpen}
              onClick={handleProfileToggle}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  handleProfileToggle()
                }
              }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                border: `1.5px solid ${profileOpen ? colors.blueInteraction : colors.greyMedium}`,
                borderRadius: 99,
                p: '3px 6px 3px 3px',
                height: 40,
                width: '100%',
                cursor: 'pointer',
                bgcolor: colors.white,
                transition: 'border-color 0.2s, box-shadow 0.2s',
                '&:hover': {
                  borderColor: colors.blueInteraction,
                  boxShadow: '0 3px 10px rgba(37, 48, 56, 0.08)',
                },
                userSelect: 'none',
              }}
            >
              <Avatar
                alt={userName}
                src={avatarUrl || undefined}
                sx={{
                  height: 32,
                  width: 32,
                  flexShrink: 0,
                  bgcolor: colors.blueMedium,
                  color: colors.anthracite,
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {!avatarUrl ? userInitials : null}
              </Avatar>
              <Typography
                sx={{
                  flex: 1,
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  fontSize: 14,
                  fontWeight: 500,
                  color: colors.anthracite,
                  whiteSpace: 'nowrap',
                }}
              >
                {userName}
              </Typography>
              <Box
                sx={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  bgcolor: colors.greyLight,
                  color: colors.greyDark,
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                }}
              >
                <ChevronDown
                  size={16}
                  style={{
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

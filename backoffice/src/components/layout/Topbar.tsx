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
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { Bell, Check, ChevronDown, LogOut, Mail, Menu, Search, Trash2, User } from 'lucide-react'
import { useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useNotifications } from '../../hooks/useNotifications'
import { colors } from '../../theme/colors'
import type { AdminNotification } from '../../types/notification'

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/subscriptions': 'Souscriptions',
  '/documents': 'Documents',
  '/support-alerts': 'Alertes support',
  '/users': 'Utilisateurs',
  '/offers': 'Offres',
  '/communications': 'Communications',
}

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, logout } = useAuth()
  const { connected, markAllRead, markRead, markUnread, notifications, remove, unreadCount } = useNotifications()
  const location = useLocation()
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const profileRef = useRef<HTMLDivElement>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [profileOpen, setProfileOpen] = useState(false)
  const [notificationAnchor, setNotificationAnchor] = useState<HTMLElement | null>(null)
  const [notificationFilter, setNotificationFilter] = useState<'all' | 'unread'>('all')

  const title = pageTitles[location.pathname] ?? (location.pathname.startsWith('/subscriptions/') ? 'Detail dossier' : 'Backoffice')
  const userName = user ? `${user.firstName} ${user.lastName}` : 'Administrateur'
  const initials = userName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'A'
  const visibleNotifications = notificationFilter === 'unread'
    ? notifications.filter((notification) => !notification.readAt)
    : notifications

  function handleLogout() {
    setProfileOpen(false)
    logout()
    navigate('/login')
  }

  function handleSearchBlur() {
    if (!searchValue) setSearchOpen(false)
  }

  function openNotification(notification: AdminNotification) {
    if (!notification.readAt) void markRead(notification.id)
    setNotificationAnchor(null)
    const actionPath = typeof notification.data.actionPath === 'string' ? notification.data.actionPath : null
    navigate(actionPath ?? (notification.subscriptionId ? `/subscriptions/${notification.subscriptionId}` : '/dashboard'))
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
              <Menu size={20} />
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
              <Search size={18} />
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

          <Badge badgeContent={unreadCount} color="error" max={99}>
            <IconButton
              aria-label={`${unreadCount} notification(s) non lue(s)`}
              onClick={(event) => setNotificationAnchor(event.currentTarget)}
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
            <Box sx={{ maxHeight: 520, maxWidth: 'calc(100vw - 24px)', overflowY: 'auto', width: { xs: 330, sm: 420 } }}>
              <Stack direction="row" sx={{ alignItems: 'center', borderBottom: `1px solid ${colors.greyMedium}`, justifyContent: 'space-between', p: 2 }}>
                <Box>
                  <Typography sx={{ fontWeight: 900 }}>Notifications equipe</Typography>
                  <Typography color="text.secondary" variant="caption">
                    {connected ? 'Temps reel actif' : 'Reconnexion en cours'}
                  </Typography>
                </Box>
                {unreadCount > 0 && <Button onClick={() => void markAllRead()} size="small">Tout lire</Button>}
              </Stack>
              <Stack direction="row" spacing={1} sx={{ borderBottom: `1px solid ${colors.greyMedium}`, p: 1.5 }}>
                <Button onClick={() => setNotificationFilter('all')} size="small" variant={notificationFilter === 'all' ? 'contained' : 'text'}>Toutes</Button>
                <Button onClick={() => setNotificationFilter('unread')} size="small" variant={notificationFilter === 'unread' ? 'contained' : 'text'}>Non lues ({unreadCount})</Button>
              </Stack>
              {visibleNotifications.length === 0 ? (
                <Typography color="text.secondary" sx={{ p: 3, textAlign: 'center' }}>
                  {notificationFilter === 'unread' ? 'Aucune notification non lue.' : 'Aucune notification.'}
                </Typography>
              ) : visibleNotifications.map((notification) => (
                <Box
                  key={notification.id}
                  onClick={() => openNotification(notification)}
                  onKeyDown={(event) => {
                    if (event.target !== event.currentTarget || (event.key !== 'Enter' && event.key !== ' ')) return
                    event.preventDefault()
                    openNotification(notification)
                  }}
                  role="button"
                  tabIndex={0}
                  sx={{
                    bgcolor: notification.readAt ? colors.white : colors.blueLight,
                    borderBottom: `1px solid ${colors.greyMedium}`,
                    cursor: 'pointer',
                    p: 2,
                    '&:hover': { bgcolor: colors.greyLight40 },
                  }}
                >
                  <Stack direction="row" spacing={1.25}>
                    <Box sx={{
                      bgcolor: notification.readAt ? colors.greyMedium : notification.priority === 'high' ? colors.redDark : colors.blueInteraction,
                      borderRadius: 99,
                      height: 8,
                      mt: 0.75,
                      width: 8,
                    }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontSize: 14, fontWeight: notification.readAt ? 700 : 900 }}>{notification.title}</Typography>
                      <Typography color="text.secondary" variant="body2">{notification.message}</Typography>
                      <Typography color="text.secondary" variant="caption">
                        {new Date(notification.createdAt).toLocaleString('fr-FR')}
                      </Typography>
                      {typeof notification.data.actionLabel === 'string' && (
                        <Typography color="primary" sx={{ display: 'block', fontWeight: 800 }} variant="caption">
                          {notification.data.actionLabel}
                        </Typography>
                      )}
                    </Box>
                    <Stack direction="row" sx={{ alignSelf: 'flex-start' }}>
                      <Tooltip title={notification.readAt ? 'Marquer non lue' : 'Marquer comme lue'}>
                        <IconButton
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
              ))}
            </Box>
          </Popover>

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
                <Avatar alt={userName} src={user?.avatarUrl ?? undefined} sx={{ bgcolor: colors.blueInteraction, fontSize: 13, fontWeight: 800, height: 34, width: 34 }}>
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
                <ChevronDown size={16} style={{ transform: profileOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
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
                    <User size={16} />
                    {user?.role === 'admin' ? 'Administrateur' : 'Utilisateur'}
                  </MenuItem>
                  <Divider sx={{ my: 0.5 }} />
                  <MenuItem onClick={handleLogout} sx={{ color: colors.redDark, gap: 1.5, px: 2, py: 1.2 }}>
                    <LogOut size={16} />
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

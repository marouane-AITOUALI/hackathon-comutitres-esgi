import { Badge, Box, Button, IconButton, Popover, Stack, Tooltip, Typography } from '@mui/material'
import { useState } from 'react'
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
  '/audit-logs': 'Audit logs',
  '/communications': 'Communications',
}

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [notificationAnchor, setNotificationAnchor] = useState<HTMLElement | null>(null)
  const [notificationFilter, setNotificationFilter] = useState<'all' | 'unread'>('all')
  const { connected, markAllRead, markRead, markUnread, notifications, remove, unreadCount } = useNotifications()
  const visibleNotifications = notificationFilter === 'unread'
    ? notifications.filter((notification) => !notification.readAt)
    : notifications
  const title = pageTitles[location.pathname] ?? (location.pathname.startsWith('/subscriptions/') ? 'Detail dossier' : 'Backoffice')

  function handleLogout() {
    logout()
    navigate('/login')
  }

  function openNotification(notification: AdminNotification) {
    if (!notification.readAt) void markRead(notification.id)
    setNotificationAnchor(null)
    const actionPath = typeof notification.data.actionPath === 'string' ? notification.data.actionPath : null
    navigate(actionPath ?? (notification.subscriptionId ? `/subscriptions/${notification.subscriptionId}` : '/dashboard'))
  }

  return (
    <Box component="header" sx={{ alignItems: 'center', display: 'flex', gap: 2, justifyContent: 'space-between', mb: 3 }}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
        <IconButton onClick={onMenuClick} sx={{ display: { xs: 'inline-flex', md: 'none' } }} aria-label="Ouvrir le menu">
          <span aria-hidden>Menu</span>
        </IconButton>
        <div>
          <Typography component="h1" variant="h4" sx={{ fontWeight: 900 }}>{title}</Typography>
          <Typography color="text.secondary">Pilotage Comutitres des parcours et dossiers.</Typography>
        </div>
      </Stack>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
        <Badge badgeContent={unreadCount} color="error" max={99}>
          <IconButton
            aria-label={`${unreadCount} notification(s) non lue(s)`}
            onClick={(event) => setNotificationAnchor(event.currentTarget)}
            sx={{ bgcolor: colors.white, border: `1px solid ${colors.greyMedium}` }}
          >
            <span aria-hidden>🔔</span>
          </IconButton>
        </Badge>
        <Popover
          anchorEl={notificationAnchor}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          onClose={() => setNotificationAnchor(null)}
          open={Boolean(notificationAnchor)}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Box sx={{ maxHeight: 520, maxWidth: 'calc(100vw - 24px)', overflowY: 'auto', width: { xs: 330, sm: 410 } }}>
            <Stack direction="row" sx={{ alignItems: 'center', borderBottom: `1px solid ${colors.greyMedium}`, justifyContent: 'space-between', p: 2 }}>
              <Box>
                <Typography sx={{ fontWeight: 900 }}>Notifications équipe</Typography>
                <Typography color="text.secondary" variant="caption">
                  {connected ? 'Temps réel actif' : 'Reconnexion en cours'}
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
                        <span aria-hidden>{notification.readAt ? '✉' : '✓'}</span>
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
                        <span aria-hidden>×</span>
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Stack>
              </Box>
            ))}
          </Box>
        </Popover>
        <Stack sx={{ alignItems: 'flex-end', display: { xs: 'none', sm: 'flex' } }}>
        <Typography color="text.secondary" variant="body2">
          {user ? `${user.firstName} ${user.lastName}` : 'Admin'}
        </Typography>
        </Stack>
        <Button onClick={handleLogout} variant="outlined">Deconnexion</Button>
      </Stack>
    </Box>
  )
}

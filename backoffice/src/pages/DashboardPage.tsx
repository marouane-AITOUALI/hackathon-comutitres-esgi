import { Alert, Button, Grid, MenuItem, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState } from '../components/common/EmptyState'
import { LoadingState } from '../components/common/LoadingState'
import { StatCard } from '../components/common/StatCard'
import { StatusBadge } from '../components/common/StatusBadge'
import { getAdminStats, getPendingDocuments, getSupportAlerts } from '../services/admin.service'
import { getAdminSubscriptions } from '../services/subscriptions.service'
import type { AdminStats, SupportAlert } from '../types/admin'
import type { PendingDocumentItem } from '../types/document'
import type { AdminSubscriptionItem, SubscriptionStatus } from '../types/subscription'

const subscriptionStatuses: Array<SubscriptionStatus | ''> = ['', 'draft', 'pending_documents', 'pending_payment', 'pending_validation', 'accepted', 'rejected', 'suspended', 'cancelled']

function profileName(profile: AdminSubscriptionItem['bearerProfile']) {
  return profile ? `${profile.firstName} ${profile.lastName}` : 'Non renseigne'
}

function riskAlerts(alerts: SupportAlert[]) {
  return alerts.filter((alert) => alert.severity === 'error' || alert.type.includes('payment') || alert.type.includes('blocked'))
}

export function DashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [subscriptions, setSubscriptions] = useState<AdminSubscriptionItem[]>([])
  const [documents, setDocuments] = useState<PendingDocumentItem[]>([])
  const [alerts, setAlerts] = useState<SupportAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatus | ''>('')
  const [search, setSearch] = useState('')
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null)

  useEffect(() => {
    let mounted = true
    async function loadDashboard(silent = false) {
      try {
        if (silent) setRefreshing(true)
        const [statsResponse, subscriptionsResponse, alertsResponse, documentsResponse] = await Promise.all([
          getAdminStats(),
          getAdminSubscriptions('', 8),
          getSupportAlerts(),
          getPendingDocuments(),
        ])
        if (!mounted) return
        setStats(statsResponse)
        setSubscriptions(subscriptionsResponse.subscriptions)
        setAlerts(alertsResponse.alerts)
        setDocuments(documentsResponse.documents)
        setLastUpdatedAt(new Date())
        setError(null)
      } catch (err) {
        if (!mounted) return
        setError(err instanceof Error ? err.message : 'Erreur de chargement du backoffice.')
      } finally {
        if (mounted) {
          setLoading(false)
          setRefreshing(false)
        }
      }
    }
    loadDashboard()
    const interval = window.setInterval(() => loadDashboard(true), 15_000)
    return () => {
      mounted = false
      window.clearInterval(interval)
    }
  }, [])

  const priorityAlerts = useMemo(() => riskAlerts(alerts).slice(0, 4), [alerts])
  const filteredSubscriptions = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    return subscriptions.filter((row) => {
      const searchableText = [
        row.subscription.id,
        profileName(row.bearerProfile),
        profileName(row.payerProfile),
        row.user?.email,
        row.offer?.name,
      ].filter(Boolean).join(' ').toLowerCase()

      return (!statusFilter || row.subscription.status === statusFilter)
        && (!normalizedSearch || searchableText.includes(normalizedSearch))
    })
  }, [search, statusFilter, subscriptions])
  const statCards = [
    { label: 'Souscriptions en attente', value: (stats?.subscriptions.pending_documents ?? 0) + (stats?.subscriptions.pending_payment ?? 0) + (stats?.subscriptions.pending_validation ?? 0), tone: 'warning' as const },
    { label: 'Documents a traiter', value: documents.length, tone: 'primary' as const },
    { label: 'Alertes support', value: stats?.supportAlerts ?? alerts.length, tone: 'error' as const },
    { label: 'Dossiers valides', value: stats?.subscriptions.accepted ?? 0, tone: 'success' as const },
    { label: 'Dossiers refuses', value: stats?.subscriptions.rejected ?? 0, tone: 'error' as const },
    { label: 'Paiements echoues', value: stats?.payments?.rejected ?? 0, tone: 'warning' as const },
  ]

  if (loading) return <LoadingState label="Chargement du dashboard..." />

  return (
    <Stack spacing={3}>
      {error && <Alert severity="error">{error}</Alert>}

      <Grid container spacing={2}>
        {statCards.map((stat) => (
          <Grid key={stat.label} size={{ xs: 12, sm: 6, lg: 4 }}>
            <StatCard label={stat.label} tone={stat.tone} value={stat.value} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 5 }}>
          <Paper sx={{ borderRadius: 4, height: '100%', p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 900, mb: 2 }}>Actions prioritaires</Typography>
            <Stack spacing={1.5}>
              {priorityAlerts.length === 0 && <EmptyState title="Aucune alerte critique" description="Les dossiers a risque apparaitront ici." />}
              {priorityAlerts.map((alert) => (
                <Alert key={alert.id} severity={alert.severity === 'error' ? 'error' : 'warning'}>
                  <strong>{alert.title}</strong> - {alert.message}
                </Alert>
              ))}
            </Stack>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Paper sx={{ borderRadius: 4, height: '100%', p: 3 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', mb: 2 }}>
              <Stack spacing={0.5}>
                <Typography component="h2" sx={{ fontWeight: 900 }} variant="h6">Dernieres souscriptions</Typography>
                <Typography color="text.secondary" variant="caption">
                  {refreshing ? 'Actualisation...' : lastUpdatedAt ? `Mis a jour a ${lastUpdatedAt.toLocaleTimeString('fr-FR')}` : 'Vue temps reel active'}
                </Typography>
              </Stack>
              <Button component={Link} to="/subscriptions" variant="outlined">Voir toutes</Button>
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
              <TextField
                fullWidth
                label="Recherche"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Nom, email, offre..."
                size="small"
                value={search}
              />
              <TextField
                label="Statut"
                onChange={(event) => setStatusFilter(event.target.value as SubscriptionStatus | '')}
                select
                size="small"
                sx={{ minWidth: 220 }}
                value={statusFilter}
              >
                {subscriptionStatuses.map((status) => (
                  <MenuItem key={status || 'all'} value={status}>
                    {status ? <StatusBadge status={status} /> : 'Tous les statuts'}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
            <TableContainer>
              <Table aria-label="Dernieres demandes de souscription">
                <TableHead><TableRow><TableCell>Reference</TableCell><TableCell>Porteur</TableCell><TableCell>Offre</TableCell><TableCell>Statut</TableCell></TableRow></TableHead>
                <TableBody>
                  {filteredSubscriptions.slice(0, 8).map((row) => (
                    <TableRow key={row.subscription.id}>
                      <TableCell>{row.subscription.id.slice(0, 8)}</TableCell>
                      <TableCell>{profileName(row.bearerProfile)}</TableCell>
                      <TableCell>{row.offer?.name ?? 'Non renseignee'}</TableCell>
                      <TableCell><StatusBadge status={row.subscription.status} /></TableCell>
                    </TableRow>
                  ))}
                  {filteredSubscriptions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4}>
                        <Typography color="text.secondary">Aucune souscription ne correspond aux filtres.</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Stack>
  )
}

import { Alert, Button, Grid, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'
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
import type { AdminSubscriptionItem } from '../types/subscription'

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
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    async function loadDashboard() {
      try {
        const [statsResponse, subscriptionsResponse, alertsResponse, documentsResponse] = await Promise.all([
          getAdminStats(),
          getAdminSubscriptions(),
          getSupportAlerts(),
          getPendingDocuments(),
        ])
        if (!mounted) return
        setStats(statsResponse)
        setSubscriptions(subscriptionsResponse.subscriptions)
        setAlerts(alertsResponse.alerts)
        setDocuments(documentsResponse.documents)
      } catch (err) {
        if (!mounted) return
        setError(err instanceof Error ? err.message : 'Erreur de chargement du backoffice.')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    loadDashboard()
    return () => { mounted = false }
  }, [])

  const priorityAlerts = useMemo(() => riskAlerts(alerts).slice(0, 4), [alerts])
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
              <Typography component="h2" sx={{ fontWeight: 900 }} variant="h6">Dernieres souscriptions</Typography>
              <Button component={Link} to="/subscriptions" variant="outlined">Voir toutes</Button>
            </Stack>
            <TableContainer>
              <Table aria-label="Dernieres demandes de souscription">
                <TableHead><TableRow><TableCell>Reference</TableCell><TableCell>Porteur</TableCell><TableCell>Offre</TableCell><TableCell>Statut</TableCell></TableRow></TableHead>
                <TableBody>
                  {subscriptions.slice(0, 6).map((row) => (
                    <TableRow key={row.subscription.id}>
                      <TableCell>{row.subscription.id.slice(0, 8)}</TableCell>
                      <TableCell>{profileName(row.bearerProfile)}</TableCell>
                      <TableCell>{row.offer?.name ?? 'Non renseignee'}</TableCell>
                      <TableCell><StatusBadge status={row.subscription.status} /></TableCell>
                    </TableRow>
                  ))}
                  {subscriptions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4}>
                        <Typography color="text.secondary">Aucune souscription a afficher pour le moment.</Typography>
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

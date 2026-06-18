import { Alert, Box, Button, Chip, Grid, Paper, Stack, Typography } from '@mui/material'
import { AlertTriangle, CheckCircle2, ClipboardList, CreditCard, FileWarning, ShieldAlert, TrendingUp } from 'lucide-react'
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
import { colors } from '../theme/colors'
import { dossierPriority, formatDate, hasDocumentIssue, hasPaymentIssue, profileName } from '../utils/backofficeLabels'

function priorityAlerts(alerts: SupportAlert[]) {
  return alerts
    .filter((alert) => alert.severity === 'error' || alert.severity === 'warning' || alert.type.includes('payment') || alert.type.includes('blocked'))
    .slice(0, 5)
}

function sortByPriority(rows: AdminSubscriptionItem[]) {
  const weights = { high: 0, medium: 1, low: 2, none: 3 }
  return [...rows].sort((a, b) => {
    const byPriority = weights[dossierPriority(a)] - weights[dossierPriority(b)]
    if (byPriority !== 0) return byPriority
    return new Date(b.subscription.updatedAt).getTime() - new Date(a.subscription.updatedAt).getTime()
  })
}

function QueueCard({ title, value, helper, to, tone }: { title: string; value: number; helper: string; to: string; tone: 'primary' | 'warning' | 'error' | 'success' }) {
  return (
    <Paper
      component={Link}
      to={to}
      sx={{
        bgcolor: colors.white,
        border: `1px solid ${colors.greyMedium}`,
        borderRadius: 2,
        color: 'inherit',
        display: 'block',
        height: '100%',
        p: 2.25,
        textDecoration: 'none',
        transition: 'border-color 0.2s, transform 0.2s',
        '&:hover': { borderColor: colors.blueInteraction, transform: 'translateY(-2px)' },
      }}
    >
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box>
          <Typography sx={{ fontWeight: 850 }}>{title}</Typography>
          <Typography color="text.secondary" variant="body2">{helper}</Typography>
        </Box>
        <Chip color={tone} label={value} sx={{ fontWeight: 850 }} />
      </Stack>
    </Paper>
  )
}

export function DashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [subscriptions, setSubscriptions] = useState<AdminSubscriptionItem[]>([])
  const [documents, setDocuments] = useState<PendingDocumentItem[]>([])
  const [alerts, setAlerts] = useState<SupportAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null)

  useEffect(() => {
    let mounted = true

    async function loadDashboard(silent = false) {
      try {
        if (silent) setRefreshing(true)
        const [statsResponse, subscriptionsResponse, alertsResponse, documentsResponse] = await Promise.all([
          getAdminStats(),
          getAdminSubscriptions('', 20),
          getSupportAlerts(),
          getPendingDocuments(),
        ])

        if (!mounted) return
        setStats(statsResponse)
        setSubscriptions(subscriptionsResponse.subscriptions)
        setAlerts(alertsResponse.alerts)
        setDocuments(documentsResponse.documents)
        setLastUpdatedAt(new Date())
        setError('')
      } catch (caught) {
        if (!mounted) return
        setError(caught instanceof Error ? caught.message : 'Erreur de chargement du backoffice.')
      } finally {
        if (mounted) {
          setLoading(false)
          setRefreshing(false)
        }
      }
    }

    void loadDashboard()
    const interval = window.setInterval(() => loadDashboard(true), 15_000)
    return () => {
      mounted = false
      window.clearInterval(interval)
    }
  }, [])

  const priorityRows = useMemo(() => sortByPriority(subscriptions).slice(0, 6), [subscriptions])
  const alertsToShow = useMemo(() => priorityAlerts(alerts), [alerts])
  const documentIssueCount = subscriptions.filter(hasDocumentIssue).length
  const paymentIssueCount = subscriptions.filter(hasPaymentIssue).length
  const waitingCount = (stats?.subscriptions.pending_documents ?? 0) + (stats?.subscriptions.pending_payment ?? 0) + (stats?.subscriptions.pending_validation ?? 0)

  if (loading) return <LoadingState label="Chargement du pilotage backoffice..." />

  return (
    <Stack spacing={3}>
      {error && <Alert severity="error">{error}</Alert>}

      <Paper sx={{ borderRadius: 3, p: { xs: 2, md: 3 } }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: { md: 'center' }, justifyContent: 'space-between' }}>
          <Box>
            <Typography component="h2" sx={{ fontWeight: 900 }} variant="h5">Pilotage opérationnel</Typography>
            <Typography color="text.secondary">
              Vue synthétique des dossiers, documents, paiements et alertes à traiter.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
            <Chip color={refreshing ? 'warning' : 'success'} label={refreshing ? 'Actualisation...' : 'Vue temps réel'} />
            {lastUpdatedAt && <Chip label={`Mis à jour à ${lastUpdatedAt.toLocaleTimeString('fr-FR')}`} variant="outlined" />}
          </Stack>
        </Stack>
      </Paper>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <StatCard icon={<ClipboardList color={colors.orangeDark} size={28} />} label="Dossiers à piloter" value={waitingCount} helper="Documents, paiement ou validation attendus" tone="warning" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <StatCard icon={<FileWarning color={colors.blueInteraction} size={28} />} label="Documents à vérifier" value={documents.length} helper="Justificatifs en attente ou revue manuelle" tone="primary" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <StatCard icon={<ShieldAlert color={colors.redDark} size={28} />} label="Alertes support" value={stats?.supportAlerts ?? alerts.length} helper="Blocages à traiter en priorité" tone="error" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <StatCard icon={<CheckCircle2 color={colors.greenDark} size={28} />} label="Dossiers acceptés" value={stats?.subscriptions.accepted ?? 0} helper="Souscriptions validées" tone="success" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <StatCard icon={<AlertTriangle color={colors.orangeDark} size={28} />} label="Dossiers refusés" value={stats?.subscriptions.rejected ?? 0} helper="Décisions défavorables" tone="error" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <StatCard icon={<CreditCard color={colors.orangeDark} size={28} />} label="Paiements bloqués" value={stats?.payments?.rejected ?? 0} helper="Paiements rejetés à régulariser" tone="warning" />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={2} sx={{ height: '100%' }}>
            <QueueCard title="File documents" helper="Dossiers avec pièce à contrôler" to="/documents" tone="primary" value={documentIssueCount} />
            <QueueCard title="File paiements" helper="Dossiers avec paiement bloqué" to="/subscriptions" tone="warning" value={paymentIssueCount} />
            <QueueCard title="Alertes critiques" helper="Risques support et blocages" to="/support-alerts" tone="error" value={alertsToShow.length} />
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper sx={{ borderRadius: 3, height: '100%', p: 3 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between', mb: 2 }}>
              <Box>
                <Typography component="h2" sx={{ fontWeight: 900 }} variant="h6">Dossiers prioritaires</Typography>
                <Typography color="text.secondary" variant="body2">Triés par blocage paiement, document puis validation.</Typography>
              </Box>
              <Button component={Link} endIcon={<TrendingUp size={16} />} to="/subscriptions" variant="outlined">Voir toutes</Button>
            </Stack>

            <Stack spacing={1.25}>
              {priorityRows.map((row) => (
                <Paper key={row.subscription.id} variant="outlined" sx={{ borderRadius: 2, p: 1.75 }}>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ alignItems: { md: 'center' }, justifyContent: 'space-between' }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 850 }}>{profileName(row.bearerProfile)}</Typography>
                      <Typography color="text.secondary" variant="body2">{row.offer?.name ?? 'Offre non renseignée'} · Créé le {formatDate(row.subscription.createdAt)}</Typography>
                    </Box>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', justifyContent: { md: 'flex-end' } }}>
                      <StatusBadge status={row.subscription.status} />
                      {hasDocumentIssue(row) && <StatusBadge status="warning" label="Document à traiter" />}
                      {hasPaymentIssue(row) && <StatusBadge status="error" label="Paiement bloqué" />}
                      <Button component={Link} size="small" to={`/subscriptions/${row.subscription.id}`} variant="contained">Voir dossier</Button>
                    </Stack>
                  </Stack>
                </Paper>
              ))}
              {priorityRows.length === 0 && <EmptyState title="Aucun dossier prioritaire" description="Les dossiers à traiter apparaîtront ici dès qu’une action sera nécessaire." />}
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ borderRadius: 3, p: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ justifyContent: 'space-between' }}>
          <Box>
            <Typography sx={{ fontWeight: 900 }} variant="h6">Alertes support</Typography>
            <Typography color="text.secondary" variant="body2">Les alertes visibles ici sont les signaux à traiter avant contact client.</Typography>
          </Box>
          <Button component={Link} to="/support-alerts" variant="outlined">Voir les alertes</Button>
        </Stack>
        <Stack spacing={1.25} sx={{ mt: 2 }}>
          {alertsToShow.map((alert) => (
            <Alert key={alert.id} severity={alert.severity === 'error' ? 'error' : 'warning'}>
              <strong>{alert.title}</strong> · {alert.message}
            </Alert>
          ))}
          {alertsToShow.length === 0 && <EmptyState title="Aucun blocage détecté" description="Les alertes de support, paiement ou document seront remontées ici." />}
        </Stack>
      </Paper>
    </Stack>
  )
}

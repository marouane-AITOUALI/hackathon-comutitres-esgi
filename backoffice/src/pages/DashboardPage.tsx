import { Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Grid, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { adminRequest, getAdminToken, type AdminStats, type AdminSubscriptionItem, type SubscriptionStatus } from '../services/admin.service'
import { useApiUrl } from '../hooks/useApiUrl'

const statusLabels: Record<SubscriptionStatus, string> = {
  draft: 'Brouillon',
  pending_documents: 'Documents attendus',
  pending_payment: 'Paiement attendu',
  pending_validation: 'A valider',
  accepted: 'Acceptee',
  rejected: 'Refusee',
  cancelled: 'Annulee',
  suspended: 'Suspendue',
}

const subscriptionTypes = {
  self: 'Pour soi-meme',
  child: 'Parent pour enfant',
  other: 'Autre porteur',
  organization_beneficiary: 'Structure / association',
}

function statusColor(status: SubscriptionStatus) {
  if (status === 'accepted') return 'success' as const
  if (status === 'rejected' || status === 'cancelled' || status === 'suspended') return 'error' as const
  if (status === 'pending_documents' || status === 'pending_payment') return 'warning' as const
  return 'primary' as const
}

function profileName(profile: AdminSubscriptionItem['bearerProfile']) {
  return profile ? `${profile.firstName} ${profile.lastName}` : 'Non renseigne'
}

export function DashboardPage() {
  const apiUrl = useApiUrl()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [subscriptions, setSubscriptions] = useState<AdminSubscriptionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const hasToken = useMemo(() => Boolean(getAdminToken()), [])

  useEffect(() => {
    let mounted = true
    async function loadDashboard() {
      if (!hasToken) {
        setLoading(false)
        return
      }
      try {
        const [statsResponse, subscriptionsResponse] = await Promise.all([
          adminRequest<AdminStats>(apiUrl, '/admin/stats'),
          adminRequest<{ subscriptions: AdminSubscriptionItem[] }>(apiUrl, '/admin/subscriptions'),
        ])
        if (!mounted) return
        setStats(statsResponse)
        setSubscriptions(subscriptionsResponse.subscriptions)
      } catch (err) {
        if (!mounted) return
        setError(err instanceof Error ? err.message : 'Erreur de chargement du backoffice.')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    loadDashboard()
    return () => { mounted = false }
  }, [apiUrl, hasToken])

  const statCards = [
    { label: 'Souscriptions', value: stats?.subscriptions.total ?? 0 },
    { label: 'En attente', value: (stats?.subscriptions.pending_documents ?? 0) + (stats?.subscriptions.pending_payment ?? 0) + (stats?.subscriptions.pending_validation ?? 0) },
    { label: 'Acceptees', value: stats?.subscriptions.accepted ?? 0 },
    { label: 'Alertes support', value: stats?.supportAlerts ?? 0 },
  ]

  return (
    <Stack spacing={3}>
      <div>
        <Typography component="h1" variant="h4">
          Pilotage des souscriptions
        </Typography>
        <Typography color="text.secondary">Vue prototype des parcours, porteurs, payeurs et offres recommandees.</Typography>
      </div>

      {!hasToken && (
        <Alert severity="info">
          Backoffice protege : ajoute un JWT admin dans <code>localStorage.comutitres_admin_token</code> ou connecte-toi avec un compte admin dans le prototype.
        </Alert>
      )}
      {error && <Alert severity="error">{error}</Alert>}
      {loading && (
        <Box sx={{ alignItems: 'center', display: 'flex', gap: 2 }}>
          <CircularProgress size={22} />
          <Typography>Chargement du backoffice...</Typography>
        </Box>
      )}

      <Grid container spacing={2}>
        {statCards.map((stat) => (
          <Grid key={stat.label} size={{ xs: 12, sm: 6, lg: 3 }}>
            <Card>
              <CardContent>
                <Typography color="text.secondary">{stat.label}</Typography>
                <Typography variant="h4">{stat.value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      <Card>
        <CardContent>
          <Box sx={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography component="h2" sx={{ fontWeight: 800 }} variant="h6">Dernieres demandes</Typography>
            <Button disabled={loading} onClick={() => window.location.reload()} variant="outlined">Rafraichir</Button>
          </Box>
          <TableContainer>
            <Table aria-label="Dernieres demandes de souscription">
              <TableHead><TableRow><TableCell>Reference</TableCell><TableCell>Type de souscription</TableCell><TableCell>Porteur</TableCell><TableCell>Payeur</TableCell><TableCell>Offre recommandee</TableCell><TableCell>Statut</TableCell></TableRow></TableHead>
              <TableBody>
                {subscriptions.map((row) => (
                  <TableRow key={row.subscription.id}>
                    <TableCell>{row.subscription.id.slice(0, 8)}</TableCell><TableCell>{row.onboardingSession ? subscriptionTypes[row.onboardingSession.subscriptionFor] : 'Non renseigne'}</TableCell><TableCell>{profileName(row.bearerProfile)}</TableCell><TableCell>{profileName(row.payerProfile)}</TableCell><TableCell>{row.offer?.name ?? 'Non renseignee'}</TableCell><TableCell><Chip color={statusColor(row.subscription.status)} label={statusLabels[row.subscription.status]} size="small" /></TableCell>
                  </TableRow>
                ))}
                {!loading && subscriptions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Typography color="text.secondary">Aucune souscription a afficher pour le moment.</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Stack>
  )
}

import { Alert, Box, Button, Checkbox, FormControlLabel, MenuItem, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material'
import { ArrowRight, FileWarning, RefreshCcw } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState } from '../components/common/EmptyState'
import { LoadingState } from '../components/common/LoadingState'
import { StatusBadge } from '../components/common/StatusBadge'
import { getSupportAlerts } from '../services/admin.service'
import { getAdminSubscriptions } from '../services/subscriptions.service'
import type { SupportAlert } from '../types/admin'
import type { AdminSubscriptionItem, SubscriptionStatus } from '../types/subscription'
import { colors } from '../theme/colors'
import { dossierPriority, formatDate, hasAcceptedPayment, hasDocumentIssue, hasPaymentIssue, profileName } from '../utils/backofficeLabels'

const statuses: Array<SubscriptionStatus | ''> = ['', 'draft', 'pending_documents', 'pending_payment', 'pending_validation', 'accepted', 'rejected', 'suspended', 'cancelled']

function priorityLabel(row: AdminSubscriptionItem) {
  const priority = dossierPriority(row)
  if (priority === 'high') return <StatusBadge status="error" label="Priorité haute" />
  if (priority === 'medium') return <StatusBadge status="warning" label="À traiter" />
  if (priority === 'low') return <StatusBadge status="info" label="À suivre" />
  return <StatusBadge status="validated" label="Stable" />
}

function sortRows(rows: AdminSubscriptionItem[]) {
  const weights = { high: 0, medium: 1, low: 2, none: 3 }
  return [...rows].sort((a, b) => {
    const priority = weights[dossierPriority(a)] - weights[dossierPriority(b)]
    if (priority !== 0) return priority
    return new Date(b.subscription.updatedAt).getTime() - new Date(a.subscription.updatedAt).getTime()
  })
}

export function SubscriptionsPage() {
  const [rows, setRows] = useState<AdminSubscriptionItem[]>([])
  const [alerts, setAlerts] = useState<SupportAlert[]>([])
  const [status, setStatus] = useState<SubscriptionStatus | ''>('')
  const [offer, setOffer] = useState('')
  const [search, setSearch] = useState('')
  const [onlyDocuments, setOnlyDocuments] = useState(false)
  const [onlyPayments, setOnlyPayments] = useState(false)
  const [onlyUrgent, setOnlyUrgent] = useState(false)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null)

  useEffect(() => {
    let mounted = true

    async function loadSubscriptions(silent = false) {
      try {
        if (silent) setRefreshing(true)
        const [subscriptionsResponse, alertsResponse] = await Promise.all([getAdminSubscriptions(), getSupportAlerts()])
        if (!mounted) return
        setRows(subscriptionsResponse.subscriptions)
        setAlerts(alertsResponse.alerts)
        setLastUpdatedAt(new Date())
        setError('')
      } catch (caught) {
        if (!mounted) return
        setError(caught instanceof Error ? caught.message : 'Souscriptions indisponibles.')
      } finally {
        if (mounted) {
          setLoading(false)
          setRefreshing(false)
        }
      }
    }

    void loadSubscriptions()
    const interval = window.setInterval(() => loadSubscriptions(true), 15_000)
    return () => {
      mounted = false
      window.clearInterval(interval)
    }
  }, [])

  const paymentIssueSubscriptionIds = useMemo(
    () => new Set(alerts.filter((alert) => alert.type.includes('payment')).map((alert) => alert.subscriptionId).filter(Boolean)),
    [alerts],
  )
  const offers = useMemo(() => [...new Set(rows.map((row) => row.offer?.name).filter(Boolean))] as string[], [rows])
  const filtered = useMemo(() => sortRows(rows.filter((row) => {
    const text = `${profileName(row.bearerProfile)} ${profileName(row.payerProfile)} ${row.user?.email ?? ''} ${row.offer?.name ?? ''}`.toLowerCase()
    const hasPaymentBlock = hasPaymentIssue(row) || paymentIssueSubscriptionIds.has(row.subscription.id)

    return (!status || row.subscription.status === status)
      && (!offer || row.offer?.name === offer)
      && (!search || text.includes(search.toLowerCase()))
      && (!onlyDocuments || hasDocumentIssue(row))
      && (!onlyPayments || hasPaymentBlock)
      && (!onlyUrgent || dossierPriority(row) === 'high' || dossierPriority(row) === 'medium')
  })), [offer, onlyDocuments, onlyPayments, onlyUrgent, paymentIssueSubscriptionIds, rows, search, status])

  const counters = {
    urgent: rows.filter((row) => dossierPriority(row) === 'high' || dossierPriority(row) === 'medium').length,
    documents: rows.filter(hasDocumentIssue).length,
    payments: rows.filter((row) => hasPaymentIssue(row) || paymentIssueSubscriptionIds.has(row.subscription.id)).length,
  }

  if (loading) return <LoadingState label="Chargement des souscriptions..." />

  return (
    <Stack spacing={3}>
      {error && <Alert severity="error">{error}</Alert>}

      <Paper sx={{ borderRadius: 3, p: 3 }}>
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} sx={{ alignItems: { lg: 'center' }, justifyContent: 'space-between', mb: 2.5 }}>
          <Box>
            <Typography component="h2" sx={{ fontWeight: 900 }} variant="h6">Portefeuille de dossiers</Typography>
            <Typography color="text.secondary" variant="body2">
              Suivez les souscriptions par urgence, statut, document et paiement.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
            <StatusBadge status={counters.urgent > 0 ? 'warning' : 'validated'} label={`${counters.urgent} à traiter`} />
            <StatusBadge status={counters.documents > 0 ? 'warning' : 'validated'} label={`${counters.documents} documents`} />
            <StatusBadge status={counters.payments > 0 ? 'error' : 'paid'} label={`${counters.payments} paiements`} />
            <StatusBadge status={refreshing ? 'warning' : 'info'} label={refreshing ? 'Actualisation...' : lastUpdatedAt ? `MAJ ${lastUpdatedAt.toLocaleTimeString('fr-FR')}` : 'Vue temps réel'} />
          </Stack>
        </Stack>

        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2}>
          <TextField label="Recherche" onChange={(event) => setSearch(event.target.value)} placeholder="Nom, email, offre..." value={search} sx={{ flex: 1 }} />
          <TextField label="Statut" onChange={(event) => setStatus(event.target.value as SubscriptionStatus | '')} select value={status} sx={{ minWidth: 220 }}>
            {statuses.map((item) => <MenuItem key={item || 'all'} value={item}>{item ? <StatusBadge status={item} /> : 'Tous les statuts'}</MenuItem>)}
          </TextField>
          <TextField label="Offre" onChange={(event) => setOffer(event.target.value)} select value={offer} sx={{ minWidth: 240 }}>
            <MenuItem value="">Toutes les offres</MenuItem>
            {offers.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
          </TextField>
        </Stack>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ mt: 2 }}>
          <FormControlLabel control={<Checkbox checked={onlyUrgent} onChange={(event) => setOnlyUrgent(event.target.checked)} />} label="Seulement à traiter" />
          <FormControlLabel control={<Checkbox checked={onlyDocuments} onChange={(event) => setOnlyDocuments(event.target.checked)} />} label="Document à vérifier" />
          <FormControlLabel control={<Checkbox checked={onlyPayments} onChange={(event) => setOnlyPayments(event.target.checked)} />} label="Paiement bloqué" />
        </Stack>
      </Paper>

      <Paper sx={{ borderRadius: 3, p: 3 }}>
        <TableContainer>
          <Table aria-label="Liste des souscriptions" size="small">
            <TableHead>
              <TableRow>
                <TableCell>Priorité</TableCell>
                <TableCell>Porteur</TableCell>
                <TableCell>Payeur</TableCell>
                <TableCell>Offre</TableCell>
                <TableCell>Documents</TableCell>
                <TableCell>Paiement</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell>Création</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((row) => {
                const paymentBlocked = hasPaymentIssue(row) || paymentIssueSubscriptionIds.has(row.subscription.id)
                const paymentOk = hasAcceptedPayment(row)
                return (
                  <TableRow key={row.subscription.id} hover>
                    <TableCell>{priorityLabel(row)}</TableCell>
                    <TableCell sx={{ fontWeight: 750 }}>{profileName(row.bearerProfile)}</TableCell>
                    <TableCell>{profileName(row.payerProfile)}</TableCell>
                    <TableCell>{row.offer?.name ?? 'Non renseignée'}</TableCell>
                    <TableCell><StatusBadge status={hasDocumentIssue(row) ? 'warning' : 'validated'} label={hasDocumentIssue(row) ? 'À vérifier' : 'OK'} /></TableCell>
                    <TableCell><StatusBadge status={paymentBlocked ? 'error' : paymentOk ? 'paid' : row.subscription.status === 'pending_payment' ? 'pending' : 'info'} label={paymentBlocked ? 'Bloqué' : paymentOk ? 'OK' : row.subscription.status === 'pending_payment' ? 'Attendu' : 'Non requis'} /></TableCell>
                    <TableCell><StatusBadge status={row.subscription.status} /></TableCell>
                    <TableCell>{formatDate(row.subscription.createdAt)}</TableCell>
                    <TableCell align="right">
                      <Button component={Link} endIcon={<ArrowRight size={15} />} size="small" to={`/subscriptions/${row.subscription.id}`} variant="outlined">
                        Voir dossier
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
        {filtered.length === 0 && (
          <EmptyState
            title="Aucun dossier"
            description="Aucun dossier ne correspond aux filtres actifs."
            action={<Button onClick={() => { setStatus(''); setOffer(''); setSearch(''); setOnlyDocuments(false); setOnlyPayments(false); setOnlyUrgent(false) }} startIcon={<RefreshCcw size={16} />} variant="outlined">Réinitialiser les filtres</Button>}
          />
        )}
      </Paper>

      <Paper sx={{ bgcolor: colors.blueLight, borderRadius: 3, p: 2.5 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <FileWarning color={colors.blueInteraction} size={20} />
          <Typography color="text.secondary" variant="body2">
            Les fichiers justificatifs restent stockés dans Supabase Storage. Le backoffice affiche uniquement les métadonnées utiles au traitement.
          </Typography>
        </Stack>
      </Paper>
    </Stack>
  )
}

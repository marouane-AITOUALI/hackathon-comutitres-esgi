import { Alert, Button, Checkbox, FormControlLabel, MenuItem, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField } from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState } from '../components/common/EmptyState'
import { LoadingState } from '../components/common/LoadingState'
import { StatusBadge } from '../components/common/StatusBadge'
import { getSupportAlerts } from '../services/admin.service'
import { getAdminSubscriptions } from '../services/subscriptions.service'
import type { SupportAlert } from '../types/admin'
import type { AdminSubscriptionItem, SubscriptionStatus } from '../types/subscription'

const statuses: Array<SubscriptionStatus | ''> = ['', 'draft', 'pending_documents', 'pending_payment', 'pending_validation', 'accepted', 'rejected', 'suspended', 'cancelled']

function profileName(profile: AdminSubscriptionItem['bearerProfile']) {
  return profile ? `${profile.firstName} ${profile.lastName}` : 'Non renseigne'
}

function hasDocumentIssue(row: AdminSubscriptionItem) {
  return row.documents.some((document) => ['pending', 'needs_manual_review', 'rejected'].includes(document.status))
}

export function SubscriptionsPage() {
  const [rows, setRows] = useState<AdminSubscriptionItem[]>([])
  const [alerts, setAlerts] = useState<SupportAlert[]>([])
  const [status, setStatus] = useState<SubscriptionStatus | ''>('')
  const [offer, setOffer] = useState('')
  const [search, setSearch] = useState('')
  const [onlyDocuments, setOnlyDocuments] = useState(false)
  const [onlyPayments, setOnlyPayments] = useState(false)
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
    loadSubscriptions()
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
  const filtered = rows.filter((row) => {
    const text = `${profileName(row.bearerProfile)} ${profileName(row.payerProfile)} ${row.user?.email ?? ''} ${row.offer?.name ?? ''}`.toLowerCase()
    return (!status || row.subscription.status === status)
      && (!offer || row.offer?.name === offer)
      && (!search || text.includes(search.toLowerCase()))
      && (!onlyDocuments || hasDocumentIssue(row))
      && (!onlyPayments || paymentIssueSubscriptionIds.has(row.subscription.id))
  })

  if (loading) return <LoadingState label="Chargement des souscriptions..." />

  return (
    <Stack spacing={3}>
      {error && <Alert severity="error">{error}</Alert>}
      <Paper sx={{ borderRadius: 4, p: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between', mb: 2 }}>
          <span />
          <span style={{ color: '#53606E', fontSize: 13 }}>
            {refreshing ? 'Actualisation...' : lastUpdatedAt ? `Mis a jour a ${lastUpdatedAt.toLocaleTimeString('fr-FR')}` : 'Vue temps reel active'}
          </span>
        </Stack>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField label="Recherche nom/email" onChange={(event) => setSearch(event.target.value)} value={search} />
          <TextField label="Statut" onChange={(event) => setStatus(event.target.value as SubscriptionStatus | '')} select value={status} sx={{ minWidth: 220 }}>
            {statuses.map((item) => <MenuItem key={item || 'all'} value={item}>{item || 'Tous les statuts'}</MenuItem>)}
          </TextField>
          <TextField label="Offre" onChange={(event) => setOffer(event.target.value)} select value={offer} sx={{ minWidth: 220 }}>
            <MenuItem value="">Toutes les offres</MenuItem>
            {offers.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
          </TextField>
        </Stack>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 2 }}>
          <FormControlLabel control={<Checkbox checked={onlyDocuments} onChange={(event) => setOnlyDocuments(event.target.checked)} />} label="Document manquant/a revoir" />
          <FormControlLabel control={<Checkbox checked={onlyPayments} onChange={(event) => setOnlyPayments(event.target.checked)} />} label="Paiement echoue" />
        </Stack>
      </Paper>

      <Paper sx={{ borderRadius: 4, p: 3 }}>
        <TableContainer>
          <Table aria-label="Liste des souscriptions">
            <TableHead>
              <TableRow><TableCell>ID</TableCell><TableCell>Porteur</TableCell><TableCell>Payeur</TableCell><TableCell>Offre</TableCell><TableCell>Documents</TableCell><TableCell>Paiement</TableCell><TableCell>Statut</TableCell><TableCell>Date</TableCell><TableCell /></TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((row) => (
                <TableRow key={row.subscription.id}>
                  <TableCell>{row.subscription.id.slice(0, 8)}</TableCell>
                  <TableCell>{profileName(row.bearerProfile)}</TableCell>
                  <TableCell>{profileName(row.payerProfile)}</TableCell>
                  <TableCell>{row.offer?.name ?? 'Non renseignee'}</TableCell>
                  <TableCell><StatusBadge status={hasDocumentIssue(row) ? 'pending' : 'validated'} label={hasDocumentIssue(row) ? 'A verifier' : 'OK'} /></TableCell>
                  <TableCell><StatusBadge status={paymentIssueSubscriptionIds.has(row.subscription.id) ? 'failed' : row.subscription.status === 'pending_payment' ? 'pending' : 'paid'} /></TableCell>
                  <TableCell><StatusBadge status={row.subscription.status} /></TableCell>
                  <TableCell>{new Date(row.subscription.createdAt).toLocaleDateString('fr-FR')}</TableCell>
                  <TableCell><Button component={Link} to={`/subscriptions/${row.subscription.id}`} variant="outlined">Voir dossier</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {filtered.length === 0 && <EmptyState title="Aucune souscription" description="Aucun dossier ne correspond aux filtres." />}
      </Paper>
    </Stack>
  )
}

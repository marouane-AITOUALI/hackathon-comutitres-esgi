import { Alert, Box, Button, Chip, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { cancelPayment, regularizePayment } from '../services/payments.service'
import { listSubscriptions } from '../services/subscriptions.service'
import type { PaymentSummary, SubscriptionSummary } from '../types'

const statusTone: Record<string, 'default' | 'warning' | 'success' | 'error' | 'info'> = {
  simulated: 'info',
  pending: 'warning',
  accepted: 'success',
  rejected: 'error',
  cancelled: 'default',
  regularized: 'success',
}

function formatAmount(payment: PaymentSummary) {
  return new Intl.NumberFormat('fr-FR', { currency: payment.currency, style: 'currency' }).format(payment.amountCents / 100)
}

export function PaiementsPage() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const load = useCallback(async () => {
    setSubscriptions(await listSubscriptions())
  }, [])

  useEffect(() => {
    let mounted = true

    async function loadInitial() {
      try {
        const data = await listSubscriptions()
        if (mounted) setSubscriptions(data)
      } catch (caught) {
        if (mounted) setError(caught instanceof Error ? caught.message : 'Paiements indisponibles.')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    void loadInitial()
    return () => { mounted = false }
  }, [])

  const rows = subscriptions.flatMap((subscription) => (subscription.payments ?? []).map((payment) => ({ payment, subscription })))

  async function regularize(id: string) {
    setSavingId(id)
    setError('')
    setSuccess('')
    try {
      await regularizePayment(id)
      await load()
      setSuccess('Paiement régularisé.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Régularisation impossible.')
    } finally {
      setSavingId(null)
    }
  }

  async function cancel(id: string) {
    setSavingId(id)
    setError('')
    setSuccess('')
    try {
      await cancelPayment(id)
      await load()
      setSuccess('Paiement annulé.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Annulation impossible.')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' }, mb: 0.5 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>Paiements</Typography>
            <Typography color="text.secondary">Historique et régularisation des paiements.</Typography>
          </Box>
          <Button component={Link} to="/paiements/nouveau" variant="contained" sx={{ fontWeight: 700, borderRadius: 2, whiteSpace: 'nowrap' }}>
            Effectuer un paiement
          </Button>
        </Stack>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success">{success}</Alert>}
      {loading && <Alert severity="info">Chargement des paiements...</Alert>}

      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow><TableCell>Dossier</TableCell><TableCell>Type</TableCell><TableCell>Montant</TableCell><TableCell>Statut</TableCell><TableCell align="right">Action</TableCell></TableRow>
            </TableHead>
            <TableBody>
              {rows.map(({ payment, subscription }) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    <Button component={Link} size="small" to={`/subscriptions/${subscription.subscription.id}`}>
                      {subscription.offer?.name ?? 'Dossier en cours'}
                    </Button>
                  </TableCell>
                  <TableCell>{payment.type}</TableCell>
                  <TableCell>{formatAmount(payment)}</TableCell>
                  <TableCell><Chip color={statusTone[payment.status]} label={payment.status} size="small" /></TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      <Button component={Link} size="small" to={`/paiements/${payment.id}`} variant="text">
                        Détail
                      </Button>
                      <Button
                        color="error"
                        disabled={savingId === payment.id || !['pending', 'simulated'].includes(payment.status)}
                        onClick={() => void cancel(payment.id)}
                        size="small"
                        variant="outlined"
                      >
                        Annuler
                      </Button>
                      <Button
                        disabled={savingId === payment.id || !['rejected', 'cancelled', 'pending'].includes(payment.status)}
                        onClick={() => void regularize(payment.id)}
                        size="small"
                        variant="outlined"
                      >
                        Régulariser
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {!loading && rows.length === 0 && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Aucun paiement. Ouvrez une souscription pour simuler un paiement.
          </Alert>
        )}
      </Paper>
    </Stack>
  )
}

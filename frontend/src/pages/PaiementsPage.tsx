import { Alert, Box, Button, Chip, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { regularizePayment } from '../services/payments.service'
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
      setSuccess('Paiement regularise.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Regularisation impossible.')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>Paiements</Typography>
        <Typography color="text.secondary">Historique et regularisation des paiements simules du prototype.</Typography>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success">{success}</Alert>}
      {loading && <Alert severity="info">Chargement des paiements...</Alert>}

      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow><TableCell>Reference</TableCell><TableCell>Dossier</TableCell><TableCell>Type</TableCell><TableCell>Montant</TableCell><TableCell>Statut</TableCell><TableCell align="right">Action</TableCell></TableRow>
            </TableHead>
            <TableBody>
              {rows.map(({ payment, subscription }) => (
                <TableRow key={payment.id}>
                  <TableCell>{payment.externalReference ?? payment.id.slice(0, 8)}</TableCell>
                  <TableCell>
                    <Button component={Link} size="small" to={`/subscriptions/${subscription.subscription.id}`}>
                      {subscription.offer?.name ?? subscription.subscription.id.slice(0, 8)}
                    </Button>
                  </TableCell>
                  <TableCell>{payment.type}</TableCell>
                  <TableCell>{formatAmount(payment)}</TableCell>
                  <TableCell><Chip color={statusTone[payment.status]} label={payment.status} size="small" /></TableCell>
                  <TableCell align="right">
                    <Button disabled={savingId === payment.id || !['rejected', 'cancelled', 'pending'].includes(payment.status)} onClick={() => regularize(payment.id)} size="small" variant="outlined">
                      Regulariser
                    </Button>
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

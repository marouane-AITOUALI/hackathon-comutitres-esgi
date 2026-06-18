import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import { ArrowLeft } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { cancelPayment, getPayment, regularizePayment } from '../services/payments.service'
import type { PaymentSummary } from '../types'

const statusTone: Record<string, 'default' | 'warning' | 'success' | 'error' | 'info'> = {
  simulated: 'info',
  pending: 'warning',
  accepted: 'success',
  rejected: 'error',
  cancelled: 'default',
  regularized: 'success',
}

const statusLabel: Record<string, string> = {
  simulated: 'Simulé',
  pending: 'En attente',
  accepted: 'Accepté',
  rejected: 'Refusé',
  cancelled: 'Annulé',
  regularized: 'Régularisé',
}

const typeLabel: Record<string, string> = {
  simulation: 'Simulation',
  direct: 'Carte bancaire',
  mandate: 'Prélèvement SEPA',
  regularization: 'Régularisation',
}

function formatAmount(payment: PaymentSummary) {
  return new Intl.NumberFormat('fr-FR', { currency: payment.currency, style: 'currency' }).format(payment.amountCents / 100)
}

function formatDate(value?: string | null) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 0.5, sm: 2 }} sx={{ py: 1 }}>
      <Typography color="text.secondary" sx={{ minWidth: 180, fontWeight: 600 }} variant="body2">
        {label}
      </Typography>
      <Typography variant="body2">{value}</Typography>
    </Stack>
  )
}

export function PaymentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [payment, setPayment] = useState<PaymentSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const load = useCallback(async () => {
    if (!id) return
    const response = await getPayment(id)
    setPayment(response.payment)
  }, [id])

  useEffect(() => {
    let mounted = true

    async function loadInitial() {
      if (!id) {
        setError('Paiement introuvable.')
        setLoading(false)
        return
      }

      try {
        const response = await getPayment(id)
        if (mounted) setPayment(response.payment)
      } catch (caught) {
        if (mounted) setError(caught instanceof Error ? caught.message : 'Paiement indisponible.')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    void loadInitial()
    return () => { mounted = false }
  }, [id])

  async function handleCancel() {
    if (!payment) return
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const response = await cancelPayment(payment.id)
      setPayment(response.payment)
      setSuccess('Paiement annulé.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Annulation impossible.')
    } finally {
      setSaving(false)
    }
  }

  async function handleRegularize() {
    if (!payment) return
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const response = await regularizePayment(payment.id)
      setPayment(response.payment)
      setSuccess('Paiement régularisé.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Régularisation impossible.')
    } finally {
      setSaving(false)
    }
  }

  const canCancel = payment && ['pending', 'simulated'].includes(payment.status)
  const canRegularize = payment && ['rejected', 'cancelled', 'pending'].includes(payment.status)

  return (
    <Stack spacing={3}>
      <Box>
        <Button component={Link} startIcon={<ArrowLeft size={18} />} sx={{ mb: 1 }} to="/paiements" variant="text">
          Retour aux paiements
        </Button>
        <Typography sx={{ fontWeight: 800 }} variant="h4">
          Détail du paiement
        </Typography>
        <Typography color="text.secondary">
          Consultation, annulation et régularisation.
        </Typography>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success">{success}</Alert>}
      {loading && <Alert severity="info">Chargement du paiement…</Alert>}

      {payment && (
        <Paper sx={{ borderRadius: 3, p: 3 }}>
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { xs: 'flex-start', sm: 'center' } }}>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontWeight: 700 }} variant="h6">
                  {payment.externalReference ?? payment.id.slice(0, 8).toUpperCase()}
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  Créé le {formatDate(payment.createdAt)}
                </Typography>
              </Box>
              <Chip
                color={statusTone[payment.status]}
                label={statusLabel[payment.status] ?? payment.status}
                size="small"
              />
            </Stack>

            <Divider />

            <DetailRow label="Montant" value={formatAmount(payment)} />
            <DetailRow label="Type" value={typeLabel[payment.type] ?? payment.type} />
            <DetailRow label="Fournisseur" value={payment.provider} />
            <DetailRow label="Traité le" value={formatDate(payment.processedAt)} />
            <DetailRow label="Dernière mise à jour" value={formatDate(payment.updatedAt)} />

            <Divider />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Button component={Link} to={`/subscriptions/${payment.subscriptionId}`} variant="outlined">
                Voir le dossier
              </Button>
              {canCancel && (
                <Button color="error" disabled={saving} onClick={() => void handleCancel()} variant="outlined">
                  Annuler le paiement
                </Button>
              )}
              {canRegularize && (
                <Button disabled={saving} onClick={() => void handleRegularize()} variant="contained">
                  Régulariser
                </Button>
              )}
              <Button disabled={saving} onClick={() => void load()} variant="text">
                Actualiser
              </Button>
            </Stack>
          </Stack>
        </Paper>
      )}

      {!loading && !payment && !error && (
        <Alert severity="warning">
          Paiement introuvable.{' '}
          <Button onClick={() => navigate('/paiements')} size="small">
            Retour à la liste
          </Button>
        </Alert>
      )}
    </Stack>
  )
}

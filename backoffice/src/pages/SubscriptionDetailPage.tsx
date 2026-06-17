import { Alert, Button, Grid, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { LoadingState } from '../components/common/LoadingState'
import { StatusBadge } from '../components/common/StatusBadge'
import { regularizePayment } from '../services/payments.service'
import { getAdminSubscription, getSubscriptionNextActions, updateAdminSubscriptionStatus } from '../services/subscriptions.service'
import type { AdminSubscriptionItem, SubscriptionNextAction, SubscriptionStatus } from '../types/subscription'
import type { AdminPayment } from '../types/payment'

function profileName(profile: AdminSubscriptionItem['bearerProfile']) {
  return profile ? `${profile.firstName} ${profile.lastName}` : 'Non renseigne'
}

function documentConfidence(result: AdminSubscriptionItem['documents'][number]['analysisResult']) {
  return result && typeof result === 'object' && 'confidence' in result && typeof result.confidence === 'number'
    ? `${result.confidence}%`
    : 'Non disponible'
}

function formatAmount(payment: AdminPayment) {
  return new Intl.NumberFormat('fr-FR', { currency: payment.currency, style: 'currency' }).format(payment.amountCents / 100)
}

function fallbackNextActions(item: AdminSubscriptionItem): SubscriptionNextAction[] {
  const actions: SubscriptionNextAction[] = []
  if (item.documents.some((document) => document.status === 'pending' || document.status === 'needs_manual_review')) actions.push({ code: 'review_documents', priority: 'high', label: 'Verifier les justificatifs', detail: 'Un document attend une revue backoffice.' })
  if (item.documents.some((document) => document.status === 'rejected')) actions.push({ code: 'rejected_document', priority: 'medium', label: 'Informer le client', detail: 'Un justificatif a ete refuse.' })
  if (item.payments.some((payment) => payment.status === 'rejected' || payment.status === 'cancelled')) actions.push({ code: 'regularize_payment', priority: 'high', label: 'Regulariser le paiement', detail: 'Un paiement bloque le dossier.' })
  if (item.subscription.status === 'pending_validation') actions.push({ code: 'validate_subscription', priority: 'medium', label: 'Valider le dossier', detail: 'Le dossier attend une decision backoffice.' })
  if (actions.length === 0) actions.push({ code: 'no_action', priority: 'low', label: 'Aucune action prioritaire', detail: 'Le prototype ne detecte aucun blocage.' })
  return actions
}

export function SubscriptionDetailPage() {
  const { id } = useParams()
  const [item, setItem] = useState<AdminSubscriptionItem | null>(null)
  const [actions, setActions] = useState<SubscriptionNextAction[]>([])
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (!id) return
    Promise.all([getAdminSubscription(id), getSubscriptionNextActions(id).catch(() => null)])
      .then(([subscription, nextActionsResponse]) => {
        setItem(subscription)
        setActions(nextActionsResponse?.actions ?? fallbackNextActions(subscription))
      })
      .catch((caught) => setError(caught instanceof Error ? caught.message : 'Dossier indisponible.'))
      .finally(() => setLoading(false))
  }, [id])

  async function changeStatus(status: SubscriptionStatus) {
    if (!id) return
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      setItem(await updateAdminSubscriptionStatus(id, status))
      if (item) setActions(fallbackNextActions({ ...item, subscription: { ...item.subscription, status } }))
      setSuccess('Statut de souscription mis a jour.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Mise a jour impossible.')
    } finally {
      setSaving(false)
    }
  }

  async function regularize(id: string) {
    if (!item) return
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const response = await regularizePayment(id, 'Regularisation effectuee pendant la demo backoffice.')
      setItem({
        ...item,
        payments: item.payments.map((payment) => payment.id === id ? response.payment : payment),
        subscription: { ...item.subscription, status: 'pending_validation' },
      })
      setActions(fallbackNextActions({
        ...item,
        payments: item.payments.map((payment) => payment.id === id ? response.payment : payment),
        subscription: { ...item.subscription, status: 'pending_validation' },
      }))
      setSuccess('Paiement regularise. Le dossier repasse en validation.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Regularisation impossible.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingState label="Chargement du dossier..." />
  if (!item) return <Alert severity="error">{error || 'Dossier introuvable.'}</Alert>

  return (
    <Stack spacing={3}>
      {error && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success">{success}</Alert>}
      <Button component={Link} to="/subscriptions" variant="outlined" sx={{ alignSelf: 'flex-start' }}>Retour liste</Button>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ borderRadius: 4, p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 900, mb: 2 }}>Informations dossier</Typography>
            <Stack spacing={1}>
              <Typography>ID : {item.subscription.id}</Typography>
              <Typography>Client : {item.user ? `${item.user.firstName} ${item.user.lastName} (${item.user.email})` : 'Non renseigne'}</Typography>
              <Typography>Offre : {item.offer?.name ?? 'Non renseignee'}</Typography>
              <Typography>Statut : <StatusBadge status={item.subscription.status} /></Typography>
            </Stack>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ borderRadius: 4, p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 900, mb: 2 }}>Porteur / payeur</Typography>
            <Stack spacing={1}>
              <Typography>Porteur : {profileName(item.bearerProfile)}</Typography>
              <Typography>Payeur : {profileName(item.payerProfile)}</Typography>
              <Typography>Parcours : {item.onboardingSession?.subscriptionFor ?? 'Non renseigne'}</Typography>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ borderRadius: 4, p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 900, mb: 2 }}>Actions admin</Typography>
        <Stack spacing={1} sx={{ mb: 2 }}>
          {actions.map((action) => (
            <Alert key={action.code} severity={action.priority === 'high' ? 'warning' : 'info'}>
              <strong>{action.label}</strong> - {action.detail}
            </Alert>
          ))}
        </Stack>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <Button disabled={saving} onClick={() => changeStatus('accepted')} color="success" variant="contained">Accepter</Button>
          <Button disabled={saving} onClick={() => changeStatus('rejected')} color="error" variant="contained">Refuser</Button>
          <Button disabled={saving} onClick={() => changeStatus('suspended')} color="warning" variant="outlined">Suspendre</Button>
        </Stack>
        <TextField fullWidth label="Commentaire de refus (prepare UI, non envoye si backend non supporte)" onChange={(event) => setComment(event.target.value)} sx={{ mt: 2 }} value={comment} />
      </Paper>

      <Paper sx={{ borderRadius: 4, p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 900, mb: 2 }}>Paiements simules</Typography>
        <TableContainer>
          <Table>
            <TableHead><TableRow><TableCell>Reference</TableCell><TableCell>Type</TableCell><TableCell>Montant</TableCell><TableCell>Statut</TableCell><TableCell>Date</TableCell><TableCell align="right">Action</TableCell></TableRow></TableHead>
            <TableBody>
              {item.payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{payment.externalReference ?? payment.id.slice(0, 8)}</TableCell>
                  <TableCell>{payment.type}</TableCell>
                  <TableCell>{formatAmount(payment)}</TableCell>
                  <TableCell><StatusBadge status={payment.status} /></TableCell>
                  <TableCell>{new Date(payment.createdAt).toLocaleDateString('fr-FR')}</TableCell>
                  <TableCell align="right">
                    <Button
                      disabled={saving || !['rejected', 'cancelled', 'pending'].includes(payment.status)}
                      onClick={() => regularize(payment.id)}
                      size="small"
                      variant="outlined"
                    >
                      Regulariser
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {item.payments.length === 0 && <Typography color="text.secondary">Aucun paiement rattache a ce dossier.</Typography>}
      </Paper>

      <Paper sx={{ borderRadius: 4, p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 900, mb: 2 }}>Documents associes</Typography>
        <TableContainer>
          <Table>
            <TableHead><TableRow><TableCell>Type</TableCell><TableCell>Statut</TableCell><TableCell>Analyse</TableCell><TableCell>Date</TableCell></TableRow></TableHead>
            <TableBody>
              {item.documents.map((document) => (
                <TableRow key={document.id}>
                  <TableCell>{document.type}</TableCell>
                  <TableCell><StatusBadge status={document.status} /></TableCell>
                  <TableCell>{documentConfidence(document.analysisResult)}</TableCell>
                  <TableCell>{new Date(document.createdAt).toLocaleDateString('fr-FR')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Stack>
  )
}

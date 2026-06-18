import { Alert, Button, Divider, Grid, MenuItem, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { LoadingState } from '../components/common/LoadingState'
import { StatusBadge } from '../components/common/StatusBadge'
import { regularizePayment } from '../services/payments.service'
import { getAdminSubscription, getSubscriptionNextActions, updateAdminSubscriptionStatus } from '../services/subscriptions.service'
import type { AdminPayment } from '../types/payment'
import type { AdminProfile, AdminSubscriptionItem, SubscriptionNextAction, SubscriptionStatus } from '../types/subscription'

const statusOptions: Array<{ value: SubscriptionStatus; label: string }> = [
  { value: 'draft', label: 'Brouillon' },
  { value: 'pending_documents', label: 'Documents attendus' },
  { value: 'pending_payment', label: 'Paiement attendu' },
  { value: 'pending_validation', label: 'A valider' },
  { value: 'accepted', label: 'Accepte' },
  { value: 'rejected', label: 'Refuse' },
  { value: 'suspended', label: 'Suspendu' },
  { value: 'cancelled', label: 'Annule' },
]

function profileName(profile: AdminProfile | null) {
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

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleString('fr-FR') : 'Non renseigne'
}

function line(label: string, value: React.ReactNode) {
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ justifyContent: 'space-between' }}>
      <Typography color="text.secondary">{label}</Typography>
      <Typography sx={{ fontWeight: 700, textAlign: { sm: 'right' }, wordBreak: 'break-word' }}>{value}</Typography>
    </Stack>
  )
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

function consistencyChecks(item: AdminSubscriptionItem) {
  const checks: Array<{ severity: 'success' | 'info' | 'warning' | 'error'; message: string }> = []
  const requiredDocuments = item.offer?.requiredDocuments ?? []
  const providedDocumentTypes = new Set(item.documents.map((document) => document.type))
  const missingDocuments = requiredDocuments.filter((documentType) => !providedDocumentTypes.has(documentType))

  if (!item.user) checks.push({ severity: 'error', message: 'Aucun utilisateur rattache a cette souscription.' })
  if (!item.bearerProfile) checks.push({ severity: 'error', message: 'Aucun profil porteur rattache au dossier.' })
  if (!item.payerProfile) checks.push({ severity: 'warning', message: 'Aucun profil payeur rattache au dossier.' })
  if (!item.offer) checks.push({ severity: 'error', message: 'Aucune offre rattachee au dossier.' })
  if (!item.onboardingSession) checks.push({ severity: 'warning', message: 'Aucune session onboarding rattachee au dossier.' })

  if (item.user && item.bearerProfile?.userId && item.bearerProfile.userId !== item.subscription.userId) {
    checks.push({ severity: 'error', message: "Le porteur n'est pas rattache au meme utilisateur que la souscription." })
  }

  if (item.user && item.payerProfile?.userId && item.payerProfile.userId !== item.subscription.userId) {
    checks.push({ severity: 'warning', message: "Le payeur n'est pas rattache au meme utilisateur que la souscription." })
  }

  if (item.onboardingSession?.isBearerPayer && item.subscription.bearerProfileId !== item.subscription.payerProfileId) {
    checks.push({ severity: 'warning', message: 'Le parcours indique porteur = payeur, mais deux profils differents sont rattaches.' })
  }

  if (missingDocuments.length > 0) {
    checks.push({ severity: 'warning', message: `Justificatifs manquants pour l'offre : ${missingDocuments.join(', ')}.` })
  }

  if (checks.length === 0) checks.push({ severity: 'success', message: 'Les donnees utilisateur, profils, offre et justificatifs sont coherents.' })
  return checks
}

export function SubscriptionDetailPage() {
  const { id } = useParams()
  const [item, setItem] = useState<AdminSubscriptionItem | null>(null)
  const [actions, setActions] = useState<SubscriptionNextAction[]>([])
  const [selectedStatus, setSelectedStatus] = useState<SubscriptionStatus>('pending_validation')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (!id) return
    Promise.all([getAdminSubscription(id), getSubscriptionNextActions(id).catch(() => null)])
      .then(([subscription, nextActionsResponse]) => {
        setItem(subscription)
        setSelectedStatus(subscription.subscription.status)
        setActions(nextActionsResponse?.actions ?? fallbackNextActions(subscription))
      })
      .catch((caught) => setError(caught instanceof Error ? caught.message : 'Dossier indisponible.'))
      .finally(() => setLoading(false))
  }, [id])

  const checks = useMemo(() => item ? consistencyChecks(item) : [], [item])

  async function changeStatus(status = selectedStatus) {
    if (!id) return
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const updated = await updateAdminSubscriptionStatus(id, status)
      setItem(updated)
      setSelectedStatus(updated.subscription.status)
      setActions(fallbackNextActions(updated))
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
      const updated: AdminSubscriptionItem = {
        ...item,
        payments: item.payments.map((payment) => payment.id === id ? response.payment : payment),
        subscription: { ...item.subscription, status: 'pending_validation' },
      }
      setItem(updated)
      setSelectedStatus('pending_validation')
      setActions(fallbackNextActions(updated))
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

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ justifyContent: 'space-between' }}>
        <Button component={Link} to="/subscriptions" variant="outlined" sx={{ alignSelf: 'flex-start' }}>Retour liste</Button>
        <StatusBadge status={item.subscription.status} />
      </Stack>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Paper sx={{ borderRadius: 4, p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 900, mb: 2 }}>Dossier abonnement</Typography>
            <Stack spacing={1.2}>
              {line('Reference', item.subscription.id)}
              {line('Statut actuel', <StatusBadge status={item.subscription.status} />)}
              {line('Offre', item.offer ? `${item.offer.name} (${item.offer.code})` : 'Non renseignee')}
              {line('Creation', formatDate(item.subscription.createdAt))}
              {line('Derniere mise a jour', formatDate(item.subscription.updatedAt))}
              {line('Session onboarding', item.onboardingSession?.id ?? 'Non renseignee')}
            </Stack>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }}>
          <Paper sx={{ borderRadius: 4, p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 900, mb: 2 }}>Modification du statut</Typography>
            <Stack spacing={2}>
              <TextField
                label="Nouveau statut"
                onChange={(event) => setSelectedStatus(event.target.value as SubscriptionStatus)}
                select
                value={selectedStatus}
              >
                {statusOptions.map((status) => (
                  <MenuItem key={status.value} value={status.value}>
                    {status.label}
                  </MenuItem>
                ))}
              </TextField>
              <Button disabled={saving || selectedStatus === item.subscription.status} onClick={() => changeStatus()} variant="contained">
                Mettre a jour le statut
              </Button>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <Button disabled={saving} onClick={() => changeStatus('accepted')} color="success" variant="outlined">Accepter</Button>
                <Button disabled={saving} onClick={() => changeStatus('rejected')} color="error" variant="outlined">Refuser</Button>
                <Button disabled={saving} onClick={() => changeStatus('suspended')} color="warning" variant="outlined">Suspendre</Button>
              </Stack>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ borderRadius: 4, p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 900, mb: 2 }}>Cohérence donnees utilisateur</Typography>
        <Stack spacing={1.2}>
          {checks.map((check) => (
            <Alert key={check.message} severity={check.severity}>{check.message}</Alert>
          ))}
        </Stack>
      </Paper>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ borderRadius: 4, height: '100%', p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 900, mb: 2 }}>Utilisateur</Typography>
            <Stack spacing={1.2}>
              {line('Nom', item.user ? `${item.user.firstName} ${item.user.lastName}` : 'Non renseigne')}
              {line('Email', item.user?.email ?? 'Non renseigne')}
              {line('Role', item.user?.role ?? 'Non renseigne')}
              {line('Consentement RGPD', item.user?.rgpdConsent === undefined ? 'Non renseigne' : item.user.rgpdConsent ? 'Oui' : 'Non')}
              {line('Utilisateur ID', item.user?.id ?? item.subscription.userId)}
            </Stack>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ borderRadius: 4, height: '100%', p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 900, mb: 2 }}>Porteur</Typography>
            <Stack spacing={1.2}>
              {line('Nom', profileName(item.bearerProfile))}
              {line('Email', item.bearerProfile?.email ?? 'Non renseigne')}
              {line('Date de naissance', item.bearerProfile?.birthDate ?? 'Non renseigne')}
              {line('Statut', item.bearerProfile?.status ?? 'Non renseigne')}
              {line('Profil ID', item.subscription.bearerProfileId ?? 'Non renseigne')}
            </Stack>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ borderRadius: 4, height: '100%', p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 900, mb: 2 }}>Payeur</Typography>
            <Stack spacing={1.2}>
              {line('Nom', profileName(item.payerProfile))}
              {line('Email', item.payerProfile?.email ?? 'Non renseigne')}
              {line('Relation porteur', item.payerProfile?.relationshipToBearer ?? 'Non renseigne')}
              {line('Porteur = payeur', item.onboardingSession?.isBearerPayer ? 'Oui' : 'Non')}
              {line('Profil ID', item.subscription.payerProfileId ?? 'Non renseigne')}
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ borderRadius: 4, height: '100%', p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 900, mb: 2 }}>Offre choisie</Typography>
            <Stack spacing={1.2}>
              {line('Nom', item.offer?.name ?? 'Non renseignee')}
              {line('Code', item.offer?.code ?? 'Non renseigne')}
              {line('Cible', item.offer?.target ?? 'Non renseignee')}
              {line('Active', item.offer?.isActive === undefined ? 'Non renseigne' : item.offer.isActive ? 'Oui' : 'Non')}
              <Divider />
              <Typography color="text.secondary">Justificatifs requis</Typography>
              <Typography sx={{ fontWeight: 700 }}>{item.offer?.requiredDocuments?.length ? item.offer.requiredDocuments.join(', ') : 'Aucun'}</Typography>
            </Stack>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ borderRadius: 4, height: '100%', p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 900, mb: 2 }}>Parcours onboarding</Typography>
            <Stack spacing={1.2}>
              {line('Etape courante', item.onboardingSession?.currentStep ?? 'Non renseignee')}
              {line('Souscription pour', item.onboardingSession?.subscriptionFor ?? 'Non renseigne')}
              {line('Porteur payeur', item.onboardingSession?.isBearerPayer ? 'Oui' : 'Non')}
              {line('Session ID', item.onboardingSession?.id ?? 'Non renseigne')}
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ borderRadius: 4, p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 900, mb: 2 }}>Actions admin recommandees</Typography>
        <Stack spacing={1}>
          {actions.map((action) => (
            <Alert key={action.code} severity={action.priority === 'high' ? 'warning' : 'info'}>
              <strong>{action.label}</strong> - {action.detail}
            </Alert>
          ))}
        </Stack>
      </Paper>

      <Paper sx={{ borderRadius: 4, p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 900, mb: 2 }}>Paiements</Typography>
        <TableContainer>
          <Table>
            <TableHead><TableRow><TableCell>Reference</TableCell><TableCell>Type</TableCell><TableCell>Montant</TableCell><TableCell>Statut</TableCell><TableCell>Traite le</TableCell><TableCell>Creation</TableCell><TableCell align="right">Action</TableCell></TableRow></TableHead>
            <TableBody>
              {item.payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{payment.externalReference ?? payment.id.slice(0, 8)}</TableCell>
                  <TableCell>{payment.type}</TableCell>
                  <TableCell>{formatAmount(payment)}</TableCell>
                  <TableCell><StatusBadge status={payment.status} /></TableCell>
                  <TableCell>{formatDate(payment.processedAt)}</TableCell>
                  <TableCell>{formatDate(payment.createdAt)}</TableCell>
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
        <Typography variant="h6" sx={{ fontWeight: 900, mb: 2 }}>Documents</Typography>
        <TableContainer>
          <Table>
            <TableHead><TableRow><TableCell>Type</TableCell><TableCell>Fichier</TableCell><TableCell>Statut</TableCell><TableCell>Analyse</TableCell><TableCell>Motif refus</TableCell><TableCell>Creation</TableCell></TableRow></TableHead>
            <TableBody>
              {item.documents.map((document) => (
                <TableRow key={document.id}>
                  <TableCell>{document.type}</TableCell>
                  <TableCell>{document.originalFilename ?? document.fileUrl}</TableCell>
                  <TableCell><StatusBadge status={document.status} /></TableCell>
                  <TableCell>{documentConfidence(document.analysisResult)}</TableCell>
                  <TableCell>{document.rejectionReason ?? 'Aucun'}</TableCell>
                  <TableCell>{formatDate(document.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {item.documents.length === 0 && <Typography color="text.secondary">Aucun document rattache a ce dossier.</Typography>}
      </Paper>
    </Stack>
  )
}

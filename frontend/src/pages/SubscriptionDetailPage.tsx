import { Alert, Box, Button, Chip, Grid, MenuItem, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { analyzeDocument, createDocument, resubmitDocument } from '../services/documents.service'
import { createDirectPayment, createMandatePayment, regularizePayment, simulatePayment } from '../services/payments.service'
import { getSubscriptionById, getSubscriptionNextActions } from '../services/subscriptions.service'
import type { DocumentSummary, DocumentType, PaymentSummary, SubscriptionNextAction, SubscriptionStatus, SubscriptionSummary } from '../types'

const statusLabel: Record<SubscriptionStatus, string> = {
  draft: 'Brouillon',
  pending_documents: 'Documents attendus',
  pending_payment: 'Paiement attendu',
  pending_validation: 'En validation',
  accepted: 'Acceptee',
  rejected: 'Refusee',
  cancelled: 'Annulee',
  suspended: 'Suspendue',
}

const statusTone: Record<string, 'default' | 'warning' | 'success' | 'error' | 'info'> = {
  draft: 'default',
  pending_documents: 'warning',
  pending_payment: 'warning',
  pending_validation: 'info',
  accepted: 'success',
  rejected: 'error',
  cancelled: 'default',
  suspended: 'warning',
  pending: 'warning',
  analyzing: 'info',
  validated: 'success',
  needs_manual_review: 'warning',
  simulated: 'info',
  regularized: 'success',
}

const documentTypeLabels: Record<DocumentType, string> = {
  identity: "Piece d'identite",
  proof_of_address: 'Justificatif de domicile',
  eligibility: 'Justificatif eligibilite',
  school_certificate: 'Certificat de scolarite',
  tax_notice: 'Avis fiscal',
  other: 'Autre document',
}

function normalizeDocumentType(value: string): DocumentType {
  const normalized = value.toLowerCase()
  if (normalized.includes('school') || normalized.includes('scolar')) return 'school_certificate'
  if (normalized.includes('address') || normalized.includes('domicile')) return 'proof_of_address'
  if (normalized.includes('eligib') || normalized.includes('solidar')) return 'eligibility'
  if (normalized.includes('tax') || normalized.includes('fiscal') || normalized.includes('impot')) return 'tax_notice'
  if (normalized.includes('ident') || normalized.includes('piece')) return 'identity'
  return ['identity', 'proof_of_address', 'eligibility', 'school_certificate', 'tax_notice', 'other'].includes(normalized) ? normalized as DocumentType : 'other'
}

function profileName(profile: SubscriptionSummary['bearerProfile']) {
  return profile ? `${profile.firstName} ${profile.lastName}` : 'Non renseigne'
}

function confidence(document: DocumentSummary) {
  const result = document.analysisResult
  return result && typeof result === 'object' && 'confidence' in result && typeof result.confidence === 'number'
    ? `${result.confidence}%`
    : 'Non analysee'
}

function formatAmount(payment: PaymentSummary) {
  return new Intl.NumberFormat('fr-FR', { currency: payment.currency, style: 'currency' }).format(payment.amountCents / 100)
}

function fallbackActions(item: SubscriptionSummary): SubscriptionNextAction[] {
  const actions: SubscriptionNextAction[] = []
  if ((item.documents ?? []).some((document) => document.status === 'pending' || document.status === 'needs_manual_review')) actions.push({ code: 'documents', priority: 'high', label: 'Suivre les justificatifs', detail: 'Un document attend une analyse ou une validation.' })
  if ((item.payments ?? []).some((payment) => payment.status === 'rejected' || payment.status === 'cancelled')) actions.push({ code: 'payment', priority: 'high', label: 'Regulariser le paiement', detail: 'Un paiement bloque le dossier.' })
  if (item.subscription.status === 'pending_payment') actions.push({ code: 'pay', priority: 'high', label: 'Payer la souscription', detail: 'Le paiement est attendu pour continuer.' })
  if (item.subscription.status === 'pending_validation') actions.push({ code: 'validation', priority: 'medium', label: 'Attendre la validation', detail: 'Le dossier est chez Comutitres.' })
  if (!actions.length) actions.push({ code: 'none', priority: 'low', label: 'Aucune action urgente', detail: 'Le dossier suit son traitement normal.' })
  return actions
}

export function SubscriptionDetailPage() {
  const { id } = useParams()
  const [item, setItem] = useState<SubscriptionSummary | null>(null)
  const [actions, setActions] = useState<SubscriptionNextAction[]>([])
  const [documentForm, setDocumentForm] = useState<{ type: DocumentType; fileUrl: string }>({ type: 'school_certificate', fileUrl: '' })
  const [paymentMode, setPaymentMode] = useState<'one_time' | 'monthly'>('one_time')
  const [ibanLast4, setIbanLast4] = useState('1234')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function refresh() {
    if (!id) return
    const subscription = await getSubscriptionById(id)
    setItem(subscription)
    const nextActions = await getSubscriptionNextActions(id).catch(() => ({ actions: fallbackActions(subscription) }))
    setActions(nextActions.actions)
  }

  useEffect(() => {
    if (!id) return
    const subscriptionId = id
    let mounted = true

    async function loadInitial() {
      try {
        const subscription = await getSubscriptionById(subscriptionId)
        if (!mounted) return
        setItem(subscription)
        const nextActions = await getSubscriptionNextActions(subscriptionId).catch(() => ({ actions: fallbackActions(subscription) }))
        if (mounted) setActions(nextActions.actions)
      } catch (caught) {
        if (mounted) setError(caught instanceof Error ? caught.message : 'Dossier indisponible.')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    void loadInitial()
    return () => { mounted = false }
  }, [id])

  const requiredDocuments = useMemo(() => {
    const existing = new Set((item?.documents ?? []).map((document) => document.type))
    return (item?.offer?.requiredDocuments ?? []).map(normalizeDocumentType).filter((type) => !existing.has(type))
  }, [item])

  async function submitDocument(event: FormEvent) {
    event.preventDefault()
    if (!id) return
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await createDocument(id, documentForm)
      setDocumentForm({ ...documentForm, fileUrl: '' })
      await refresh()
      setSuccess('Document ajoute. Vous pouvez lancer son analyse.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Ajout du document impossible.')
    } finally {
      setSaving(false)
    }
  }

  async function analyze(idToAnalyze: string) {
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await analyzeDocument(idToAnalyze)
      await refresh()
      setSuccess('Analyse documentaire simulee terminee.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Analyse impossible.')
    } finally {
      setSaving(false)
    }
  }

  async function resubmit(document: DocumentSummary) {
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await resubmitDocument(document.id, { type: document.type, fileUrl: `${document.fileUrl}-nouvelle-version` })
      await refresh()
      setSuccess('Document renvoye pour traitement.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Renvoi impossible.')
    } finally {
      setSaving(false)
    }
  }

  async function simulate() {
    if (!id) return
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const response = await simulatePayment({ subscriptionId: id, paymentMode })
      await refresh()
      setSuccess(`Simulation : ${(response.simulation.totalCents / 100).toFixed(2)} EUR.`)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Simulation impossible.')
    } finally {
      setSaving(false)
    }
  }

  async function pay(simulateFailure = false) {
    if (!id) return
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await createDirectPayment({ subscriptionId: id, cardToken: 'demo-card-token', simulateFailure })
      await refresh()
      setSuccess(simulateFailure ? 'Paiement refuse simule. Une regularisation sera demandee.' : 'Paiement accepte. Le dossier passe en validation.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Paiement impossible.')
    } finally {
      setSaving(false)
    }
  }

  async function mandate() {
    if (!id) return
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await createMandatePayment({ subscriptionId: id, holderName: profileName(item?.payerProfile ?? item?.bearerProfile ?? null), ibanLast4, mandateAccepted: true })
      await refresh()
      setSuccess('Mandat SEPA prototype accepte.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Mandat impossible.')
    } finally {
      setSaving(false)
    }
  }

  async function regularize(idToRegularize: string) {
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await regularizePayment(idToRegularize)
      await refresh()
      setSuccess('Paiement regularise.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Regularisation impossible.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Alert severity="info">Chargement du dossier...</Alert>
  if (!item) return <Alert severity="error">{error || 'Dossier introuvable.'}</Alert>

  return (
    <Stack spacing={3}>
      <Button component={Link} to="/subscriptions" variant="outlined" sx={{ alignSelf: 'flex-start' }}>Retour aux souscriptions</Button>
      {error && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success">{success}</Alert>}

      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { md: 'center' } }}>
          <Box>
            <Typography color="text.secondary" variant="body2">Dossier {item.subscription.id.slice(0, 8)}</Typography>
            <Typography variant="h4" sx={{ fontWeight: 900 }}>{item.offer?.name ?? 'Offre non associee'}</Typography>
            <Typography color="text.secondary">Porteur : {profileName(item.bearerProfile)} - Payeur : {profileName(item.payerProfile)}</Typography>
          </Box>
          <Chip color={statusTone[item.subscription.status]} label={statusLabel[item.subscription.status]} />
        </Stack>
      </Paper>

      <Grid container spacing={2}>
        {actions.map((action) => (
          <Grid key={action.code} size={{ xs: 12, md: 4 }}>
            <Alert severity={action.priority === 'high' ? 'warning' : 'info'} sx={{ height: '100%' }}>
              <strong>{action.label}</strong><br />{action.detail}
            </Alert>
          </Grid>
        ))}
      </Grid>

      <Paper component="form" onSubmit={submitDocument} sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>Justificatifs</Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>Ajoutez un nom de fichier ou une URL de demo, puis lancez l'analyse documentaire simulee.</Typography>
        {requiredDocuments.length > 0 && (
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', mb: 2 }}>
            {requiredDocuments.map((type) => (
              <Button key={type} onClick={() => setDocumentForm({ type, fileUrl: `demo-${type}.pdf` })} size="small" variant="outlined">
                Ajouter {documentTypeLabels[type]}
              </Button>
            ))}
          </Stack>
        )}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
          <TextField label="Type" onChange={(event) => setDocumentForm({ ...documentForm, type: event.target.value as DocumentType })} select value={documentForm.type} sx={{ minWidth: 240 }}>
            {Object.entries(documentTypeLabels).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
          </TextField>
          <TextField fullWidth label="Nom du fichier / URL" onChange={(event) => setDocumentForm({ ...documentForm, fileUrl: event.target.value })} required value={documentForm.fileUrl} />
          <Button disabled={saving} type="submit" variant="contained">Ajouter</Button>
        </Stack>
        <TableContainer>
          <Table size="small">
            <TableHead><TableRow><TableCell>Document</TableCell><TableCell>Statut</TableCell><TableCell>Analyse</TableCell><TableCell>Mis a jour</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead>
            <TableBody>
              {(item.documents ?? []).map((document) => (
                <TableRow key={document.id}>
                  <TableCell>{documentTypeLabels[document.type] ?? document.type}<br /><Typography color="text.secondary" variant="caption">{document.fileUrl}</Typography></TableCell>
                  <TableCell><Chip color={statusTone[document.status]} label={document.status} size="small" /></TableCell>
                  <TableCell>{confidence(document)}</TableCell>
                  <TableCell>{new Date(document.updatedAt).toLocaleDateString('fr-FR')}</TableCell>
                  <TableCell align="right">
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ justifyContent: 'flex-end' }}>
                      <Button disabled={saving} onClick={() => analyze(document.id)} size="small" variant="outlined">Analyser</Button>
                      {document.status === 'rejected' && <Button disabled={saving} onClick={() => resubmit(document)} size="small" variant="outlined">Renvoyer</Button>}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {(item.documents ?? []).length === 0 && <Alert severity="info" sx={{ mt: 2 }}>Aucun justificatif ajoute pour le moment.</Alert>}
      </Paper>

      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>Paiement prototype</Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>Simulation gratuite : aucune vraie donnee bancaire n'est collectee.</Typography>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
          <TextField label="Mode" onChange={(event) => setPaymentMode(event.target.value as 'one_time' | 'monthly')} select value={paymentMode} sx={{ minWidth: 180 }}>
            <MenuItem value="one_time">Comptant</MenuItem>
            <MenuItem value="monthly">Mensuel</MenuItem>
          </TextField>
          <Button disabled={saving} onClick={simulate} variant="outlined">Simuler</Button>
          <Button disabled={saving} onClick={() => pay(false)} variant="contained">Payer demo</Button>
          <Button color="warning" disabled={saving} onClick={() => pay(true)} variant="outlined">Simuler echec</Button>
        </Stack>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
          <TextField label="4 derniers chiffres IBAN" onChange={(event) => setIbanLast4(event.target.value)} value={ibanLast4} />
          <Button disabled={saving || !/^\d{4}$/.test(ibanLast4)} onClick={mandate} variant="outlined">Signer mandat demo</Button>
        </Stack>
        <TableContainer>
          <Table size="small">
            <TableHead><TableRow><TableCell>Reference</TableCell><TableCell>Type</TableCell><TableCell>Montant</TableCell><TableCell>Statut</TableCell><TableCell align="right">Action</TableCell></TableRow></TableHead>
            <TableBody>
              {(item.payments ?? []).map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{payment.externalReference ?? payment.id.slice(0, 8)}</TableCell>
                  <TableCell>{payment.type}</TableCell>
                  <TableCell>{formatAmount(payment)}</TableCell>
                  <TableCell><Chip color={statusTone[payment.status]} label={payment.status} size="small" /></TableCell>
                  <TableCell align="right">
                    <Button disabled={saving || !['rejected', 'cancelled', 'pending'].includes(payment.status)} onClick={() => regularize(payment.id)} size="small" variant="outlined">
                      Regulariser
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Stack>
  )
}

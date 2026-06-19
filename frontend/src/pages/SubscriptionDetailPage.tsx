import { Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Divider, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material'
import { useEffect, useMemo, useRef, useState, type DragEvent } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Circle,
  ClipboardCheck,
  CloudUpload,
  CreditCard,
  FileText,
  FolderOpen,
  History,
  Pencil,
  RotateCcw,
  Send,
  ShieldCheck,
  ShieldX,
  X,
} from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { createDocument, resubmitDocument } from '../services/documents.service'
import { createDirectPayment, createMandatePayment, simulatePayment } from '../services/payments.service'
import { acceptSubscriptionRenewal, cancelSubscription, cancelSubscriptionRenewal, cancelSubscriptionTermination, getSubscriptionById, getSubscriptionRenewal, getSubscriptionTermination, requestSubscriptionTermination, submitSubscription } from '../services/subscriptions.service'
import { PaymentMethodSection } from '../components/payment/PaymentMethodSection'
import { buildCardToken, validateCardFields } from '../components/payment/cardPaymentUtils'
import { validateSepaFields } from '../components/payment/sepaPaymentUtils'
import { colors } from '../theme/colors'
import type { DocumentSummary, DocumentType, PaymentSimulation, RenewalSummary, SubscriptionStatus, SubscriptionSummary, TerminationSummary } from '../types'
import { useSubscriptionRealtime } from '../hooks/useSubscriptionRealtime'
import { subscriptionStatusLabels } from '../utils/statusLabels'

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
}

const documentTypeLabels: Record<DocumentType, string> = {
  identity: "Pièce d'identité",
  proof_of_address: 'Justificatif de domicile',
  eligibility: "Justificatif d'éligibilité",
  school_certificate: 'Certificat de scolarité',
  tax_notice: 'Avis fiscal',
  other: 'Autre document',
}

const acceptedCopy: Record<DocumentType, string> = {
  identity: "Carte d'identité, passeport ou titre de séjour en cours de validité. Formats acceptés : PDF, JPG ou PNG.",
  proof_of_address: 'Facture, quittance ou attestation de domicile de moins de 3 mois. Formats acceptés : PDF, JPG ou PNG.',
  eligibility: 'Attestation de droits ou justificatif officiel de situation sociale. Formats acceptés : PDF, JPG ou PNG.',
  school_certificate: "Certificat de scolarité ou attestation étudiante pour l'année en cours. Formats acceptés : PDF, JPG ou PNG.",
  tax_notice: 'Avis fiscal complet et lisible. Formats acceptés : PDF, JPG ou PNG.',
  other: 'Document justificatif lisible demandé pour ce dossier. Formats acceptés : PDF, JPG ou PNG.',
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
  return profile ? `${profile.firstName} ${profile.lastName}` : 'Non renseigné'
}

function confidence(document: DocumentSummary) {
  const result = document.analysisResult
  return result && typeof result === 'object' && 'confidence' in result && typeof result.confidence === 'number'
    ? `${result.confidence}%`
    : 'Non analysée'
}

function displayDocumentName(document: DocumentSummary) {
  return document.originalFilename ?? document.fileUrl
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

function documentStatusMeta(document?: DocumentSummary) {
  if (!document) return { label: 'À déposer', color: colors.greyDark, icon: <Circle size={18} /> }
  if (document.status === 'validated') return { label: 'Vérifié automatiquement', color: colors.greenDark, icon: <CheckCircle2 size={18} /> }
  if (document.status === 'rejected') return { label: 'À remplacer', color: colors.redDark, icon: <AlertCircle size={18} /> }
  if (document.status === 'needs_manual_review') return { label: 'Revue humaine nécessaire', color: colors.orangeDark, icon: <AlertCircle size={18} /> }
  if (document.status === 'analyzing') return { label: 'Analyse en cours', color: colors.blueInteraction, icon: <RotateCcw size={18} /> }
  return { label: document.analyzedAt ? 'Déposé' : "Déposé · analyse à l'envoi", color: colors.orangeDark, icon: <FileText size={18} /> }
}

function formatEuros(cents: number, currency = 'EUR') {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(cents / 100)
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function uniqueDocumentTypes(types: DocumentType[]) {
  return types.filter((type, index, list) => list.indexOf(type) === index)
}

function terminationMonthOptions(count = 13) {
  const formatter = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' })
  const now = new Date()
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() + index, 1)
    return {
      value: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
      label: formatter.format(date),
    }
  })
}

function workflowPresentation(item: SubscriptionSummary) {
  switch (item.workflow.state) {
    case 'documents_required':
      return { title: 'Complétez les justificatifs', description: "Déposez les pièces indiquées ci-dessous. L'analyse simulée sera lancée lors de l'envoi final.", severity: 'warning' as const }
    case 'payment_required':
      return { title: 'Le dossier attend votre paiement', description: 'Les justificatifs sont déposés. Choisissez maintenant votre mode de règlement.', severity: 'warning' as const }
    case 'ready_to_submit':
      return { title: 'Votre dossier est prêt', description: 'Vérifiez le récapitulatif puis envoyez le dossier à Comutitres.', severity: 'success' as const }
    case 'under_review':
      return { title: 'Dossier en cours d’étude', description: 'Comutitres vérifie votre demande. Vous serez informé dès qu’une décision sera prise.', severity: 'info' as const }
    case 'needs_action':
      return { title: 'Une correction est nécessaire', description: 'Remplacez uniquement les justificatifs refusés indiqués dans le dossier.', severity: 'error' as const }
    case 'approved':
      return { title: 'Dossier validé', description: 'Votre demande a été acceptée par Comutitres.', severity: 'success' as const }
    case 'rejected':
      return { title: 'Dossier refusé', description: 'Consultez les informations du dossier ou contactez le support si nécessaire.', severity: 'error' as const }
    case 'cancelled':
      return { title: 'Demande annulée', description: 'Ce dossier est terminé. Vous pouvez créer une nouvelle demande.', severity: 'info' as const }
    case 'suspended':
      return { title: 'Dossier suspendu', description: 'Une intervention du support Comutitres est nécessaire.', severity: 'warning' as const }
  }
}

export function SubscriptionDetailPage() {
  const { id } = useParams()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [item, setItem] = useState<SubscriptionSummary | null>(null)
  const [activeStep, setActiveStep] = useState(0)
  const [preparedFiles, setPreparedFiles] = useState<Partial<Record<DocumentType, File>>>({})
  const [isDraggingDocument, setIsDraggingDocument] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [paymentMode, setPaymentMode] = useState<'one_time' | 'monthly'>('one_time')
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'mandate'>('card')
  const [renewal, setRenewal] = useState<RenewalSummary | null>(null)
  const [renewalReason, setRenewalReason] = useState('')
  const [renewing, setRenewing] = useState(false)
  const [termination, setTermination] = useState<TerminationSummary | null>(null)
  const [terminationReason, setTerminationReason] = useState('')
  const [terminationMonth, setTerminationMonth] = useState(terminationMonthOptions(1)[0]?.value ?? '')
  const [terminationDialogOpen, setTerminationDialogOpen] = useState(false)
  const [terminating, setTerminating] = useState(false)
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvv, setCardCvv] = useState('')
  const [cardholderName, setCardholderName] = useState('')
  const [simulateFailure, setSimulateFailure] = useState(false)
  const [holderName, setHolderName] = useState('')
  const [iban, setIban] = useState('')
  const [bic, setBic] = useState('')
  const [mandateAccepted, setMandateAccepted] = useState(false)
  const [simulation, setSimulation] = useState<PaymentSimulation | null>(null)
  const [simulating, setSimulating] = useState(false)
  const [paying, setPaying] = useState(false)

  async function refresh() {
    if (!id) return
    const [subscription, renewalResponse, terminationResponse] = await Promise.all([
      getSubscriptionById(id),
      getSubscriptionRenewal(id).catch(() => null),
      getSubscriptionTermination(id).catch(() => null),
    ])
    setItem(subscription)
    setRenewal(renewalResponse)
    setTermination(terminationResponse)
  }

  useSubscriptionRealtime((detail) => {
    if (detail.subscriptionId !== id) return
    void refresh().catch((caught) => setError(caught instanceof Error ? caught.message : 'Actualisation du dossier impossible.'))
  })

  useEffect(() => {
    if (!id) return
    const subscriptionId = id
    let mounted = true

    async function loadInitial() {
      try {
        const [subscription, renewalResponse, terminationResponse] = await Promise.all([
          getSubscriptionById(subscriptionId),
          getSubscriptionRenewal(subscriptionId).catch(() => null),
          getSubscriptionTermination(subscriptionId).catch(() => null),
        ])
        if (mounted) {
          setItem(subscription)
          setRenewal(renewalResponse)
          setTermination(terminationResponse)
        }
      } catch (caught) {
        if (mounted) setError(caught instanceof Error ? caught.message : 'Dossier indisponible.')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    void loadInitial()
    return () => { mounted = false }
  }, [id])

  const documentSteps = useMemo(() => {
    const requiredTypes = (item?.workflow.requiredDocumentTypes ?? item?.offer?.requiredDocuments ?? []).map(normalizeDocumentType)
    const existingTypes = (item?.documents ?? []).map((document) => document.type)
    return uniqueDocumentTypes(requiredTypes.length > 0 ? requiredTypes : existingTypes.length > 0 ? existingTypes : ['other'])
  }, [item])

  const activeDocumentType = activeStep < documentSteps.length ? documentSteps[activeStep] : undefined
  const activeDocument = activeDocumentType ? item?.documents.find((document) => document.type === activeDocumentType) : undefined
  const preparedCount = documentSteps.filter((type) => preparedFiles[type]).length
  const completedCount = documentSteps.filter((type) => item?.documents.some((document) => document.type === type) || preparedFiles[type]).length
  const allDocumentsDeposited = completedCount === documentSteps.length
  const paymentStepIndex = documentSteps.length
  const finalStepIndex = documentSteps.length + 1
  const isPaymentStep = activeStep === paymentStepIndex
  const isFinalStep = activeStep === finalStepIndex
  const stepperItems = [...documentSteps, 'payment' as const, 'final' as const]
  const selectedDocumentFile = activeDocumentType ? preparedFiles[activeDocumentType] ?? null : null
  const hasCompletedPayment = item?.workflow.hasAcceptedPayment ?? false
  const draftDocumentsEditable = item?.subscription.status === 'draft' && !item.subscription.submittedAt
  const activeCanReplace = activeDocumentType
    ? (item?.workflow.replaceableDocumentTypes?.includes(activeDocumentType) ?? false) || draftDocumentsEditable
    : false
  const historyItems = useMemo(() => {
    if (!item) return []

    return [
      {
        id: `subscription-created-${item.subscription.id}`,
        date: item.subscription.createdAt,
        title: 'Souscription creee',
        detail: item.offer?.name ?? 'Offre non associee',
        status: item.subscription.status,
      },
      ...item.documents.map((document) => ({
        id: `document-${document.id}`,
        date: document.updatedAt,
        title: `Document ${documentStatusMeta(document).label.toLowerCase()}`,
        detail: `${documentTypeLabels[document.type]} - ${displayDocumentName(document)}`,
        status: document.status,
      })),
      ...item.payments.map((payment) => ({
        id: `payment-${payment.id}`,
        date: payment.updatedAt,
        title: `Paiement ${payment.status}`,
        detail: `${payment.type} - ${formatEuros(payment.amountCents, payment.currency)}`,
        status: payment.status,
      })),
      ...(renewal?.events ?? []).map((event) => ({
        id: `renewal-${event.id}`,
        date: event.createdAt,
        title: `Renouvellement ${event.action}`,
        detail: event.reason ?? 'Decision de renouvellement enregistree',
        status: event.action === 'accepted' || event.action === 'requested' ? 'accepted' : event.action === 'suspended' ? 'suspended' : 'cancelled',
      })),
      {
        id: `subscription-updated-${item.subscription.id}`,
        date: item.subscription.updatedAt,
        title: 'Donnees synchronisees',
        detail: `Statut actuel : ${subscriptionStatusLabels[item.subscription.status]}`,
        status: item.subscription.status,
      },
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [item, renewal])

  useEffect(() => {
    if (item?.bearerProfile) {
      const name = `${item.bearerProfile.firstName} ${item.bearerProfile.lastName}`
      setHolderName(name)
      setCardholderName(name)
    }
  }, [item])

  function selectDocumentFile(file?: File) {
    if (!file || !activeDocumentType) return
    setPreparedFiles((current) => ({ ...current, [activeDocumentType]: file }))
  }

  function clearSelectedFile() {
    if (activeDocumentType) {
      setPreparedFiles((current) => {
        const next = { ...current }
        delete next[activeDocumentType]
        return next
      })
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleDocumentDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDraggingDocument(false)
    selectDocumentFile(event.dataTransfer.files[0])
  }

  async function saveCurrentDocumentAndContinue() {
    if (!id || !activeDocumentType) return
    const file = preparedFiles[activeDocumentType]
    if (!activeDocument && !file) {
      setError(`Ajoutez ${documentTypeLabels[activeDocumentType].toLowerCase()} avant de continuer.`)
      return
    }
    if (activeDocument?.status === 'rejected' && !file) {
      setError('Ce document a été refusé. Choisissez un nouveau fichier avant de continuer.')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')
    try {
      if (file) {
        if (activeDocument) await resubmitDocument(activeDocument.id, { type: activeDocumentType, file })
        else await createDocument(id, { type: activeDocumentType, file })
        setPreparedFiles((current) => {
          const next = { ...current }
          delete next[activeDocumentType]
          return next
        })
      }
      const latest = await getSubscriptionById(id)
      setItem(latest)
      const nextStep = activeStep === documentSteps.length - 1 ? paymentStepIndex : activeStep + 1
      goToStep(nextStep)
      if (file) setSuccess("Document enregistré. Il sera analysé lors de l'envoi final.")
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Enregistrement du document impossible.')
    } finally {
      setSaving(false)
    }
  }

  function goToStep(step: number) {
    setActiveStep(Math.max(0, Math.min(step, finalStepIndex)))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function runPaymentSimulation() {
    if (!id) return
    setSimulating(true)
    setError('')
    setSuccess('')
    setSimulation(null)
    try {
      const response = await simulatePayment({ subscriptionId: id, paymentMode })
      setSimulation(response.simulation)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Simulation impossible.')
    } finally {
      setSimulating(false)
    }
  }

  async function submitPayment() {
    if (!id) return
    if (!simulation) {
      setError('Lancez d’abord une simulation pour connaître le montant.')
      return
    }

    setPaying(true)
    setError('')
    setSuccess('')
    try {
      if (paymentMethod === 'card') {
        const cardError = simulation.totalCents === 0 ? null : validateCardFields(cardNumber, cardExpiry, cardCvv, cardholderName)
        if (cardError) {
          setError(cardError)
          return
        }
        await createDirectPayment({ subscriptionId: id, paymentMode, cardToken: simulation.totalCents === 0 ? undefined : buildCardToken(cardNumber), simulateFailure })
        setSuccess(simulateFailure ? 'Paiement refusé (simulation).' : 'Paiement accepté.')
      } else {
        if (paymentMode !== 'monthly') {
          setPaymentMethod('card')
          setError('Le prélèvement SEPA est disponible uniquement avec la mensualisation.')
          return
        }
        const sepaError = validateSepaFields(holderName, iban, bic)
        if (sepaError) {
          setError(sepaError)
          return
        }
        if (!mandateAccepted) {
          setError('Vous devez accepter le mandat SEPA.')
          return
        }
        await createMandatePayment({
          subscriptionId: id,
          paymentMode: 'monthly',
          holderName,
          ibanLast4: iban.replace(/\s/g, '').slice(-4),
          bic,
          mandateAccepted: true,
        })
        setSuccess('Mandat SEPA enregistré. Les prélèvements suivront l’échéancier affiché.')
      }
      await refresh()
      setSimulation(null)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Paiement impossible.')
    } finally {
      setPaying(false)
    }
  }

  async function requestRenewal() {
    if (!id) return
    setRenewing(true)
    setError('')
    setSuccess('')
    try {
      await acceptSubscriptionRenewal(id, renewalReason || "Demande de renouvellement depuis l'espace client.")
      await refresh()
      setRenewalReason('')
      setSuccess('Votre demande de renouvellement est enregistrée. Votre forfait actuel reste actif.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Action de renouvellement impossible.')
    } finally {
      setRenewing(false)
    }
  }

  async function submitFullDossier() {
    if (!id) return
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      for (const type of documentSteps) {
        const file = preparedFiles[type]
        if (!file) continue
        const existingDocument = item?.documents.find((document) => document.type === type)
        if (existingDocument) await resubmitDocument(existingDocument.id, { type, file })
        else await createDocument(id, { type, file })
      }
      setPreparedFiles({})
      const latest = await getSubscriptionById(id)
      if (latest.workflow.canSubmit) {
        const submitted = await submitSubscription(id)
        setItem(submitted)
        setSuccess('Dossier envoyé pour validation Comutitres.')
      } else {
        setItem(latest)
        setSuccess('Documents enregistrés. Le dossier sera envoyable dès que tous les contrôles seront validés.')
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Envoi du dossier impossible.')
    } finally {
      setSaving(false)
    }
  }

  async function cancelRenewalRequest() {
    if (!id) return
    setRenewing(true)
    setError('')
    setSuccess('')
    try {
      await cancelSubscriptionRenewal(id, renewalReason || "Annulation de la demande depuis l'espace client.")
      await refresh()
      setRenewalReason('')
      setSuccess('La demande de renouvellement est annulée. Votre forfait actuel reste actif.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "La demande de renouvellement n'a pas pu être annulée.")
    } finally {
      setRenewing(false)
    }
  }

  async function submitTerminationRequest() {
    if (!id) return
    if (terminationReason.trim().length < 3) {
      setError('Précisez en quelques mots la raison de votre résiliation.')
      return
    }
    setTerminating(true)
    setError('')
    setSuccess('')
    try {
      setTermination(await requestSubscriptionTermination(id, { reason: terminationReason.trim(), effectiveMonth: terminationMonth }))
      setTerminationDialogOpen(false)
      setTerminationReason('')
      setSuccess("Votre demande de résiliation est enregistrée. L'abonnement reste actif jusqu'à la date indiquée.")
      await refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'La résiliation est impossible.')
    } finally {
      setTerminating(false)
    }
  }

  async function cancelTerminationRequest() {
    if (!id) return
    setTerminating(true)
    setError('')
    setSuccess('')
    try {
      setTermination(await cancelSubscriptionTermination(id, "Annulation depuis l'espace client."))
      setSuccess("La demande de résiliation est annulée. L'abonnement reste actif.")
      await refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "La demande de résiliation n'a pas pu être annulée.")
    } finally {
      setTerminating(false)
    }
  }

  async function cancelCurrentSubscription() {
    if (!id) return
    setSaving(true)
    setError('')
    try {
      setItem(await cancelSubscription(id))
      setSuccess('Votre demande a été annulée.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "L'annulation est impossible.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Alert severity="info">Chargement du dossier...</Alert>
  if (!item) return <Alert severity="error">{error || 'Dossier introuvable.'}</Alert>
  const workflowCopy = workflowPresentation(item)

  return (
    <Stack spacing={3}>
      <Button component={Link} startIcon={<ArrowLeft size={18} />} to="/subscriptions" variant="outlined" sx={{ alignSelf: 'flex-start' }}>
        Retour aux souscriptions
      </Button>
      {error && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success">{success}</Alert>}

      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { md: 'center' } }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 900 }}>{item.offer?.name ?? 'Offre non associee'}</Typography>
            <Typography color="text.secondary">Porteur : {profileName(item.bearerProfile)} - Payeur : {profileName(item.payerProfile)}</Typography>
          </Box>
          <Chip color={statusTone[item.subscription.status]} label={subscriptionStatusLabels[item.subscription.status]} />
        </Stack>
      </Paper>

      <Paper sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 3, border: `1px solid ${colors.greyMedium}`, bgcolor: colors.blueLight }}>
        <Stack spacing={2.5}>
          <Alert severity={workflowCopy.severity}>
            <Typography sx={{ fontWeight: 850 }}>{workflowCopy.title}</Typography>
            <Typography variant="body2">{workflowCopy.description}</Typography>
          </Alert>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 1.5 }}>
            {[
              {
                label: 'Justificatifs',
                value: item.workflow.documentsUploaded
                  ? item.workflow.requiresDocumentAnalysis
                    ? 'Déposés · analyse à l’envoi'
                    : item.workflow.requiresDocumentReview ? 'Déposés · contrôle BO' : 'Vérifiés'
                  : `${item.workflow.requiredDocumentTypes.length - item.workflow.missingRequiredDocuments.length}/${item.workflow.requiredDocumentTypes.length} déposés`,
                complete: item.workflow.documentsUploaded,
                icon: <FileText size={21} />,
              },
              {
                label: 'Paiement',
                value: item.workflow.hasAcceptedPayment ? 'Enregistré' : 'À effectuer',
                complete: item.workflow.hasAcceptedPayment,
                icon: <CreditCard size={21} />,
              },
              {
                label: 'Envoi Comutitres',
                value: item.subscription.submittedAt ? 'Envoyé' : item.workflow.canSubmit ? 'Prêt à envoyer' : 'En attente',
                complete: Boolean(item.subscription.submittedAt),
                icon: <Send size={21} />,
              },
            ].map((step) => (
              <Paper key={step.label} variant="outlined" sx={{ p: 2, borderRadius: 2.5, bgcolor: colors.white }}>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                  <Box sx={{ width: 42, height: 42, borderRadius: 2, display: 'grid', placeItems: 'center', color: step.complete ? colors.greenDark : colors.blueInteraction, bgcolor: step.complete ? colors.greenLight : colors.blueLight }}>
                    {step.icon}
                  </Box>
                  <Box>
                    <Typography color="text.secondary" variant="caption">{step.label}</Typography>
                    <Typography sx={{ fontWeight: 850 }}>{step.value}</Typography>
                  </Box>
                </Stack>
              </Paper>
            ))}
          </Box>

          {item.workflow.blockingReasons.length > 0 && (
            <Box>
              <Typography sx={{ fontWeight: 800, mb: 0.75 }}>À faire pour continuer</Typography>
              <Stack spacing={0.5}>
                {item.workflow.blockingReasons.map((reason) => (
                  <Stack key={reason} direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <AlertCircle size={16} color={colors.orangeDark} />
                    <Typography variant="body2">{reason}</Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>
          )}
        </Stack>
      </Paper>

      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3}>
          <Box sx={{ flex: 1 }}>
            <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', mb: 1 }}>
              <History size={20} color={colors.blueInteraction} />
              <Typography variant="h6" sx={{ fontWeight: 850 }}>Historique & abonnement</Typography>
            </Stack>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Les statuts, documents, paiements et decisions de renouvellement sont synchronises avec votre dossier.
            </Typography>
            <Stack spacing={1.25}>
              {historyItems.slice(0, 6).map((entry) => (
                <Paper key={entry.id} variant="outlined" sx={{ borderRadius: 2, p: 1.75 }}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ justifyContent: 'space-between' }}>
                    <Box>
                      <Typography sx={{ fontWeight: 800 }}>{entry.title}</Typography>
                      <Typography color="text.secondary" variant="body2">{entry.detail}</Typography>
                    </Box>
                    <Stack spacing={0.75} sx={{ alignItems: { sm: 'flex-end' }, minWidth: 150 }}>
                      <Chip color={statusTone[entry.status] ?? 'default'} label={subscriptionStatusLabels[entry.status as SubscriptionStatus] ?? entry.status} size="small" />
                      <Typography color="text.secondary" variant="caption">{formatDateTime(entry.date)}</Typography>
                    </Stack>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </Box>

          <Box sx={{ width: { xs: '100%', lg: 360 }, flexShrink: 0 }}>
            <Paper variant="outlined" sx={{ borderRadius: 2, p: 2.5 }}>
              <Typography sx={{ fontWeight: 850, mb: 1 }}>Actions possibles</Typography>
              {item.subscription.status === 'accepted' && renewal ? (
                <Stack spacing={2}>
                  <Box>
                    <Typography sx={{ fontWeight: 850 }}>Préparer la prochaine année</Typography>
                    <Typography color="text.secondary" variant="body2">
                      La demande est ouverte trois mois avant l’échéance. Elle ne remplace et n’annule jamais votre forfait actuel.
                    </Typography>
                  </Box>
                  <Paper variant="outlined" sx={{ borderRadius: 2, p: 1.75 }}>
                    <Typography color="text.secondary" variant="caption">Prochaine échéance</Typography>
                    <Typography sx={{ fontWeight: 800 }}>{formatDateTime(renewal.renewal.nextRenewalDate)}</Typography>
                    <Typography color="text.secondary" variant="body2">
                      Demande possible dès le {formatDateTime(renewal.renewal.renewalWindowStartsAt)}
                    </Typography>
                  </Paper>
                  {renewal.renewal.requestStatus === 'requested' ? (
                    <Alert severity="success">
                      Votre demande de renouvellement est enregistrée. Le forfait actuel continue normalement.
                    </Alert>
                  ) : renewal.renewal.warnings.map((warning) => <Alert key={warning} severity="info">{warning}</Alert>)}
                  <TextField
                    label={renewal.renewal.canCancelRequest ? "Motif d'annulation (facultatif)" : 'Précision (facultative)'}
                    minRows={2}
                    multiline
                    onChange={(event) => setRenewalReason(event.target.value)}
                    size="small"
                    value={renewalReason}
                  />
                  {renewal.renewal.canCancelRequest ? (
                    <Button color="warning" disabled={renewing} onClick={() => void cancelRenewalRequest()} variant="outlined">
                      Annuler ma demande de renouvellement
                    </Button>
                  ) : (
                    <Button disabled={renewing || !renewal.renewal.canRenew} onClick={() => void requestRenewal()} startIcon={<RotateCcw size={17} />} variant="contained">
                      Demander le renouvellement
                    </Button>
                  )}

                  {termination && (
                    <>
                      <Divider />
                      <Box>
                        <Typography sx={{ fontWeight: 850 }}>Arrêter définitivement l’abonnement</Typography>
                        <Typography color="text.secondary" variant="body2">
                          La résiliation est différente de l’annulation d’un renouvellement.
                          {termination.termination.requiresManualReview
                            ? ' Pour Imagine R, la demande doit être étudiée avant toute fin de droits.'
                            : ' Elle met fin au forfait en cours à la date effective.'}
                        </Typography>
                      </Box>
                      {termination.termination.canCancelRequest ? (
                        <Stack spacing={1.25}>
                          <Alert severity="warning">
                            Résiliation demandée pour le {termination.termination.effectiveAt ? formatDateTime(termination.termination.effectiveAt) : 'fin du mois'}.
                            Le forfait reste actif jusque-là.
                          </Alert>
                          <Button color="warning" disabled={terminating} onClick={() => void cancelTerminationRequest()} variant="outlined">
                            Annuler ma demande de résiliation
                          </Button>
                        </Stack>
                      ) : termination.termination.canRequest ? (
                        <Button color="error" disabled={terminating} onClick={() => setTerminationDialogOpen(true)} startIcon={<ShieldX size={17} />} variant="outlined">
                          Résilier mon abonnement
                        </Button>
                      ) : (
                        <Alert severity="info">{termination.termination.message}</Alert>
                      )}
                    </>
                  )}
                </Stack>
              ) : item.workflow.canCancel ? (
                <Stack spacing={1.5}>
                  <Alert severity={item.subscription.status === 'pending_validation' ? 'info' : 'warning'}>
                    {item.subscription.status === 'pending_validation'
                      ? "Le dossier est en cours d'étude par Comutitres."
                      : 'Vous pouvez encore annuler cette demande.'}
                  </Alert>
                  {item.workflow.hasAcceptedPayment && (
                    <Alert severity="info">
                      Un remboursement éventuel sera traité après contrôle. Le délai dépend du moyen de paiement.
                    </Alert>
                  )}
                  <Button color="error" disabled={saving} onClick={() => void cancelCurrentSubscription()} variant="outlined">
                    Annuler ma demande
                  </Button>
                </Stack>
              ) : (
                <Alert severity="info">Aucune action client disponible pour ce dossier.</Alert>
              )}
              <Button component={Link} startIcon={<Pencil size={17} />} sx={{ mt: 1.5 }} to="/onboarding" variant="text">
                Modifier les informations
              </Button>
            </Paper>
          </Box>
        </Stack>
      </Paper>

      <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { lg: 'center' }, mb: 2.5 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 850 }}>Constitution du dossier</Typography>
            <Typography color="text.secondary">
              Déposez les justificatifs, réglez le paiement, puis envoyez le dossier pour validation.
            </Typography>
            {item.workflow.state === 'under_review' && (
              <Alert severity="info" sx={{ mt: 1.5 }}>Dossier en attente d’étude Comutitres.</Alert>
            )}
          </Box>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Chip icon={<ClipboardCheck size={16} />} label={`${completedCount}/${documentSteps.length}`} color={allDocumentsDeposited ? 'success' : 'warning'} sx={{ fontWeight: 850 }} />
            {preparedCount > 0 && <Chip icon={<CloudUpload size={16} />} label={preparedCount} color="info" sx={{ fontWeight: 850 }} />}
          </Stack>
        </Stack>

        <Box
          role="tablist"
          aria-label="Étapes des justificatifs"
          sx={{
            overflowX: 'auto',
            pb: 1,
            mb: 3,
          }}
        >
          <Box sx={{ display: 'flex', minWidth: { xs: 820, md: '100%' }, alignItems: 'flex-start' }}>
            {stepperItems.map((step, index) => {
              const isFinal = step === 'final'
              const isPayment = step === 'payment'
              const type = !isFinal && !isPayment ? step : null
              const document = type ? item.documents.find((candidate) => candidate.type === type) : undefined
              const preparedFile = type ? preparedFiles[type] : undefined
              const meta = isFinal
                ? {
                    label: allDocumentsDeposited && hasCompletedPayment ? 'Prêt à envoyer' : 'À compléter',
                    color: allDocumentsDeposited && hasCompletedPayment ? colors.greenDark : colors.greyDark,
                    icon: <Send size={19} />,
                  }
                : isPayment
                  ? {
                      label: hasCompletedPayment ? 'Payé' : allDocumentsDeposited ? 'À régler' : 'En attente',
                      color: hasCompletedPayment ? colors.greenDark : allDocumentsDeposited ? colors.orangeDark : colors.greyDark,
                      icon: <CreditCard size={19} />,
                    }
                  : preparedFile && document?.status !== 'validated'
                    ? {
                        label: 'Prêt à envoyer',
                        color: colors.blueInteraction,
                        icon: <CloudUpload size={18} />,
                      }
                    : documentStatusMeta(document)
              const selected = activeStep === index
              const stepLabel = isFinal ? 'Envoi final' : isPayment ? 'Paiement' : documentTypeLabels[type!]

              return (
                <Box key={isFinal ? 'final' : isPayment ? 'payment' : type} sx={{ flex: 1, minWidth: 110, position: 'relative', textAlign: 'center' }}>
                  {index < stepperItems.length - 1 && (
                    <Box
                      sx={{
                        bgcolor: colors.blueInteraction,
                        height: 4,
                        left: '50%',
                        opacity: selected || index < activeStep ? 0.95 : 0.32,
                        position: 'absolute',
                        right: '-50%',
                        top: 22,
                        zIndex: 0,
                      }}
                    />
                  )}
                  <Button
                    aria-label={stepLabel}
                    onClick={() => goToStep(index)}
                    role="tab"
                    sx={{
                      bgcolor: selected ? meta.color : colors.white,
                      border: `2px solid ${meta.color}`,
                      borderRadius: '50%',
                      color: selected ? colors.white : meta.color,
                      height: 48,
                      minHeight: 48,
                      minWidth: 48,
                      p: 0,
                      position: 'relative',
                      width: 48,
                      zIndex: 1,
                      '&:hover': {
                        bgcolor: selected ? meta.color : colors.blueLight,
                        borderColor: meta.color,
                      },
                      '& .MuiButton-startIcon': { m: 0 },
                    }}
                  >
                    {meta.icon}
                  </Button>
                  <Typography sx={{ fontSize: 13, fontWeight: 850, lineHeight: 1.2, mt: 1 }}>
                    {stepLabel}
                  </Typography>
                  <Typography sx={{ color: meta.color, fontSize: 12, fontWeight: 750, mt: 0.25 }}>
                    {meta.label}
                  </Typography>
                </Box>
              )
            })}
          </Box>
        </Box>

        {!isFinalStep && !isPaymentStep && activeDocumentType && (
          <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
            <Stack spacing={2.5} sx={{ alignItems: 'center' }}>
              <Box sx={{ width: '100%', maxWidth: 820 }}>
                <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', mb: 1 }}>
                  <FolderOpen size={20} color={colors.blueInteraction} />
                  <Typography variant="h6" sx={{ fontWeight: 850 }}>{documentTypeLabels[activeDocumentType]}</Typography>
                </Stack>
                <Typography color="text.secondary" sx={{ mb: 2 }}>{acceptedCopy[activeDocumentType]}</Typography>

                {activeDocument && (
                  <Alert severity={activeDocument.status === 'validated' ? 'success' : activeDocument.status === 'rejected' ? 'error' : 'warning'} sx={{ mb: 2 }}>
                    <Typography sx={{ fontWeight: 800 }}>{documentStatusMeta(activeDocument).label}</Typography>
                    <Typography variant="body2">
                      {activeDocument.analyzedAt
                        ? `Confiance de l’analyse : ${confidence(activeDocument)}.${activeDocument.status === 'needs_manual_review'
                          ? ' Le document est bien enregistré et sera contrôlé par le backoffice.'
                          : activeDocument.status === 'validated'
                            ? ' Aucun contrôle supplémentaire n’est nécessaire avant l’étude du dossier.'
                            : ''}`
                        : "Le fichier est bien enregistré. L'analyse simulée sera lancée lors de l'envoi final."}
                    </Typography>
                    {activeDocument.signedUrl && (
                      <Button component="a" href={activeDocument.signedUrl} rel="noreferrer" size="small" sx={{ ml: 1 }} target="_blank">
                        Voir
                      </Button>
                    )}
                  </Alert>
                )}

                {!activeCanReplace ? (
                  <Paper
                    variant="outlined"
                    sx={{
                      alignItems: 'center',
                      bgcolor: colors.greyLight40,
                      borderColor: colors.greenLight,
                      borderRadius: 3,
                      display: 'flex',
                      gap: 2,
                      minHeight: { xs: 150, md: 190 },
                      p: { xs: 2, md: 3 },
                    }}
                  >
                    <Box sx={{ bgcolor: colors.white, borderRadius: 2, color: colors.greenDark, display: 'grid', height: 64, placeItems: 'center', width: 64 }}>
                      <CheckCircle2 size={30} />
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 850 }}>{activeDocument ? 'Justificatif enregistré' : 'Dépôt indisponible'}</Typography>
                      <Typography color="text.secondary">
                        {activeDocument
                          ? 'Le fichier reste consultable ci-dessus. Son remplacement n’est possible que s’il est refusé.'
                          : "Cette pièce ne peut pas être ajoutée pendant l'étude du dossier."}
                      </Typography>
                    </Box>
                  </Paper>
                ) : (
                  <Box
                    onDragLeave={() => setIsDraggingDocument(false)}
                    onDragOver={(event) => {
                      event.preventDefault()
                      setIsDraggingDocument(true)
                    }}
                    onDrop={handleDocumentDrop}
                    sx={{
                      alignItems: 'center',
                      bgcolor: isDraggingDocument ? colors.blueLight : colors.greyLight40,
                      border: `1.5px dashed ${isDraggingDocument ? colors.blueInteraction : colors.greyMedium}`,
                      borderRadius: 3,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1.5,
                      justifyContent: 'center',
                      minHeight: { xs: 180, md: 230 },
                      p: { xs: 2, md: 3 },
                      textAlign: 'center',
                      transition: 'background 0.2s, border-color 0.2s',
                      '&:hover': { bgcolor: colors.blueLight, borderColor: colors.blueInteraction },
                    }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Box
                      sx={{
                        alignItems: 'center',
                        bgcolor: colors.white,
                        border: `1px solid ${colors.greyMedium}`,
                        borderRadius: 2,
                        color: colors.blueInteraction,
                        display: 'flex',
                        flexShrink: 0,
                        height: 64,
                        justifyContent: 'center',
                        width: 64,
                      }}
                    >
                      <CloudUpload size={30} />
                    </Box>
                    <Box sx={{ maxWidth: 520, minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 850 }}>Déposer ici le fichier</Typography>
                      <Typography color="text.secondary">
                        Glissez le justificatif dans cette zone. Formats acceptés : PDF, JPG ou PNG.
                      </Typography>
                      <Button component="span" size="small" startIcon={<FileText size={16} />} sx={{ mt: 1, px: 0 }} variant="text">
                        Choisir un fichier
                      </Button>
                    </Box>
                    <Box
                      component="input"
                      accept=".pdf,.jpg,.jpeg,.png"
                      hidden
                      onChange={(event) => selectDocumentFile(event.target.files?.[0])}
                      ref={fileInputRef}
                      type="file"
                    />
                  </Box>
                )}

                {selectedDocumentFile && (
                  <Paper variant="outlined" sx={{ mt: 1.5, p: 1.5, borderRadius: 2 }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}>
                      <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', minWidth: 0 }}>
                        <FileText size={18} color={colors.blueInteraction} />
                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{ fontWeight: 750, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {selectedDocumentFile.name}
                          </Typography>
                          <Typography color="text.secondary" variant="caption">{formatFileSize(selectedDocumentFile.size)}</Typography>
                        </Box>
                      </Stack>
                      <Button color="inherit" onClick={clearSelectedFile} size="small" startIcon={<X size={15} />} variant="text">
                        Retirer
                      </Button>
                    </Stack>
                  </Paper>
                )}
              </Box>
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ justifyContent: 'space-between', mt: 3 }}>
              <Button disabled={activeStep === 0} onClick={() => goToStep(activeStep - 1)} startIcon={<ArrowLeft size={17} />} variant="outlined">
                Précédent
              </Button>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <Button
                  disabled={saving || (!activeDocument && !selectedDocumentFile) || (activeDocument?.status === 'rejected' && !selectedDocumentFile)}
                  endIcon={<ArrowRight size={17} />}
                  onClick={() => void saveCurrentDocumentAndContinue()}
                  variant="outlined"
                >
                  {selectedDocumentFile ? 'Enregistrer et continuer' : 'Suivant'}
                </Button>
              </Stack>
            </Stack>
          </Paper>
        )}

        {isPaymentStep && (
          <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
            <Stack spacing={2.5}>
              <Box>
                <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', mb: 1 }}>
                  <CreditCard size={20} color={colors.blueInteraction} />
                  <Typography variant="h6" sx={{ fontWeight: 850 }}>Règlement du forfait</Typography>
                </Stack>
                <Typography color="text.secondary">
                  Après le certificat de scolarité, réglez votre forfait avant l’envoi final.
                </Typography>
              </Box>

              {!allDocumentsDeposited && (
                <Alert severity="warning">
                  Terminez d’abord le dépôt de tous les justificatifs.
                </Alert>
              )}

              {hasCompletedPayment && (
                <Alert severity="success" icon={<CheckCircle2 size={18} />}>
                  Paiement enregistré. Vous pouvez passer à l’envoi final.
                </Alert>
              )}

              {allDocumentsDeposited && !hasCompletedPayment && (
                <>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { sm: 'flex-end' } }}>
                    <TextField
                      select
                      label="Fréquence"
                      value={paymentMode}
                      onChange={(event) => {
                        const nextMode = event.target.value as 'one_time' | 'monthly'
                        setPaymentMode(nextMode)
                        if (nextMode === 'one_time') {
                          setPaymentMethod('card')
                          setMandateAccepted(false)
                        }
                        setSimulation(null)
                      }}
                      sx={{ minWidth: 220 }}
                    >
                      <MenuItem value="one_time">Paiement unique</MenuItem>
                      <MenuItem value="monthly">Mensualisation</MenuItem>
                    </TextField>
                    <Button disabled={simulating} onClick={() => void runPaymentSimulation()} variant="outlined" sx={{ fontWeight: 700, minHeight: 44 }}>
                      {simulating ? 'Simulation...' : 'Simuler le montant'}
                    </Button>
                  </Stack>

                  {simulation && (
                    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, bgcolor: colors.blueLight }}>
                      {paymentMode === 'monthly' ? (
                        <Stack spacing={0.5}>
                          <Typography sx={{ fontWeight: 800 }}>
                            {formatEuros(simulation.installmentAmountCents, simulation.currency)} par mois pendant {simulation.installmentCount} mois
                          </Typography>
                          {simulation.schedule.map((installment) => (
                            <Typography key={installment.installmentNumber} variant="body2">
                              Échéance {installment.installmentNumber} · {formatEuros(installment.amountCents, simulation.currency)}
                            </Typography>
                          ))}
                        </Stack>
                      ) : (
                        <Typography sx={{ fontWeight: 800 }}>Total à régler : {formatEuros(simulation.totalCents, simulation.currency)}</Typography>
                      )}
                    </Paper>
                  )}

                  <PaymentMethodSection
                    method={paymentMethod}
                    onMethodChange={setPaymentMethod}
                    allowMandate={paymentMode === 'monthly'}
                    cardNumber={cardNumber}
                    onCardNumberChange={setCardNumber}
                    expiry={cardExpiry}
                    onExpiryChange={setCardExpiry}
                    cvv={cardCvv}
                    onCvvChange={setCardCvv}
                    cardholderName={cardholderName}
                    onCardholderNameChange={setCardholderName}
                    simulateFailure={simulateFailure}
                    onSimulateFailureChange={setSimulateFailure}
                    holderName={holderName}
                    onHolderNameChange={setHolderName}
                    iban={iban}
                    onIbanChange={setIban}
                    bic={bic}
                    onBicChange={setBic}
                    mandateAccepted={mandateAccepted}
                    onMandateAcceptedChange={setMandateAccepted}
                  />

                  <Button disabled={paying || !simulation} onClick={() => void submitPayment()} variant="contained" sx={{ alignSelf: { sm: 'flex-start' }, fontWeight: 700 }}>
                    {paying ? 'Traitement...' : paymentMode === 'one_time' || paymentMethod === 'card' ? 'Payer maintenant' : 'Valider le mandat'}
                  </Button>
                </>
              )}

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ justifyContent: 'space-between' }}>
                <Button onClick={() => goToStep(paymentStepIndex - 1)} startIcon={<ArrowLeft size={17} />} variant="outlined">Précédent</Button>
                <Button disabled={!hasCompletedPayment} endIcon={<ArrowRight size={17} />} onClick={() => goToStep(finalStepIndex)} variant="outlined">Suivant</Button>
              </Stack>
            </Stack>
          </Paper>
        )}

        {isFinalStep && item.workflow.state !== 'under_review' && (
          <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, bgcolor: colors.greyLight40 }}>
            <Stack spacing={2.5}>
              <Stack spacing={1}>
                <Box>
                  <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', mb: 1 }}>
                    <ClipboardCheck size={22} color={allDocumentsDeposited ? colors.greenDark : colors.orangeDark} />
                    <Typography variant="h6" sx={{ fontWeight: 850 }}>Vérification avant envoi</Typography>
                  </Stack>
                  <Typography color="text.secondary">
                    {allDocumentsDeposited && hasCompletedPayment
                      ? `${completedCount} document(s) déposés, paiement validé.`
                      : !allDocumentsDeposited
                        ? `${documentSteps.length - completedCount} document(s) restent à déposer.`
                        : 'Validez le paiement avant l’envoi final.'}
                  </Typography>
                </Box>
              </Stack>

              <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' } }}>
                {documentSteps.map((type, index) => {
                  const document = item.documents.find((candidate) => candidate.type === type)
                  const preparedFile = preparedFiles[type]
                  const meta = preparedFile && !document
                    ? { label: 'Prêt à envoyer', color: colors.blueInteraction, icon: <CloudUpload size={18} /> }
                    : documentStatusMeta(document)

                  return (
                    <Paper
                      key={type}
                      component="button"
                      onClick={() => goToStep(index)}
                      variant="outlined"
                      sx={{
                        bgcolor: colors.white,
                        borderRadius: 2,
                        cursor: 'pointer',
                        p: 2,
                        textAlign: 'left',
                        transition: 'border-color 0.2s, transform 0.2s',
                        width: '100%',
                        '&:hover': {
                          borderColor: colors.blueInteraction,
                          transform: 'translateY(-1px)',
                        },
                      }}
                    >
                      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
                        <Box sx={{ color: meta.color, display: 'flex', mt: 0.25 }}>{meta.icon}</Box>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{ fontWeight: 850 }}>{documentTypeLabels[type]}</Typography>
                          <Typography sx={{ color: meta.color, fontSize: 13, fontWeight: 750 }}>{meta.label}</Typography>
                          <Typography color="text.secondary" variant="body2" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {preparedFile?.name ?? (document ? displayDocumentName(document) : null) ?? 'Aucun fichier déposé'}
                          </Typography>
                        </Box>
                      </Stack>
                    </Paper>
                  )
                })}
              </Box>

              <Stack spacing={1.5} sx={{ alignItems: 'center', pt: 1 }}>
                <Button
                  disabled={(!allDocumentsDeposited && preparedCount === 0) || !hasCompletedPayment || saving}
                  onClick={submitFullDossier}
                  startIcon={<Send size={20} />}
                  variant="contained"
                  sx={{ minHeight: 52, minWidth: { xs: '100%', sm: 280 }, px: 3 }}
                >
                  Analyser et envoyer pour validation
                </Button>
                <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                  <ShieldCheck size={18} color={allDocumentsDeposited && hasCompletedPayment ? colors.greenDark : colors.greyDark} />
                  <Typography color="text.secondary" variant="body2">
                    L'analyse simulée sera lancée, puis les documents et le paiement seront transmis à Comutitres.
                  </Typography>
                </Stack>
              </Stack>
              <Button onClick={() => goToStep(paymentStepIndex)} startIcon={<ArrowLeft size={17} />} variant="outlined" sx={{ alignSelf: 'flex-start' }}>
                Retour au paiement
              </Button>
            </Stack>
          </Paper>
        )}

        {isFinalStep && item.workflow.state === 'under_review' && (
          <Alert severity="info">
            Votre dossier a déjà été envoyé. Comutitres étudie actuellement les justificatifs et le paiement.
          </Alert>
        )}
      </Paper>

      <Dialog fullWidth maxWidth="sm" onClose={() => !terminating && setTerminationDialogOpen(false)} open={terminationDialogOpen}>
        <DialogTitle sx={{ fontWeight: 900 }}>Résilier mon abonnement annuel</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Alert severity="error">
              {termination?.termination.requiresManualReview
                ? 'Votre demande sera étudiée selon son motif et les conditions Imagine R. Vos droits restent actifs tant que Comutitres ne l’a pas validée.'
                : 'Cette action est définitive à sa date d’effet. Pour une interruption temporaire, contactez le support afin d’étudier une suspension.'}
            </Alert>
            <Typography>
              Le mois en cours reste dû. En cas de paiement annuel comptant, un éventuel trop-perçu sera vérifié puis remboursé selon votre dossier.
            </Typography>
            <TextField
              fullWidth
              label="Mois de fin souhaité"
              onChange={(event) => setTerminationMonth(event.target.value)}
              select
              value={terminationMonth}
            >
              {terminationMonthOptions().map((month) => (
                <MenuItem key={month.value} value={month.value}>{month.label}</MenuItem>
              ))}
            </TextField>
            <TextField
              autoFocus
              fullWidth
              label="Pourquoi souhaitez-vous résilier ?"
              minRows={3}
              multiline
              onChange={(event) => setTerminationReason(event.target.value)}
              value={terminationReason}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button disabled={terminating} onClick={() => setTerminationDialogOpen(false)}>Conserver mon abonnement</Button>
          <Button color="error" disabled={terminating || terminationReason.trim().length < 3} onClick={() => void submitTerminationRequest()} variant="contained">
            Confirmer la résiliation
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}

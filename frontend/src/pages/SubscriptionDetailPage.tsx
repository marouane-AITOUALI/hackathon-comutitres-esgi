import { Alert, Box, Button, Chip, Paper, Stack, Typography } from '@mui/material'
import { useEffect, useMemo, useRef, useState, type DragEvent } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Circle,
  ClipboardCheck,
  CloudUpload,
  FileText,
  FolderOpen,
  RotateCcw,
  Send,
  ShieldCheck,
  X,
} from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { analyzeDocument, createDocument, resubmitDocument } from '../services/documents.service'
import { getSubscriptionById } from '../services/subscriptions.service'
import { colors } from '../theme/colors'
import type { DocumentSummary, DocumentType, SubscriptionStatus, SubscriptionSummary } from '../types'

const statusLabel: Record<SubscriptionStatus, string> = {
  draft: 'Brouillon',
  pending_documents: 'Documents attendus',
  pending_payment: 'Paiement attendu',
  pending_validation: 'En validation',
  accepted: 'Acceptée',
  rejected: 'Refusée',
  cancelled: 'Annulée',
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

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

function documentStatusMeta(document?: DocumentSummary) {
  if (!document) return { label: 'À déposer', color: colors.greyDark, icon: <Circle size={18} /> }
  if (document.status === 'validated') return { label: 'Validé', color: colors.greenDark, icon: <CheckCircle2 size={18} /> }
  if (document.status === 'rejected') return { label: 'À remplacer', color: colors.redDark, icon: <AlertCircle size={18} /> }
  if (document.status === 'needs_manual_review') return { label: 'À vérifier', color: colors.orangeDark, icon: <AlertCircle size={18} /> }
  if (document.status === 'analyzing') return { label: 'Analyse en cours', color: colors.blueInteraction, icon: <RotateCcw size={18} /> }
  return { label: 'Déposé', color: colors.orangeDark, icon: <FileText size={18} /> }
}

function uniqueDocumentTypes(types: DocumentType[]) {
  return types.filter((type, index, list) => list.indexOf(type) === index)
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

  async function refresh() {
    if (!id) return
    setItem(await getSubscriptionById(id))
  }

  useEffect(() => {
    if (!id) return
    const subscriptionId = id
    let mounted = true

    async function loadInitial() {
      try {
        const subscription = await getSubscriptionById(subscriptionId)
        if (mounted) setItem(subscription)
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
    const requiredTypes = (item?.offer?.requiredDocuments ?? []).map(normalizeDocumentType)
    const existingTypes = (item?.documents ?? []).map((document) => document.type)
    return uniqueDocumentTypes(requiredTypes.length > 0 ? requiredTypes : existingTypes.length > 0 ? existingTypes : ['other'])
  }, [item])

  const activeDocumentType = documentSteps[Math.min(activeStep, documentSteps.length - 1)]
  const activeDocument = item?.documents.find((document) => document.type === activeDocumentType)
  const preparedCount = documentSteps.filter((type) => preparedFiles[type]).length
  const completedCount = documentSteps.filter((type) => item?.documents.some((document) => document.type === type) || preparedFiles[type]).length
  const validatedCount = documentSteps.filter((type) => item?.documents.some((document) => document.type === type && document.status === 'validated')).length
  const allDocumentsDeposited = completedCount === documentSteps.length
  const isFinalStep = activeStep >= documentSteps.length
  const stepperItems = [...documentSteps, 'final' as const]
  const selectedDocumentFile = activeDocumentType ? preparedFiles[activeDocumentType] ?? null : null

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

  async function analyze(idToAnalyze: string) {
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await analyzeDocument(idToAnalyze)
      await refresh()
      setSuccess('Analyse documentaire lancée.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Analyse impossible.')
    } finally {
      setSaving(false)
    }
  }

  function goToStep(step: number) {
    setActiveStep(Math.max(0, Math.min(step, documentSteps.length)))
    if (fileInputRef.current) fileInputRef.current.value = ''
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
        const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-')
        const fileUrl = `uploads/${id}/${Date.now()}-${safeFileName}`
        if (existingDocument) await resubmitDocument(existingDocument.id, { type, fileUrl })
        else await createDocument(id, { type, fileUrl })
      }
      setPreparedFiles({})
      await refresh()
      setSuccess('Dossier documentaire prêt pour validation Comutitres.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Envoi du dossier impossible.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Alert severity="info">Chargement du dossier...</Alert>
  if (!item) return <Alert severity="error">{error || 'Dossier introuvable.'}</Alert>

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
            <Typography color="text.secondary" variant="body2">Dossier {item.subscription.id.slice(0, 8)}</Typography>
            <Typography variant="h4" sx={{ fontWeight: 900 }}>{item.offer?.name ?? 'Offre non associee'}</Typography>
            <Typography color="text.secondary">Porteur : {profileName(item.bearerProfile)} - Payeur : {profileName(item.payerProfile)}</Typography>
          </Box>
          <Chip color={statusTone[item.subscription.status]} label={statusLabel[item.subscription.status]} />
        </Stack>
      </Paper>

      <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { lg: 'center' }, mb: 2.5 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 850 }}>Constitution du dossier</Typography>
            <Typography color="text.secondary">
              Déposez les justificatifs un par un. Le paiement sera traité ensuite dans l’espace Paiements si le dossier le nécessite.
            </Typography>
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
          <Box sx={{ display: 'flex', minWidth: { xs: 680, md: '100%' }, alignItems: 'flex-start' }}>
            {stepperItems.map((step, index) => {
              const isFinal = step === 'final'
              const type = isFinal ? null : step
              const document = type ? item.documents.find((candidate) => candidate.type === type) : undefined
              const preparedFile = type ? preparedFiles[type] : undefined
              const meta = isFinal
                ? {
                    label: allDocumentsDeposited ? 'Prêt à envoyer' : 'À compléter',
                    color: allDocumentsDeposited ? colors.greenDark : colors.greyDark,
                    icon: <Send size={19} />,
                  }
                : preparedFile && document?.status !== 'validated'
                  ? {
                      label: 'Prêt à envoyer',
                      color: colors.blueInteraction,
                      icon: <CloudUpload size={18} />,
                    }
                : documentStatusMeta(document)
              const selected = activeStep === index
              const stepLabel = isFinal || !type ? 'Envoi final' : documentTypeLabels[type]

              return (
                <Box key={isFinal ? 'final' : type} sx={{ flex: 1, minWidth: 120, position: 'relative', textAlign: 'center' }}>
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

        {!isFinalStep && activeDocumentType && (
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
                    {documentStatusMeta(activeDocument).label}. Confiance : {confidence(activeDocument)}
                  </Alert>
                )}

                {activeDocument?.status === 'validated' ? (
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
                      <Typography sx={{ fontWeight: 850 }}>Justificatif déjà validé</Typography>
                      <Typography color="text.secondary">
                        Ce document est accepté pour ce dossier. Aucune nouvelle pièce n’est nécessaire pour cette étape.
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
                {activeDocument && activeDocument.status !== 'validated' && (
                  <Button disabled={saving} onClick={() => analyze(activeDocument.id)} startIcon={<ShieldCheck size={17} />} sx={{ mt: 2 }} variant="outlined">
                    Vérifier le document
                  </Button>
                )}
              </Box>
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ justifyContent: 'space-between', mt: 3 }}>
              <Button disabled={activeStep === 0} onClick={() => goToStep(activeStep - 1)} startIcon={<ArrowLeft size={17} />} variant="outlined">
                Précédent
              </Button>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <Button endIcon={<ArrowRight size={17} />} onClick={() => goToStep(activeStep + 1)} variant="outlined">
                  Suivant
                </Button>
              </Stack>
            </Stack>
          </Paper>
        )}

        {isFinalStep && (
          <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, bgcolor: colors.greyLight40 }}>
            <Stack spacing={2.5}>
              <Stack spacing={1}>
                <Box>
                  <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', mb: 1 }}>
                    <ClipboardCheck size={22} color={allDocumentsDeposited ? colors.greenDark : colors.orangeDark} />
                    <Typography variant="h6" sx={{ fontWeight: 850 }}>Vérification avant envoi</Typography>
                  </Stack>
                  <Typography color="text.secondary">
                    {allDocumentsDeposited
                      ? `${completedCount} document(s) sont déposés. ${validatedCount} sont déjà validés.`
                      : `${documentSteps.length - completedCount} document(s) restent à déposer avant l'envoi du dossier.`}
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
                            {preparedFile?.name ?? document?.fileUrl ?? 'Aucun fichier déposé'}
                          </Typography>
                        </Box>
                      </Stack>
                    </Paper>
                  )
                })}
              </Box>

              <Stack spacing={1.5} sx={{ alignItems: 'center', pt: 1 }}>
                <Button
                  disabled={!allDocumentsDeposited || saving}
                  onClick={submitFullDossier}
                  startIcon={<Send size={20} />}
                  variant="contained"
                  sx={{ minHeight: 52, minWidth: { xs: '100%', sm: 280 }, px: 3 }}
                >
                  Envoyer pour validation
                </Button>
                <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                  <ShieldCheck size={18} color={allDocumentsDeposited ? colors.greenDark : colors.greyDark} />
                  <Typography color="text.secondary" variant="body2">
                    Les documents seront transmis à Comutitres pour contrôle.
                  </Typography>
                </Stack>
              </Stack>
            </Stack>
          </Paper>
        )}
      </Paper>
    </Stack>
  )
}

import { Accordion, AccordionDetails, AccordionSummary, Alert, Box, Button, Chip, Pagination, Paper, Stack, Typography } from '@mui/material'
import { ArrowRight, BadgeCheck, ChevronDown, FileSearch, FileText, FileWarning, Layers3, RefreshCw, ShieldAlert } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type ReactElement, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { analyzeDocument } from '../services/documents.service'
import { listSubscriptions } from '../services/subscriptions.service'
import { colors } from '../theme/colors'
import type { DocumentStatus, DocumentSummary, SubscriptionSummary } from '../types'

const documentLabels: Record<string, string> = {
  identity: "Pièce d'identité",
  proof_of_address: 'Justificatif de domicile',
  eligibility: 'Éligibilité',
  school_certificate: 'Certificat de scolarité',
  tax_notice: 'Avis fiscal',
  other: 'Autre justificatif',
}

const statusLabel: Record<DocumentStatus, string> = {
  pending: 'À analyser',
  analyzing: 'Analyse en cours',
  validated: 'Validé',
  rejected: 'Refusé',
  needs_manual_review: 'Contrôle requis',
}

const statusTone: Record<DocumentStatus, 'default' | 'warning' | 'success' | 'error' | 'info'> = {
  pending: 'warning',
  analyzing: 'info',
  validated: 'success',
  rejected: 'error',
  needs_manual_review: 'warning',
}

const statusIcon: Record<DocumentStatus, ReactElement> = {
  pending: <FileSearch size={16} />,
  analyzing: <RefreshCw size={16} />,
  validated: <BadgeCheck size={16} />,
  rejected: <ShieldAlert size={16} />,
  needs_manual_review: <FileWarning size={16} />,
}

const filterOptions: Array<{ key: 'all' | DocumentStatus; label: string; icon: ReactNode }> = [
  { key: 'all', label: 'Tous', icon: <Layers3 size={16} /> },
  { key: 'pending', label: 'À analyser', icon: <FileSearch size={16} /> },
  { key: 'needs_manual_review', label: 'Contrôle', icon: <FileWarning size={16} /> },
  { key: 'rejected', label: 'Refusés', icon: <ShieldAlert size={16} /> },
  { key: 'validated', label: 'Validés', icon: <BadgeCheck size={16} /> },
]

interface DocumentRow {
  document: DocumentSummary
  subscription: SubscriptionSummary
}

interface DocumentGroup {
  subscription: SubscriptionSummary
  documents: DocumentSummary[]
}

const groupsPerPage = 4

function formatDate(value?: string | null) {
  if (!value) return 'Non renseigné'
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value))
}

function getConfidence(document: DocumentSummary) {
  const result = document.analysisResult
  return result && typeof result === 'object' && 'confidence' in result && typeof result.confidence === 'number'
    ? result.confidence
    : null
}

function getAnalysisWarnings(document: DocumentSummary) {
  const result = document.analysisResult
  if (!result || typeof result !== 'object' || !('warnings' in result) || !Array.isArray(result.warnings)) return []
  return result.warnings.filter((warning): warning is string => typeof warning === 'string')
}

function getAnalysisReasons(document: DocumentSummary) {
  const result = document.analysisResult
  if (!result || typeof result !== 'object' || !('reasons' in result) || !Array.isArray(result.reasons)) return []
  return result.reasons.filter((reason): reason is string => typeof reason === 'string')
}

function countByStatus(rows: DocumentRow[]) {
  return rows.reduce(
    (accumulator, { document }) => {
      accumulator.total += 1
      if (document.status === 'validated') accumulator.validated += 1
      if (document.status === 'rejected') accumulator.rejected += 1
      if (document.status === 'pending' || document.status === 'analyzing') accumulator.pending += 1
      if (document.status === 'needs_manual_review') accumulator.review += 1
      return accumulator
    },
    { total: 0, validated: 0, rejected: 0, pending: 0, review: 0 },
  )
}

function filterCount(key: 'all' | DocumentStatus, rows: DocumentRow[]) {
  if (key === 'all') return rows.length
  return rows.filter(({ document }) => document.status === key).length
}

function getDocumentAction(document: DocumentSummary) {
  if (document.status === 'validated' || document.status === 'analyzing') return null
  if (document.status === 'rejected') return 'Réanalyser'
  if (document.status === 'needs_manual_review') return 'Réanalyser'
  return 'Analyser'
}

function getDocumentName(document: DocumentSummary) {
  if (document.originalFilename) return document.originalFilename
  const cleanUrl = document.fileUrl.split('?')[0]
  const lastSegment = cleanUrl.split('/').filter(Boolean).at(-1)
  return lastSegment ? decodeURIComponent(lastSegment) : document.fileUrl
}

function getDocumentIssue(document: DocumentSummary) {
  const warnings = getAnalysisWarnings(document)
  const reasons = getAnalysisReasons(document)
  return document.rejectionReason ?? warnings[0] ?? reasons[0] ?? ''
}

export function DocumentsPage() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionSummary[]>([])
  const [activeFilter, setActiveFilter] = useState<'all' | DocumentStatus>('all')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const load = useCallback(async () => {
    const data = await listSubscriptions()
    setSubscriptions(data)
  }, [])

  useEffect(() => {
    let cancelled = false

    listSubscriptions()
      .then((data) => {
        if (!cancelled) setSubscriptions(data)
      })
      .catch((caught) => {
        if (!cancelled) setError(caught instanceof Error ? caught.message : 'Documents indisponibles.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const rows = useMemo(
    () => subscriptions.flatMap((subscription) => (subscription.documents ?? []).map((document) => ({ document, subscription }))),
    [subscriptions],
  )
  const counters = useMemo(() => countByStatus(rows), [rows])
  const filteredRows = useMemo(
    () => rows.filter(({ document }) => activeFilter === 'all' || document.status === activeFilter),
    [activeFilter, rows],
  )
  const groupedSubscriptions = useMemo<DocumentGroup[]>(
    () => subscriptions
      .map((subscription) => ({
        subscription,
        documents: (subscription.documents ?? []).filter((document) => activeFilter === 'all' || document.status === activeFilter),
      }))
      .filter((group) => group.documents.length > 0),
    [activeFilter, subscriptions],
  )
  const pageCount = Math.max(1, Math.ceil(groupedSubscriptions.length / groupsPerPage))
  const currentPage = Math.min(page, pageCount)
  const visibleGroups = groupedSubscriptions.slice((currentPage - 1) * groupsPerPage, currentPage * groupsPerPage)
  const blockingRows = rows.filter(({ document }) => ['pending', 'rejected', 'needs_manual_review'].includes(document.status)).slice(0, 4)

  async function analyze(id: string) {
    setSavingId(id)
    setError('')
    setSuccess('')
    try {
      await analyzeDocument(id)
      await load()
      setSuccess('Analyse documentaire terminée.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Analyse impossible.')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <Stack spacing={3}>
      <Paper
        sx={{
          p: { xs: 2.5, md: 3.5 },
          border: `1px solid ${colors.greyMedium}`,
          borderRadius: 3,
          background: colors.white,
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.5} sx={{ justifyContent: 'space-between', alignItems: { md: 'center' } }}>
          <Box sx={{ maxWidth: 730 }}>
            <Chip icon={<FileText size={15} />} label="Justificatifs" color="primary" sx={{ mb: 2, fontWeight: 700 }} />
            <Typography variant="h4" sx={{ fontWeight: 850, mb: 1 }}>
              Suivez les pièces attendues, contrôlées et validées.
            </Typography>
            <Typography color="text.secondary">
              Centralisez les justificatifs liés à vos dossiers et relancez une analyse dès qu'un document doit être vérifié.
            </Typography>
          </Box>
          <Button component={Link} to="/subscriptions" variant="contained" endIcon={<ArrowRight size={18} />} sx={{ alignSelf: { xs: 'flex-start', md: 'center' } }}>
            Voir les dossiers
          </Button>
        </Stack>
      </Paper>

      {error && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success">{success}</Alert>}
      {loading && <Alert severity="info">Chargement des documents...</Alert>}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', xl: 'repeat(4, 1fr)' }, gap: 2 }}>
        {[
          { label: 'Documents', value: counters.total, icon: <FileText size={20} />, color: colors.blueInteraction },
          { label: 'Validés', value: counters.validated, icon: <BadgeCheck size={20} />, color: colors.greenDark },
          { label: 'À traiter', value: counters.pending + counters.review, icon: <FileWarning size={20} />, color: colors.orangeDark },
          { label: 'Refusés', value: counters.rejected, icon: <ShieldAlert size={20} />, color: colors.redDark },
        ].map((item) => (
          <Paper key={item.label} variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
            <Stack direction="row" spacing={2} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography color="text.secondary" variant="body2">{item.label}</Typography>
                <Typography variant="h4" sx={{ fontWeight: 850 }}>{item.value}</Typography>
              </Box>
              <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: colors.greyLight40, color: item.color, display: 'grid', placeItems: 'center' }}>
                {item.icon}
              </Box>
            </Stack>
          </Paper>
        ))}
      </Box>

      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3}>
        <Paper sx={{ flex: 1, p: 3, borderRadius: 3 }}>
          <Stack direction={{ xs: 'column', xl: 'row' }} spacing={2.5} sx={{ justifyContent: 'space-between', alignItems: { xl: 'flex-start' }, mb: 2.5 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 850 }}>Mes justificatifs</Typography>
              <Typography color="text.secondary">Filtrez les pièces par état de contrôle.</Typography>
            </Box>
            <Box
              aria-label="Filtres des documents par statut"
              role="group"
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, minmax(126px, 1fr))', xl: 'repeat(5, auto)' },
                gap: 1,
                width: { xs: '100%', xl: 'auto' },
              }}
            >
              {filterOptions.map((option) => (
                <Button
                  key={option.key}
                  onClick={() => {
                    setActiveFilter(option.key)
                    setPage(1)
                  }}
                  startIcon={option.icon}
                  variant={activeFilter === option.key ? 'contained' : 'outlined'}
                  sx={{
                    bgcolor: activeFilter === option.key ? colors.blueInteraction : colors.white,
                    borderColor: activeFilter === option.key ? colors.blueInteraction : colors.greyMedium,
                    color: activeFilter === option.key ? colors.white : colors.anthracite,
                    justifyContent: 'flex-start',
                    minHeight: 42,
                    px: 1.5,
                    '&:hover': {
                      bgcolor: activeFilter === option.key ? colors.blueFocus : colors.blueLight,
                      borderColor: colors.blueInteraction,
                    },
                    '& .MuiButton-endIcon': { ml: 'auto' },
                    '& .MuiButton-startIcon': { color: 'inherit', mr: 1 },
                  }}
                  endIcon={
                    <Box
                      component="span"
                      sx={{
                        alignItems: 'center',
                        bgcolor: activeFilter === option.key ? 'rgba(255,255,255,0.22)' : colors.greyLight40,
                        borderRadius: 99,
                        color: activeFilter === option.key ? colors.white : colors.greyDark,
                        display: 'inline-flex',
                        fontSize: 12,
                        fontWeight: 800,
                        height: 22,
                        justifyContent: 'center',
                        minWidth: 28,
                        px: 0.75,
                      }}
                    >
                      {filterCount(option.key, rows)}
                    </Box>
                  }
                >
                  {option.label}
                </Button>
              ))}
            </Box>
          </Stack>

          {!loading && rows.length === 0 && (
            <Alert severity="info">Aucun document pour le moment. Ouvrez une souscription pour ajouter vos justificatifs.</Alert>
          )}

          <Stack spacing={1.5}>
            {visibleGroups.map(({ documents, subscription }) => {
              const groupCounters = countByStatus(documents.map((document) => ({ document, subscription })))
              const groupTitle = subscription.offer?.name ?? 'Offre non associée'
              const documentsToHandle = groupCounters.pending + groupCounters.review + groupCounters.rejected

              return (
                <Accordion
                  disableGutters
                  key={subscription.subscription.id}
                  sx={{
                    border: `1px solid ${colors.greyMedium}`,
                    borderRadius: 2,
                    boxShadow: 'none',
                    overflow: 'hidden',
                    '&:before': { display: 'none' },
                    '&.Mui-expanded': { m: 0 },
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ChevronDown size={20} />}
                    sx={{
                      minHeight: 74,
                      px: 2.25,
                      py: 1,
                      '& .MuiAccordionSummary-content': {
                        alignItems: 'center',
                        gap: 2,
                        my: 1,
                      },
                    }}
                  >
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                        <Typography variant="h6" sx={{ fontWeight: 850 }}>{groupTitle}</Typography>
                        {documentsToHandle > 0 && <Chip color="warning" label={`${documentsToHandle} à traiter`} size="small" sx={{ fontWeight: 700 }} />}
                        {groupCounters.rejected > 0 && <Chip color="error" label={`${groupCounters.rejected} refusé(s)`} size="small" sx={{ fontWeight: 700 }} />}
                        {documentsToHandle === 0 && (
                          <Chip
                            label="À jour"
                            size="small"
                            sx={{
                              bgcolor: colors.blueMedium,
                              color: colors.blueFocus,
                              fontWeight: 700,
                            }}
                          />
                        )}
                      </Stack>
                      <Typography color="text.secondary" variant="body2">
                        {documents.length} justificatif(s)
                      </Typography>
                    </Box>
                  </AccordionSummary>

                  <AccordionDetails sx={{ borderTop: `1px solid ${colors.greyMedium}`, p: 0 }}>
                    {documents.map((document, index) => {
                      const confidence = getConfidence(document)
                      const issue = getDocumentIssue(document)
                      const action = getDocumentAction(document)

                      return (
                        <Box
                          key={document.id}
                          sx={{
                            borderTop: index === 0 ? 0 : `1px solid ${colors.greyMedium}`,
                            p: 2.25,
                          }}
                        >
                          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: { md: 'center' }, justifyContent: 'space-between' }}>
                            <Stack direction="row" spacing={1.5} sx={{ minWidth: 0 }}>
                              <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: colors.greyLight40, color: colors.blueInteraction, display: 'grid', flexShrink: 0, placeItems: 'center' }}>
                                <FileText size={19} />
                              </Box>
                              <Box sx={{ minWidth: 0 }}>
                                <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                                  <Typography sx={{ fontWeight: 850, overflowWrap: 'anywhere' }}>{getDocumentName(document)}</Typography>
                                  {document.status === 'validated' ? (
                                    <Box
                                      aria-label={statusLabel[document.status]}
                                      title={statusLabel[document.status]}
                                      sx={{
                                        alignItems: 'center',
                                        bgcolor: colors.greenDark,
                                        borderRadius: 99,
                                        color: colors.white,
                                        display: 'inline-flex',
                                        height: 24,
                                        justifyContent: 'center',
                                        width: 24,
                                      }}
                                    >
                                      {statusIcon[document.status]}
                                    </Box>
                                  ) : (
                                    <Chip color={statusTone[document.status]} icon={statusIcon[document.status]} label={statusLabel[document.status]} size="small" sx={{ fontWeight: 700 }} />
                                  )}
                                </Stack>
                                <Typography color="text.secondary" variant="body2">
                                  {documentLabels[document.type] ?? document.type} · maj {formatDate(document.updatedAt)}
                                  {confidence !== null ? ` · analyse ${confidence}%` : ''}
                                </Typography>
                                {issue && (
                                  <Typography color={document.status === 'rejected' ? 'error' : 'text.secondary'} variant="body2" sx={{ mt: 0.5 }}>
                                    {issue}
                                  </Typography>
                                )}
                              </Box>
                            </Stack>
                            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                              {action && (
                                <Button
                                  disabled={savingId === document.id}
                                  onClick={() => analyze(document.id)}
                                  startIcon={<RefreshCw size={16} />}
                                  variant={document.status === 'pending' ? 'contained' : 'outlined'}
                                >
                                  {savingId === document.id ? 'Analyse...' : action}
                                </Button>
                              )}
                            </Stack>
                          </Stack>
                        </Box>
                      )
                    })}
                  </AccordionDetails>
                </Accordion>
              )
            })}
          </Stack>

          {groupedSubscriptions.length > groupsPerPage && (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between', mt: 2.5 }}>
              <Typography color="text.secondary" variant="body2">
                Page {currentPage} sur {pageCount} · {groupedSubscriptions.length} dossier(s)
              </Typography>
              <Pagination
                count={pageCount}
                onChange={(_, value) => setPage(value)}
                page={currentPage}
                shape="rounded"
                siblingCount={0}
              />
            </Stack>
          )}

          {!loading && rows.length > 0 && filteredRows.length === 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>Aucun document ne correspond à ce filtre.</Alert>
          )}
        </Paper>

        <Stack spacing={3} sx={{ width: { xs: '100%', lg: 340 }, flexShrink: 0 }}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 850, mb: 1 }}>À traiter</Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Les pièces refusées ou en contrôle peuvent retarder la validation d'un titre.
            </Typography>
            <Stack spacing={1.25}>
              <Alert severity={counters.rejected > 0 ? 'error' : 'success'}>
                {counters.rejected > 0 ? `${counters.rejected} document(s) refusé(s).` : 'Aucun document refusé.'}
              </Alert>
              <Alert severity={counters.review > 0 ? 'warning' : 'success'}>
                {counters.review > 0 ? `${counters.review} document(s) en contrôle manuel.` : 'Aucun contrôle manuel en attente.'}
              </Alert>
            </Stack>
          </Paper>

          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 850, mb: 2 }}>Priorités</Typography>
            <Stack spacing={1.5}>
              {blockingRows.map(({ document, subscription }) => (
                <Paper
                  key={document.id}
                  component={Link}
                  to={`/subscriptions/${subscription.subscription.id}`}
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    color: 'inherit',
                    display: 'block',
                    textDecoration: 'none',
                    transition: 'border-color 0.2s, transform 0.2s',
                    '&:hover': { borderColor: colors.blueInteraction, transform: 'translateY(-1px)' },
                  }}
                >
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                    <Box sx={{ color: document.status === 'rejected' ? colors.redDark : colors.orangeDark, display: 'flex' }}>
                      {statusIcon[document.status]}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 800 }}>{documentLabels[document.type] ?? document.type}</Typography>
                      <Typography color="text.secondary" variant="body2">{subscription.offer?.name ?? 'Dossier sans offre'}</Typography>
                    </Box>
                    <ArrowRight size={16} color={colors.greyDark} />
                  </Stack>
                </Paper>
              ))}
              {!loading && blockingRows.length === 0 && <Alert severity="success">Aucune priorité documentaire.</Alert>}
            </Stack>
          </Paper>
        </Stack>
      </Stack>
    </Stack>
  )
}

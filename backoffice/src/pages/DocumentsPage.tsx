import { Alert, Box, Button, Chip, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material'
import { FileCheck2, FileSearch, FileWarning } from 'lucide-react'
import { useEffect, useState } from 'react'
import { EmptyState } from '../components/common/EmptyState'
import { LoadingState } from '../components/common/LoadingState'
import { StatusBadge } from '../components/common/StatusBadge'
import { getPendingDocuments } from '../services/admin.service'
import { analyzeDocument, getDocumentSignedUrl, reviewDocument } from '../services/documents.service'
import type { AdminDocument, PendingDocumentItem } from '../types/document'

interface DecisionHistoryItem {
  id: string
  documentId: string
  documentType: string
  holder: string
  decision: string
  status: string
  actor: string
  reason: string
  decidedAt: string
}

const documentTypeLabels: Record<string, string> = {
  identity: "Piece d'identite",
  proof_of_address: 'Justificatif de domicile',
  eligibility: "Justificatif d'eligibilite",
  school_certificate: 'Certificat de scolarite',
  tax_notice: 'Avis fiscal',
  other: 'Autre document',
}

function holderName(item: PendingDocumentItem) {
  const profile = item.subscription.bearerProfile
  return profile ? `${profile.firstName} ${profile.lastName}` : 'Non renseigne'
}

function documentTypeLabel(type: string) {
  return documentTypeLabels[type] ?? type
}

function confidence(item: PendingDocumentItem) {
  const result = item.document.analysisResult
  return result && typeof result === 'object' && 'confidence' in result && typeof result.confidence === 'number'
    ? `${result.confidence}%`
    : 'Non analysee'
}

function warnings(item: PendingDocumentItem) {
  const result = item.document.analysisResult
  return result && typeof result === 'object' && 'warnings' in result && Array.isArray(result.warnings)
    ? result.warnings.join(' ')
    : ''
}

function analysisValue(document: AdminDocument, key: 'provider' | 'note' | 'reviewedAt' | 'analyzedAt') {
  const result = document.analysisResult
  return result && typeof result === 'object' && key in result && typeof result[key] === 'string'
    ? result[key]
    : null
}

function decisionFromDocument(item: PendingDocumentItem): DecisionHistoryItem | null {
  const reviewedAt = analysisValue(item.document, 'reviewedAt')
  const analyzedAt = item.document.analyzedAt ?? analysisValue(item.document, 'analyzedAt')

  if (item.document.status === 'validated' || item.document.status === 'rejected') {
    return {
      id: `${item.document.id}-${item.document.updatedAt}`,
      documentId: item.document.id,
      documentType: item.document.type,
      holder: holderName(item),
      decision: item.document.status === 'validated' ? 'Validation' : 'Refus',
      status: item.document.status,
      actor: reviewedAt ? 'Backoffice' : 'Analyse automatique',
      reason: item.document.rejectionReason ?? analysisValue(item.document, 'note') ?? 'Aucun motif renseigne',
      decidedAt: reviewedAt ?? analyzedAt ?? item.document.updatedAt,
    }
  }

  if (analyzedAt) {
    return {
      id: `${item.document.id}-${analyzedAt}`,
      documentId: item.document.id,
      documentType: item.document.type,
      holder: holderName(item),
      decision: 'Analyse',
      status: item.document.status,
      actor: analysisValue(item.document, 'provider') ?? 'Moteur de regles',
      reason: warnings(item) || 'Analyse documentaire effectuee',
      decidedAt: analyzedAt,
    }
  }

  return null
}

export function DocumentsPage() {
  const [rows, setRows] = useState<PendingDocumentItem[]>([])
  const [reasons, setReasons] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [history, setHistory] = useState<DecisionHistoryItem[]>([])

  useEffect(() => {
    let mounted = true
    getPendingDocuments()
      .then((response) => {
        if (!mounted) return
        setRows(response.documents)
        setHistory(response.documents.map(decisionFromDocument).filter((item): item is DecisionHistoryItem => item !== null))
      })
      .catch((caught) => setError(caught instanceof Error ? caught.message : 'Documents indisponibles.'))
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  async function review(id: string, decision: 'validate' | 'reject' | 'manual_review') {
    setSavingId(id)
    setError('')
    setSuccess('')
    try {
      const rejectionReason = decision === 'reject' ? reasons[id] : undefined
      const response = await reviewDocument(id, decision, rejectionReason, decision === 'validate' ? 'Document validé depuis le backoffice.' : decision === 'reject' ? 'Document refusé depuis le backoffice.' : 'Revue manuelle demandée.')
      const currentItem = rows.find((item) => item.document.id === id)
      if (currentItem) {
        setHistory((current) => [{
          id: `${id}-${Date.now()}`,
          documentId: id,
          documentType: currentItem.document.type,
          holder: holderName(currentItem),
          decision: decision === 'validate' ? 'Validation' : decision === 'reject' ? 'Refus' : 'Revue manuelle',
          status: response.document.status,
          actor: 'Backoffice',
          reason: decision === 'validate' ? 'Document validé depuis le backoffice.' : decision === 'reject' ? rejectionReason ?? 'Motif non renseigné' : 'Revue humaine demandée',
          decidedAt: response.document.updatedAt,
        }, ...current])
      }
      setRows((current) => decision === 'manual_review'
        ? current.map((item) => item.document.id === id ? { ...item, document: response.document } : item)
        : current.filter((item) => item.document.id !== id))
      setSuccess(decision === 'validate' ? 'Document validé.' : decision === 'reject' ? 'Document refusé.' : 'Revue manuelle demandée.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Action document impossible.')
    } finally {
      setSavingId(null)
    }
  }

  async function analyze(id: string) {
    setSavingId(id)
    setError('')
    setSuccess('')
    try {
      const response = await analyzeDocument(id)
      setRows((current) => current.map((item) => item.document.id === id ? { ...item, document: response.document } : item))
      const currentItem = rows.find((item) => item.document.id === id)
      if (currentItem) {
        const updatedItem = { ...currentItem, document: response.document }
        const decision = decisionFromDocument(updatedItem)
        if (decision) setHistory((current) => [decision, ...current.filter((item) => item.id !== decision.id)])
      }
      setSuccess('Analyse documentaire simulee terminee.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Analyse documentaire impossible.')
    } finally {
      setSavingId(null)
    }
  }

  async function visualize(id: string) {
    setSavingId(id)
    setError('')
    setSuccess('')
    try {
      const response = await getDocumentSignedUrl(id)
      if (!response.signedUrl) throw new Error("Aucun lien de visualisation n'est disponible pour ce document.")
      window.open(response.signedUrl, '_blank', 'noopener,noreferrer')
      setSuccess('Lien securise de visualisation ouvert.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Visualisation impossible.')
    } finally {
      setSavingId(null)
    }
  }

  if (loading) return <LoadingState label="Chargement des documents..." />

  const manualReviewCount = rows.filter((item) => item.document.status === 'needs_manual_review').length
  const pendingCount = rows.filter((item) => item.document.status === 'pending' || item.document.status === 'analyzing').length

  return (
    <Stack spacing={3}>
      {error && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success">{success}</Alert>}

      <Paper sx={{ borderRadius: 4, p: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: { md: 'center' }, justifyContent: 'space-between' }}>
          <Box>
            <Typography component="h2" sx={{ fontWeight: 900 }} variant="h5">File documentaire</Typography>
            <Typography color="text.secondary">
              Controlez les pieces deposees, ouvrez le fichier securise puis validez ou refusez avec un motif.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
            <Chip color="primary" icon={<FileSearch size={16} />} label={`${rows.length} a traiter`} />
            <Chip color={manualReviewCount > 0 ? 'warning' : 'success'} icon={<FileWarning size={16} />} label={`${manualReviewCount} revue manuelle`} />
            <Chip color={pendingCount > 0 ? 'warning' : 'success'} icon={<FileCheck2 size={16} />} label={`${pendingCount} en attente`} />
          </Stack>
        </Stack>
      </Paper>

      <Paper sx={{ borderRadius: 4, p: 3 }}>
        <Typography component="h2" sx={{ fontWeight: 900, mb: 1 }} variant="h6">Documents en attente</Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Validez les justificatifs simples et refusez les pieces non conformes avec un motif lisible pour le support.
        </Typography>

        <Box sx={{ display: 'grid', gap: 2 }}>
          {rows.map((item) => {
            const documentWarnings = warnings(item)
            const busy = savingId === item.document.id

            return (
              <Paper key={item.document.id} variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
                <Box sx={{ p: { xs: 2, md: 2.5 }, bgcolor: item.document.status === 'needs_manual_review' ? '#fffaf0' : 'background.paper' }}>
                  <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2.5} sx={{ justifyContent: 'space-between' }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ alignItems: { sm: 'center' }, mb: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 900 }}>{documentTypeLabel(item.document.type)}</Typography>
                        <StatusBadge status={item.document.status} />
                      </Stack>
                      <Typography sx={{ fontWeight: 750, wordBreak: 'break-word' }}>
                        {item.document.originalFilename ?? item.document.fileUrl}
                      </Typography>
                      <Typography color="text.secondary" variant="body2">
                        Porteur : {holderName(item)} · Offre : {item.subscription.offer?.name ?? 'Non renseignée'}
                      </Typography>
                      <Typography color="text.secondary" variant="body2">
                        Déposé le {new Date(item.document.createdAt).toLocaleDateString('fr-FR')} · {item.document.mimeType ?? 'type inconnu'} · {item.document.sizeBytes ? `${Math.round(item.document.sizeBytes / 1024)} Ko` : 'taille inconnue'}
                      </Typography>
                    </Box>

                    <Box sx={{ width: { xs: '100%', lg: 300 }, flexShrink: 0 }}>
                      <Paper variant="outlined" sx={{ p: 1.75, borderRadius: 2, bgcolor: 'background.default' }}>
                        <Typography color="text.secondary" variant="caption">Analyse automatique</Typography>
                        <Typography sx={{ fontWeight: 850 }}>
                          {item.document.status === 'validated' ? 'Vérifié automatiquement' : 'Revue humaine nécessaire'}
                        </Typography>
                        <Typography variant="body2">Confiance : {confidence(item)}</Typography>
                        <Typography color={documentWarnings ? 'warning.main' : 'text.secondary'} variant="body2" sx={{ mt: 0.5 }}>
                          {documentWarnings || 'Aucun avertissement détecté.'}
                        </Typography>
                      </Paper>
                    </Box>
                  </Stack>
                </Box>

                <Box sx={{ borderTop: '1px solid', borderColor: 'divider', p: { xs: 2, md: 2.5 } }}>
                  <Stack spacing={2}>
                    <TextField
                      disabled={busy}
                      fullWidth
                      helperText="Obligatoire uniquement pour refuser la pièce. Le client verra ce motif."
                      label="Motif du refus"
                      placeholder="Ex. Document illisible, incomplet ou expiré"
                      onChange={(event) => setReasons((current) => ({ ...current, [item.document.id]: event.target.value }))}
                      value={reasons[item.document.id] ?? ''}
                    />
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ flexWrap: 'wrap' }}>
                      <Button disabled={busy} onClick={() => visualize(item.document.id)} variant="outlined">Voir le document</Button>
                      <Button color="success" disabled={busy} onClick={() => review(item.document.id, 'validate')} variant="contained">Accepter la pièce</Button>
                      <Button
                        color="error"
                        disabled={busy || (reasons[item.document.id] ?? '').trim().length < 3}
                        onClick={() => review(item.document.id, 'reject')}
                        variant="outlined"
                      >
                        Refuser avec ce motif
                      </Button>
                      <Button disabled={busy} onClick={() => review(item.document.id, 'manual_review')} variant="outlined">
                        Demander une revue manuelle
                      </Button>
                      <Button disabled={busy} onClick={() => analyze(item.document.id)} variant="text">
                        Relancer l’analyse
                      </Button>
                    </Stack>
                  </Stack>
                </Box>
              </Paper>
            )
          })}
        </Box>

        {rows.length === 0 && <EmptyState title="Aucun document a traiter" description="Les justificatifs en attente ou en revue manuelle apparaitront ici." />}
      </Paper>

      <Paper sx={{ borderRadius: 4, p: 3 }}>
        <Typography component="h2" sx={{ fontWeight: 900, mb: 1 }} variant="h6">Historique des decisions</Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Trace des analyses, validations et refus effectues sur les justificatifs affiches pendant la session backoffice.
        </Typography>
        <TableContainer>
          <Table aria-label="Historique des decisions documentaires">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Decision</TableCell>
                <TableCell>Document</TableCell>
                <TableCell>Porteur</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell>Acteur</TableCell>
                <TableCell>Motif / trace</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {history.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>{new Date(entry.decidedAt).toLocaleString('fr-FR')}</TableCell>
                  <TableCell>{entry.decision}</TableCell>
                  <TableCell>{documentTypeLabel(entry.documentType)}</TableCell>
                  <TableCell>{entry.holder}</TableCell>
                  <TableCell><StatusBadge status={entry.status} /></TableCell>
                  <TableCell>{entry.actor}</TableCell>
                  <TableCell sx={{ maxWidth: 360 }}>{entry.reason}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {history.length === 0 && <EmptyState title="Aucune decision tracee" description="Les analyses, validations et refus apparaitront ici." />}
      </Paper>
    </Stack>
  )
}

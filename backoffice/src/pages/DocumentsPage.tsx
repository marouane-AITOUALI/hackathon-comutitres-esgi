import { Alert, Button, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material'
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
  dossierId: string
  documentType: string
  holder: string
  decision: string
  status: string
  actor: string
  reason: string
  decidedAt: string
}

function holderName(item: PendingDocumentItem) {
  const profile = item.subscription.bearerProfile
  return profile ? `${profile.firstName} ${profile.lastName}` : 'Non renseigne'
}

function confidence(item: PendingDocumentItem) {
  const result = item.document.analysisResult
  return result && typeof result === 'object' && 'confidence' in result && typeof result.confidence === 'number'
    ? `${result.confidence}%`
    : 'Non disponible'
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
      dossierId: item.document.subscriptionId,
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
      dossierId: item.document.subscriptionId,
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

  async function review(id: string, accepted: boolean) {
    setSavingId(id)
    setError('')
    setSuccess('')
    try {
      const rejectionReason = accepted ? undefined : reasons[id]
      const response = await reviewDocument(id, accepted, rejectionReason, accepted ? 'Document valide depuis le backoffice.' : 'Document refuse depuis le backoffice.')
      const currentItem = rows.find((item) => item.document.id === id)
      if (currentItem) {
        setHistory((current) => [{
          id: `${id}-${Date.now()}`,
          documentId: id,
          dossierId: currentItem.document.subscriptionId,
          documentType: currentItem.document.type,
          holder: holderName(currentItem),
          decision: accepted ? 'Validation' : 'Refus',
          status: response.document.status,
          actor: 'Backoffice',
          reason: accepted ? 'Document valide depuis le backoffice.' : rejectionReason ?? 'Motif non renseigne',
          decidedAt: response.document.updatedAt,
        }, ...current])
      }
      setRows((current) => current.filter((item) => item.document.id !== id))
      setSuccess(accepted ? 'Document valide.' : 'Document refuse.')
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

  return (
    <Stack spacing={3}>
      {error && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success">{success}</Alert>}

      <Paper sx={{ borderRadius: 4, p: 3 }}>
        <Typography component="h2" sx={{ fontWeight: 900, mb: 1 }} variant="h6">Documents en attente</Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Validez les justificatifs simples et refusez les pieces non conformes avec un motif lisible pour le support.
        </Typography>

        <TableContainer>
          <Table aria-label="Documents en attente">
            <TableHead>
              <TableRow>
                <TableCell>Document</TableCell>
                <TableCell>Fichier</TableCell>
                <TableCell>Porteur</TableCell>
                <TableCell>Offre</TableCell>
                <TableCell>Dossier</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell>Confiance IA</TableCell>
                <TableCell>Warnings</TableCell>
                <TableCell>Trace</TableCell>
                <TableCell>Revue manuelle</TableCell>
                <TableCell>Date upload</TableCell>
                <TableCell>Motif refus</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((item) => {
                const requiresManualReview = item.document.status === 'needs_manual_review'
                return (
                  <TableRow key={item.document.id}>
                    <TableCell>{item.document.type}</TableCell>
                    <TableCell sx={{ maxWidth: 180 }}>
                      <Typography sx={{ fontWeight: 700 }} variant="body2">{item.document.originalFilename ?? item.document.fileUrl}</Typography>
                      <Typography color="text.secondary" variant="caption">
                        {item.document.mimeType ?? 'type inconnu'} - {item.document.sizeBytes ? `${Math.round(item.document.sizeBytes / 1024)} Ko` : 'taille inconnue'}
                      </Typography>
                    </TableCell>
                    <TableCell>{holderName(item)}</TableCell>
                    <TableCell>{item.subscription.offer?.name ?? 'Non renseignee'}</TableCell>
                    <TableCell>{item.document.subscriptionId.slice(0, 8)}</TableCell>
                    <TableCell><StatusBadge status={item.document.status} /></TableCell>
                    <TableCell>{confidence(item)}</TableCell>
                    <TableCell sx={{ maxWidth: 220 }}>{warnings(item) || 'Aucun'}</TableCell>
                    <TableCell sx={{ minWidth: 170 }}>
                      <Typography variant="body2">ID {item.document.id.slice(0, 8)}</Typography>
                      <Typography color="text.secondary" variant="caption">MAJ {new Date(item.document.updatedAt).toLocaleString('fr-FR')}</Typography>
                    </TableCell>
                    <TableCell>
                      {requiresManualReview
                        ? <StatusBadge status="needs_manual_review" />
                        : <Button disabled size="small" variant="outlined">Non requis</Button>}
                    </TableCell>
                    <TableCell>{new Date(item.document.createdAt).toLocaleDateString('fr-FR')}</TableCell>
                    <TableCell>
                      <TextField
                        disabled={savingId === item.document.id}
                        label="Motif si refus"
                        onChange={(event) => setReasons((current) => ({ ...current, [item.document.id]: event.target.value }))}
                        size="small"
                        value={reasons[item.document.id] ?? ''}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ justifyContent: 'flex-end' }}>
                        <Button disabled={savingId === item.document.id} onClick={() => visualize(item.document.id)} size="small" variant="outlined">Visualiser</Button>
                        <Button disabled={savingId === item.document.id} onClick={() => analyze(item.document.id)} size="small" variant="outlined">Analyser</Button>
                        <Button disabled={savingId === item.document.id} onClick={() => review(item.document.id, true)} size="small" variant="contained">Valider</Button>
                        <Button
                          color="error"
                          disabled={savingId === item.document.id || (reasons[item.document.id] ?? '').trim().length < 3}
                          onClick={() => review(item.document.id, false)}
                          size="small"
                          variant="outlined"
                        >
                          Refuser
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>

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
                <TableCell>Dossier</TableCell>
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
                  <TableCell>{entry.documentType}</TableCell>
                  <TableCell>{entry.holder}</TableCell>
                  <TableCell>{entry.dossierId.slice(0, 8)}</TableCell>
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

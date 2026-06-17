import { Alert, Button, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { EmptyState } from '../components/common/EmptyState'
import { LoadingState } from '../components/common/LoadingState'
import { StatusBadge } from '../components/common/StatusBadge'
import { getPendingDocuments } from '../services/admin.service'
import { analyzeDocument, reviewDocument } from '../services/documents.service'
import type { PendingDocumentItem } from '../types/document'

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

export function DocumentsPage() {
  const [rows, setRows] = useState<PendingDocumentItem[]>([])
  const [reasons, setReasons] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    let mounted = true
    getPendingDocuments()
      .then((response) => { if (mounted) setRows(response.documents) })
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
      await reviewDocument(id, accepted, rejectionReason, accepted ? 'Document valide depuis le backoffice.' : 'Document refuse depuis le backoffice.')
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
      setSuccess('Analyse documentaire simulee terminee.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Analyse documentaire impossible.')
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
                <TableCell>Porteur</TableCell>
                <TableCell>Offre</TableCell>
                <TableCell>Dossier</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell>Confiance IA</TableCell>
                <TableCell>Warnings</TableCell>
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
                    <TableCell>{holderName(item)}</TableCell>
                    <TableCell>{item.subscription.offer?.name ?? 'Non renseignee'}</TableCell>
                    <TableCell>{item.document.subscriptionId.slice(0, 8)}</TableCell>
                    <TableCell><StatusBadge status={item.document.status} /></TableCell>
                    <TableCell>{confidence(item)}</TableCell>
                    <TableCell sx={{ maxWidth: 220 }}>{warnings(item) || 'Aucun'}</TableCell>
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
    </Stack>
  )
}

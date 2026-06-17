import { Alert, Box, Button, Chip, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { analyzeDocument } from '../services/documents.service'
import { listSubscriptions } from '../services/subscriptions.service'
import type { DocumentSummary, SubscriptionSummary } from '../types'

const documentLabels: Record<string, string> = {
  identity: "Piece d'identite",
  proof_of_address: 'Justificatif de domicile',
  eligibility: 'Eligibilite',
  school_certificate: 'Certificat de scolarite',
  tax_notice: 'Avis fiscal',
  other: 'Autre',
}

const statusTone: Record<string, 'default' | 'warning' | 'success' | 'error' | 'info'> = {
  pending: 'warning',
  analyzing: 'info',
  validated: 'success',
  rejected: 'error',
  needs_manual_review: 'warning',
}

function confidence(document: DocumentSummary) {
  const result = document.analysisResult
  return result && typeof result === 'object' && 'confidence' in result && typeof result.confidence === 'number'
    ? `${result.confidence}%`
    : 'Non analysee'
}

export function DocumentsPage() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const load = useCallback(async () => {
    const data = await listSubscriptions()
    setSubscriptions(data)
  }, [])

  useEffect(() => {
    let mounted = true

    async function loadInitial() {
      try {
        const data = await listSubscriptions()
        if (mounted) setSubscriptions(data)
      } catch (caught) {
        if (mounted) setError(caught instanceof Error ? caught.message : 'Documents indisponibles.')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    void loadInitial()
    return () => { mounted = false }
  }, [])

  const rows = subscriptions.flatMap((subscription) => (subscription.documents ?? []).map((document) => ({ document, subscription })))

  async function analyze(id: string) {
    setSavingId(id)
    setError('')
    setSuccess('')
    try {
      await analyzeDocument(id)
      await load()
      setSuccess('Analyse documentaire simulee terminee.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Analyse impossible.')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>Documents</Typography>
        <Typography color="text.secondary">Suivez les justificatifs, leur analyse et leur traitement par Comutitres.</Typography>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success">{success}</Alert>}
      {loading && <Alert severity="info">Chargement des documents...</Alert>}

      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow><TableCell>Document</TableCell><TableCell>Dossier</TableCell><TableCell>Statut</TableCell><TableCell>Analyse</TableCell><TableCell>Derniere mise a jour</TableCell><TableCell align="right">Action</TableCell></TableRow>
            </TableHead>
            <TableBody>
              {rows.map(({ document, subscription }) => (
                <TableRow key={document.id}>
                  <TableCell>
                    <Typography sx={{ fontWeight: 700 }}>{documentLabels[document.type] ?? document.type}</Typography>
                    <Typography color="text.secondary" variant="caption">{document.fileUrl}</Typography>
                  </TableCell>
                  <TableCell>
                    <Button component={Link} size="small" to={`/subscriptions/${subscription.subscription.id}`}>
                      {subscription.offer?.name ?? subscription.subscription.id.slice(0, 8)}
                    </Button>
                  </TableCell>
                  <TableCell><Chip color={statusTone[document.status]} label={document.status} size="small" /></TableCell>
                  <TableCell>{confidence(document)}</TableCell>
                  <TableCell>{new Date(document.updatedAt).toLocaleDateString('fr-FR')}</TableCell>
                  <TableCell align="right">
                    <Button disabled={savingId === document.id} onClick={() => analyze(document.id)} size="small" variant="outlined">Analyser</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {!loading && rows.length === 0 && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Aucun document pour le moment. Ouvrez une souscription pour ajouter vos justificatifs.
          </Alert>
        )}
      </Paper>
    </Stack>
  )
}

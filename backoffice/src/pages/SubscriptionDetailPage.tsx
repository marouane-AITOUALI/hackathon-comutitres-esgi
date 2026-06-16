import { Alert, Button, Grid, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { LoadingState } from '../components/common/LoadingState'
import { StatusBadge } from '../components/common/StatusBadge'
import { getAdminSubscription, updateAdminSubscriptionStatus } from '../services/subscriptions.service'
import type { AdminSubscriptionItem, SubscriptionStatus } from '../types/subscription'

function profileName(profile: AdminSubscriptionItem['bearerProfile']) {
  return profile ? `${profile.firstName} ${profile.lastName}` : 'Non renseigne'
}

function documentConfidence(result: AdminSubscriptionItem['documents'][number]['analysisResult']) {
  return result && typeof result === 'object' && 'confidence' in result && typeof result.confidence === 'number'
    ? `${result.confidence}%`
    : 'Non disponible'
}

export function SubscriptionDetailPage() {
  const { id } = useParams()
  const [item, setItem] = useState<AdminSubscriptionItem | null>(null)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    getAdminSubscription(id)
      .then(setItem)
      .catch((caught) => setError(caught instanceof Error ? caught.message : 'Dossier indisponible.'))
      .finally(() => setLoading(false))
  }, [id])

  async function changeStatus(status: SubscriptionStatus) {
    if (!id) return
    setSaving(true)
    setError('')
    try {
      setItem(await updateAdminSubscriptionStatus(id, status))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Mise a jour impossible.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingState label="Chargement du dossier..." />
  if (!item) return <Alert severity="error">{error || 'Dossier introuvable.'}</Alert>

  return (
    <Stack spacing={3}>
      {error && <Alert severity="error">{error}</Alert>}
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
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <Button disabled={saving} onClick={() => changeStatus('accepted')} color="success" variant="contained">Accepter</Button>
          <Button disabled={saving} onClick={() => changeStatus('rejected')} color="error" variant="contained">Refuser</Button>
          <Button disabled={saving} onClick={() => changeStatus('suspended')} color="warning" variant="outlined">Suspendre</Button>
        </Stack>
        <TextField fullWidth label="Commentaire de refus (prepare UI, non envoye si backend non supporte)" onChange={(event) => setComment(event.target.value)} sx={{ mt: 2 }} value={comment} />
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

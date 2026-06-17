import { Alert, Button, Checkbox, FormControlLabel, Grid, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material'
import { useEffect, useState, type FormEvent } from 'react'
import { EmptyState } from '../components/common/EmptyState'
import { LoadingState } from '../components/common/LoadingState'
import { StatusBadge } from '../components/common/StatusBadge'
import { createAdminOffer, getAdminOffers, updateAdminOffer } from '../services/offers.service'
import type { AdminOffer, OfferPayload } from '../types/offer'

const emptyPayload: OfferPayload = {
  code: '',
  name: '',
  description: '',
  target: '',
  requiredDocuments: [],
  isActive: true,
}

export function OffersPage() {
  const [offers, setOffers] = useState<AdminOffer[]>([])
  const [payload, setPayload] = useState<OfferPayload>(emptyPayload)
  const [documentsText, setDocumentsText] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editPayload, setEditPayload] = useState<OfferPayload>(emptyPayload)
  const [editDocumentsText, setEditDocumentsText] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    let mounted = true
    getAdminOffers()
      .then((response) => { if (mounted) setOffers(response.offers) })
      .catch((caught) => setError(caught instanceof Error ? caught.message : 'Offres indisponibles.'))
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  async function submitOffer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const nextPayload = {
        ...payload,
        requiredDocuments: documentsText.split(',').map((item) => item.trim()).filter(Boolean),
      }
      const response = await createAdminOffer(nextPayload)
      setOffers((current) => [...current, response.offer].sort((a, b) => a.name.localeCompare(b.name)))
      setPayload(emptyPayload)
      setDocumentsText('')
      setSuccess('Offre creee.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Creation de l'offre impossible.")
    } finally {
      setSaving(false)
    }
  }

  async function toggleOffer(offer: AdminOffer) {
    setError('')
    try {
      const response = await updateAdminOffer(offer.id, { isActive: !offer.isActive })
      setOffers((current) => current.map((item) => item.id === offer.id ? response.offer : item))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Mise a jour de l'offre impossible.")
    }
  }

  function startEdit(offer: AdminOffer) {
    setEditingId(offer.id)
    setEditPayload({
      code: offer.code,
      name: offer.name,
      description: offer.description ?? '',
      target: offer.target,
      requiredDocuments: offer.requiredDocuments,
      isActive: offer.isActive !== false,
    })
    setEditDocumentsText(offer.requiredDocuments.join(', '))
  }

  async function saveEdit() {
    if (!editingId) return
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const response = await updateAdminOffer(editingId, {
        ...editPayload,
        requiredDocuments: editDocumentsText.split(',').map((item) => item.trim()).filter(Boolean),
      })
      setOffers((current) => current.map((item) => item.id === editingId ? response.offer : item).sort((a, b) => a.name.localeCompare(b.name)))
      setEditingId(null)
      setSuccess('Offre mise a jour.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Mise a jour de l'offre impossible.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingState label="Chargement des offres..." />

  return (
    <Stack spacing={3}>
      {error && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success">{success}</Alert>}

      <Paper component="form" onSubmit={submitOffer} sx={{ borderRadius: 4, p: 3 }}>
        <Typography sx={{ fontWeight: 900, mb: 2 }} variant="h6">Ajouter une offre</Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField fullWidth label="Code" onChange={(event) => setPayload((current) => ({ ...current, code: event.target.value }))} required value={payload.code} />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField fullWidth label="Nom" onChange={(event) => setPayload((current) => ({ ...current, name: event.target.value }))} required value={payload.name} />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField fullWidth label="Cible" onChange={(event) => setPayload((current) => ({ ...current, target: event.target.value }))} required value={payload.target} />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField fullWidth label="Documents requis, separes par virgule" onChange={(event) => setDocumentsText(event.target.value)} value={documentsText} />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField fullWidth label="Description" multiline onChange={(event) => setPayload((current) => ({ ...current, description: event.target.value }))} rows={2} value={payload.description} />
          </Grid>
        </Grid>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { sm: 'center' }, mt: 2 }}>
          <FormControlLabel control={<Checkbox checked={payload.isActive} onChange={(event) => setPayload((current) => ({ ...current, isActive: event.target.checked }))} />} label="Offre active" />
          <Button disabled={saving} type="submit" variant="contained">Creer offre</Button>
        </Stack>
      </Paper>

      <Paper sx={{ borderRadius: 4, p: 3 }}>
        <TableContainer>
          <Table aria-label="Offres">
            <TableHead>
              <TableRow><TableCell>Code</TableCell><TableCell>Nom</TableCell><TableCell>Cible</TableCell><TableCell>Documents</TableCell><TableCell>Statut</TableCell><TableCell align="right">Action</TableCell></TableRow>
            </TableHead>
            <TableBody>
              {offers.map((offer) => {
                const editing = editingId === offer.id
                return (
                  <TableRow key={offer.id}>
                    <TableCell>
                      {editing ? <TextField label="Code" onChange={(event) => setEditPayload((current) => ({ ...current, code: event.target.value }))} size="small" value={editPayload.code} /> : offer.code}
                    </TableCell>
                    <TableCell>
                      {editing ? (
                        <Stack spacing={1}>
                          <TextField label="Nom" onChange={(event) => setEditPayload((current) => ({ ...current, name: event.target.value }))} size="small" value={editPayload.name} />
                          <TextField label="Description" onChange={(event) => setEditPayload((current) => ({ ...current, description: event.target.value }))} size="small" value={editPayload.description} />
                        </Stack>
                      ) : offer.name}
                    </TableCell>
                    <TableCell>
                      {editing ? <TextField label="Cible" onChange={(event) => setEditPayload((current) => ({ ...current, target: event.target.value }))} size="small" value={editPayload.target} /> : offer.target}
                    </TableCell>
                    <TableCell>
                      {editing ? <TextField label="Documents" onChange={(event) => setEditDocumentsText(event.target.value)} size="small" value={editDocumentsText} /> : offer.requiredDocuments.length > 0 ? offer.requiredDocuments.join(', ') : 'Aucun'}
                    </TableCell>
                    <TableCell><StatusBadge status={offer.isActive === false ? 'cancelled' : 'validated'} label={offer.isActive === false ? 'Inactive' : 'Active'} /></TableCell>
                    <TableCell align="right">
                      {editing ? (
                        <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
                          <Button disabled={saving} onClick={saveEdit} size="small" variant="contained">Enregistrer</Button>
                          <Button disabled={saving} onClick={() => setEditingId(null)} size="small" variant="outlined">Annuler</Button>
                        </Stack>
                      ) : (
                        <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
                          <Button onClick={() => startEdit(offer)} size="small" variant="outlined">Modifier</Button>
                          <Button onClick={() => toggleOffer(offer)} size="small" variant="outlined">
                            {offer.isActive === false ? 'Activer' : 'Desactiver'}
                          </Button>
                        </Stack>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
        {offers.length === 0 && <EmptyState title="Aucune offre" description="Les offres configurees dans Supabase apparaitront ici." />}
      </Paper>
    </Stack>
  )
}

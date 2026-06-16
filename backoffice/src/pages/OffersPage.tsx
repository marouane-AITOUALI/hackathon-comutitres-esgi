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
              {offers.map((offer) => (
                <TableRow key={offer.id}>
                  <TableCell>{offer.code}</TableCell>
                  <TableCell>{offer.name}</TableCell>
                  <TableCell>{offer.target}</TableCell>
                  <TableCell>{offer.requiredDocuments.length > 0 ? offer.requiredDocuments.join(', ') : 'Aucun'}</TableCell>
                  <TableCell><StatusBadge status={offer.isActive === false ? 'cancelled' : 'validated'} label={offer.isActive === false ? 'Inactive' : 'Active'} /></TableCell>
                  <TableCell align="right">
                    <Button onClick={() => toggleOffer(offer)} size="small" variant="outlined">
                      {offer.isActive === false ? 'Activer' : 'Desactiver'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {offers.length === 0 && <EmptyState title="Aucune offre" description="Les offres configurees dans Supabase apparaitront ici." />}
      </Paper>
    </Stack>
  )
}

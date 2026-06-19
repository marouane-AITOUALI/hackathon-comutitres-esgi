import { Alert, Button, Checkbox, Chip, FormControlLabel, Grid, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material'
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
  priceCents: 0,
  monthlyInstallmentCount: null,
  isActive: true,
}

const euroFormatter = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })

function eurosToCents(value: string) {
  const amount = Number(value.replace(',', '.'))
  return Number.isFinite(amount) ? Math.max(0, Math.round(amount * 100)) : 0
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
      priceCents: offer.priceCents,
      monthlyInstallmentCount: offer.monthlyInstallmentCount,
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

  const activeOffersCount = offers.filter((offer) => offer.isActive !== false).length

  return (
    <Stack spacing={3}>
      {error && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success">{success}</Alert>}

      <Paper component="form" onSubmit={submitOffer} sx={{ borderRadius: 4, p: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between', mb: 2 }}>
          <div>
            <Typography sx={{ fontWeight: 900 }} variant="h6">Ajouter une offre</Typography>
            <Typography color="text.secondary" variant="body2">Les prix sont saisis en euros et conservés précisément en centimes par l'API.</Typography>
          </div>
          <Stack direction="row" spacing={1}>
            <Chip color="success" label={`${activeOffersCount} active(s)`} size="small" />
            <Chip label={`${offers.length} au total`} size="small" />
          </Stack>
        </Stack>
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
            <TextField
              fullWidth
              helperText="Ex. identity, proof_of_address, school_certificate"
              label="Documents requis"
              onChange={(event) => setDocumentsText(event.target.value)}
              value={documentsText}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              label="Prix total (€)"
              onChange={(event) => setPayload((current) => ({ ...current, priceCents: eurosToCents(event.target.value) }))}
              slotProps={{ htmlInput: { min: 0, step: '0.01' } }}
              type="number"
              value={payload.priceCents / 100}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              helperText="Laisser vide si l'offre ne peut pas être mensualisée"
              label="Nombre de mensualités"
              onChange={(event) => setPayload((current) => ({ ...current, monthlyInstallmentCount: event.target.value ? Number(event.target.value) : null }))}
              slotProps={{ htmlInput: { min: 2, max: 24, step: 1 } }}
              type="number"
              value={payload.monthlyInstallmentCount ?? ''}
            />
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
        <Typography sx={{ fontWeight: 900, mb: 2 }} variant="h6">Catalogue des offres</Typography>
        <TableContainer>
          <Table aria-label="Offres" sx={{ minWidth: 1100 }}>
            <TableHead>
              <TableRow><TableCell>Code</TableCell><TableCell>Nom</TableCell><TableCell>Cible</TableCell><TableCell>Prix</TableCell><TableCell>Paiement</TableCell><TableCell>Documents</TableCell><TableCell>Statut</TableCell><TableCell align="right">Actions</TableCell></TableRow>
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
                    <TableCell sx={{ minWidth: 130 }}>
                      {editing ? (
                        <TextField
                          label="Prix (€)"
                          onChange={(event) => setEditPayload((current) => ({ ...current, priceCents: eurosToCents(event.target.value) }))}
                          size="small"
                          slotProps={{ htmlInput: { min: 0, step: '0.01' } }}
                          type="number"
                          value={editPayload.priceCents / 100}
                        />
                      ) : euroFormatter.format(offer.priceCents / 100)}
                    </TableCell>
                    <TableCell sx={{ minWidth: 155 }}>
                      {editing ? (
                        <TextField
                          helperText="Vide = paiement unique"
                          label="Mensualités"
                          onChange={(event) => setEditPayload((current) => ({ ...current, monthlyInstallmentCount: event.target.value ? Number(event.target.value) : null }))}
                          size="small"
                          slotProps={{ htmlInput: { min: 2, max: 24, step: 1 } }}
                          type="number"
                          value={editPayload.monthlyInstallmentCount ?? ''}
                        />
                      ) : offer.monthlyInstallmentCount ? `${offer.monthlyInstallmentCount} échéances` : 'Paiement unique'}
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

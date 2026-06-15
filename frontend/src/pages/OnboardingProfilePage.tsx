import { Alert, Button, FormControlLabel, MenuItem, Stack, Switch, TextField, Typography } from '@mui/material'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { OnboardingProgress } from '../components/OnboardingProgress'
import { PageCard } from '../components/PageCard'
import { calculateAge, getOnboardingDraft, saveOnboardingDraft } from '../services/onboarding.service'
import type { PayeurProfile, PorteurProfile, ProfileStatus, RelationshipToBearer } from '../types'

const blankBearer: PorteurProfile = { firstName: '', lastName: '', birthDate: '', status: 'other' }
const blankPayer: PayeurProfile = { firstName: '', lastName: '', email: '', relationshipToBearer: 'parent' }

export function OnboardingProfilePage() {
  const navigate = useNavigate()
  const initial = getOnboardingDraft()
  const [isBearerPayer, setIsBearerPayer] = useState(initial.isBearerPayer ?? true)
  const [bearer, setBearer] = useState<PorteurProfile>(initial.bearer ?? blankBearer)
  const [payer, setPayer] = useState<PayeurProfile>(initial.payer ?? blankPayer)

  function submit(event: FormEvent) {
    event.preventDefault()
    saveOnboardingDraft({ isBearerPayer, bearer, payer: isBearerPayer ? undefined : payer })
    navigate('/onboarding/needs')
  }

  return (
    <PageCard>
      <OnboardingProgress step={2} />
      <Stack component="form" onSubmit={submit} spacing={2.5}>
        <div><Typography component="h1" variant="h4">Qui utilisera et paiera le forfait ?</Typography><Typography color="text.secondary">Nous adaptons les offres et justificatifs au porteur.</Typography></div>
        <Alert severity="info">Les informations du payeur sont demandees uniquement s'il est different du porteur.</Alert>
        <FormControlLabel control={<Switch checked={isBearerPayer} onChange={(event) => setIsBearerPayer(event.target.checked)} />} label="Le porteur est aussi le payeur" />
        <Typography component="h2" sx={{ fontWeight: 800 }} variant="h6">Profil du porteur</Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField fullWidth label="Prenom" onChange={(e) => setBearer({ ...bearer, firstName: e.target.value })} required value={bearer.firstName} />
          <TextField fullWidth label="Nom" onChange={(e) => setBearer({ ...bearer, lastName: e.target.value })} required value={bearer.lastName} />
        </Stack>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField fullWidth helperText={bearer.birthDate ? `Age calcule : ${calculateAge(bearer.birthDate)} ans` : undefined} label="Date de naissance" onChange={(e) => setBearer({ ...bearer, birthDate: e.target.value })} required slotProps={{ inputLabel: { shrink: true } }} type="date" value={bearer.birthDate} />
          <TextField fullWidth label="Statut" onChange={(e) => setBearer({ ...bearer, status: e.target.value as ProfileStatus })} required select value={bearer.status}>
            <MenuItem value="junior">Junior</MenuItem><MenuItem value="school">Scolaire</MenuItem><MenuItem value="student">Etudiant</MenuItem><MenuItem value="active">Actif</MenuItem><MenuItem value="senior">Senior</MenuItem><MenuItem value="solidarity">Beneficiaire solidarite</MenuItem><MenuItem value="other">Autre</MenuItem>
          </TextField>
        </Stack>
        {!isBearerPayer && (
          <>
            <Typography component="h2" sx={{ fontWeight: 800 }} variant="h6">Profil du payeur</Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField fullWidth label="Prenom" onChange={(e) => setPayer({ ...payer, firstName: e.target.value })} required value={payer.firstName} />
              <TextField fullWidth label="Nom" onChange={(e) => setPayer({ ...payer, lastName: e.target.value })} required value={payer.lastName} />
            </Stack>
            <TextField label="Email" onChange={(e) => setPayer({ ...payer, email: e.target.value })} required type="email" value={payer.email} />
            <TextField label="Lien avec le porteur" onChange={(e) => setPayer({ ...payer, relationshipToBearer: e.target.value as RelationshipToBearer })} required select value={payer.relationshipToBearer}>
              <MenuItem value="parent">Parent</MenuItem><MenuItem value="guardian">Tuteur</MenuItem><MenuItem value="association">Association</MenuItem><MenuItem value="employer">Employeur</MenuItem><MenuItem value="other">Autre</MenuItem>
            </TextField>
          </>
        )}
        <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
          <Button onClick={() => navigate('/onboarding')}>Retour</Button>
          <Button type="submit" variant="contained">Continuer</Button>
        </Stack>
      </Stack>
    </PageCard>
  )
}

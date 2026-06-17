import { Alert, Button, FormControlLabel, MenuItem, Stack, Switch, TextField, Typography } from '@mui/material'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { OnboardingProgress } from '../components/OnboardingProgress'
import { PageCard } from '../components/PageCard'
import { createOnboarding, getOnboardingDraft, saveOnboardingDraft } from '../services/onboarding.service'
import type { Frequency, OnboardingAnswer, PlanPreference, SocialSituation, SupportPreference } from '../types'

export function OnboardingNeedsPage() {
  const navigate = useNavigate()
  const initial = getOnboardingDraft()
  const [needs, setNeeds] = useState({
    frequency: initial.frequency ?? 'daily' as Frequency,
    planPreference: initial.planPreference ?? 'unsure' as PlanPreference,
    socialSituation: initial.socialSituation ?? 'other' as SocialSituation,
    support: initial.support ?? 'unsure' as SupportPreference,
    scholarship: initial.scholarship ?? false,
    solidarity: initial.solidarity ?? false,
    department: initial.department ?? '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    const answer = saveOnboardingDraft(needs)
    if (!answer.subscriptionFor || answer.isBearerPayer === undefined || !answer.bearer) {
      setError('Le profil porteur est incomplet. Revenez a l etape precedente.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const created = await createOnboarding(answer as OnboardingAnswer)
      sessionStorage.setItem('comutitres_onboarding_session_id', created.session?.id ?? created.id)
      navigate('/onboarding/result')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "La session n'a pas pu etre enregistree.")
    } finally {
      setLoading(false)
    }
  }

  const update = <K extends keyof typeof needs>(key: K, value: (typeof needs)[K]) => setNeeds((current) => ({ ...current, [key]: value }))
  return (
    <PageCard>
      <OnboardingProgress step={3} />
      <Stack component="form" onSubmit={submit} spacing={2.5}>
        <div><Typography component="h1" variant="h4">Quels sont vos besoins de transport ?</Typography><Typography color="text.secondary">Quelques reponses suffisent pour proposer une premiere orientation.</Typography></div>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField label="Frequence de transport" onChange={(e) => update('frequency', e.target.value as Frequency)} select value={needs.frequency}>
          <MenuItem value="daily">Quotidienne</MenuItem><MenuItem value="regular">Reguliere</MenuItem><MenuItem value="occasional">Occasionnelle</MenuItem>
        </TextField>
        <TextField label="Type de forfait souhaite" onChange={(e) => update('planPreference', e.target.value as PlanPreference)} select value={needs.planPreference}>
          <MenuItem value="annual">Annuel</MenuItem><MenuItem value="monthly">Mensuel</MenuItem><MenuItem value="weekly">Hebdomadaire</MenuItem><MenuItem value="pay_as_you_go">Paiement a l usage</MenuItem><MenuItem value="unsure">Je ne sais pas</MenuItem>
        </TextField>
        <TextField label="Situation" onChange={(e) => update('socialSituation', e.target.value as SocialSituation)} select value={needs.socialSituation}>
          <MenuItem value="student">Etudiant</MenuItem><MenuItem value="scholarship">Boursier</MenuItem><MenuItem value="job_seeker">Demandeur d emploi</MenuItem><MenuItem value="social_beneficiary">Beneficiaire social</MenuItem><MenuItem value="senior">Senior</MenuItem><MenuItem value="other">Autre</MenuItem>
        </TextField>
        <TextField label="Support prefere" onChange={(e) => update('support', e.target.value as SupportPreference)} select value={needs.support}>
          <MenuItem value="phone">Telephone</MenuItem><MenuItem value="navigo_pass">Passe Navigo</MenuItem><MenuItem value="unsure">Je ne sais pas</MenuItem>
        </TextField>
        <Stack>
          <FormControlLabel control={<Switch checked={needs.scholarship} onChange={(e) => update('scholarship', e.target.checked)} />} label="Le porteur est boursier" />
          <FormControlLabel control={<Switch checked={needs.solidarity} onChange={(e) => update('solidarity', e.target.checked)} />} label="Le porteur beneficie ou pense beneficier de la tarification solidarite" />
        </Stack>
        <TextField helperText="Optionnel, utile notamment pour verifier Amethyste." label="Departement" onChange={(e) => update('department', e.target.value)} slotProps={{ htmlInput: { maxLength: 3 } }} value={needs.department} />
        <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
          <Button onClick={() => navigate('/onboarding/profile')}>Retour</Button>
          <Button disabled={loading} type="submit" variant="contained">{loading ? 'Analyse...' : 'Voir ma recommandation'}</Button>
        </Stack>
      </Stack>
    </PageCard>
  )
}

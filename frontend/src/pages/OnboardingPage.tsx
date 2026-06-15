import { Alert, Button, FormControl, FormControlLabel, Radio, RadioGroup, Stack, Typography } from '@mui/material'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { OnboardingProgress } from '../components/OnboardingProgress'
import { PageCard } from '../components/PageCard'
import { getOnboardingDraft, saveOnboardingDraft } from '../services/onboarding.service'
import type { SubscriptionFor } from '../types'

const choices: Array<{ value: SubscriptionFor; label: string; help: string }> = [
  { value: 'self', label: 'Pour moi-meme', help: 'Vous utilisez et payez votre titre de transport.' },
  { value: 'child', label: 'Pour mon enfant', help: 'Vous payez, votre enfant est le porteur.' },
  { value: 'other', label: 'Pour une autre personne', help: 'Le porteur et le payeur peuvent etre differents.' },
  { value: 'organization_beneficiary', label: 'Pour un beneficiaire via une structure ou association', help: 'La structure prend en charge le titre du beneficiaire.' },
]

export function OnboardingPage() {
  const navigate = useNavigate()
  const [value, setValue] = useState<SubscriptionFor | ''>(getOnboardingDraft().subscriptionFor ?? '')

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!value) return
    saveOnboardingDraft({ subscriptionFor: value, isBearerPayer: value === 'self' })
    navigate('/onboarding/profile')
  }

  return (
    <PageCard>
      <OnboardingProgress step={1} />
      <Stack component="form" onSubmit={submit} spacing={3}>
        <div><Typography component="h1" variant="h4">Pour qui souhaitez-vous souscrire ?</Typography><Typography color="text.secondary">Cette reponse nous aide a distinguer la personne qui voyage de celle qui paie.</Typography></div>
        <Alert severity="info"><strong>Le porteur</strong> utilise le titre de transport. <strong>Le payeur</strong> finance la souscription. Il peut s'agir de la meme personne.</Alert>
        <FormControl>
          <RadioGroup onChange={(event) => setValue(event.target.value as SubscriptionFor)} value={value}>
            {choices.map((choice) => (
              <FormControlLabel
                control={<Radio />}
                key={choice.value}
                label={<span><strong>{choice.label}</strong><br /><Typography color="text.secondary" component="span" variant="body2">{choice.help}</Typography></span>}
                sx={{ alignItems: 'flex-start', border: 1, borderColor: value === choice.value ? 'primary.main' : 'divider', borderRadius: 2, m: 0, mb: 1.5, p: 1.5 }}
                value={choice.value}
              />
            ))}
          </RadioGroup>
        </FormControl>
        <Button disabled={!value} type="submit" variant="contained">Continuer</Button>
      </Stack>
    </PageCard>
  )
}

import { Alert, Button, Chip, CircularProgress, Divider, List, ListItem, ListItemText, Stack, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { OnboardingProgress } from '../components/OnboardingProgress'
import { PageCard } from '../components/PageCard'
import { clearOnboardingDraft, createOnboarding, getOnboardingDraft, getRecommendation } from '../services/onboarding.service'
import { createSubscription, submitSubscription } from '../services/subscriptions.service'
import type { OfferRecommendation, OnboardingAnswer } from '../types'

export function OnboardingResultPage() {
  const navigate = useNavigate()
  const [answer] = useState(() => getOnboardingDraft() as OnboardingAnswer)
  const [recommendation, setRecommendation] = useState<OfferRecommendation | null>(null)
  const [error, setError] = useState(answer.bearer ? '' : 'Le parcours est incomplet.')
  const [preparing, setPreparing] = useState(false)

  useEffect(() => {
    if (!answer.bearer) return
    getRecommendation(answer).then(setRecommendation).catch((caught) => setError(caught instanceof Error ? caught.message : 'Recommandation indisponible.'))
  }, [answer])

  async function startSubscription() {
    if (!recommendation) return
    setPreparing(true)
    setError('')
    try {
      const existingSessionId = sessionStorage.getItem('comutitres_onboarding_session_id')
      const onboarding = existingSessionId ? { id: existingSessionId } : await createOnboarding(answer)
      const created = await createSubscription({
        onboardingSessionId: onboarding.id,
        offerCode: recommendation.offerCode,
      })
      const submitted = await submitSubscription(created.subscription.id)
      clearOnboardingDraft()
      sessionStorage.removeItem('comutitres_onboarding_session_id')
      navigate(`/subscriptions/${submitted.subscription.id}`)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Impossible de preparer la souscription.')
    } finally {
      setPreparing(false)
    }
  }

  return (
    <PageCard>
      <OnboardingProgress step={4} />
      <Stack spacing={3}>
        <div><Typography component="h1" variant="h4">Votre recommandation</Typography><Typography color="text.secondary">Cette orientation sera confirmee lors de la souscription.</Typography></div>
        {error && <Alert severity="error">{error}</Alert>}
        {!error && !recommendation && <Stack sx={{ alignItems: 'center', py: 4 }}><CircularProgress /><Typography sx={{ mt: 2 }}>Analyse de votre profil...</Typography></Stack>}
        {recommendation && (
          <>
            <Stack spacing={1} sx={{ alignItems: 'flex-start', bgcolor: 'background.default', borderRadius: 3, p: 3 }}>
              <Chip color="success" label={`${recommendation.confidencePercent} % de confiance`} />
              <Typography color="text.secondary" sx={{ fontSize: '0.9rem' }}>{recommendation.offerCode}</Typography>
              <Typography color="primary.dark" component="h2" variant="h4">{recommendation.offerName}</Typography>
              <Typography>{recommendation.reasons.join(' ')}</Typography>
            </Stack>
            <div><Typography sx={{ fontWeight: 800 }} variant="h6">Justificatifs potentiellement necessaires</Typography><List dense>{recommendation.requiredDocuments.map((document) => <ListItem key={document}><ListItemText primary={document} /></ListItem>)}</List></div>
            {recommendation.warnings.map((warning) => <Alert key={warning} severity="warning">{warning}</Alert>)}
            <Divider />
            <Stack direction={{ xs: 'column-reverse', sm: 'row' }} spacing={1} sx={{ justifyContent: 'space-between' }}>
              <Button disabled={preparing} onClick={() => navigate('/onboarding/needs')}>Modifier mes reponses</Button>
              <Button disabled={preparing} onClick={startSubscription} variant="contained">
                {preparing ? 'Preparation du dossier...' : 'Continuer vers la souscription'}
              </Button>
            </Stack>
          </>
        )}
      </Stack>
    </PageCard>
  )
}

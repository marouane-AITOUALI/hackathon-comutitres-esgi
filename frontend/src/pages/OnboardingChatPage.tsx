import { Alert, Box, Button, Chip, CircularProgress, Paper, Stack, TextField, Typography } from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import CheckIcon from '@mui/icons-material/Check'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { LandmarkStepper } from '../components/onboarding/LandmarkStepper'
import { createOnboarding, getRecommendation, saveRecommendationResult } from '../services/onboarding.service'
import { createSubscription } from '../services/subscriptions.service'
import { useAuth } from '../hooks/useAuth'
import type { OfferRecommendation, OnboardingAnswer, OnboardingDraft } from '../types'

// ─── Types ───────────────────────────────────────────────────────────────────

type StepType = 'text' | 'email' | 'date' | 'choice' | 'yesno'

interface StepOption { value: string; label: string; description?: string }

interface ChatStep {
  section: 1 | 2 | 3 | 4
  field: string
  label: string
  type: StepType
  botMessage: (d: OnboardingDraft) => string
  options?: StepOption[]
  placeholder?: string
  optional?: boolean
  skip?: (d: OnboardingDraft) => boolean
}

const SECTION_LABELS: Record<1 | 2 | 3 | 4, string> = {
  1: 'Pour qui ?',
  2: 'Profil du porteur',
  3: 'Profil du payeur',
  4: 'Vos besoins',
}

// ─── Steps ───────────────────────────────────────────────────────────────────

const STEPS: ChatStep[] = [
  // Section 1 — Pour qui ?
  {
    section: 1, field: 'subscriptionFor', label: 'Pour qui souscrivez-vous ?', type: 'choice',
    botMessage: () =>
      'Sur Comutitres, on distingue deux rôles :\n'
      + '• Le porteur : la personne qui utilise le titre (enfant, salarié, bénéficiaire…)\n'
      + '• Le payeur : la personne ou structure qui finance l\'abonnement\n\n'
      + 'Ils peuvent être la même personne ou non.',
    options: [
      { value: 'self',                     label: 'Pour moi-même',                   description: 'Je suis à la fois porteur et payeur de l\'abonnement' },
      { value: 'child',                    label: 'Pour mon enfant',                 description: 'Mon enfant utilise le titre, je le finance (Imagine R, Junior…)' },
      { value: 'other',                    label: 'Pour une autre personne',         description: 'Porteur et payeur sont deux personnes distinctes' },
      { value: 'organization_beneficiary', label: 'Via une structure / association', description: 'Une structure (association, employeur…) finance le titre d\'un bénéficiaire' },
    ],
  },

  // Section 2 — Profil porteur
  {
    section: 2, field: 'bearer.firstName', label: 'Prénom du porteur', type: 'text',
    skip: (d) => d.subscriptionFor === 'self' && !!getField(d, 'bearer.firstName'),
    botMessage: (d) => d.subscriptionFor === 'self'
      ? 'Vous êtes à la fois porteur et payeur du titre. Commençons par votre prénom.'
      : 'Quel est le prénom de la personne qui utilisera le titre de transport ?',
    placeholder: 'Prénom…',
  },
  {
    section: 2, field: 'bearer.lastName', label: 'Nom du porteur', type: 'text',
    skip: (d) => d.subscriptionFor === 'self' && !!getField(d, 'bearer.lastName'),
    botMessage: (d) => `Et le nom de famille de ${d.bearer?.firstName ?? 'votre porteur'} ?`,
    placeholder: 'Nom de famille…',
  },
  {
    section: 2, field: 'bearer.birthDate', label: 'Date de naissance', type: 'date',
    botMessage: () =>
      'L\'âge est déterminant pour l\'offre recommandée :\n'
      + '• Moins de 11 ans → forfait Junior\n'
      + '• 11 à 25 ans (scolaire) → Imagine R Scolaire / Junior\n'
      + '• Études supérieures → Imagine R Étudiant\n'
      + '• En activité → Navigo Annuel\n'
      + '• 65 ans et plus → Navigo Senior (tarif réduit)',
    placeholder: '',
  },
  {
    section: 2, field: 'bearer.status', label: 'Statut actuel', type: 'choice',
    botMessage: (d) =>
      `Quel est le statut actuel de ${d.bearer?.firstName ?? 'votre porteur'} ?\n\n`
      + 'Chaque statut ouvre droit à des forfaits différents.',
    options: [
      { value: 'junior',     label: 'Junior',      description: 'Moins de 11 ans → forfait Junior' },
      { value: 'school',     label: 'Scolaire',    description: '11 à 25 ans en milieu scolaire → Imagine R Scolaire / Junior' },
      { value: 'student',    label: 'Étudiant·e',  description: 'Enseignement supérieur → Imagine R Étudiant' },
      { value: 'active',     label: 'Actif·ve',    description: 'En activité professionnelle → Navigo Annuel' },
      { value: 'senior',     label: 'Senior',      description: '65 ans et plus → Navigo Senior ou Améthyste' },
      { value: 'solidarity', label: 'Solidarité',  description: 'Bénéficiaire d\'aides sociales → TST (tarif solidarité)' },
      { value: 'other',      label: 'Autre',       description: 'Autre situation (handicap, mixte…)' },
    ],
  },

  // Section 3 — Payeur
  {
    section: 3, field: 'isBearerPayer', label: 'Porteur = Payeur ?', type: 'yesno',
    botMessage: (d) =>
      `${d.bearer?.firstName ?? 'Le porteur'} sera-t-il·elle aussi la personne qui financera le titre de transport ?\n\n`
      + 'Sur Comutitres, porteur et payeur peuvent être distincts :\n'
      + '• Un enfant mineur ne peut pas être son propre payeur\n'
      + '• Une association peut financer le titre d\'un bénéficiaire TST\n'
      + '• Un employeur peut prendre en charge le Navigo d\'un salarié\n\n'
      + 'Le payeur devra valider les CGU et sera responsable des prélèvements.',
    skip: (d) => d.subscriptionFor === 'self',
  },
  {
    section: 3, field: 'payer.firstName', label: 'Prénom du payeur', type: 'text',
    botMessage: () =>
      'D\'accord ! Quelques informations sur le payeur.\n\n'
      + 'Le payeur est la personne (ou structure) qui finance l\'abonnement. '
      + 'Il devra valider les Conditions Générales de Vente et d\'Utilisation (CGVU) '
      + 'et sera responsable des prélèvements mensuels ou du paiement annuel.\n\n'
      + 'Quel est son prénom ?',
    placeholder: 'Prénom du payeur…',
    skip: (d) => d.isBearerPayer !== false,
  },
  {
    section: 3, field: 'payer.lastName', label: 'Nom du payeur', type: 'text',
    botMessage: (d) => `Et le nom de famille de ${d.payer?.firstName ?? 'votre payeur'} ?`,
    placeholder: 'Nom du payeur…',
    skip: (d) => d.isBearerPayer !== false,
  },
  {
    section: 3, field: 'payer.email', label: 'Email du payeur', type: 'email',
    botMessage: (d) =>
      `Quelle est l'adresse e-mail de ${d.payer?.firstName ?? 'votre payeur'} ?\n\n`
      + 'Cette adresse sera utilisée pour :\n'
      + '• Les confirmations de paiement et les factures\n'
      + '• Les avis de renouvellement annuel (ou trimestriel pour la TST)\n'
      + '• Les communications importantes liées au contrat\n\n'
      + 'Elle reste strictement confidentielle, conformément au RGPD.',
    placeholder: 'email@exemple.com',
    skip: (d) => d.isBearerPayer !== false,
  },
  {
    section: 3, field: 'payer.relationshipToBearer', label: 'Lien porteur / payeur', type: 'choice',
    botMessage: (d) =>
      `Quel est le lien entre ${d.payer?.firstName ?? 'le payeur'} et ${d.bearer?.firstName ?? 'le porteur'} ?\n\n`
      + 'Cette information est nécessaire pour valider les conditions de souscription :\n'
      + '• Un parent peut souscrire pour son enfant mineur\n'
      + '• Un tuteur légal peut gérer le contrat d\'une personne sous tutelle\n'
      + '• Une association peut financer le titre TST d\'un bénéficiaire\n'
      + '• Un employeur peut prendre en charge le Navigo d\'un salarié',
    options: [
      { value: 'parent',      label: 'Parent',       description: 'Père ou mère du porteur' },
      { value: 'guardian',    label: 'Tuteur légal', description: 'Tuteur ou représentant légal' },
      { value: 'association', label: 'Association',  description: 'Structure associative finançant le titre' },
      { value: 'employer',    label: 'Employeur',    description: 'Entreprise prenant en charge l\'abonnement' },
      { value: 'other',       label: 'Autre',        description: 'Autre lien (conjoint, aidant…)' },
    ],
    skip: (d) => d.isBearerPayer !== false,
  },

  // Section 4 — Besoins
  {
    section: 4, field: 'frequency', label: 'Fréquence d\'utilisation', type: 'choice',
    botMessage: (d) =>
      `Parlons maintenant des habitudes de transport de ${d.subscriptionFor === 'self' ? 'vous-même' : (d.bearer?.firstName ?? 'votre porteur')}.\n\n`
      + 'La fréquence oriente directement vers le bon forfait :\n'
      + '• Quotidienne → Navigo Annuel ou mensuel (le plus économique à l\'année)\n'
      + '• Régulière → Navigo mensuel ou hebdomadaire\n'
      + '• Occasionnelle → Navigo Liberté+ (paiement à l\'usage, sans engagement)',
    options: [
      { value: 'daily',      label: 'Quotidienne',   description: 'Tous les jours ou presque (trajets domicile-travail/école)' },
      { value: 'regular',    label: 'Régulière',     description: 'Plusieurs fois par semaine' },
      { value: 'occasional', label: 'Occasionnelle', description: 'Quelques fois par mois' },
    ],
  },
  {
    section: 4, field: 'planPreference', label: 'Type d\'abonnement', type: 'choice',
    botMessage: () =>
      'Quel type d\'abonnement vous intéresse le plus ?\n\n'
      + '• Annuel → le plus économique, renouvellement automatique\n'
      + '• Mensuel → flexibilité mois par mois\n'
      + '• Hebdomadaire → idéal pour des besoins ponctuels\n'
      + '• Liberté+ → paiement à la validation, sans engagement\n\n'
      + 'Note : l\'Imagine R est uniquement annuel (lié à la saison scolaire).',
    options: [
      { value: 'annual',        label: 'Annuel',         description: 'Navigo Annuel — le plus économique, renouvellement automatique' },
      { value: 'monthly',       label: 'Mensuel',        description: 'Navigo mois — souplesse mois par mois' },
      { value: 'weekly',        label: 'Hebdomadaire',   description: 'Navigo semaine — idéal pour des besoins ponctuels' },
      { value: 'pay_as_you_go', label: 'À l\'usage',     description: 'Navigo Liberté+ — paiement à la validation, sans engagement' },
      { value: 'unsure',        label: 'Je ne sais pas', description: 'Aidez-moi à choisir selon mon profil !' },
    ],
  },
  {
    section: 4, field: 'socialSituation', label: 'Situation sociale', type: 'choice',
    botMessage: (d) => {
      const who = d.subscriptionFor === 'self' ? 'votre' : `la situation de ${d.bearer?.firstName ?? 'votre porteur'} —`
      return `Quelle est ${who} situation sociale ou professionnelle ?\n\n`
        + 'Certaines situations ouvrent droit à des tarifs préférentiels :\n'
        + '• Boursier·e → réduction sur Imagine R\n'
        + '• Demandeur·se d\'emploi → possible éligibilité à la TST\n'
        + '• Bénéficiaire social (RSA, AAH, CAF…) → TST Solidarité\n'
        + '• Senior 65+ → Navigo Senior à tarif réduit, ou Améthyste'
    },
    options: [
      { value: 'student',            label: 'Étudiant·e',                      description: 'En enseignement supérieur — Imagine R Étudiant' },
      { value: 'scholarship',        label: 'Boursier·e',                      description: 'Bourse de l\'Éducation Nationale ou du supérieur' },
      { value: 'job_seeker',         label: 'Demandeur·se d\'emploi',          description: 'Inscrit·e à Pôle Emploi — potentiellement éligible TST' },
      { value: 'social_beneficiary', label: 'Bénéficiaire social',             description: 'RSA, AAH, CMU-C… → TST (réduction 50%, 75% ou gratuité)' },
      { value: 'senior',             label: 'Senior (65 ans et +)',             description: 'Navigo Senior ou Améthyste selon le département' },
      { value: 'other',              label: 'Autre / Aucune de ces situations', description: 'Tarif standard sans réduction spécifique' },
    ],
  },
  {
    section: 4, field: 'support', label: 'Support souhaité', type: 'choice',
    botMessage: () =>
      'Sur quel support souhaitez-vous utiliser le titre de transport ?\n\n'
      + '• Passe Navigo (carte physique) → compatible tous forfaits, durée de vie 10 ans\n'
      + '• Téléphone NFC → iPhone ou Android, pratique et sans carte physique\n\n'
      + 'Notez que certains forfaits comme l\'Imagine R imposent le passe physique.',
    options: [
      { value: 'phone',       label: 'Téléphone (NFC)',        description: 'iPhone ou Android — validez directement avec votre smartphone' },
      { value: 'navigo_pass', label: 'Passe Navigo',           description: 'Carte physique — compatible tous forfaits, durée de vie 10 ans' },
      { value: 'unsure',      label: 'Je ne sais pas encore',  description: 'Je laisse l\'assistant recommander le support adapté' },
    ],
  },
  {
    section: 4, field: 'scholarship', label: 'Boursier ?', type: 'yesno',
    botMessage: (d) =>
      `${d.bearer?.firstName ?? 'Le porteur'} est-il·elle boursier·e de l'Éducation Nationale ou de l'Enseignement Supérieur ?\n\n`
      + 'Si oui, une réduction peut s\'appliquer sur l\'abonnement Imagine R selon le département de résidence.',
  },
  {
    section: 4, field: 'solidarity', label: 'Tarif solidarité ?', type: 'yesno',
    botMessage: (d) =>
      `${d.bearer?.firstName ?? 'Le porteur'} bénéficie-t-il·elle de la Tarification Solidarité Transport (TST) d'Île-de-France Mobilités ?\n\n`
      + 'La TST est réservée aux personnes en situation de précarité (RSA, AAH, CMU-C, CAF…). Elle offre :\n'
      + '• Réduction 50%\n'
      + '• Solidarité 75%\n'
      + '• Gratuité totale\n\n'
      + 'Des justificatifs sociaux seront demandés pour vérification des droits.',
  },
  {
    section: 4, field: 'department', label: 'Département de résidence', type: 'text',
    botMessage: (d) =>
      `Dans quel département réside ${d.subscriptionFor === 'self' ? 'vous' : (d.bearer?.firstName ?? 'le porteur')} ?\n\n`
      + 'Certaines aides varient selon le département (Améthyste, réductions bourse Imagine R, TST).\n\n'
      + '(Optionnel — mais plus votre département est précis, plus la recommandation sera fiable)',
    placeholder: 'Ex : 75, 92, 93, 94…',
    optional: true,
  },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function setField(draft: OnboardingDraft, path: string, value: unknown): OnboardingDraft {
  const [head, ...rest] = path.split('.')
  if (rest.length === 0) return { ...draft, [head]: value }
  const nested = (draft as Record<string, unknown>)[head] ?? {}
  return { ...draft, [head]: setField(nested as OnboardingDraft, rest.join('.'), value) }
}

function getField(draft: OnboardingDraft, path: string): unknown {
  return path.split('.').reduce(
    (acc, k) => (acc as Record<string, unknown>)?.[k],
    draft as unknown,
  )
}

function advance(fromIdx: number, draft: OnboardingDraft): { nextIdx: number; draft: OnboardingDraft } {
  let idx = fromIdx + 1
  let d = draft
  while (idx < STEPS.length && STEPS[idx].skip?.(d)) {
    if (STEPS[idx].field === 'isBearerPayer' && d.subscriptionFor === 'self') d = { ...d, isBearerPayer: true }
    idx++
  }
  return { nextIdx: idx, draft: d }
}

// ─── Component ───────────────────────────────────────────────────────────────

export function OnboardingChatPage() {
  const location  = useLocation()
  const navigate  = useNavigate()
  const { user }  = useAuth()

  const locationState = location.state as { fromSimpleForm?: boolean; mode?: string } | null
  const chatMode = locationState?.mode === 'chat' || locationState?.fromSimpleForm === false

  const [draft,          setDraft]          = useState<OnboardingDraft>({})
  const [stepIdx,        setStepIdx]        = useState(0)
  const [inputValue,     setInputValue]     = useState('')
  const [error,          setError]          = useState('')
  const [loading,        setLoading]        = useState(false)
  const [isDone,         setIsDone]         = useState(false)
  const [recommendation,    setRecommendation]    = useState<OfferRecommendation | null>(null)
  const [onboardingSessionId, setOnboardingSessionId] = useState<string | null>(null)
  const [subscribing,       setSubscribing]       = useState(false)
  const [subscribeError,    setSubscribeError]    = useState('')

  const step           = STEPS[stepIdx] as ChatStep | undefined
  const currentSection = isDone ? 5 : step?.section ?? 1

  // ── Reset ──────────────────────────────────────────────────────────────────

  function reset() {
    setDraft({}); setStepIdx(0); setInputValue(''); setError('')
    setLoading(false); setIsDone(false); setRecommendation(null)
    setOnboardingSessionId(null); setSubscribeError('')
  }

  // ── Submit : recommandation + persistance session ─────────────────────────

  async function handleSubmit(finalDraft: OnboardingDraft) {
    setLoading(true)
    try {
      const answer = finalDraft as OnboardingAnswer
      // Les deux appels en parallèle : recommandation + création session en DB
      const [rec, session] = await Promise.all([
        getRecommendation(answer),
        createOnboarding(answer),
      ])
      saveRecommendationResult(rec)
      setRecommendation(rec)
      setOnboardingSessionId(session.id)
      setIsDone(true)
    } catch (err) {
      setError(err instanceof Error ? `Oups ! ${err.message}` : 'Désolé, une erreur inattendue est survenue.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubscribeNow() {
    if (!recommendation) return
    setSubscribing(true)
    setSubscribeError('')
    try {
      const sub = await createSubscription({
        offerCode: recommendation.offerCode,
        ...(onboardingSessionId ? { onboardingSessionId } : {}),
      })
      navigate(`/subscriptions/${sub.subscription.id}`)
    } catch (err) {
      setSubscribeError(err instanceof Error ? err.message : 'Impossible de créer le dossier.')
      setSubscribing(false)
    }
  }

  // ── Navigation helpers ─────────────────────────────────────────────────────

  function applyAnswer(field: string, value: unknown, extraDraft?: Partial<OnboardingDraft>) {
    let newDraft = setField(draft, field, value)
    if (extraDraft) newDraft = { ...newDraft, ...extraDraft }
    const { nextIdx, draft: advDraft } = advance(stepIdx, newDraft)
    setDraft(advDraft)
    setStepIdx(nextIdx)
    setInputValue('')
    setError('')
    if (nextIdx >= STEPS.length) handleSubmit(advDraft)
  }

  function handleChoice(option: StepOption) {
    if (!step) return
    if (step.field === 'subscriptionFor') {
      let newDraft: OnboardingDraft = { subscriptionFor: option.value as OnboardingDraft['subscriptionFor'] }
      if (option.value === 'self') {
        newDraft = { ...newDraft, isBearerPayer: true }
        if (user) {
          newDraft = setField(setField(newDraft, 'bearer.firstName', user.firstName), 'bearer.lastName', user.lastName)
        }
      }
      const { nextIdx, draft: advDraft } = advance(stepIdx, newDraft)
      setDraft(advDraft)
      setStepIdx(nextIdx)
      setError('')
      if (nextIdx >= STEPS.length) handleSubmit(advDraft)
      return
    }
    applyAnswer(step.field, option.value)
  }

  function handleYesNo(yes: boolean) {
    if (!step) return
    applyAnswer(step.field, yes)
  }

  function handleNext() {
    if (!step) return
    const value = inputValue.trim()
    if (!value && !step.optional) { setError('Ce champ est requis.'); return }
    if (step.type === 'email' && value && !value.includes('@')) { setError('Adresse e-mail invalide.'); return }
    applyAnswer(step.field, value || undefined)
  }

  function handleBack() {
    let idx = stepIdx - 1
    while (idx >= 0 && STEPS[idx].skip?.(draft)) idx--
    if (idx < 0) return
    const prevStep = STEPS[idx]
    const val      = getField(draft, prevStep.field)
    setStepIdx(idx)
    setInputValue(
      (prevStep.type === 'text' || prevStep.type === 'email' || prevStep.type === 'date') && val != null
        ? String(val)
        : ''
    )
    setError('')
  }

  const selectedValue = step ? getField(draft, step.field) : undefined
  const canGoBack     = stepIdx > 0

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#f5f7ff' }}>
      <Header />

      <Box sx={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
        px: { xs: 2, sm: 3, md: 4 },
        pt: { xs: 2, md: 3 },
        pb: { xs: 3, md: 4 },
        gap: 3,
      }}>

        {/* ── LandmarkStepper ── */}
        <Box sx={{
          width: '100%', maxWidth: 860,
          bgcolor: '#fff', borderRadius: 3,
          boxShadow: '0 2px 12px rgba(26,86,219,0.07)',
          border: '1px solid rgba(26,86,219,0.07)',
          px: { xs: 2, md: 5 }, py: { xs: 1, md: 1.5 },
        }}>
          <LandmarkStepper section={currentSection} />
        </Box>

        {/* ── Loading screen ── */}
        {loading && (
          <Paper sx={{ width: '100%', maxWidth: 680, borderRadius: 4, p: { xs: 4, md: 6 }, textAlign: 'center', boxShadow: '0 8px 48px rgba(26,86,219,0.13)' }}>
            <CircularProgress sx={{ color: '#1a56db' }} />
            <Typography sx={{ mt: 2.5, fontWeight: 700, color: '#1e3a8a', fontSize: 15 }}>
              Analyse de votre profil en cours…
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
              Identification de l'offre Comutitres la plus adaptée à votre situation.
            </Typography>
          </Paper>
        )}

        {/* ── Form wizard ── */}
        {!loading && !isDone && step && !chatMode && (
          <Paper sx={{
            width: '100%', maxWidth: 680,
            borderRadius: 4, overflow: 'hidden',
            boxShadow: '0 8px 48px rgba(26,86,219,0.13)',
            border: '1px solid rgba(26,86,219,0.08)',
          }}>
            <Box sx={{ p: { xs: 3, md: 4 } }}>
              {/* Section label + counter */}
              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Chip
                  label={SECTION_LABELS[step.section]}
                  size="small"
                  sx={{ bgcolor: '#EEF4FF', color: '#1a56db', fontWeight: 700, fontSize: 11, border: 'none' }}
                />
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                  {stepIdx + 1} / {STEPS.length}
                </Typography>
              </Stack>

              {/* Question */}
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, color: '#1e3a8a', lineHeight: 1.3 }}>
                {step.label}
              </Typography>

              {/* ── Text / email / date ── */}
              {(step.type === 'text' || step.type === 'email' || step.type === 'date') && (
                <TextField
                  type={step.type}
                  value={inputValue}
                  onChange={e => { setInputValue(e.target.value); setError('') }}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleNext() } }}
                  placeholder={step.placeholder ?? ''}
                  fullWidth
                  autoFocus
                  size="small"
                  sx={{ mb: 1.5 }}
                />
              )}

              {/* ── Choice ── */}
              {step.type === 'choice' && (
                <Stack spacing={1} sx={{ mb: 2 }}>
                  {step.options?.map(opt => (
                    <Box
                      key={opt.value}
                      onClick={() => handleChoice(opt)}
                      sx={{
                        px: 2, py: 1.5,
                        bgcolor: selectedValue === opt.value ? '#EEF4FF' : '#fff',
                        border: '1.5px solid',
                        borderColor: selectedValue === opt.value ? '#1a56db' : 'rgba(26,86,219,0.15)',
                        borderRadius: 2.5,
                        cursor: 'pointer',
                        transition: 'all 0.18s',
                        display: 'flex', alignItems: 'center', gap: 1.5,
                        '&:hover': { bgcolor: '#f0f6ff', borderColor: '#1a56db' },
                      }}
                    >
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#1e3a8a', lineHeight: 1.3 }}>
                          {opt.label}
                        </Typography>
                        {opt.description && (
                          <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mt: 0.3 }}>
                            {opt.description}
                          </Typography>
                        )}
                      </Box>
                      {selectedValue === opt.value
                        ? <CheckIcon sx={{ fontSize: 18, color: '#1a56db', flexShrink: 0 }} />
                        : <Box sx={{ width: 18, height: 18, flexShrink: 0 }} />
                      }
                    </Box>
                  ))}
                </Stack>
              )}

              {/* ── Yes / No ── */}
              {step.type === 'yesno' && (
                <Stack direction="row" spacing={1.5} sx={{ mb: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={() => handleYesNo(false)}
                    fullWidth
                    sx={{
                      py: 1.5, borderRadius: 2.5, fontWeight: 600,
                      textTransform: 'none', fontSize: 14,
                      borderColor: selectedValue === false ? '#1a56db' : 'rgba(26,86,219,0.3)',
                      bgcolor: selectedValue === false ? '#EEF4FF' : 'transparent',
                    }}
                  >Non</Button>
                  <Button
                    variant={selectedValue === true ? 'contained' : 'outlined'}
                    onClick={() => handleYesNo(true)}
                    fullWidth
                    sx={{
                      py: 1.5, borderRadius: 2.5, fontWeight: 700,
                      textTransform: 'none', fontSize: 14,
                      background: selectedValue === true ? 'linear-gradient(135deg, #2563eb, #1a56db)' : 'transparent',
                      borderColor: selectedValue === true ? 'transparent' : 'rgba(26,86,219,0.3)',
                      '&:hover': selectedValue === true ? { background: 'linear-gradient(135deg, #1d4ed8, #1a4fcc)' } : {},
                    }}
                  >Oui ✓</Button>
                </Stack>
              )}

              {error && <Alert severity="error" sx={{ mb: 2, fontSize: 13 }}>{error}</Alert>}

              {/* ── Navigation ── */}
              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                <Button
                  onClick={handleBack}
                  disabled={!canGoBack}
                  variant="text"
                  sx={{
                    textTransform: 'none', color: 'text.secondary', fontSize: 13,
                    visibility: canGoBack ? 'visible' : 'hidden',
                    '&:hover': { color: 'text.primary', bgcolor: 'transparent' },
                  }}
                >
                  ← Retour
                </Button>

                {(step.type === 'text' || step.type === 'email' || step.type === 'date') && (
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    {step.optional && (
                      <Button
                        variant="text"
                        onClick={() => { setInputValue(''); handleNext() }}
                        sx={{ textTransform: 'none', color: 'text.secondary', fontSize: 13 }}
                      >
                        Passer
                      </Button>
                    )}
                    <Button
                      variant="contained"
                      onClick={handleNext}
                      sx={{
                        borderRadius: 50, px: 3.5, py: 1.1,
                        textTransform: 'none', fontWeight: 700, fontSize: 14,
                        background: 'linear-gradient(135deg, #2563eb, #1a56db)',
                        boxShadow: '0 4px 14px rgba(26,86,219,0.35)',
                        '&:hover': { background: 'linear-gradient(135deg, #1d4ed8, #1a4fcc)' },
                      }}
                    >
                      Suivant →
                    </Button>
                  </Stack>
                )}

                {(step.type === 'choice' || step.type === 'yesno') && (
                  <Button
                    onClick={reset}
                    size="small"
                    startIcon={<RefreshIcon sx={{ fontSize: 14 }} />}
                    sx={{ textTransform: 'none', color: 'text.secondary', fontSize: 12 }}
                  >
                    Recommencer
                  </Button>
                )}
              </Stack>

              {/* Plus tard */}
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Button
                  onClick={() => navigate('/profil')}
                  variant="text"
                  size="small"
                  sx={{ textTransform: 'none', color: 'text.disabled', fontSize: 12, '&:hover': { color: 'text.secondary', bgcolor: 'transparent' } }}
                >
                  Faire ça plus tard
                </Button>
              </Box>
            </Box>
          </Paper>
        )}

        {/* ── Chat mode ── */}
        {!loading && !isDone && step && chatMode && (
          <Box sx={{
            width: '100%', maxWidth: 680,
            borderRadius: 4, overflow: 'hidden',
            boxShadow: '0 8px 48px rgba(26,86,219,0.13)',
            border: '1px solid rgba(26,86,219,0.08)',
          }}>
            {/* Chat header */}
            <Box sx={{
              px: 2.5, py: 1.75, flexShrink: 0,
              background: 'linear-gradient(135deg, #1a56db 0%, #2563eb 60%)',
              display: 'flex', alignItems: 'center', gap: 1.5,
            }}>
              <Box sx={{
                width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                background: 'rgba(255,255,255,0.18)',
                border: '2px solid rgba(255,255,255,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 900, fontSize: 15, color: '#fff',
              }}>C</Box>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 13.5, lineHeight: 1.2 }}>
                  Assistant Comutitres
                </Typography>
                <Stack direction="row" spacing={0.6} sx={{ alignItems: 'center', mt: 0.3 }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#4ade80', boxShadow: '0 0 5px #4ade80' }} />
                  <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: 11 }}>En ligne</Typography>
                </Stack>
              </Box>
              <Box sx={{ px: 1.25, py: 0.4, borderRadius: 99, bgcolor: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)' }}>
                <Typography sx={{ color: 'rgba(255,255,255,0.9)', fontSize: 11, fontWeight: 600 }}>
                  Étape {Math.min(currentSection, 4)} / 4
                </Typography>
              </Box>
              <Button
                onClick={() => navigate('/profil')}
                size="small"
                sx={{
                  textTransform: 'none', fontSize: 12, fontWeight: 500,
                  color: 'rgba(255,255,255,0.7)',
                  '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.1)' },
                }}
              >
                Plus tard
              </Button>
            </Box>

            {/* Chat body */}
            <Box sx={{ background: 'linear-gradient(180deg, #f7f9ff 0%, #f0f4ff 100%)', p: 3 }}>
              {/* Bot question bubble */}
              <Box sx={{ display: 'flex', gap: 1.5, mb: 3 }}>
                <Box sx={{
                  width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg, #2563eb, #1a56db)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 900, fontSize: 11, color: '#fff',
                }}>C</Box>
                <Box sx={{
                  bgcolor: '#fff', px: 2, py: 1.5,
                  borderRadius: '5px 20px 20px 20px',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                  border: '1px solid rgba(26,86,219,0.07)',
                  maxWidth: '82%',
                }}>
                  <Typography sx={{ fontWeight: 700, color: '#1e3a8a', fontSize: 14, lineHeight: 1.35, mb: 0.5 }}>
                    {step.label}
                  </Typography>
                  <Typography sx={{ fontSize: 13, color: 'text.secondary', lineHeight: 1.65, whiteSpace: 'pre-line' }}>
                    {step.botMessage(draft)}
                  </Typography>
                </Box>
              </Box>

              {/* ── Text / email / date ── */}
              {(step.type === 'text' || step.type === 'email' || step.type === 'date') && (
                <Box sx={{ ml: 4.5, mb: 2 }}>
                  <TextField
                    type={step.type}
                    value={inputValue}
                    onChange={e => { setInputValue(e.target.value); setError('') }}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleNext() } }}
                    placeholder={step.placeholder ?? ''}
                    fullWidth autoFocus size="small"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: '#fff' } }}
                  />
                </Box>
              )}

              {/* ── Choice ── */}
              {step.type === 'choice' && (
                <Stack spacing={1} sx={{ mb: 2, ml: 4.5 }}>
                  {step.options?.map(opt => (
                    <Box
                      key={opt.value}
                      onClick={() => handleChoice(opt)}
                      sx={{
                        px: 2, py: 1.25,
                        bgcolor: '#fff',
                        borderRadius: '12px 12px 12px 4px',
                        border: '1.5px solid rgba(26,86,219,0.15)',
                        cursor: 'pointer',
                        transition: 'all 0.18s',
                        display: 'flex', alignItems: 'center', gap: 1.5,
                        '&:hover': { bgcolor: '#eff6ff', borderColor: '#1a56db', transform: 'translateX(4px)' },
                      }}
                    >
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: '#1e3a8a' }}>{opt.label}</Typography>
                        {opt.description && (
                          <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 0.25 }}>{opt.description}</Typography>
                        )}
                      </Box>
                      <Box sx={{ color: '#1a56db', fontWeight: 700, fontSize: 18, flexShrink: 0 }}>›</Box>
                    </Box>
                  ))}
                </Stack>
              )}

              {/* ── Yes / No ── */}
              {step.type === 'yesno' && (
                <Stack direction="row" spacing={1.5} sx={{ mb: 2 }}>
                  <Button variant="outlined" onClick={() => handleYesNo(false)} fullWidth
                    sx={{ py: 1.25, borderRadius: 99, fontWeight: 600, textTransform: 'none', fontSize: 14 }}>
                    Non
                  </Button>
                  <Button variant="contained" onClick={() => handleYesNo(true)} fullWidth
                    sx={{
                      py: 1.25, borderRadius: 99, fontWeight: 700, textTransform: 'none', fontSize: 14,
                      background: 'linear-gradient(135deg, #2563eb, #1a56db)',
                      '&:hover': { background: 'linear-gradient(135deg, #1d4ed8, #1a4fcc)' },
                    }}>
                    Oui ✓
                  </Button>
                </Stack>
              )}

              {error && <Alert severity="error" sx={{ mb: 2, fontSize: 13 }}>{error}</Alert>}

              {/* Navigation */}
              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                <Button
                  onClick={handleBack}
                  variant="text"
                  disabled={!canGoBack}
                  sx={{ textTransform: 'none', color: 'text.secondary', fontSize: 13, visibility: canGoBack ? 'visible' : 'hidden' }}
                >
                  ← Retour
                </Button>

                {(step.type === 'text' || step.type === 'email' || step.type === 'date') && (
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    {step.optional && (
                      <Button variant="text" onClick={() => { setInputValue(''); handleNext() }}
                        sx={{ textTransform: 'none', color: 'text.secondary', fontSize: 13 }}>
                        Passer
                      </Button>
                    )}
                    <Button variant="contained" onClick={handleNext}
                      sx={{
                        borderRadius: 99, px: 3, py: 1, textTransform: 'none', fontWeight: 700, fontSize: 14,
                        background: 'linear-gradient(135deg, #2563eb, #1a56db)',
                        boxShadow: '0 4px 14px rgba(26,86,219,0.35)',
                        '&:hover': { background: 'linear-gradient(135deg, #1d4ed8, #1a4fcc)' },
                      }}>
                      Suivant →
                    </Button>
                  </Stack>
                )}
              </Stack>
            </Box>
          </Box>
        )}

        {/* ── Result ── */}
        {!loading && isDone && recommendation && (
          <Stack spacing={3} sx={{ width: '100%', maxWidth: 680 }}>
            {/* Recommendation card */}
            <Paper sx={{ borderRadius: 4, overflow: 'hidden', boxShadow: '0 8px 48px rgba(26,86,219,0.13)' }}>
              <Box sx={{ px: 3, py: 2, background: 'linear-gradient(135deg, #1a56db 0%, #0ea5e9 100%)' }}>
                <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: 15 }}>
                  🎉 Votre recommandation personnalisée
                </Typography>
              </Box>
              <Box sx={{ p: 3 }}>
                <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
                  <Chip
                    label={`${recommendation.confidencePercent} % de correspondance`}
                    size="small"
                    sx={{ fontSize: 11, height: 24, fontWeight: 700, bgcolor: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' }}
                  />
                </Stack>
                <Typography sx={{ fontWeight: 900, fontSize: 22, color: '#1a56db', mb: 0.5, letterSpacing: -0.3 }}>
                  {recommendation.offerName}
                </Typography>
                <Typography sx={{ fontSize: 13.5, color: 'text.secondary', lineHeight: 1.7, mb: 2 }}>
                  {recommendation.reasons.join(' ')}
                </Typography>

                {recommendation.requiredDocuments.length > 0 && (
                  <Box sx={{ mb: 1.5, p: 1.5, bgcolor: '#f0f6ff', borderRadius: 2, border: '1px solid #dbeafe' }}>
                    <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: '#1e40af', mb: 0.75, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Documents requis
                    </Typography>
                    {recommendation.requiredDocuments.map(doc => (
                      <Stack key={doc} direction="row" spacing={0.75} sx={{ alignItems: 'flex-start', mb: 0.4 }}>
                        <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: '#3b82f6', mt: 0.7, flexShrink: 0 }} />
                        <Typography sx={{ fontSize: 12.5, color: '#1e3a8a' }}>{doc}</Typography>
                      </Stack>
                    ))}
                  </Box>
                )}

                {recommendation.warnings.map(w => (
                  <Box key={w} sx={{
                    display: 'flex', gap: 1, alignItems: 'flex-start',
                    bgcolor: '#fffbeb', border: '1px solid #fde68a',
                    borderLeft: '4px solid #f59e0b',
                    px: 1.5, py: 1, borderRadius: '0 8px 8px 0', mb: 0.75,
                  }}>
                    <Typography sx={{ fontSize: 12.5, color: '#92400e', lineHeight: 1.5 }}>⚠️ {w}</Typography>
                  </Box>
                ))}
              </Box>
            </Paper>

            {/* Subscribe now or later */}
            <Paper sx={{ borderRadius: 4, overflow: 'hidden', boxShadow: '0 8px 48px rgba(26,86,219,0.13)' }}>
              <Box sx={{ px: 3, py: 2, bgcolor: '#f0fdf4', borderBottom: '1px solid #bbf7d0' }}>
                <Typography sx={{ fontWeight: 800, color: '#166534', fontSize: 14 }}>
                  Souhaitez-vous souscrire à cette offre ?
                </Typography>
                <Typography sx={{ fontSize: 12.5, color: '#15803d', mt: 0.4 }}>
                  Si vous souscrivez maintenant, nous vous guidons pour déposer vos documents justificatifs.
                </Typography>
              </Box>
              <Box sx={{ p: 3 }}>
                {subscribeError && (
                  <Alert severity="error" sx={{ mb: 2, fontSize: 13 }}>{subscribeError}</Alert>
                )}
                <Stack spacing={1.5}>
                  <Button
                    variant="contained" fullWidth
                    onClick={handleSubscribeNow}
                    disabled={subscribing}
                    sx={{
                      borderRadius: 50, py: 1.4, fontWeight: 700, fontSize: 14, textTransform: 'none',
                      background: 'linear-gradient(135deg, #16a34a, #15803d)',
                      boxShadow: '0 4px 14px rgba(22,163,74,0.35)',
                      '&:hover': { background: 'linear-gradient(135deg, #15803d, #166534)' },
                    }}
                  >
                    {subscribing ? 'Création du dossier…' : 'Souscrire maintenant — déposer mes documents →'}
                  </Button>
                  <Button
                    variant="outlined" fullWidth
                    onClick={() => navigate('/dashboard')}
                    sx={{ borderRadius: 50, py: 1.25, fontWeight: 600, fontSize: 14, textTransform: 'none', borderColor: 'rgba(26,86,219,0.3)' }}
                  >
                    Je le ferai plus tard
                  </Button>
                </Stack>
              </Box>
            </Paper>

            <Button
              onClick={reset}
              size="small"
              startIcon={<RefreshIcon sx={{ fontSize: 14 }} />}
              sx={{ textTransform: 'none', color: 'text.secondary', fontSize: 12, alignSelf: 'center' }}
            >
              Recommencer
            </Button>
          </Stack>
        )}

      </Box>

      <Footer />
    </Box>
  )
}

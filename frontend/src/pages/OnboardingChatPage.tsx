import { Box, Button, Chip, CircularProgress, IconButton, Stack, TextField, Typography } from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import RefreshIcon from '@mui/icons-material/Refresh'
import EditIcon from '@mui/icons-material/Edit'
import CloseIcon from '@mui/icons-material/Close'
import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { LandmarkStepper } from '../components/onboarding/LandmarkStepper'
import { createOnboarding, getRecommendation } from '../services/onboarding.service'
import type { OfferRecommendation, OnboardingAnswer, OnboardingDraft } from '../types'

// ─── Types ───────────────────────────────────────────────────────────────────

type StepType = 'text' | 'email' | 'date' | 'choice' | 'yesno'

interface StepOption { value: string; label: string; description?: string }

interface ChatStep {
  section: 1 | 2 | 3 | 4
  field: string
  label: string          // short label for the edit panel
  type: StepType
  botMessage: (d: OnboardingDraft) => string
  options?: StepOption[]
  placeholder?: string
  optional?: boolean
  skip?: (d: OnboardingDraft) => boolean
}

type TextMessage   = { id: number; from: 'bot' | 'user'; kind: 'text'; text: string }
type ResultMessage = { id: number; from: 'bot'; kind: 'result'; data: OfferRecommendation }
type Message = TextMessage | ResultMessage

// ─── Steps ───────────────────────────────────────────────────────────────────

const STEPS: ChatStep[] = [
  // Section 1 — Pour qui ?
  {
    section: 1, field: 'subscriptionFor', label: 'Pour qui ?', type: 'choice',
    botMessage: () =>
      'Première question clé : pour qui souscrivez-vous ce titre de transport ?\n\n'
      + 'Sur Comutitres, on distingue deux rôles :\n'
      + '• Le porteur : la personne qui utilise le titre (enfant, salarié, bénéficiaire…)\n'
      + '• Le payeur : la personne ou structure qui finance l\'abonnement\n\n'
      + 'Ils peuvent être la même personne ou non. Quelques exemples :\n'
      + '→ Un parent finance l\'Imagine R de son enfant\n'
      + '→ Une association paye le TST d\'un demandeur d\'emploi\n'
      + '→ Un salarié souscrit son propre Navigo Annuel',
    options: [
      { value: 'self',                    label: 'Pour moi-même',                  description: 'Je suis à la fois porteur et payeur de l\'abonnement' },
      { value: 'child',                   label: 'Pour mon enfant',                description: 'Mon enfant utilise le titre, je le finance (Imagine R, Junior…)' },
      { value: 'other',                   label: 'Pour une autre personne',        description: 'Porteur et payeur sont deux personnes distinctes' },
      { value: 'organization_beneficiary',label: 'Via une structure / association', description: 'Une structure (association, employeur…) finance le titre d\'un bénéficiaire' },
    ],
  },

  // Section 2 — Profil porteur
  {
    section: 2, field: 'bearer.firstName', label: 'Prénom du porteur', type: 'text',
    botMessage: (d) => d.subscriptionFor === 'self'
      ? 'Parfait ! 😊 Parlons de vous — vous êtes à la fois porteur et payeur du titre.\n\nCommençons par votre prénom :'
      : 'Maintenant, parlons du porteur — la personne qui va utiliser le titre au quotidien.\n\nQuel est son prénom ?',
    placeholder: 'Prénom…',
  },
  {
    section: 2, field: 'bearer.lastName', label: 'Nom du porteur', type: 'text',
    botMessage: (d) => `Et le nom de famille de ${d.bearer?.firstName ?? 'votre porteur'} ?`,
    placeholder: 'Nom de famille…',
  },
  {
    section: 2, field: 'bearer.birthDate', label: 'Date de naissance', type: 'date',
    botMessage: (d) =>
      `Quelle est la date de naissance de ${d.bearer?.firstName ?? 'votre porteur'} ?\n\n`
      + 'L\'âge est déterminant pour l\'offre recommandée :\n'
      + '• Moins de 11 ans → forfait Junior\n'
      + '• 11 à 25 ans (scolaire) → Imagine R Scolaire / Junior\n'
      + '• Études supérieures → Imagine R Étudiant\n'
      + '• En activité → Navigo Annuel\n'
      + '• 65 ans et plus → Navigo Senior (tarif réduit)\n\n'
      + 'Cela nous permettra aussi de vérifier les conditions d\'éligibilité.',
    placeholder: '',
  },
  {
    section: 2, field: 'bearer.status', label: 'Statut', type: 'choice',
    botMessage: (d) =>
      `Quel est le statut actuel de ${d.bearer?.firstName ?? 'votre porteur'} ?\n\n`
      + 'Chaque statut ouvre droit à des forfaits différents. Par exemple :\n'
      + '• Junior / Scolaire → Imagine R (avec possibilité de réduction bourse)\n'
      + '• Étudiant·e → Imagine R Étudiant\n'
      + '• Actif·ve → Navigo Annuel (renouvellement automatique chaque année)\n'
      + '• Senior → Navigo Senior dès 65 ans, ou Améthyste selon département\n'
      + '• Solidarité → TST (Tarification Solidarité Transport, renouvellement trimestriel)',
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
      { value: 'parent',      label: 'Parent',           description: 'Père ou mère du porteur' },
      { value: 'guardian',    label: 'Tuteur légal',     description: 'Tuteur ou représentant légal' },
      { value: 'association', label: 'Association',      description: 'Structure associative finançant le titre' },
      { value: 'employer',    label: 'Employeur',        description: 'Entreprise prenant en charge l\'abonnement' },
      { value: 'other',       label: 'Autre',            description: 'Autre lien (conjoint, aidant…)' },
    ],
    skip: (d) => d.isBearerPayer !== false,
  },

  // Section 4 — Besoins
  {
    section: 4, field: 'frequency', label: 'Fréquence', type: 'choice',
    botMessage: (d) =>
      `Excellent ! Parlons maintenant des habitudes de transport de ${d.subscriptionFor === 'self' ? 'vous-même' : (d.bearer?.firstName ?? 'votre porteur')}.\n\n`
      + 'La fréquence oriente directement vers le bon forfait :\n'
      + '• Quotidienne → Navigo Annuel ou mensuel (le plus économique à l\'année)\n'
      + '• Régulière → Navigo mensuel ou hebdomadaire\n'
      + '• Occasionnelle → Navigo Liberté+ (paiement à l\'usage, sans engagement)\n\n'
      + 'À quelle fréquence utilise-t-on les transports en commun ?',
    options: [
      { value: 'daily',      label: 'Quotidienne',   description: 'Tous les jours ou presque (trajets domicile-travail/école)' },
      { value: 'regular',    label: 'Régulière',     description: 'Plusieurs fois par semaine' },
      { value: 'occasional', label: 'Occasionnelle', description: 'Quelques fois par mois' },
    ],
  },
  {
    section: 4, field: 'planPreference', label: "Type d'abonnement", type: 'choice',
    botMessage: () =>
      'Quel type d\'abonnement vous intéresse le plus ?\n\n'
      + 'Voici les formules proposées par Comutitres :\n'
      + '• Annuel → le plus économique, renouvellement automatique à date anniversaire\n'
      + '• Mensuel → flexibilité mois par mois (Navigo mois)\n'
      + '• Hebdomadaire → idéal pour des besoins ponctuels (Navigo semaine)\n'
      + '• Liberté+ → paiement à la validation, sans abonnement fixe\n\n'
      + 'Note : l\'Imagine R est uniquement annuel (lié à la saison scolaire).',
    options: [
      { value: 'annual',        label: 'Annuel',          description: 'Navigo Annuel — le plus économique, renouvellement automatique' },
      { value: 'monthly',       label: 'Mensuel',         description: 'Navigo mois — souplesse mois par mois' },
      { value: 'weekly',        label: 'Hebdomadaire',    description: 'Navigo semaine — idéal pour des besoins ponctuels' },
      { value: 'pay_as_you_go', label: 'À l\'usage',      description: 'Navigo Liberté+ — paiement à la validation, sans engagement' },
      { value: 'unsure',        label: 'Je ne sais pas',  description: 'Aidez-moi à choisir selon mon profil !' },
    ],
  },
  {
    section: 4, field: 'socialSituation', label: 'Situation sociale', type: 'choice',
    botMessage: (d) => {
      const who = d.subscriptionFor === 'self' ? 'votre' : `la situation de ${d.bearer?.firstName ?? 'votre porteur'} —`
      return `Quelle est ${who} situation sociale ou professionnelle ?\n\n`
        + 'Certaines situations ouvrent droit à des tarifs préférentiels importants :\n'
        + '• Boursier·e → réduction sur Imagine R (selon département, sur attestation)\n'
        + '• Demandeur·se d\'emploi → possible éligibilité à la TST\n'
        + '• Bénéficiaire social (RSA, AAH, CAF…) → TST Solidarité (réduction 50%, 75% ou gratuité totale)\n'
        + '• Senior 65+ → Navigo Senior à tarif réduit, ou Améthyste selon département'
    },
    options: [
      { value: 'student',            label: 'Étudiant·e',               description: 'En enseignement supérieur — Imagine R Étudiant' },
      { value: 'scholarship',        label: 'Boursier·e',               description: 'Bourse de l\'Éducation Nationale ou du supérieur — réduction Imagine R' },
      { value: 'job_seeker',         label: 'Demandeur·se d\'emploi',   description: 'Inscrit·e à Pôle Emploi — potentiellement éligible TST' },
      { value: 'social_beneficiary', label: 'Bénéficiaire social',      description: 'RSA, AAH, CMU-C… → TST (réduction 50%, 75% ou gratuité)' },
      { value: 'senior',             label: 'Senior (65 ans et +)',      description: 'Navigo Senior ou Améthyste selon le département' },
      { value: 'other',              label: 'Autre / Aucune de ces situations', description: 'Tarif standard sans réduction spécifique' },
    ],
  },
  {
    section: 4, field: 'support', label: 'Support souhaité', type: 'choice',
    botMessage: () =>
      'Sur quel support souhaitez-vous utiliser le titre de transport ?\n\n'
      + 'Comutitres propose deux options :\n'
      + '• Passe Navigo (carte physique) → compatible avec tous les forfaits, durée de vie 10 ans. '
      + 'L\'Imagine R nécessite un passe Navigo dédié.\n'
      + '• Téléphone NFC → iPhone ou Android compatible, pratique et sans carte physique. '
      + 'Disponible pour Navigo Annuel, mensuel, semaine et Liberté+.\n\n'
      + 'Notez que certains forfaits comme l\'Imagine R imposent le passe physique.',
    options: [
      { value: 'phone',       label: 'Téléphone (NFC)',   description: 'iPhone ou Android — validez directement avec votre smartphone' },
      { value: 'navigo_pass', label: 'Passe Navigo',      description: 'Carte physique — compatible tous forfaits, durée de vie 10 ans' },
      { value: 'unsure',      label: 'Je ne sais pas encore', description: 'Je laisse l\'assistant recommander le support adapté' },
    ],
  },
  {
    section: 4, field: 'scholarship', label: 'Boursier ?', type: 'yesno',
    botMessage: (d) =>
      `${d.bearer?.firstName ?? 'Le porteur'} est-il·elle boursier·e de l'Éducation Nationale ou de l'Enseignement Supérieur ?\n\n`
      + 'Si oui, une réduction peut s\'appliquer sur l\'abonnement Imagine R, selon le département de résidence. '
      + 'Une attestation d\'attribution de bourse sera demandée lors de la souscription pour valider ce droit.',
  },
  {
    section: 4, field: 'solidarity', label: 'Tarif solidarité ?', type: 'yesno',
    botMessage: (d) =>
      `${d.bearer?.firstName ?? 'Le porteur'} bénéficie-t-il·elle (ou pense bénéficier) de la Tarification Solidarité Transport (TST) d'Île-de-France Mobilités ?\n\n`
      + 'La TST est réservée aux personnes en situation de précarité (RSA, AAH, CMU-C, CAF…). Elle offre :\n'
      + '• Réduction 50%\n'
      + '• Solidarité 75%\n'
      + '• Gratuité totale\n\n'
      + 'Contrairement aux autres forfaits annuels, la TST se renouvelle par période de 3 mois. '
      + 'Des justificatifs sociaux seront demandés pour vérification des droits.',
  },
  {
    section: 4, field: 'department', label: 'Département', type: 'text',
    botMessage: (d) =>
      `Dernière question ! Dans quel département réside ${d.subscriptionFor === 'self' ? 'vous' : (d.bearer?.firstName ?? 'le porteur')} ?\n\n`
      + 'Cette information est recommandée car certaines aides varient selon le département :\n'
      + '• Améthyste (seniors et personnes en situation de handicap) → tarifs et conditions différents selon le Conseil Départemental\n'
      + '• Réductions bourse Imagine R → selon le département de résidence\n'
      + '• TST → vérification des droits selon la préfecture de résidence\n\n'
      + '(Optionnel — mais plus votre département est précis, plus la recommandation sera fiable)',
    placeholder: 'Ex : 75, 92, 93, 94…',
    optional: true,
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function getDisplayValue(step: ChatStep, draft: OnboardingDraft): string {
  const raw = getField(draft, step.field)
  if (raw === undefined || raw === null || raw === '') return '—'
  if (step.type === 'yesno') return raw ? 'Oui' : 'Non'
  if (step.type === 'date') return formatDate(String(raw))
  if (step.type === 'choice') return step.options?.find(o => o.value === raw)?.label ?? String(raw)
  return String(raw)
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
  const fromSimpleForm = (location.state as { fromSimpleForm?: boolean } | null)?.fromSimpleForm ?? false

  // Core chat state
  const [messages,    setMessages]    = useState<Message[]>([])
  const [draft,       setDraft]       = useState<OnboardingDraft>({})
  const [stepIdx,     setStepIdx]     = useState(0)
  const [section,     setSection]     = useState(1)
  const [inputValue,  setInputValue]  = useState('')
  const [inputType,   setInputType]   = useState<'text' | 'email' | 'date'>('text')
  const [isTyping,    setIsTyping]    = useState(false)
  const [showInput,   setShowInput]   = useState(false)
  const [showChoices, setShowChoices] = useState(false)
  const [showYesNo,   setShowYesNo]   = useState(false)
  const [yesNoField,  setYesNoField]  = useState('')
  const [error,       setError]       = useState('')
  const [loading,     setLoading]     = useState(false)
  const [isDone,      setIsDone]      = useState(false)

  // Restart
  const [restartKey, setRestartKey] = useState(0)

  // Edit mode
  const [showEdit,    setShowEdit]    = useState(false)
  const [isEditMode,  setIsEditMode]  = useState(false)
  const [returnToIdx, setReturnToIdx] = useState(0)

  const messagesBoxRef = useRef<HTMLDivElement>(null)
  const inputRef       = useRef<HTMLInputElement>(null)
  const idRef          = useRef(0)

  function nextId()            { return ++idRef.current }
  function addBot(text: string) { setMessages(prev => [...prev, { id: nextId(), from: 'bot', kind: 'text', text }]) }
  function addUser(text: string){ setMessages(prev => [...prev, { id: nextId(), from: 'user', kind: 'text', text }]) }

  useEffect(() => {
    const el = messagesBoxRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, isTyping])

  // ── Reset (Tout refaire) ────────────────────────────────────────────────────

  function reset() {
    idRef.current = 0
    setMessages([]);   setDraft({});        setStepIdx(0)
    setSection(1);     setInputValue('');   setInputType('text')
    setIsTyping(false);setShowInput(false); setShowChoices(false)
    setShowYesNo(false);setYesNoField('');  setError('')
    setLoading(false); setIsDone(false);    setIsEditMode(false)
    setShowEdit(false);setReturnToIdx(0)
    setRestartKey(k => k + 1)
  }

  // ── Trigger a step's question + UI ─────────────────────────────────────────

  function triggerStep(idx: number, d: OnboardingDraft) {
    if (idx >= STEPS.length) { handleSubmit(d); return }
    const step = STEPS[idx]
    setSection(step.section)
    addBot(step.botMessage(d))
    if (step.type === 'choice') {
      setShowChoices(true)
    } else if (step.type === 'yesno') {
      setShowYesNo(true); setYesNoField(step.field)
    } else {
      setInputType(step.type === 'email' ? 'email' : step.type === 'date' ? 'date' : 'text')
      setShowInput(true)
      setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 50)
    }
  }

  function botThen(fn: () => void) {
    setIsTyping(true)
    setTimeout(() => { setIsTyping(false); fn() }, 850)
  }

  // ── Initialization ──────────────────────────────────────────────────────────

  useEffect(() => {
    const intro = fromSimpleForm
      ? "Votre compte est bien créé ✅ Maintenant c'est moi qui vous assiste !\n\nJe vais vous poser quelques questions pour identifier, parmi tous les forfaits Comutitres (Navigo Annuel, Imagine R, TST, Améthyste…), celui qui correspond le mieux à votre situation. Comptez environ 2 minutes."
      : "Bienvenue dans votre parcours Comutitres 👋\n\nJe suis votre assistant personnel. Mon rôle : vous orienter vers le forfait Île-de-France Mobilités le plus adapté à votre profil, parmi les offres disponibles — Navigo Annuel, Imagine R, Liberté+, TST Solidarité, Améthyste et bien d'autres.\n\nC'est parti, ça prend environ 2 minutes !"

    setIsTyping(true)
    const t1 = setTimeout(() => {
      setIsTyping(false)
      addBot(intro)
      const t2 = setTimeout(() => botThen(() => triggerStep(0, {})), 400)
      return () => clearTimeout(t2)
    }, 1000)
    return () => clearTimeout(t1)
  }, [restartKey]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Edit mode ───────────────────────────────────────────────────────────────

  function handleEditStep(targetIdx: number) {
    setShowEdit(false)
    setIsEditMode(true)
    setReturnToIdx(stepIdx)
    setStepIdx(targetIdx)
    const step = STEPS[targetIdx]
    botThen(() => {
      addBot(`Bien sûr ! Modifions : « ${step.label} »`)
      if (step.type === 'choice') {
        setShowChoices(true)
      } else if (step.type === 'yesno') {
        setShowYesNo(true); setYesNoField(step.field)
      } else {
        setInputType(step.type === 'email' ? 'email' : step.type === 'date' ? 'date' : 'text')
        setShowInput(true)
        setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 50)
      }
    })
  }

  function finishEdit() {
    setIsEditMode(false)
    setStepIdx(returnToIdx)
    botThen(() => addBot("Réponse mise à jour ! 👍 Je reprends là où on en était."))
  }

  // ── Answer handlers ─────────────────────────────────────────────────────────

  function handleChoice(option: StepOption) {
    setShowChoices(false)
    const step = STEPS[stepIdx]
    let newDraft = setField(draft, step.field, option.value)
    if (step.field === 'subscriptionFor' && option.value === 'self') newDraft = { ...newDraft, isBearerPayer: true }
    setDraft(newDraft)
    addUser(option.label)
    if (isEditMode) { finishEdit(); return }
    const { nextIdx, draft: advDraft } = advance(stepIdx, newDraft)
    setDraft(advDraft); setStepIdx(nextIdx)
    botThen(() => triggerStep(nextIdx, advDraft))
  }

  function handleYesNo(yes: boolean) {
    setShowYesNo(false)
    const newDraft = setField(draft, yesNoField, yes)
    setDraft(newDraft)
    addUser(yes ? 'Oui ✅' : 'Non')
    if (isEditMode) { finishEdit(); return }
    const { nextIdx, draft: advDraft } = advance(stepIdx, newDraft)
    setDraft(advDraft); setStepIdx(nextIdx)
    botThen(() => triggerStep(nextIdx, advDraft))
  }

  function handleSend() {
    const value = inputValue.trim()
    const step  = STEPS[stepIdx]
    if (!value && !step.optional) { setError('Ce champ est requis.'); return }
    if (step.type === 'email' && value && !value.includes('@')) { setError('Adresse e-mail invalide.'); return }
    setError(''); setShowInput(false)
    const display  = step.type === 'date' && value ? formatDate(value) : value || '(passé)'
    const newDraft = value ? setField(draft, step.field, value) : draft
    setDraft(newDraft); addUser(display); setInputValue('')
    if (isEditMode) { finishEdit(); return }
    const { nextIdx, draft: advDraft } = advance(stepIdx, newDraft)
    setDraft(advDraft); setStepIdx(nextIdx)
    botThen(() => triggerStep(nextIdx, advDraft))
  }

  // ── Submit ──────────────────────────────────────────────────────────────────

  async function handleSubmit(finalDraft: OnboardingDraft) {
    setSection(5)
    addBot(
      "Merci pour toutes ces informations 🙏\n\n"
      + "J'analyse votre profil pour identifier l'offre Comutitres la plus adaptée parmi : "
      + "Navigo Annuel, Navigo Senior, Imagine R, Navigo Liberté+, TST Solidarité et Améthyste. "
      + "Un instant..."
    )
    setLoading(true)
    try {
      const answer  = finalDraft as OnboardingAnswer
      const created = await createOnboarding(answer)
      sessionStorage.setItem('comutitres_onboarding_session_id', created.session?.id ?? created.id)
      const rec = await getRecommendation(answer)
      setMessages(prev => [...prev, { id: nextId(), from: 'bot' as const, kind: 'result' as const, data: rec }])
      setIsDone(true)
    } catch (err) {
      addBot(err instanceof Error ? `Oups ! ${err.message}` : 'Désolé, une erreur inattendue est survenue.')
    } finally {
      setLoading(false)
    }
  }

  // ── Derived ─────────────────────────────────────────────────────────────────

  const currentSection  = isDone ? 5 : section
  const answeredSteps   = STEPS
    .map((step, i) => ({ step, i }))
    .filter(({ step, i }) => i < (isEditMode ? returnToIdx : stepIdx) && !step.skip?.(draft))

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#fff' }}>
      <Header />

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', px: { xs: 1.5, sm: 3, md: 4 }, pt: { xs: 2, md: 3 }, pb: { xs: 3, md: 4 }, gap: { xs: 2, md: 3 } }}>

        {/* ── Stepper card ── */}
        <Box sx={{
          width: '100%', maxWidth: 860,
          bgcolor: '#fff',
          borderRadius: 3,
          boxShadow: '0 2px 12px rgba(26,86,219,0.07)',
          border: '1px solid rgba(26,86,219,0.07)',
          px: { xs: 2, md: 5 },
          py: { xs: 1, md: 1.5 },
        }}>
          <LandmarkStepper section={currentSection} />
        </Box>

        {/* ── Chat card ── */}
        <Box sx={{
          width: '100%', maxWidth: 700,
          height: { xs: 520, sm: 580, md: 620 },
          borderRadius: { xs: 3, md: 4 },
          boxShadow: '0 8px 48px rgba(26,86,219,0.13), 0 1px 4px rgba(0,0,0,0.06)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden', position: 'relative',
          border: '1px solid rgba(26,86,219,0.08)',
        }}>

        {/* ── Header ── */}
        <Box sx={{
          px: 2.5, py: 1.75, flexShrink: 0,
          background: 'linear-gradient(135deg, #1a56db 0%, #2563eb 60%, #1d72e8 100%)',
          display: 'flex', alignItems: 'center', gap: 1.5,
        }}>
          {/* Avatar */}
          <Box sx={{
            width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
            background: 'rgba(255,255,255,0.18)',
            border: '2px solid rgba(255,255,255,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, fontSize: 17, color: '#fff',
            boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
          }}>C</Box>

          <Box sx={{ flex: 1 }}>
            <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 14, lineHeight: 1.2, letterSpacing: 0.1 }}>
              Assistant Comutitres
            </Typography>
            <Stack direction="row" spacing={0.6} sx={{ alignItems: 'center', mt: 0.4 }}>
              <Box sx={{
                width: 7, height: 7, borderRadius: '50%',
                bgcolor: loading ? '#fbbf24' : '#4ade80',
                boxShadow: loading ? '0 0 6px #fbbf24' : '0 0 6px #4ade80',
                animation: 'pulse 2s infinite',
                '@keyframes pulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.6 } },
              }} />
              <Typography sx={{ color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: 500 }}>
                {loading ? 'Analyse en cours…' : 'En ligne'}
              </Typography>
            </Stack>
          </Box>

          {/* Section badge */}
          <Box sx={{
            px: 1.25, py: 0.4, borderRadius: 99,
            bgcolor: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.25)',
          }}>
            <Typography sx={{ color: 'rgba(255,255,255,0.9)', fontSize: 11, fontWeight: 600 }}>
              {isDone ? '✓ Terminé' : `Étape ${Math.min(currentSection, 4)} / 4`}
            </Typography>
          </Box>

          {/* Modifier */}
          {answeredSteps.length > 0 && !isDone && (
            <IconButton size="small" title="Modifier une réponse" onClick={() => setShowEdit(v => !v)}
              sx={{ color: 'rgba(255,255,255,0.75)', '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.14)' }, borderRadius: 2 }}>
              <EditIcon sx={{ fontSize: 17 }} />
            </IconButton>
          )}
          {/* Tout refaire */}
          <IconButton size="small" title="Tout refaire" onClick={reset}
            sx={{ color: 'rgba(255,255,255,0.75)', '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.14)' }, borderRadius: 2 }}>
            <RefreshIcon sx={{ fontSize: 17 }} />
          </IconButton>
        </Box>

        {/* Progress bar */}
        <Box sx={{ height: 4, bgcolor: 'rgba(26,86,219,0.08)', flexShrink: 0, position: 'relative' }}>
          <Box sx={{
            position: 'absolute', left: 0, top: 0, bottom: 0,
            background: 'linear-gradient(90deg, #3b82f6, #1a56db)',
            width: isDone ? '100%' : `${Math.min(((currentSection - 1) / 4) * 100, 100)}%`,
            transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
            borderRadius: '0 99px 99px 0',
          }} />
        </Box>

        {/* ── Messages ── */}
        <Box ref={messagesBoxRef} sx={{
          flex: 1, overflowY: 'auto', px: 2, py: 2.5,
          display: 'flex', flexDirection: 'column', gap: 2,
          background: 'linear-gradient(180deg, #f7f9ff 0%, #f0f4ff 100%)',
          '&::-webkit-scrollbar': { width: 4 },
          '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(26,86,219,0.15)', borderRadius: 99 },
        }}>

          {messages.map((msg) => (
            <Box key={msg.id} sx={{ animation: 'fadeSlideIn 0.28s ease both', '@keyframes fadeSlideIn': { from: { opacity: 0, transform: 'translateY(10px)' }, to: { opacity: 1, transform: 'translateY(0)' } } }}>
              {msg.kind === 'text' && (
                <Box sx={{ display: 'flex', justifyContent: msg.from === 'user' ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 1 }}>
                  {msg.from === 'bot' && <BotAvatar />}
                  <Box sx={{
                    maxWidth: '80%', px: 2, py: 1.25,
                    borderRadius: msg.from === 'user' ? '20px 20px 5px 20px' : '5px 20px 20px 20px',
                    background: msg.from === 'user'
                      ? 'linear-gradient(135deg, #2563eb 0%, #1a56db 100%)'
                      : '#fff',
                    boxShadow: msg.from === 'user'
                      ? '0 4px 14px rgba(37,99,235,0.35)'
                      : '0 2px 12px rgba(0,0,0,0.06)',
                    border: msg.from === 'bot' ? '1px solid rgba(26,86,219,0.07)' : 'none',
                  }}>
                    <Typography sx={{
                      fontSize: 13.5, lineHeight: 1.65, whiteSpace: 'pre-line',
                      color: msg.from === 'user' ? '#fff' : 'text.primary',
                      letterSpacing: 0.1,
                    }}>
                      {msg.text}
                    </Typography>
                  </Box>
                </Box>
              )}

              {msg.kind === 'result' && (
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                  <BotAvatar sx={{ mt: 0.5 }} />
                  <Box sx={{
                    flex: 1, borderRadius: '6px 20px 20px 20px',
                    boxShadow: '0 4px 24px rgba(26,86,219,0.12)',
                    overflow: 'hidden', border: '1px solid rgba(26,86,219,0.1)',
                  }}>
                    {/* Result header */}
                    <Box sx={{
                      px: 2.5, py: 1.75,
                      background: 'linear-gradient(135deg, #1a56db 0%, #0ea5e9 100%)',
                    }}>
                      <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: 14, letterSpacing: 0.2 }}>
                        🎉 Votre recommandation personnalisée
                      </Typography>
                    </Box>
                    {/* Result body */}
                    <Box sx={{ p: 2.5, bgcolor: '#fff' }}>
                      <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
                        <Chip
                          label={`${msg.data.confidencePercent} % de correspondance`}
                          size="small"
                          sx={{
                            fontSize: 11, height: 24, fontWeight: 700,
                            bgcolor: '#dcfce7', color: '#166534',
                            border: '1px solid #bbf7d0',
                          }}
                        />
                      </Stack>
                      <Typography sx={{ fontWeight: 900, fontSize: 20, color: '#1a56db', mb: 0.5, letterSpacing: -0.3 }}>
                        {msg.data.offerName}
                      </Typography>
                      <Typography sx={{ fontSize: 13.5, color: 'text.secondary', lineHeight: 1.7, mb: 2 }}>
                        {msg.data.reasons.join(' ')}
                      </Typography>
                      {msg.data.requiredDocuments.length > 0 && (
                        <Box sx={{ mb: 1.5, p: 1.5, bgcolor: '#f0f6ff', borderRadius: 2, border: '1px solid #dbeafe' }}>
                          <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: '#1e40af', mb: 0.75, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            Documents requis
                          </Typography>
                          {msg.data.requiredDocuments.map((doc) => (
                            <Stack key={doc} direction="row" spacing={0.75} sx={{ alignItems: 'flex-start', mb: 0.4 }}>
                              <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: '#3b82f6', mt: 0.7, flexShrink: 0 }} />
                              <Typography sx={{ fontSize: 12.5, color: '#1e3a8a' }}>{doc}</Typography>
                            </Stack>
                          ))}
                        </Box>
                      )}
                      {msg.data.warnings.map((w) => (
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
                  </Box>
                </Box>
              )}
            </Box>
          ))}

          {/* Typing / loading */}
          {(isTyping || loading) && (
            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
              <BotAvatar />
              <Box sx={{
                px: 2, py: 1.25, borderRadius: '5px 16px 16px 16px',
                bgcolor: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
                border: '1px solid rgba(26,86,219,0.07)',
                display: 'flex', gap: '6px', alignItems: 'center',
              }}>
                {loading
                  ? <CircularProgress size={14} sx={{ color: 'primary.main' }} />
                  : [0, 0.2, 0.4].map((delay, i) => (
                    <Box key={i} sx={{
                      width: 7, height: 7, borderRadius: '50%',
                      background: 'linear-gradient(135deg, #3b82f6, #1a56db)',
                      animation: 'bounce 1.2s infinite',
                      animationDelay: `${delay}s`,
                      '@keyframes bounce': { '0%,60%,100%': { transform: 'translateY(0)' }, '30%': { transform: 'translateY(-6px)' } },
                    }} />
                  ))
                }
              </Box>
            </Box>
          )}

          {/* ── Choice buttons ── */}
          {showChoices && !isTyping && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 0.5, ml: 4.5 }}>
              {STEPS[stepIdx]?.options?.map((opt, idx) => (
                <Box
                  key={opt.value}
                  onClick={() => handleChoice(opt)}
                  sx={{
                    px: 2, py: 1.25,
                    bgcolor: '#fff',
                    borderRadius: '12px 12px 12px 4px',
                    border: '1.5px solid rgba(26,86,219,0.15)',
                    borderLeft: '3px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.18s cubic-bezier(0.4,0,0.2,1)',
                    boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
                    animation: 'fadeSlideIn 0.25s ease both',
                    animationDelay: `${idx * 0.06}s`,
                    display: 'flex', alignItems: 'center', gap: 1.5,
                    '&:hover': {
                      bgcolor: '#eff6ff',
                      borderColor: '#1a56db',
                      borderLeftColor: '#1a56db',
                      transform: 'translateX(4px)',
                      boxShadow: '0 4px 16px rgba(26,86,219,0.12)',
                    },
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: '#1e3a8a', lineHeight: 1.3 }}>
                      {opt.label}
                    </Typography>
                    {opt.description && (
                      <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 0.3, lineHeight: 1.4 }}>
                        {opt.description}
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{
                    width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                    bgcolor: 'rgba(26,86,219,0.07)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, color: '#1a56db', fontWeight: 700,
                  }}>›</Box>
                </Box>
              ))}
            </Box>
          )}

          {/* ── Yes / No ── */}
          {showYesNo && !isTyping && (
            <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'flex-end', mt: 0.5 }}>
              <Button
                onClick={() => handleYesNo(false)}
                variant="outlined"
                sx={{
                  borderRadius: 99, textTransform: 'none', fontSize: 13.5, fontWeight: 600,
                  px: 2.5, py: 0.9,
                  borderColor: 'rgba(26,86,219,0.3)',
                  color: '#374151',
                  '&:hover': { borderColor: '#1a56db', bgcolor: '#f0f6ff' },
                }}
              >Non</Button>
              <Button
                onClick={() => handleYesNo(true)}
                variant="contained"
                sx={{
                  borderRadius: 99, textTransform: 'none', fontSize: 13.5, fontWeight: 700,
                  px: 2.5, py: 0.9,
                  background: 'linear-gradient(135deg, #2563eb, #1a56db)',
                  boxShadow: '0 4px 14px rgba(26,86,219,0.35)',
                  '&:hover': { background: 'linear-gradient(135deg, #1d4ed8, #1a4fcc)', boxShadow: '0 6px 18px rgba(26,86,219,0.4)' },
                }}
              >Oui ✓</Button>
            </Stack>
          )}

          {/* ── Done actions ── */}
          {isDone && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, alignItems: 'center', mt: 2, mb: 1 }}>
              <Button
                variant="contained"
                onClick={() => addBot("La souscription complète sera disponible dans une prochaine version. Merci pour votre confiance !")}
                sx={{
                  borderRadius: 99, textTransform: 'none', fontSize: 14, fontWeight: 800,
                  px: 4, py: 1.25,
                  background: 'linear-gradient(135deg, #2563eb, #1a56db)',
                  boxShadow: '0 6px 20px rgba(26,86,219,0.4)',
                  '&:hover': { background: 'linear-gradient(135deg, #1d4ed8, #1a4fcc)', transform: 'translateY(-1px)', boxShadow: '0 8px 24px rgba(26,86,219,0.45)' },
                  transition: 'all 0.2s',
                }}
              >
                Continuer la souscription →
              </Button>
              <Button
                variant="text"
                onClick={reset}
                sx={{ textTransform: 'none', fontSize: 12.5, color: 'text.secondary', '&:hover': { color: 'primary.main', bgcolor: 'transparent' } }}
              >
                Recommencer depuis le début
              </Button>
            </Box>
          )}

        </Box>

        {/* ── Error ── */}
        {error && (
          <Box sx={{
            px: 2.5, py: 1,
            bgcolor: '#fef2f2', flexShrink: 0,
            borderTop: '1px solid #fecaca',
            display: 'flex', alignItems: 'center', gap: 1,
          }}>
            <Typography sx={{ fontSize: 12.5, color: '#dc2626' }}>⚠ {error}</Typography>
          </Box>
        )}

        {/* ── Text input ── */}
        {showInput && (
          <Box sx={{
            px: 2, py: 1.5, flexShrink: 0,
            background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(12px)',
            borderTop: '1px solid rgba(26,86,219,0.08)',
            boxShadow: '0 -4px 24px rgba(26,86,219,0.06)',
            display: 'flex', gap: 1, alignItems: 'center',
          }}>
            <TextField
              inputRef={inputRef}
              value={inputValue}
              onChange={(e) => { setInputValue(e.target.value); setError('') }}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSend() } }}
              placeholder={STEPS[stepIdx]?.placeholder ?? 'Votre réponse…'}
              type={inputType}
              size="small" fullWidth autoComplete="off"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 99, fontSize: 13.5,
                  bgcolor: '#f5f8ff',
                  '& fieldset': { borderColor: 'rgba(26,86,219,0.2)' },
                  '&:hover fieldset': { borderColor: 'rgba(26,86,219,0.4)' },
                  '&.Mui-focused fieldset': { borderColor: '#1a56db', borderWidth: 1.5 },
                },
              }}
            />
            {STEPS[stepIdx]?.optional && (
              <Button onClick={() => { setInputValue(''); handleSend() }} variant="text" size="small"
                sx={{ textTransform: 'none', fontSize: 12, flexShrink: 0, color: 'text.secondary', '&:hover': { color: 'primary.main', bgcolor: 'transparent' } }}>
                Passer
              </Button>
            )}
            <IconButton
              onClick={handleSend}
              disabled={(!inputValue.trim() && !STEPS[stepIdx]?.optional) || loading}
              sx={{
                background: 'linear-gradient(135deg, #2563eb, #1a56db)',
                color: '#fff', width: 40, height: 40, flexShrink: 0,
                boxShadow: '0 4px 12px rgba(26,86,219,0.35)',
                transition: 'all 0.2s',
                '&:hover': { transform: 'scale(1.08)', boxShadow: '0 6px 16px rgba(26,86,219,0.45)' },
                '&.Mui-disabled': { background: '#e5e7eb', boxShadow: 'none' },
              }}
            >
              <SendIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        )}

        {/* ── Edit panel ── */}
        {showEdit && (
          <Box sx={{
            position: 'absolute', left: 0, right: 0, bottom: 0,
            background: 'rgba(255,255,255,0.97)',
            backdropFilter: 'blur(16px)',
            borderTop: '1px solid rgba(26,86,219,0.1)',
            maxHeight: '72%', display: 'flex', flexDirection: 'column',
            boxShadow: '0 -8px 40px rgba(26,86,219,0.12)',
            borderRadius: '16px 16px 0 0',
            animation: 'slideUp 0.25s cubic-bezier(0.4,0,0.2,1)',
            '@keyframes slideUp': { from: { transform: 'translateY(100%)' }, to: { transform: 'translateY(0)' } },
          }}>
            {/* Handle */}
            <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1 }}>
              <Box sx={{ width: 36, height: 4, borderRadius: 99, bgcolor: 'rgba(0,0,0,0.1)' }} />
            </Box>
            {/* Panel header */}
            <Box sx={{ px: 2.5, py: 1.25, display: 'flex', alignItems: 'center', borderBottom: '1px solid rgba(26,86,219,0.07)', flexShrink: 0 }}>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontWeight: 800, fontSize: 14, color: '#1e3a8a' }}>Modifier une réponse</Typography>
                <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 0.2 }}>Cliquez sur une réponse pour la corriger</Typography>
              </Box>
              <IconButton size="small" onClick={() => setShowEdit(false)}
                sx={{ bgcolor: '#f3f4f6', '&:hover': { bgcolor: '#e5e7eb' } }}>
                <CloseIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>
            {/* List */}
            <Box sx={{ overflowY: 'auto', px: 1.5, py: 1.25,
              '&::-webkit-scrollbar': { width: 4 },
              '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(26,86,219,0.15)', borderRadius: 99 },
            }}>
              {answeredSteps.length === 0 && (
                <Typography sx={{ fontSize: 13, color: 'text.secondary', px: 1.5, py: 2 }}>Aucune réponse à modifier pour l'instant.</Typography>
              )}
              {answeredSteps.map(({ step, i }) => (
                <Box
                  key={i}
                  onClick={() => handleEditStep(i)}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 1.5,
                    px: 1.5, py: 1.25, borderRadius: 2.5, cursor: 'pointer',
                    transition: 'all 0.15s',
                    '&:hover': { bgcolor: '#eff6ff', transform: 'translateX(2px)' },
                  }}
                >
                  <Box sx={{
                    width: 36, height: 36, borderRadius: 2, flexShrink: 0,
                    bgcolor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <EditIcon sx={{ fontSize: 16, color: '#1a56db' }} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: 11.5, color: 'text.secondary', mb: 0.15, fontWeight: 500 }}>{step.label}</Typography>
                    <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {getDisplayValue(step, draft)}
                    </Typography>
                  </Box>
                  <Typography sx={{ fontSize: 18, color: 'rgba(26,86,219,0.35)', flexShrink: 0 }}>›</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        </Box>

      </Box>

      <Footer />
    </Box>
  )
}

// ─── Bot avatar ───────────────────────────────────────────────────────────────

function BotAvatar({ sx }: { sx?: object }) {
  return (
    <Box sx={{
      width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
      background: 'linear-gradient(135deg, #2563eb 0%, #1a56db 100%)',
      border: '2px solid rgba(255,255,255,0.8)',
      boxShadow: '0 2px 8px rgba(26,86,219,0.3)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 900, fontSize: 11, color: '#fff',
      ...sx,
    }}>
      C
    </Box>
  )
}

import {
  Box,
  Button,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import {
  ArrowRight,
  BadgeCheck,
  CircleHelp,
  CreditCard,
  FileCheck2,
  GraduationCap,
  HeartHandshake,
  MapPin,
  SearchCheck,
  ShieldCheck,
  Smartphone,
  UserRound,
  WalletCards,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Footer } from '../components/Footer'
import { Header } from '../components/Header'
import { useAccessibility } from '../accessibility/useAccessibility'
import { useAuth } from '../hooks/useAuth'
import heroDay from '../assets/jour.png'
import ctaNight from '../assets/nuit.png'

const BRAND_BLUE = '#1972d2'

const DARK_TEXT = '#1a2b3c'

const forfaits = [
  { title: 'Imagine R', fr: 'Pour les étudiants et apprentis', en: 'For students and apprentices', color: '#7c3aed', bg: '#ede9fe', icon: 'graduation' },
  { title: 'Navigo', fr: 'Pour tous vos déplacements', en: 'For all your daily journeys', color: '#2563eb', bg: '#dbeafe', icon: 'card' },
  { title: 'TST', fr: 'Tarification Solidarité Transport', en: 'Reduced fares based on social eligibility', color: '#ea580c', bg: '#ffedd5', icon: 'people' },
  { title: 'Améthyste', fr: 'Pour les seniors et certains publics', en: 'For seniors and eligible passengers', color: '#db2777', bg: '#fce7f3', icon: 'heart' },
  { title: 'Navigo Liberté+', fr: 'Paiement à l’usage sans engagement', en: 'Pay as you travel with no commitment', color: '#0d9488', bg: '#ccfbf1', icon: 'ticket' },
]

const accessibility = [
  { frTitle: 'Français', enTitle: 'French', fr: 'Interface disponible en français', en: 'French interface available', icon: 'chat' },
  { frTitle: 'English', enTitle: 'English', fr: 'Version anglaise disponible', en: 'English interface available', icon: 'globe' },
  { frTitle: 'Senior', enTitle: 'Larger text', fr: 'Taille de texte adaptée', en: 'Adjustable and larger text', icon: 'person' },
  { frTitle: 'Handicap', enTitle: 'Accessibility', fr: 'Navigation clavier et préférences adaptées', en: 'Keyboard navigation and accessible preferences', icon: 'wheelchair' },
  { frTitle: 'Mobile First', enTitle: 'Mobile first', fr: 'Optimisé mobile et tablette', en: 'Optimised for mobile and tablet', icon: 'phone' },
]

const journeySteps = [
  {
    number: '01',
    frTitle: 'Décris ton besoin',
    enTitle: 'Tell us what you need',
    fr: 'Profil, fréquence des trajets, porteur, payeur et situation particulière.',
    en: 'Profile, travel frequency, pass holder, payer and personal circumstances.',
    icon: SearchCheck,
  },
  {
    number: '02',
    frTitle: 'Reçois une recommandation',
    enTitle: 'Get a recommendation',
    fr: 'Le questionnaire compare les offres et explique pourquoi un forfait te correspond.',
    en: 'The questionnaire compares offers and explains which pass best matches your needs.',
    icon: BadgeCheck,
  },
  {
    number: '03',
    frTitle: 'Ajoute tes justificatifs',
    enTitle: 'Upload your documents',
    fr: 'La plateforme demande uniquement les documents utiles et suit leur validation.',
    en: 'The platform requests only the required documents and tracks their validation.',
    icon: FileCheck2,
  },
  {
    number: '04',
    frTitle: 'Finalise et suis ton dossier',
    enTitle: 'Complete and track your request',
    fr: 'Paiement, réception du titre, état de la demande et support restent au même endroit.',
    en: 'Payment, pass delivery, request status and support all remain in one place.',
    icon: CreditCard,
  },
]

const aidCards = [
  {
    frTitle: 'Imagine R et bourse',
    enTitle: 'Imagine R and scholarships',
    fr: 'Des réductions peuvent s’appliquer aux élèves et étudiants boursiers selon leur situation et leur département.',
    en: 'Discounts may apply to pupils and students receiving a scholarship, depending on their circumstances and department.',
    frNote: 'Attestation de scolarité ou de bourse à prévoir.',
    enNote: 'A school or scholarship certificate may be required.',
    icon: GraduationCap,
    color: '#7c3aed',
    bg: '#f3e8ff',
  },
  {
    frTitle: 'Tarification Solidarité',
    enTitle: 'Solidarity pricing',
    fr: 'Selon les droits sociaux, la TST peut ouvrir accès à une réduction de 50 %, Solidarité 75 % ou à la gratuité.',
    en: 'Depending on social eligibility, TST may provide a 50% discount, 75% solidarity discount or free travel.',
    frNote: 'Les droits et justificatifs sont vérifiés régulièrement.',
    enNote: 'Eligibility and supporting documents are checked regularly.',
    icon: HeartHandshake,
    color: '#ea580c',
    bg: '#ffedd5',
  },
  {
    frTitle: 'Senior et Améthyste',
    enTitle: 'Senior and Améthyste',
    fr: 'Les personnes de 65 ans et plus ou en situation de handicap peuvent bénéficier d’offres adaptées.',
    en: 'People aged 65 and over or passengers with disabilities may qualify for adapted offers.',
    frNote: 'Les conditions varient selon le département.',
    enNote: 'Conditions vary depending on the department.',
    icon: MapPin,
    color: '#db2777',
    bg: '#fce7f3',
  },
]

function ForfaitIcon({ type, color }: { type: string; color: string }) {
  const props = { width: 22, height: 22, fill: 'none', stroke: color, strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

  switch (type) {
    case 'graduation':
      return (
        <svg viewBox="0 0 24 24" {...props}>
          <path d="M22 10 12 5 2 10l10 5 10-5Z" />
          <path d="M6 12v5c0 1 3 3 6 3s6-2 6-3v-5" />
        </svg>
      )
    case 'card':
      return (
        <svg viewBox="0 0 24 24" {...props}>
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <path d="M2 10h20" />
        </svg>
      )
    case 'people':
      return (
        <svg viewBox="0 0 24 24" {...props}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      )
    case 'heart':
      return (
        <svg viewBox="0 0 24 24" {...props}>
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z" />
        </svg>
      )
    default:
      return (
        <svg viewBox="0 0 24 24" {...props}>
          <path d="M2 9a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3Z" />
          <path d="M9 9h6M9 13h4" />
        </svg>
      )
  }
}

function AccessIcon({ type }: { type: string }) {
  const props = { width: 26, height: 26, fill: 'none', stroke: BRAND_BLUE, strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

  switch (type) {
    case 'chat':
      return <svg viewBox="0 0 24 24" {...props}><path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" /></svg>
    case 'globe':
      return <svg viewBox="0 0 24 24" {...props}><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z" /></svg>
    case 'person':
      return <svg viewBox="0 0 24 24" {...props}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
    case 'wheelchair':
      return <svg viewBox="0 0 24 24" {...props}><circle cx="16" cy="4" r="1" /><path d="m18 6-3 3M9 12a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" /><path d="M12 12V6H9" /></svg>
    default:
      return <svg viewBox="0 0 24 24" {...props}><rect x="7" y="2" width="10" height="20" rx="2" /><path d="M11 18h2" /></svg>
  }
}

export function HomePage() {
  const { language } = useAccessibility()
  const { user } = useAuth()
  const ctaTo = user ? '/onboarding' : '/auth/register'
  const isFrench = language === 'fr'
  const supportCases = isFrench
    ? ['J’ai perdu ma carte', 'Mon paiement a été refusé', 'Je veux résilier', 'Je souhaite modifier mon adresse']
    : ['I lost my travel card', 'My payment was declined', 'I want to cancel', 'I need to change my address']

  return (
    <Box id="main-content" component="main" tabIndex={-1} sx={{ bgcolor: '#fff', overflowX: 'hidden' }}>
      <Box
        sx={{
          position: 'relative',
          minHeight: { xs: 560, md: 640 },
          backgroundImage: `url(${heroDay})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(to bottom, rgba(0,0,0,0.12) 0%, transparent 22%, transparent 78%, rgba(255,255,255,0.25) 92%, rgba(255,255,255,0.55) 100%)',
            pointerEvents: 'none',
          }}
        />

        <Header />

        <Stack
          spacing={2}
          sx={{
            position: 'relative',
            zIndex: 2,
            alignItems: 'center',
            textAlign: 'center',
            px: { xs: 2, md: 4 },
            pt: { xs: 2, md: 4 },
            pb: { xs: 6, md: 8 },
          }}
        >
          <Box
            sx={{
              bgcolor: 'rgba(219,234,254,0.95)',
              color: BRAND_BLUE,
              fontWeight: 700,
              fontSize: 13,
              px: 2.5,
              py: 0.75,
              borderRadius: 999,
            }}
          >
            {isFrench ? '10k+ abonnés en Île-de-France' : '10k+ subscribers across Île-de-France'}
          </Box>

          <Typography
            component="h1"
            sx={{
              fontWeight: 900,
              fontSize: { xs: 36, sm: 48, md: 56 },
              lineHeight: 1.05,
              color: DARK_TEXT,
              maxWidth: 820,
            }}
          >
            {isFrench ? 'Ton forfait Navigo,' : 'Your Navigo pass,'}
            <br />
            {isFrench ? 'sans te prendre la tête.' : 'made simple.'}
          </Typography>

          <Typography sx={{ color: '#475569', fontSize: { xs: 15, md: 17 }, maxWidth: 620 }}>
            {isFrench
              ? 'Navigo, Imagine R, TST ou Améthyste : trouve le forfait qui te correspond en 2 minutes.'
              : 'Navigo, Imagine R, TST or Améthyste: find the right pass for you in 2 minutes.'}
          </Typography>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            sx={{
              mt: 1,
              position: 'relative',
              width: '100%',
              maxWidth: 560,
              p: 0.75,
              bgcolor: 'rgba(255,255,255,0.88)',
              backdropFilter: 'blur(14px)',
              borderRadius: { xs: 4, sm: 999 },
              boxShadow: '0 12px 38px rgba(15,23,42,0.14)',
              border: '1px solid rgba(255,255,255,0.8)',
              alignItems: 'center',
              transition: 'transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease',
              '&::before': {
                content: '""',
                position: 'absolute',
                inset: -2,
                zIndex: -1,
                borderRadius: 'inherit',
                background: 'linear-gradient(110deg, rgba(25,114,210,0.2), rgba(96,165,250,0.7), rgba(255,255,255,0.25))',
                opacity: 0,
                transition: 'opacity 0.25s ease',
              },
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 16px 42px rgba(25,114,210,0.2)',
              },
              '&:focus-within': {
                transform: 'translateY(-2px)',
                borderColor: 'rgba(96,165,250,0.9)',
                boxShadow: '0 16px 44px rgba(25,114,210,0.24), 0 0 0 4px rgba(96,165,250,0.14)',
                '&::before': {
                  opacity: 1,
                },
                '& .profile-search-icon': {
                  color: BRAND_BLUE,
                  bgcolor: '#dbeafe',
                  transform: 'scale(1.06)',
                },
              },
            }}
          >
            <TextField
              placeholder={isFrench ? 'Ton profil…' : 'Your profile…'}
              variant="standard"
              fullWidth
              slotProps={{
                input: {
                  disableUnderline: true,
                  startAdornment: (
                    <Box
                      className="profile-search-icon"
                      sx={{
                        width: 36,
                        height: 36,
                        mr: 1.25,
                        borderRadius: '50%',
                        color: '#64748b',
                        bgcolor: '#f1f5f9',
                        display: 'grid',
                        placeItems: 'center',
                        flexShrink: 0,
                        transition: 'color 0.25s ease, background-color 0.25s ease, transform 0.25s ease',
                      }}
                    >
                      <UserRound size={18} strokeWidth={2.1} aria-hidden="true" />
                    </Box>
                  ),
                },
              }}
              sx={{
                px: { xs: 1, sm: 1.5 },
                flex: 1,
                '& .MuiInputBase-root': { height: 48 },
                '& input': {
                  fontSize: 15,
                  fontWeight: 500,
                  color: DARK_TEXT,
                  py: 0,
                  '&::placeholder': {
                    color: '#64748b',
                    opacity: 1,
                  },
                },
              }}
            />
            <Button
              component={Link}
              to={ctaTo}
              variant="contained"
              sx={{
                borderRadius: 999,
                px: 3,
                fontWeight: 700,
                whiteSpace: 'nowrap',
                bgcolor: BRAND_BLUE,
                boxShadow: 'none',
                height: 48,
                '&:hover': { bgcolor: '#1565c0' },
              }}
            >
              {isFrench ? 'Trouver mon forfait' : 'Find my travel pass'}
              <ArrowRight size={18} aria-hidden="true" />
            </Button>
          </Stack>
        </Stack>
      </Box>

      <Box
        id="comment-ca-marche"
        sx={{
          px: { xs: 2, md: 5 },
          py: { xs: 7, md: 10 },
          bgcolor: '#f8fbff',
          scrollMarginTop: 24,
        }}
      >
        <Box sx={{ maxWidth: 1180, mx: 'auto' }}>
          <Stack spacing={1.5} sx={{ alignItems: 'center', textAlign: 'center', mb: { xs: 5, md: 7 } }}>
            <Typography sx={{ color: BRAND_BLUE, fontWeight: 800, fontSize: 12, letterSpacing: 1.2 }}>
              {isFrench ? 'COMMENT ÇA MARCHE' : 'HOW IT WORKS'}
            </Typography>
            <Typography component="h2" sx={{ fontWeight: 900, fontSize: { xs: 28, md: 38 }, color: DARK_TEXT }}>
              {isFrench ? 'Un seul parcours, du choix au suivi' : 'One journey, from choice to tracking'}
            </Typography>
            <Typography sx={{ color: '#64748b', maxWidth: 660, lineHeight: 1.7 }}>
              {isFrench
                ? 'Plus besoin de chercher où souscrire, quels documents fournir ou comment suivre ta demande.'
                : 'No more searching for where to subscribe, which documents to provide or how to track your request.'}
            </Typography>
          </Stack>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
              gap: 2,
            }}
          >
            {journeySteps.map((step) => {
              const StepIcon = step.icon
              return (
                <Box
                  key={step.number}
                  sx={{
                    position: 'relative',
                    bgcolor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 4,
                    p: 3,
                    minHeight: 230,
                    boxShadow: '0 10px 30px rgba(15,23,42,0.05)',
                  }}
                >
                  <Typography sx={{ position: 'absolute', top: 18, right: 22, color: '#dbeafe', fontWeight: 900, fontSize: 30 }}>
                    {step.number}
                  </Typography>
                  <Box
                    sx={{
                      width: 52,
                      height: 52,
                      borderRadius: 3,
                      bgcolor: '#dbeafe',
                      color: BRAND_BLUE,
                      display: 'grid',
                      placeItems: 'center',
                      mb: 3,
                    }}
                  >
                    <StepIcon size={25} strokeWidth={2} />
                  </Box>
                  <Typography sx={{ fontWeight: 850, color: DARK_TEXT, fontSize: 17, mb: 1 }}>
                    {isFrench ? step.frTitle : step.enTitle}
                  </Typography>
                  <Typography sx={{ color: '#64748b', fontSize: 14, lineHeight: 1.65 }}>
                    {isFrench ? step.fr : step.en}
                  </Typography>
                </Box>
              )
            })}
          </Box>
        </Box>
      </Box>

      <Box id="nos-forfaits" sx={{ px: { xs: 2, md: 5 }, py: { xs: 6, md: 8 }, scrollMarginTop: 24 }}>
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={{ xs: 4, lg: 6 }} sx={{ maxWidth: 1280, mx: 'auto' }}>
          <Box sx={{ flex: '0 0 auto', maxWidth: 320 }}>
            <Typography sx={{ color: BRAND_BLUE, fontWeight: 800, fontSize: 12, letterSpacing: 1.2, mb: 1.5 }}>
              {isFrench ? 'NOS FORFAITS' : 'OUR TRAVEL PASSES'}
            </Typography>
            <Typography component="h2" sx={{ fontWeight: 900, fontSize: { xs: 28, md: 34 }, lineHeight: 1.15, color: DARK_TEXT, mb: 3 }}>
              {isFrench ? 'Des solutions adaptées à chaque situation' : 'A solution for every situation'}
            </Typography>
            <Button
              component={Link}
              to={ctaTo}
              variant="outlined"
              sx={{
                borderRadius: 999,
                borderColor: BRAND_BLUE,
                color: BRAND_BLUE,
                fontWeight: 700,
                px: 3,
                '&:hover': { borderColor: '#1565c0', bgcolor: 'rgba(25,114,210,0.04)' },
              }}
            >
              {isFrench ? 'Comparer les forfaits' : 'Compare travel passes'}
              <ArrowRight size={18} aria-hidden="true" />
            </Button>
          </Box>

          <Box
            sx={{
              flex: 1,
              minWidth: 0,
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
                lg: 'repeat(5, 1fr)',
              },
              gap: 2,
            }}
          >
            {forfaits.map((f) => (
              <Box
                key={f.title}
                component={Link}
                to={ctaTo}
                sx={{
                  bgcolor: '#f8fafc',
                  borderRadius: 4,
                  p: 2.5,
                  textDecoration: 'none',
                  color: 'inherit',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  minHeight: 220,
                  cursor: 'pointer',
                  transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.2s',
                  '&:hover': {
                    borderColor: `${f.color}55`,
                    boxShadow: `0 12px 28px ${f.color}1f`,
                    transform: 'translateY(-4px)',
                  },
                  '&:focus-visible': {
                    outline: `3px solid ${f.color}55`,
                    outlineOffset: 3,
                  },
                }}
              >
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 3,
                    bgcolor: f.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2,
                  }}
                >
                  <ForfaitIcon type={f.icon} color={f.color} />
                </Box>
                <Typography sx={{ fontWeight: 800, fontSize: 16, color: DARK_TEXT, mb: 0.75 }}>{f.title}</Typography>
                <Typography sx={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>{isFrench ? f.fr : f.en}</Typography>
              </Box>
            ))}
          </Box>
        </Stack>
      </Box>

      <Box
        id="tarifs-et-aides"
        sx={{ px: { xs: 2, md: 5 }, py: { xs: 7, md: 10 }, bgcolor: '#f8fbff', scrollMarginTop: 24 }}
      >
        <Box sx={{ maxWidth: 1180, mx: 'auto' }}>
          <Stack spacing={1.5} sx={{ alignItems: 'center', textAlign: 'center', mb: { xs: 5, md: 7 } }}>
            <Typography sx={{ color: BRAND_BLUE, fontWeight: 800, fontSize: 12, letterSpacing: 1.2 }}>
              {isFrench ? 'TARIFS & AIDES' : 'PRICES & SUPPORT'}
            </Typography>
            <Typography component="h2" sx={{ fontWeight: 900, fontSize: { xs: 28, md: 38 }, color: DARK_TEXT }}>
              {isFrench ? 'Les aides qui peuvent changer ton tarif' : 'Support that may reduce your fare'}
            </Typography>
            <Typography sx={{ color: '#64748b', maxWidth: 700, lineHeight: 1.7 }}>
              {isFrench
                ? 'Le parcours identifie les dispositifs possibles, puis te demande les justificatifs nécessaires pour confirmer tes droits.'
                : 'The journey identifies possible support schemes, then asks for the documents needed to confirm your eligibility.'}
            </Typography>
          </Stack>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
              gap: 2.5,
            }}
          >
            {aidCards.map((aid) => {
              const AidIcon = aid.icon
              return (
              <Box
                key={aid.frTitle}
                sx={{
                  bgcolor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 4,
                  p: 3,
                  boxShadow: '0 10px 30px rgba(15,23,42,0.05)',
                  textAlign: 'center',
                }}
              >
                <Box
                  sx={{
                    width: 52,
                    height: 52,
                    borderRadius: 3,
                    bgcolor: aid.bg,
                    color: aid.color,
                    display: 'grid',
                    placeItems: 'center',
                    mb: 2.5,
                    mx: 'auto',
                  }}
                >
                  <AidIcon size={25} strokeWidth={2} />
                </Box>
                <Typography sx={{ fontWeight: 850, fontSize: 18, color: DARK_TEXT, mb: 1 }}>
                  {isFrench ? aid.frTitle : aid.enTitle}
                </Typography>
                <Typography sx={{ color: '#64748b', fontSize: 14, lineHeight: 1.65, mb: 2 }}>
                  {isFrench ? aid.fr : aid.en}
                </Typography>
                <Typography sx={{ color: aid.color, fontWeight: 700, fontSize: 13, lineHeight: 1.5 }}>
                  {isFrench ? aid.frNote : aid.enNote}
                </Typography>
              </Box>
              )
            })}
          </Box>
        </Box>
      </Box>

      <Box sx={{ px: { xs: 2, md: 5 }, py: { xs: 6, md: 8 }, textAlign: 'center' }}>
        <Box sx={{ maxWidth: 1280, mx: 'auto' }}>
          <Typography sx={{ color: BRAND_BLUE, fontWeight: 800, fontSize: 12, letterSpacing: 1.2, mb: 1.5 }}>
            {isFrench ? 'PENSÉ POUR TOUS' : 'DESIGNED FOR EVERYONE'}
          </Typography>
          <Typography component="h2" sx={{ fontWeight: 900, fontSize: { xs: 28, md: 36 }, color: DARK_TEXT, mb: 5 }}>
            {isFrench ? 'Une expérience accessible à tous les Franciliens.' : 'An accessible experience for everyone.'}
          </Typography>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={0}
            sx={{ justifyContent: 'center', alignItems: { xs: 'center', sm: 'flex-start' } }}
          >
            {accessibility.map((item, index) => (
              <Stack
                key={item.frTitle}
                spacing={1.5}
                sx={{
                  flex: 1,
                  alignItems: 'center',
                  px: { xs: 2, sm: 3 },
                  py: 2,
                  borderLeft: { xs: 'none', sm: index > 0 ? '1px solid #e2e8f0' : 'none' },
                  maxWidth: { xs: 280, sm: 'none' },
                }}
              >
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    border: '2px solid #dbeafe',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <AccessIcon type={item.icon} />
                </Box>
                <Typography sx={{ fontWeight: 800, fontSize: 16, color: DARK_TEXT }}>{isFrench ? item.frTitle : item.enTitle}</Typography>
                <Typography sx={{ fontSize: 13, color: '#64748b' }}>{isFrench ? item.fr : item.en}</Typography>
              </Stack>
            ))}
          </Stack>
        </Box>
      </Box>

      <Box
        id="aide"
        sx={{
          px: { xs: 2, md: 5 },
          py: { xs: 7, md: 9 },
          bgcolor: '#0d1b2a',
          color: '#fff',
          scrollMarginTop: 24,
        }}
      >
        <Box
          sx={{
            maxWidth: 1180,
            mx: 'auto',
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '0.9fr 1.1fr' },
            gap: { xs: 5, md: 8 },
            alignItems: 'center',
          }}
        >
          <Box>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: 3,
                bgcolor: 'rgba(96,165,250,0.15)',
                color: '#93c5fd',
                display: 'grid',
                placeItems: 'center',
                mb: 3,
              }}
            >
              <CircleHelp size={27} />
            </Box>
            <Typography sx={{ color: '#93c5fd', fontWeight: 800, fontSize: 12, letterSpacing: 1.2, mb: 1.5 }}>
              {isFrench ? 'AIDE & SAV' : 'HELP & SUPPORT'}
            </Typography>
            <Typography component="h2" sx={{ fontWeight: 900, fontSize: { xs: 28, md: 38 }, lineHeight: 1.15, mb: 2 }}>
              {isFrench ? 'Un support intégré à ton parcours' : 'Support built into your journey'}
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.68)', lineHeight: 1.75, maxWidth: 520 }}>
              {isFrench
                ? 'Consulte le suivi de ta demande, retrouve tes documents et obtiens une réponse sans repartir de zéro.'
                : 'Track your request, find your documents and get help without starting over.'}
            </Typography>
          </Box>

          <Box
            sx={{
              bgcolor: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 4,
              p: { xs: 2.5, sm: 3.5 },
            }}
          >
            <Stack spacing={1.5}>
              {supportCases.map((supportCase) => (
                <Stack
                  key={supportCase}
                  direction="row"
                  spacing={1.5}
                  sx={{
                    alignItems: 'center',
                    bgcolor: 'rgba(255,255,255,0.06)',
                    borderRadius: 2.5,
                    p: 1.5,
                  }}
                >
                  <ShieldCheck size={20} color="#93c5fd" />
                  <Typography sx={{ fontWeight: 650, fontSize: 14 }}>{supportCase}</Typography>
                </Stack>
              ))}
            </Stack>
            <Button
              component={Link}
              to={user ? '/support' : '/auth/register'}
              variant="contained"
              startIcon={<WalletCards size={18} />}
              sx={{
                mt: 3,
                display: 'flex',
                mx: 'auto',
                borderRadius: 999,
                bgcolor: '#fff',
                color: BRAND_BLUE,
                fontWeight: 800,
                px: 3,
                '&:hover': { bgcolor: '#dbeafe' },
              }}
            >
              {isFrench ? 'Accéder au support' : 'Open support'}
            </Button>
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          position: 'relative',
          minHeight: { xs: 320, md: 380 },
          backgroundImage: `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.45)), url(${ctaNight})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          px: 2,
          py: 6,
        }}
      >
        <Stack spacing={2} sx={{ alignItems: 'center', maxWidth: 640 }}>
          <Typography component="h2" sx={{ fontWeight: 900, fontSize: { xs: 28, md: 36 }, color: '#fff' }}>
            {isFrench ? 'Prêt à trouver le bon forfait ?' : 'Ready to find the right travel pass?'}
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.9)', fontSize: { xs: 15, md: 17 } }}>
            {isFrench
              ? 'En moins de 2 minutes, découvrez l’abonnement adapté à votre situation.'
              : 'In under 2 minutes, discover the pass that best fits your situation.'}
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 1 }}>
            <Button
              component={Link}
              to={ctaTo}
              variant="contained"
              size="large"
              sx={{
                borderRadius: 999,
                px: 4,
                py: 1.5,
                fontWeight: 700,
                bgcolor: BRAND_BLUE,
                boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                '&:hover': { bgcolor: '#1565c0' },
              }}
            >
              {isFrench ? 'Commencer maintenant' : 'Get started'}
              <ArrowRight size={19} aria-hidden="true" />
            </Button>
            <Button
              component={Link}
              to="/mobile-app"
              variant="outlined"
              size="large"
              startIcon={<Smartphone size={19} />}
              sx={{
                borderRadius: 999,
                px: 3.5,
                py: 1.5,
                color: '#fff',
                borderColor: 'rgba(255,255,255,0.72)',
                fontWeight: 700,
                backdropFilter: 'blur(8px)',
                bgcolor: 'rgba(255,255,255,0.08)',
                '&:hover': {
                  borderColor: '#fff',
                  bgcolor: 'rgba(255,255,255,0.16)',
                },
              }}
            >
              {isFrench ? 'Découvrir l’app mobile' : 'Discover the mobile app'}
            </Button>
          </Stack>
        </Stack>
      </Box>

      <Footer />
    </Box>
  )
}

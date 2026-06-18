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
import { useAuth } from '../hooks/useAuth'
import heroDay from '../assets/jour.png'
import ctaNight from '../assets/nuit.png'

const BRAND_BLUE = '#1972d2'

const DARK_TEXT = '#1a2b3c'

const forfaits = [
  { title: 'Imagine R', desc: 'Pour les étudiants et apprentis', color: '#7c3aed', bg: '#ede9fe', icon: 'graduation' },
  { title: 'Navigo', desc: 'Pour tous vos déplacements', color: '#2563eb', bg: '#dbeafe', icon: 'card' },
  { title: 'TST', desc: 'Tarification Solidarité Transport', color: '#ea580c', bg: '#ffedd5', icon: 'people' },
  { title: 'Améthyste', desc: 'Pour les seniors et certains publics', color: '#db2777', bg: '#fce7f3', icon: 'heart' },
  { title: 'Navigo Liberté+', desc: 'Paiement à l’usage sans engagement', color: '#0d9488', bg: '#ccfbf1', icon: 'ticket' },
]

const accessibility = [
  { title: 'Français', desc: 'Interface en français', icon: 'chat' },
  { title: 'English', desc: 'Version anglaise disponible', icon: 'globe' },
  { title: 'Senior', desc: 'Taille de texte adaptée', icon: 'person' },
  { title: 'Handicap', desc: 'Conforme aux normes d’accessibilité', icon: 'wheelchair' },
  { title: 'Mobile First', desc: 'Optimisé mobile et tablette', icon: 'phone' },
]

const journeySteps = [
  {
    number: '01',
    title: 'Décris ton besoin',
    desc: 'Profil, fréquence des trajets, porteur, payeur et situation particulière.',
    icon: SearchCheck,
  },
  {
    number: '02',
    title: 'Reçois une recommandation',
    desc: 'Le questionnaire compare les offres et explique pourquoi un forfait te correspond.',
    icon: BadgeCheck,
  },
  {
    number: '03',
    title: 'Ajoute tes justificatifs',
    desc: 'La plateforme demande uniquement les documents utiles et suit leur validation.',
    icon: FileCheck2,
  },
  {
    number: '04',
    title: 'Finalise et suis ton dossier',
    desc: 'Paiement, réception du titre, état de la demande et support restent au même endroit.',
    icon: CreditCard,
  },
]

const aidCards = [
  {
    title: 'Imagine R et bourse',
    desc: 'Des réductions peuvent s’appliquer aux élèves et étudiants boursiers selon leur situation et leur département.',
    note: 'Attestation de scolarité ou de bourse à prévoir.',
    icon: GraduationCap,
    color: '#7c3aed',
    bg: '#f3e8ff',
  },
  {
    title: 'Tarification Solidarité',
    desc: 'Selon les droits sociaux, la TST peut ouvrir accès à une réduction de 50 %, Solidarité 75 % ou à la gratuité.',
    note: 'Les droits et justificatifs sont vérifiés régulièrement.',
    icon: HeartHandshake,
    color: '#ea580c',
    bg: '#ffedd5',
  },
  {
    title: 'Senior et Améthyste',
    desc: 'Les personnes de 65 ans et plus ou en situation de handicap peuvent bénéficier d’offres adaptées.',
    note: 'Les conditions varient selon le département.',
    icon: MapPin,
    color: '#db2777',
    bg: '#fce7f3',
  },
]

const supportCases = [
  'J’ai perdu ma carte',
  'Mon paiement a été refusé',
  'Je veux résilier',
  'Je souhaite modifier mon adresse',
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
  const { user } = useAuth()
  const ctaTo = user ? '/onboarding' : '/auth/register'

  return (
    <Box sx={{ bgcolor: '#fff', overflowX: 'hidden' }}>
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
            10k+ abonnés en Île-de-France
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
            Ton forfait Navigo,
            <br />
            sans te prendre la tête.
          </Typography>

          <Typography sx={{ color: '#475569', fontSize: { xs: 15, md: 17 }, maxWidth: 620 }}>
            Navigo, Imagine R, TST ou Améthyste : trouve le forfait qui te correspond en 2 minutes.
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
              placeholder="Ton profil…"
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
              Trouver mon forfait
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
              COMMENT ÇA MARCHE
            </Typography>
            <Typography component="h2" sx={{ fontWeight: 900, fontSize: { xs: 28, md: 38 }, color: DARK_TEXT }}>
              Un seul parcours, du choix au suivi
            </Typography>
            <Typography sx={{ color: '#64748b', maxWidth: 660, lineHeight: 1.7 }}>
              Plus besoin de chercher où souscrire, quels documents fournir ou comment suivre ta demande.
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
                    {step.title}
                  </Typography>
                  <Typography sx={{ color: '#64748b', fontSize: 14, lineHeight: 1.65 }}>
                    {step.desc}
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
              NOS FORFAITS
            </Typography>
            <Typography component="h2" sx={{ fontWeight: 900, fontSize: { xs: 28, md: 34 }, lineHeight: 1.15, color: DARK_TEXT, mb: 3 }}>
              Des solutions adaptées à chaque situation
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
              Comparer les forfaits
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
                <Typography sx={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>{f.desc}</Typography>
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
              TARIFS & AIDES
            </Typography>
            <Typography component="h2" sx={{ fontWeight: 900, fontSize: { xs: 28, md: 38 }, color: DARK_TEXT }}>
              Les aides qui peuvent changer ton tarif
            </Typography>
            <Typography sx={{ color: '#64748b', maxWidth: 700, lineHeight: 1.7 }}>
              Le parcours identifie les dispositifs possibles, puis te demande les justificatifs nécessaires pour confirmer tes droits.
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
                key={aid.title}
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
                  {aid.title}
                </Typography>
                <Typography sx={{ color: '#64748b', fontSize: 14, lineHeight: 1.65, mb: 2 }}>
                  {aid.desc}
                </Typography>
                <Typography sx={{ color: aid.color, fontWeight: 700, fontSize: 13, lineHeight: 1.5 }}>
                  {aid.note}
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
            PENSÉ POUR TOUS
          </Typography>
          <Typography component="h2" sx={{ fontWeight: 900, fontSize: { xs: 28, md: 36 }, color: DARK_TEXT, mb: 5 }}>
            Une expérience accessible à tous les Franciliens.
          </Typography>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={0}
            sx={{ justifyContent: 'center', alignItems: { xs: 'center', sm: 'flex-start' } }}
          >
            {accessibility.map((item, index) => (
              <Stack
                key={item.title}
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
                <Typography sx={{ fontWeight: 800, fontSize: 16, color: DARK_TEXT }}>{item.title}</Typography>
                <Typography sx={{ fontSize: 13, color: '#64748b' }}>{item.desc}</Typography>
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
              AIDE & SAV
            </Typography>
            <Typography component="h2" sx={{ fontWeight: 900, fontSize: { xs: 28, md: 38 }, lineHeight: 1.15, mb: 2 }}>
              Un support intégré à ton parcours
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.68)', lineHeight: 1.75, maxWidth: 520 }}>
              Consulte le suivi de ta demande, retrouve tes documents et obtiens une réponse sans repartir de zéro.
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
              Accéder au support
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
            Prêt à trouver le bon forfait ?
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.9)', fontSize: { xs: 15, md: 17 } }}>
            En moins de 2 minutes, découvrez l’abonnement adapté à votre situation.
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
              Commencer maintenant
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
              Découvrir l’app mobile
            </Button>
          </Stack>
        </Stack>
      </Box>

      <Footer />
    </Box>
  )
}

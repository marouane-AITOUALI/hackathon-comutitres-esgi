import {
  Box,
  Button,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
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
            Navigo, Imagine R, TST, Améthyste — on t’oriente vers le bon forfait en 2 minutes.
          </Typography>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            sx={{
              mt: 1,
              width: '100%',
              maxWidth: 560,
              p: 0.5,
              bgcolor: '#fff',
              borderRadius: 999,
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              border: '1px solid #e2e8f0',
              alignItems: 'center',
            }}
          >
            <TextField
              placeholder="Ton profil…"
              variant="standard"
              fullWidth
              slotProps={{ input: { disableUnderline: true } }}
              sx={{
                px: 2,
                flex: 1,
                '& .MuiInputBase-root': { height: 48 },
                '& input': { fontSize: 15, py: 0 },
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
              Trouver mon forfait →
            </Button>
          </Stack>
        </Stack>
      </Box>

      <Box sx={{ px: { xs: 2, md: 5 }, py: { xs: 6, md: 8 } }}>
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
              Comparer les forfaits →
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
                  minHeight: 220,
                  transition: 'box-shadow 0.2s, transform 0.2s',
                  '&:hover': { boxShadow: '0 8px 24px rgba(0,0,0,0.08)', transform: 'translateY(-2px)' },
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
                <Typography sx={{ fontSize: 13, color: '#64748b', lineHeight: 1.4, flexGrow: 1 }}>{f.desc}</Typography>
                <Typography sx={{ color: BRAND_BLUE, fontWeight: 800, fontSize: 18, mt: 2 }}>→</Typography>
              </Box>
            ))}
          </Box>
        </Stack>
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
          <Button
            component={Link}
            to={ctaTo}
            variant="contained"
            size="large"
            sx={{
              mt: 1,
              borderRadius: 999,
              px: 4,
              py: 1.5,
              fontWeight: 700,
              bgcolor: BRAND_BLUE,
              boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
              '&:hover': { bgcolor: '#1565c0' },
            }}
          >
            Commencer maintenant →
          </Button>
        </Stack>
      </Box>

      <Footer />
    </Box>
  )
}

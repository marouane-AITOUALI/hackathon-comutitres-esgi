import { Alert, Box, Button, Checkbox, Divider, FormControlLabel, InputAdornment, Paper, Stack, TextField, Typography } from '@mui/material'
import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { colors } from '../theme/colors'

const benefits = [
  { title: 'Validez les dossiers', text: 'Porteur, payeur, justificatifs et statut dans une vue claire.' },
  { title: 'Anticipez le support', text: 'Alertes priorisees pour agir avant que le client appelle.' },
  { title: 'Pilotez la demo', text: 'Paiements et analyse documentaire simules pour le hackathon.' },
]

function NetworkMapPanel() {
  return (
    <Box
      sx={{
        bgcolor: colors.blueLight,
        display: { xs: 'none', md: 'block' },
        minHeight: 760,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <Box
        sx={{
          background: `radial-gradient(circle at 70% 12%, ${colors.blueMedium} 0, transparent 30%), radial-gradient(circle at 30% 86%, ${colors.greyLight40} 0, transparent 34%)`,
          inset: 0,
          opacity: 0.9,
          position: 'absolute',
        }}
      />

      <Box component="svg" viewBox="0 0 560 800" sx={{ height: '100%', inset: 0, position: 'absolute', width: '100%' }}>
        <path d="M-20 190 C100 300 172 330 260 310 C356 286 394 190 560 155" fill="none" stroke={colors.blueInteraction} strokeLinecap="round" strokeWidth="5" />
        <path d="M40 -20 C130 95 125 175 160 255 C210 370 326 370 360 470 C392 562 332 650 398 820" fill="none" stroke={colors.purpleLight} strokeLinecap="round" strokeWidth="5" />
        <path d="M-30 545 C72 498 152 468 258 520 C362 572 418 660 580 650" fill="none" stroke={colors.pinkLight} strokeLinecap="round" strokeWidth="5" />
        <path d="M-20 420 L145 420 C235 420 268 456 328 488 C412 532 484 520 580 455" fill="none" stroke={colors.greenLight} strokeLinecap="round" strokeWidth="5" />
        <path d="M505 -20 C430 90 360 168 345 270 C330 372 380 438 355 545 C335 630 258 720 220 820" fill="none" stroke={colors.orangeLight} strokeLinecap="round" strokeWidth="4" />

        {[
          [150, 255, 'Gare du Nord'],
          [260, 310, 'Republique'],
          [360, 470, 'Bastille'],
          [258, 520, 'Gare de Lyon'],
          [398, 650, 'Bibliotheque'],
          [115, 420, 'Chatelet'],
          [430, 190, 'Stade de France'],
        ].map(([cx, cy, label]) => (
          <g key={label}>
            <circle cx={cx} cy={cy} fill={colors.white} r="9" stroke={colors.blueFocus} strokeWidth="4" />
            <text fill={colors.blueFocus} fontFamily="Inter, system-ui, sans-serif" fontSize="15" fontWeight="700" x={Number(cx) + 14} y={Number(cy) + 5}>
              {label}
            </text>
          </g>
        ))}
      </Box>

      <Stack spacing={2} sx={{ bottom: 44, left: 46, position: 'absolute', right: 46 }}>
        <Paper sx={{ borderRadius: 5, boxShadow: '0 22px 60px rgba(0, 80, 170, 0.14)', p: 3 }}>
          <Stack spacing={2.5}>
            {benefits.map((item) => (
              <Stack key={item.title} direction="row" spacing={2} sx={{ alignItems: 'flex-start' }}>
                <Box
                  sx={{
                    bgcolor: colors.blueLight,
                    borderRadius: 3,
                    color: colors.blueInteraction,
                    display: 'grid',
                    flexShrink: 0,
                    fontWeight: 900,
                    height: 48,
                    placeItems: 'center',
                    width: 48,
                  }}
                >
                  {item.title.slice(0, 1)}
                </Box>
                <Box>
                  <Typography sx={{ color: colors.blueFocus, fontWeight: 900 }}>{item.title}</Typography>
                  <Typography color="text.secondary" variant="body2">{item.text}</Typography>
                </Box>
              </Stack>
            ))}
          </Stack>
        </Paper>
      </Stack>
    </Box>
  )
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { error: authError, loading, login, user } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [remember, setRemember] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [idfmMessage, setIdfmMessage] = useState('')

  if (user) return <Navigate replace to="/dashboard" />

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    try {
      await login(form.email, form.password)
      const target = typeof location.state === 'object' && location.state && 'from' in location.state ? String(location.state.from) : '/dashboard'
      navigate(target)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Connexion impossible.')
    }
  }

  return (
    <Box
      sx={{
        bgcolor: colors.greyLight40,
        display: 'grid',
        minHeight: '100vh',
        p: { xs: 1.5, md: 2.5 },
        placeItems: 'center',
      }}
    >
      <Paper
        sx={{
          border: `1px solid ${colors.greyLight}`,
          borderRadius: 5,
          boxShadow: '0 24px 80px rgba(37, 48, 56, 0.10)',
          maxWidth: 1240,
          overflow: 'hidden',
          width: '100%',
        }}
      >
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '0.98fr 1.02fr' }, minHeight: { md: 760 } }}>
          <Stack component="form" onSubmit={submit} spacing={3} sx={{ justifyContent: 'center', p: { xs: 3, sm: 6, lg: 7 } }}>
            <Box>
              <Typography sx={{ color: colors.blueFocus, fontWeight: 900, letterSpacing: -0.8, mb: 1 }} variant="h3">
                Bienvenue !
              </Typography>
              <Typography sx={{ color: colors.greyDark, fontSize: 18, lineHeight: 1.7, maxWidth: 440 }}>
                Connectez-vous pour piloter les souscriptions, les justificatifs et les alertes support Comutitres.
              </Typography>
            </Box>

            {(error || authError) && <Alert severity="error">{error || authError}</Alert>}
            {idfmMessage && <Alert severity="info" onClose={() => setIdfmMessage('')}>{idfmMessage}</Alert>}

            <Stack spacing={2.5}>
              <TextField
                autoComplete="email"
                label="Adresse e-mail"
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                placeholder="admin@comutitres.fr"
                required
                type="email"
                value={form.email}
                slotProps={{ input: { startAdornment: <InputAdornment position="start">@</InputAdornment> } }}
              />
              <TextField
                autoComplete="current-password"
                label="Mot de passe"
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                required
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                slotProps={{
                  input: {
                    startAdornment: <InputAdornment position="start">PW</InputAdornment>,
                    endAdornment: (
                      <InputAdornment position="end">
                        <Button onClick={() => setShowPassword((current) => !current)} size="small" variant="text">
                          {showPassword ? 'Masquer' : 'Voir'}
                        </Button>
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}>
              <FormControlLabel
                control={<Checkbox checked={remember} onChange={(event) => setRemember(event.target.checked)} />}
                label="Se souvenir de moi"
              />
              <Typography color="primary" sx={{ fontWeight: 800 }} variant="body2">
                Mot de passe oublie ? Contact support
              </Typography>
            </Stack>

            <Button disabled={loading} size="large" type="submit" variant="contained">
              {loading ? 'Connexion...' : 'Se connecter'}
            </Button>

            <Divider>Ou continuer avec</Divider>

            <Button
              onClick={() => setIdfmMessage("L'integration Ile-de-France Mobilites Connect sera disponible dans une prochaine version du prototype.")}
              size="large"
              sx={{ borderColor: colors.blueInteraction, justifyContent: 'space-between', px: 2.25, py: 1.35 }}
              variant="outlined"
            >
              <Box sx={{ textAlign: 'left' }}>
                <Typography sx={{ fontWeight: 700, lineHeight: 1.1 }} variant="caption">Se connecter avec</Typography>
                <Typography sx={{ fontWeight: 900 }}>Ile-de-France Mobilites Connect</Typography>
              </Box>
              <span aria-hidden>{'>'}</span>
            </Button>

            <Alert severity="info" sx={{ alignItems: 'flex-start' }}>
              Prototype hackathon : la session backoffice utilise un cookie securise httpOnly. En production, l'authentification serait couplee a Ile-de-France Mobilites Connect et a une politique SSO interne.
            </Alert>
          </Stack>

          <NetworkMapPanel />
        </Box>
      </Paper>
    </Box>
  )
}

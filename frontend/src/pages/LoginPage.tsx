import {
  Alert,
  Box,
  Button,
  Checkbox,
  Divider,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined'
import CreditCardOutlinedIcon from '@mui/icons-material/CreditCardOutlined'
import RouteOutlinedIcon from '@mui/icons-material/RouteOutlined'
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined'
import PhoneIphoneOutlinedIcon from '@mui/icons-material/PhoneIphoneOutlined'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { IdfmConnectButton } from '../components/IdfmConnectButton'
import { useAuth } from '../hooks/useAuth'
import { login } from '../services/auth.service'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { loading: authLoading, setSession, user } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)

  const redirectTo = typeof location.state === 'object' && location.state && 'from' in location.state && typeof location.state.from === 'string'
    ? location.state.from
    : '/dashboard'

  useEffect(() => {
    if (!authLoading && user) navigate(redirectTo, { replace: true })
  }, [authLoading, navigate, redirectTo, user])

  async function submit(event: FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const response = await login(form)
      setSession(response.token, response.user)
      navigate(redirectTo, { replace: true })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Connexion impossible.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '2fr 3fr' },
        minHeight: { md: 'calc(100vh - 64px)' },
        mx: { xs: -2, sm: -3 },
        my: { xs: -3, sm: -5 },
      }}
    >
      {/* Left: form panel */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.paper',
          px: { xs: 3, sm: 5, md: 6 },
          py: { xs: 4, md: 6 },
        }}
      >
        <Stack
          component="form"
          onSubmit={submit}
          spacing={2.5}
          sx={{ width: '100%', maxWidth: 400 }}
        >
          <Box>
            <Typography
              component="h1"
              variant="h4"
              sx={{ fontWeight: 800, color: 'text.primary', mb: 1.5 }}
            >
              Bienvenue ! 👋
            </Typography>
            <Typography color="text.secondary" sx={{ lineHeight: 1.6 }}>
              Connectez-vous pour gérer vos titres de transport, vos trajets et plus encore.
            </Typography>
          </Box>

          {error && <Alert severity="error">{error}</Alert>}

          <Box>
            <Typography
              component="label"
              htmlFor="email"
              sx={{ display: 'block', mb: 0.75, fontWeight: 500, fontSize: 14 }}
            >
              Adresse e-mail
            </Typography>
            <TextField
              id="email"
              autoComplete="email"
              placeholder="exemple@mail.com"
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              type="email"
              value={form.email}
              fullWidth
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailOutlinedIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Box>

          <Box>
            <Typography
              component="label"
              htmlFor="password"
              sx={{ display: 'block', mb: 0.75, fontWeight: 500, fontSize: 14 }}
            >
              Mot de passe
            </Typography>
            <TextField
              id="password"
              autoComplete="current-password"
              placeholder="••••••••"
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              fullWidth
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword((v) => !v)}
                        edge="end"
                        aria-label="afficher le mot de passe"
                        size="small"
                      >
                        {showPassword ? (
                          <VisibilityOutlinedIcon sx={{ fontSize: 20 }} />
                        ) : (
                          <VisibilityOffOutlinedIcon sx={{ fontSize: 20 }} />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Box>

          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  size="small"
                />
              }
              label={<Typography variant="body2">Se souvenir de moi</Typography>}
            />
            <Link to="/auth/forgot-password" style={{ textDecoration: 'none' }}>
              <Typography variant="body2" color="primary" sx={{ fontWeight: 500 }}>
                Mot de passe oublié ?
              </Typography>
            </Link>
          </Stack>

          <Button
            disabled={loading}
            type="submit"
            variant="contained"
            size="large"
            sx={{ py: 1.5, fontWeight: 700, fontSize: 16, borderRadius: 50 }}
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </Button>

          <Divider sx={{ '&::before, &::after': { borderColor: 'divider' } }}>
            <Typography variant="body2" color="text.secondary">
              Ou continuer avec
            </Typography>
          </Divider>

          <IdfmConnectButton />

          <Stack direction="row" spacing={1.5}>
            <Button
              variant="outlined"
              fullWidth
              sx={{
                py: 1.25,
                textTransform: 'none',
                color: 'text.primary',
                borderColor: 'divider',
                fontWeight: 600,
                gap: 1,
              }}
            >
              <Box
                component="img"
                src="https://www.google.com/favicon.ico"
                alt=""
                sx={{ width: 18, height: 18 }}
              />
              Google
            </Button>
            <Button
              variant="outlined"
              fullWidth
              sx={{
                py: 1.25,
                textTransform: 'none',
                color: 'text.primary',
                borderColor: 'divider',
                fontWeight: 600,
                gap: 1,
              }}
            >
              <Box component="span" sx={{ fontSize: 18, lineHeight: 1 }}>

              </Box>
              Apple
            </Button>
          </Stack>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              p: 2,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <PhoneIphoneOutlinedIcon sx={{ color: 'text.secondary', flexShrink: 0 }} />
            <Box>
              <Typography variant="body2" color="text.secondary">
                Vous n'avez pas encore de compte ?
              </Typography>
              <Link to="/auth/register" style={{ textDecoration: 'none' }}>
                <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>
                  Créer un compte
                </Typography>
              </Link>
            </Box>
          </Box>
        </Stack>
      </Box>

      {/* Right: metro map panel */}
      <Box
        sx={{
          position: 'relative',
          display: { xs: 'none', md: 'block' },
          backgroundImage: 'url(/images/paris-metro-map.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: '#EEF4FF',
          minHeight: 600,
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            bottom: 24,
            left: 24,
            right: 24,
            bgcolor: 'background.paper',
            borderRadius: 3,
            p: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
          }}
        >
          <Stack spacing={2.5}>
            <FeatureItem
              icon={<CreditCardOutlinedIcon color="primary" />}
              title="Gérez vos titres"
              description="Achetez et rechargez vos titres en toute simplicité."
            />
            <FeatureItem
              icon={<RouteOutlinedIcon color="primary" />}
              title="Suivez vos trajets"
              description="Itinéraires, horaires et info trafic en temps réel."
            />
            <FeatureItem
              icon={<NotificationsNoneOutlinedIcon color="primary" />}
              title="Restez informé"
              description="Alertes, perturbations et actualités du réseau."
            />
          </Stack>
        </Box>
      </Box>
    </Box>
  )
}

function FeatureItem({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 40,
          height: 40,
          borderRadius: 2,
          bgcolor: '#DDEEFF',
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.25 }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </Box>
    </Stack>
  )
}

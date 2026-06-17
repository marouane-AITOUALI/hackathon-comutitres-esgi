import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined'
import { useState } from 'react'

interface FormData {
  firstName: string
  lastName: string
  email: string
  password: string
  confirmation: string
  rgpdConsent: boolean
}

interface Props {
  onRegister: (data: Omit<FormData, 'confirmation'>) => Promise<void>
}

function validatePassword(p: string): string | null {
  if (p.length < 10) return 'Au moins 10 caractères requis.'
  if (!/[A-Z]/.test(p)) return 'Au moins une lettre majuscule requise.'
  if (!/[a-z]/.test(p)) return 'Au moins une lettre minuscule requise.'
  if (!/\d/.test(p)) return 'Au moins un chiffre requis.'
  return null
}

export function SimpleRegisterForm({ onRegister }: Props) {
  const [form, setForm] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmation: '',
    rgpdConsent: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function set(field: keyof FormData, value: string | boolean) {
    setForm(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()

    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError('Veuillez renseigner votre prénom et votre nom.')
      return
    }
    if (!form.email.includes('@')) {
      setError('Adresse e-mail invalide.')
      return
    }
    const pwErr = validatePassword(form.password)
    if (pwErr) { setError(pwErr); return }
    if (form.password !== form.confirmation) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }
    if (!form.rgpdConsent) {
      setError('Vous devez accepter la politique de confidentialité pour créer un compte.')
      return
    }

    setLoading(true)
    setError('')
    try {
      await onRegister({ firstName: form.firstName, lastName: form.lastName, email: form.email, password: form.password, rgpdConsent: form.rgpdConsent })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue. Veuillez réessayer.')
      setLoading(false)
    }
  }

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ width: '100%', maxWidth: 480, bgcolor: 'background.paper', borderRadius: 3, boxShadow: '0 4px 24px rgba(0,0,0,0.09)', p: { xs: 3, md: 4 } }}
    >
      <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>
        Créer un compte
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
        Tous les champs sont obligatoires.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2, fontSize: 13, py: 0.5 }}>
          {error}
        </Alert>
      )}

      <Stack spacing={2}>
        {/* Prénom / Nom */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <Box sx={{ flex: 1 }}>
            <Label htmlFor="firstName">Prénom</Label>
            <TextField
              id="firstName"
              value={form.firstName}
              onChange={e => set('firstName', e.target.value)}
              placeholder="Jean"
              size="small"
              fullWidth
              autoComplete="given-name"
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><PersonOutlinedIcon sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment> } }}
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Label htmlFor="lastName">Nom</Label>
            <TextField
              id="lastName"
              value={form.lastName}
              onChange={e => set('lastName', e.target.value)}
              placeholder="Dupont"
              size="small"
              fullWidth
              autoComplete="family-name"
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><PersonOutlinedIcon sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment> } }}
            />
          </Box>
        </Stack>

        {/* Email */}
        <Box>
          <Label htmlFor="email">Adresse e-mail</Label>
          <TextField
            id="email"
            type="email"
            value={form.email}
            onChange={e => set('email', e.target.value)}
            placeholder="exemple@mail.com"
            size="small"
            fullWidth
            autoComplete="email"
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><EmailOutlinedIcon sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment> } }}
          />
        </Box>

        {/* Mot de passe */}
        <Box>
          <Label htmlFor="password">Mot de passe</Label>
          <TextField
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={form.password}
            onChange={e => set('password', e.target.value)}
            placeholder="••••••••"
            size="small"
            fullWidth
            autoComplete="new-password"
            slotProps={{
              input: {
                startAdornment: <InputAdornment position="start"><LockOutlinedIcon sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment>,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowPassword(v => !v)} edge="end">
                      {showPassword ? <VisibilityOutlinedIcon sx={{ fontSize: 18 }} /> : <VisibilityOffOutlinedIcon sx={{ fontSize: 18 }} />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
          <Typography sx={{ fontSize: 11, color: 'text.secondary', mt: 0.5 }}>
            10 caractères min. avec majuscule, minuscule et chiffre.
          </Typography>
        </Box>

        {/* Confirmation */}
        <Box>
          <Label htmlFor="confirmation">Confirmer le mot de passe</Label>
          <TextField
            id="confirmation"
            type={showConfirmation ? 'text' : 'password'}
            value={form.confirmation}
            onChange={e => set('confirmation', e.target.value)}
            placeholder="••••••••"
            size="small"
            fullWidth
            autoComplete="new-password"
            slotProps={{
              input: {
                startAdornment: <InputAdornment position="start"><LockOutlinedIcon sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment>,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowConfirmation(v => !v)} edge="end">
                      {showConfirmation ? <VisibilityOutlinedIcon sx={{ fontSize: 18 }} /> : <VisibilityOffOutlinedIcon sx={{ fontSize: 18 }} />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
        </Box>

        {/* RGPD */}
        <FormControlLabel
          control={
            <Checkbox
              checked={form.rgpdConsent}
              onChange={e => set('rgpdConsent', e.target.checked)}
              size="small"
            />
          }
          label={
            <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
              J'accepte le traitement de mes données personnelles pour la gestion de mon compte, conformément au RGPD.
            </Typography>
          }
        />

        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={loading}
          sx={{ py: 1.1, fontWeight: 700, fontSize: 14, borderRadius: 50, mt: 0.5 }}
        >
          {loading ? 'Création en cours...' : 'Créer mon compte'}
        </Button>
      </Stack>
    </Box>
  )
}

function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <Typography component="label" htmlFor={htmlFor} sx={{ display: 'block', mb: 0.5, fontWeight: 500, fontSize: 13 }}>
      {children}
    </Typography>
  )
}

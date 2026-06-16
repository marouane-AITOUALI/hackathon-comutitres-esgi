import { Alert, Box, Button, Paper, Stack, TextField, Typography } from '@mui/material'
import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { colors } from '../theme/colors'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { error: authError, loading, login, user } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')

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
    <Box sx={{ bgcolor: colors.blueLight, display: 'grid', minHeight: '100vh', placeItems: 'center', px: 2 }}>
      <Paper sx={{ borderRadius: 5, maxWidth: 1040, overflow: 'hidden', width: '100%' }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '0.95fr 1.05fr' } }}>
          <Box sx={{ bgcolor: colors.blueFocus, color: colors.white, p: { xs: 4, md: 6 } }}>
            <Typography sx={{ fontWeight: 900, mb: 1 }} variant="h4">Espace personnel Comutitres</Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.82)', fontSize: 17 }}>
              Connectez-vous pour piloter les souscriptions, controler les justificatifs et suivre les dossiers.
            </Typography>
            <Stack spacing={1.5} sx={{ mt: 5 }}>
              {['Vue centralisee des dossiers', 'Alertes support prioritaires', 'Validation documentaire guidee'].map((item) => (
                <Box key={item} sx={{ bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 3, p: 2 }}>{item}</Box>
              ))}
            </Stack>
          </Box>

          <Stack component="form" onSubmit={submit} spacing={2.5} sx={{ p: { xs: 4, md: 6 } }}>
            <div>
              <Typography component="h1" sx={{ fontWeight: 900 }} variant="h4">Connexion backoffice</Typography>
              <Typography color="text.secondary">Acces reserve au personnel admin Comutitres.</Typography>
            </div>
            {(error || authError) && <Alert severity="error">{error || authError}</Alert>}
            <TextField autoComplete="email" label="Email" onChange={(event) => setForm({ ...form, email: event.target.value })} required type="email" value={form.email} />
            <TextField autoComplete="current-password" label="Mot de passe" onChange={(event) => setForm({ ...form, password: event.target.value })} required type="password" value={form.password} />
            <Button disabled={loading} type="submit" variant="contained">{loading ? 'Connexion...' : 'Se connecter'}</Button>
            <Alert severity="info">Prototype : le JWT est stocke cote navigateur pour faciliter la demo.</Alert>
          </Stack>
        </Box>
      </Paper>
    </Box>
  )
}

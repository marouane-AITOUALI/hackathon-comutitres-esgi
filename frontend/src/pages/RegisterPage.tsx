import { Alert, Button, Checkbox, Divider, FormControlLabel, Stack, TextField, Typography } from '@mui/material'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { IdfmConnectButton } from '../components/IdfmConnectButton'
import { PageCard } from '../components/PageCard'
import { useAuth } from '../hooks/useAuth'
import { register } from '../services/auth.service'

export function RegisterPage() {
  const navigate = useNavigate()
  const { setSession } = useAuth()
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirmation: '', rgpdConsent: false })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (form.password !== form.confirmation) return setError('Les mots de passe ne correspondent pas.')
    setLoading(true)
    setError('')
    try {
      const response = await register({ firstName: form.firstName, lastName: form.lastName, email: form.email, password: form.password, rgpdConsent: form.rgpdConsent })
      setSession(response.token, response.user)
      navigate('/onboarding')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Inscription impossible.')
    } finally {
      setLoading(false)
    }
  }

  const update = (field: string, value: string | boolean) => setForm((current) => ({ ...current, [field]: value }))
  return (
    <PageCard>
      <Stack component="form" onSubmit={submit} spacing={2}>
        <div><Typography component="h1" variant="h4">Creer mon compte</Typography><Typography color="text.secondary">Vos informations servent a securiser et reprendre votre demande.</Typography></div>
        {error && <Alert severity="error">{error}</Alert>}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField fullWidth label="Prenom" onChange={(e) => update('firstName', e.target.value)} required value={form.firstName} />
          <TextField fullWidth label="Nom" onChange={(e) => update('lastName', e.target.value)} required value={form.lastName} />
        </Stack>
        <TextField autoComplete="email" label="Email" onChange={(e) => update('email', e.target.value)} required type="email" value={form.email} />
        <TextField helperText="10 caracteres minimum, avec minuscule, majuscule et chiffre." label="Mot de passe" onChange={(e) => update('password', e.target.value)} required type="password" value={form.password} />
        <TextField label="Confirmation du mot de passe" onChange={(e) => update('confirmation', e.target.value)} required type="password" value={form.confirmation} />
        <FormControlLabel control={<Checkbox checked={form.rgpdConsent} onChange={(e) => update('rgpdConsent', e.target.checked)} required />} label="J'accepte le traitement de mes donnees pour gerer ma demande de souscription." />
        <Button disabled={loading} type="submit" variant="contained">{loading ? 'Creation...' : 'Creer mon compte'}</Button>
        <Divider>ou</Divider>
        <IdfmConnectButton />
        <Typography sx={{ textAlign: 'center' }}>Deja inscrit ? <Link to="/auth/login">Se connecter</Link></Typography>
      </Stack>
    </PageCard>
  )
}

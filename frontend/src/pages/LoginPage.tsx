import { Alert, Button, Divider, Stack, TextField, Typography } from '@mui/material'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { IdfmConnectButton } from '../components/IdfmConnectButton'
import { PageCard } from '../components/PageCard'
import { useAuth } from '../hooks/useAuth'
import { login } from '../services/auth.service'

export function LoginPage() {
  const navigate = useNavigate()
  const { setSession } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const response = await login(form)
      setSession(response.token, response.user)
      navigate('/dashboard')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Connexion impossible.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageCard>
      <Stack component="form" onSubmit={submit} spacing={2.5}>
        <div><Typography component="h1" variant="h4">Se connecter</Typography><Typography color="text.secondary">Reprenez votre parcours de souscription.</Typography></div>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField autoComplete="email" label="Email" onChange={(event) => setForm({ ...form, email: event.target.value })} required type="email" value={form.email} />
        <TextField autoComplete="current-password" label="Mot de passe" onChange={(event) => setForm({ ...form, password: event.target.value })} required type="password" value={form.password} />
        <Button disabled={loading} type="submit" variant="contained">{loading ? 'Connexion...' : 'Se connecter'}</Button>
        <Divider>ou</Divider>
        <IdfmConnectButton />
        <Typography sx={{ textAlign: 'center' }}>Pas encore de compte ? <Link to="/auth/register">Creer un compte</Link></Typography>
      </Stack>
    </PageCard>
  )
}

import { Alert, Button, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState } from '../components/common/EmptyState'
import { LoadingState } from '../components/common/LoadingState'
import { StatusBadge } from '../components/common/StatusBadge'
import { getSupportAlerts } from '../services/admin.service'
import type { SupportAlert } from '../types/admin'

const severities = ['', 'info', 'warning', 'error']

export function SupportAlertsPage() {
  const [alerts, setAlerts] = useState<SupportAlert[]>([])
  const [severity, setSeverity] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    getSupportAlerts()
      .then((response) => { if (mounted) setAlerts(response.alerts) })
      .catch((caught) => setError(caught instanceof Error ? caught.message : 'Alertes support indisponibles.'))
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  const filtered = useMemo(() => alerts.filter((alert) => {
    const text = `${alert.title} ${alert.message} ${alert.type}`.toLowerCase()
    return (!severity || alert.severity === severity) && (!search || text.includes(search.toLowerCase()))
  }), [alerts, search, severity])

  if (loading) return <LoadingState label="Chargement des alertes support..." />

  return (
    <Stack spacing={3}>
      {error && <Alert severity="error">{error}</Alert>}

      <Paper sx={{ borderRadius: 4, p: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField fullWidth label="Rechercher une alerte" onChange={(event) => setSearch(event.target.value)} value={search} />
          <TextField label="Severite" onChange={(event) => setSeverity(event.target.value)} select sx={{ minWidth: 200 }} value={severity}>
            {severities.map((item) => <MenuItem key={item || 'all'} value={item}>{item || 'Toutes'}</MenuItem>)}
          </TextField>
        </Stack>
      </Paper>

      <Stack spacing={2}>
        {filtered.map((alert) => (
          <Paper key={alert.id} sx={{ borderRadius: 4, p: 3 }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ justifyContent: 'space-between' }}>
              <Stack spacing={1}>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                  <Typography sx={{ fontWeight: 900 }} variant="h6">{alert.title}</Typography>
                  <StatusBadge status={alert.severity ?? 'info'} label={alert.severity ?? 'info'} />
                  <StatusBadge status={alert.type} label={alert.type} />
                </Stack>
                <Typography color="text.secondary">{alert.message}</Typography>
                {alert.createdAt && <Typography color="text.secondary" variant="body2">{new Date(alert.createdAt).toLocaleString('fr-FR')}</Typography>}
              </Stack>
              {alert.subscriptionId && (
                <Button component={Link} to={`/subscriptions/${alert.subscriptionId}`} variant="outlined">
                  Ouvrir dossier
                </Button>
              )}
            </Stack>
          </Paper>
        ))}
        {filtered.length === 0 && <EmptyState title="Aucune alerte" description="Aucune alerte ne correspond aux filtres ou le backend ne remonte rien pour le moment." />}
      </Stack>
    </Stack>
  )
}

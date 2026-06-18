import { Alert, MenuItem, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField } from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { EmptyState } from '../components/common/EmptyState'
import { LoadingState } from '../components/common/LoadingState'
import { StatusBadge } from '../components/common/StatusBadge'
import { getAuditLogs } from '../services/admin.service'
import type { AuditLog } from '../types/admin'

const entityTypes = ['', 'subscription', 'document', 'payment']

export function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [entityType, setEntityType] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    getAuditLogs()
      .then((response) => { if (mounted) setLogs(response.logs) })
      .catch((caught) => setError(caught instanceof Error ? caught.message : 'Audit logs indisponibles.'))
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  const filtered = useMemo(() => logs.filter((log) => {
    const text = `${log.action} ${log.summary}`.toLowerCase()
    return (!entityType || log.entityType === entityType) && (!search || text.includes(search.toLowerCase()))
  }), [entityType, logs, search])

  if (loading) return <LoadingState label="Chargement des audit logs..." />

  return (
    <Stack spacing={3}>
      {error && <Alert severity="error">{error}</Alert>}

      <Paper sx={{ borderRadius: 4, p: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField fullWidth label="Rechercher action ou resume" onChange={(event) => setSearch(event.target.value)} value={search} />
          <TextField label="Entite" onChange={(event) => setEntityType(event.target.value)} select sx={{ minWidth: 220 }} value={entityType}>
            {entityTypes.map((item) => <MenuItem key={item || 'all'} value={item}>{item || 'Toutes les entites'}</MenuItem>)}
          </TextField>
        </Stack>
      </Paper>

      <Paper sx={{ borderRadius: 4, p: 3 }}>
        <TableContainer>
          <Table aria-label="Audit logs">
            <TableHead>
              <TableRow><TableCell>Date</TableCell><TableCell>Entite</TableCell><TableCell>Action</TableCell><TableCell>Resume</TableCell></TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{new Date(log.createdAt).toLocaleString('fr-FR')}</TableCell>
                  <TableCell><StatusBadge status={log.entityType} label={log.entityType} /></TableCell>
                  <TableCell>{log.action}</TableCell>
                  <TableCell>{log.summary}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {filtered.length === 0 && <EmptyState title="Aucun journal" description="Aucun evenement ne correspond aux filtres." />}
      </Paper>
    </Stack>
  )
}

import { Alert, Chip, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { EmptyState } from '../components/common/EmptyState'
import { LoadingState } from '../components/common/LoadingState'
import { getAdminUsers } from '../services/admin.service'
import type { AdminUserListItem } from '../types/admin'

export function UsersPage() {
  const [users, setUsers] = useState<AdminUserListItem[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    getAdminUsers()
      .then((response) => { if (mounted) setUsers(response.users) })
      .catch((caught) => setError(caught instanceof Error ? caught.message : 'Utilisateurs indisponibles.'))
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  const filtered = useMemo(() => users.filter((user) => {
    const text = `${user.firstName} ${user.lastName} ${user.email} ${user.role}`.toLowerCase()
    return !search || text.includes(search.toLowerCase())
  }), [search, users])

  if (loading) return <LoadingState label="Chargement des utilisateurs..." />

  return (
    <Stack spacing={3}>
      {error && <Alert severity="error">{error}</Alert>}

      <Paper sx={{ borderRadius: 4, p: 3 }}>
        <TextField fullWidth label="Rechercher nom, email ou role" onChange={(event) => setSearch(event.target.value)} value={search} />
      </Paper>

      <Paper sx={{ borderRadius: 4, p: 3 }}>
        <TableContainer>
          <Table aria-label="Utilisateurs">
            <TableHead>
              <TableRow><TableCell>Nom</TableCell><TableCell>Email</TableCell><TableCell>Role</TableCell><TableCell>RGPD</TableCell><TableCell>Dossiers</TableCell><TableCell>Date</TableCell></TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.firstName} {user.lastName}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell><Chip color={user.role === 'admin' ? 'primary' : 'default'} label={user.role} size="small" /></TableCell>
                  <TableCell>{user.rgpdConsent ? 'Oui' : 'Non'}</TableCell>
                  <TableCell>{user.subscriptionCount ?? 0}</TableCell>
                  <TableCell>{user.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : 'Non renseigne'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {filtered.length === 0 && <EmptyState title="Aucun utilisateur" description="Aucun utilisateur ne correspond a votre recherche." />}
      </Paper>

      <Typography color="text.secondary" variant="body2">
        Les mots de passe et secrets ne sont jamais exposes dans ce backoffice.
      </Typography>
    </Stack>
  )
}

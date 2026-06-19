import { Alert, Box, Button, Chip, MenuItem, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material'
import { Archive, RotateCcw, ShieldCheck, Users } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { EmptyState } from '../components/common/EmptyState'
import { LoadingState } from '../components/common/LoadingState'
import { getAdminUsers, updateAdminUserArchive, updateAdminUserRole } from '../services/admin.service'
import { useAuth } from '../hooks/useAuth'
import type { AdminUserListItem } from '../types/admin'
import type { UserRole } from '../types/auth'
import { roleLabels } from '../utils/backofficeLabels'

export function UsersPage() {
  const { user: currentUser, refresh } = useAuth()
  const [users, setUsers] = useState<AdminUserListItem[]>([])
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('')
  const [statusFilter, setStatusFilter] = useState<'active' | 'archived' | ''>('')
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

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
    const statusMatches = !statusFilter || (statusFilter === 'archived' ? Boolean(user.archivedAt) : !user.archivedAt)
    return (!search || text.includes(search.toLowerCase())) && (!roleFilter || user.role === roleFilter) && statusMatches
  }), [roleFilter, search, statusFilter, users])

  const adminCount = users.filter((user) => user.role === 'admin' && !user.archivedAt).length
  const archivedCount = users.filter((user) => user.archivedAt).length

  async function changeRole(id: string, role: UserRole) {
    setSavingId(id)
    setError('')
    setSuccess('')
    try {
      const response = await updateAdminUserRole(id, role)
      setUsers((current) => current.map((item) => item.id === id ? response.user : item))
      if (currentUser?.id === id) await refresh()
      setSuccess('Role utilisateur mis a jour.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Mise a jour du role impossible.')
    } finally {
      setSavingId(null)
    }
  }

  async function changeArchive(user: AdminUserListItem) {
    const archived = !user.archivedAt
    if (archived && !window.confirm(`Archiver le compte de ${user.firstName} ${user.lastName} ? Il ne pourra plus se connecter.`)) return
    setSavingId(user.id)
    setError('')
    setSuccess('')
    try {
      const response = await updateAdminUserArchive(user.id, archived)
      setUsers((current) => current.map((item) => item.id === user.id ? response.user : item))
      setSuccess(archived ? 'Compte archivé.' : 'Compte réactivé.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Mise à jour de l'archivage impossible.")
    } finally {
      setSavingId(null)
    }
  }

  if (loading) return <LoadingState label="Chargement des utilisateurs..." />

  return (
    <Stack spacing={3}>
      {error && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success">{success}</Alert>}

      <Paper sx={{ borderRadius: 4, p: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: { md: 'center' }, justifyContent: 'space-between', mb: 2.5 }}>
          <Box>
            <Typography component="h2" sx={{ fontWeight: 900 }} variant="h5">Utilisateurs & RBAC</Typography>
            <Typography color="text.secondary">
              Le backoffice est reserve aux comptes administrateurs. Les roles sont appliques cote API.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
            <Chip color="primary" icon={<ShieldCheck size={16} />} label={`${adminCount} administrateur(s)`} />
            <Chip icon={<Users size={16} />} label={`${users.length} utilisateur(s)`} />
            <Chip color={archivedCount > 0 ? 'warning' : 'default'} icon={<Archive size={16} />} label={`${archivedCount} archivé(s)`} />
          </Stack>
        </Stack>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField fullWidth label="Rechercher nom, email ou role" onChange={(event) => setSearch(event.target.value)} value={search} />
          <TextField label="Role" onChange={(event) => setRoleFilter(event.target.value as UserRole | '')} select sx={{ minWidth: 220 }} value={roleFilter}>
            <MenuItem value="">Tous les roles</MenuItem>
            <MenuItem value="admin">Administrateurs</MenuItem>
            <MenuItem value="user">Utilisateurs</MenuItem>
          </TextField>
          <TextField label="Statut" onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)} select sx={{ minWidth: 190 }} value={statusFilter}>
            <MenuItem value="">Tous les statuts</MenuItem>
            <MenuItem value="active">Actifs</MenuItem>
            <MenuItem value="archived">Archivés</MenuItem>
          </TextField>
        </Stack>
      </Paper>

      <Paper sx={{ borderRadius: 4, p: 3 }}>
        <TableContainer>
          <Table aria-label="Utilisateurs" size="small">
            <TableHead>
              <TableRow><TableCell>Nom</TableCell><TableCell>Email</TableCell><TableCell>Role</TableCell><TableCell>Statut</TableCell><TableCell>RGPD</TableCell><TableCell>Dossiers</TableCell><TableCell>Date</TableCell><TableCell align="right">Action</TableCell></TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((user) => (
                <TableRow key={user.id} hover sx={{ opacity: user.archivedAt ? 0.65 : 1 }}>
                  <TableCell sx={{ fontWeight: 750 }}>{user.firstName} {user.lastName}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell sx={{ minWidth: 190 }}>
                    <TextField
                      disabled={savingId === user.id || Boolean(user.archivedAt)}
                      onChange={(event) => void changeRole(user.id, event.target.value as UserRole)}
                      select
                      size="small"
                      value={user.role}
                    >
                      <MenuItem value="admin">{roleLabels.admin}</MenuItem>
                      <MenuItem value="user">{roleLabels.user}</MenuItem>
                    </TextField>
                  </TableCell>
                  <TableCell>{user.archivedAt ? <Chip color="warning" label="Archivé" size="small" /> : <Chip color="success" label="Actif" size="small" />}</TableCell>
                  <TableCell>{user.rgpdConsent ? <Chip color="success" label="Oui" size="small" /> : <Chip label="Non" size="small" />}</TableCell>
                  <TableCell>{user.subscriptionCount ?? 0}</TableCell>
                  <TableCell>{user.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : 'Non renseigne'}</TableCell>
                  <TableCell align="right">
                    <Button
                      color={user.archivedAt ? 'success' : 'warning'}
                      disabled={savingId === user.id || currentUser?.id === user.id}
                      onClick={() => void changeArchive(user)}
                      size="small"
                      startIcon={user.archivedAt ? <RotateCcw size={15} /> : <Archive size={15} />}
                      variant="outlined"
                    >
                      {user.archivedAt ? 'Réactiver' : 'Archiver'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {filtered.length === 0 && <EmptyState title="Aucun utilisateur" description="Aucun utilisateur ne correspond a votre recherche." />}
      </Paper>

      <Alert severity="info">
        Les mots de passe et secrets ne sont jamais exposes dans ce backoffice. La modification du role utilise le RBAC existant user/admin.
      </Alert>
    </Stack>
  )
}

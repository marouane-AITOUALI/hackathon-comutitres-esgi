import { Alert, Box, Paper, Stack, Typography } from '@mui/material'
import { useAuth } from '../hooks/useAuth'

export function ProfilePage() {
  const { user } = useAuth()

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
          Profil
        </Typography>
        <Typography color="text.secondary">Vos informations de compte client.</Typography>
      </Box>

      <Paper sx={{ p: 3, borderRadius: 3 }}>
        {user ? (
          <Stack spacing={1}>
            <Typography sx={{ fontWeight: 700 }}>{user.firstName} {user.lastName}</Typography>
            <Typography color="text.secondary">{user.email}</Typography>
            <Typography color="text.secondary">Rôle: {user.role}</Typography>
          </Stack>
        ) : (
          <Alert severity="info">Aucun utilisateur connecté.</Alert>
        )}
      </Paper>
    </Stack>
  )
}
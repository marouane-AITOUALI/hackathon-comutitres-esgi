import { Alert, Box, Button, Paper, Stack, Typography } from '@mui/material'
import { Link } from 'react-router-dom'

export function DocumentsPage() {
  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
          Documents
        </Typography>
        <Typography color="text.secondary">Les justificatifs et l'analyse documentaire viendront ensuite.</Typography>
      </Box>

      <Alert severity="info">Le lien fonctionne désormais, même si le flux complet reste à construire.</Alert>

      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Stack spacing={2}>
          <Typography sx={{ fontWeight: 700 }}>Idées pour cette page</Typography>
          <Typography color="text.secondary">Liste des documents attachés, upload, statut d'analyse et alertes.</Typography>
          <Button component={Link} to="/subscriptions" variant="outlined" sx={{ alignSelf: 'flex-start' }}>
            Voir mes souscriptions
          </Button>
        </Stack>
      </Paper>
    </Stack>
  )
}
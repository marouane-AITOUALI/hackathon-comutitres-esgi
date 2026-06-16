import { Alert, Box, Button, Paper, Stack, Typography } from '@mui/material'
import { Link } from 'react-router-dom'

export function PaiementsPage() {
  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
          Paiements
        </Typography>
        <Typography color="text.secondary">Le module de paiement client sera complété après les écrans déjà prêts côté backend.</Typography>
      </Box>

      <Alert severity="info">Cette page sert de point d'entrée fonctionnel pour le lien de sidebar.</Alert>

      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Stack spacing={2}>
          <Typography sx={{ fontWeight: 700 }}>Ce qui peut venir ici</Typography>
          <Typography color="text.secondary">Historique des paiements, moyens enregistrés, et suivi des échéances.</Typography>
          <Button component={Link} to="/subscriptions" variant="outlined" sx={{ alignSelf: 'flex-start' }}>
            Retour aux souscriptions
          </Button>
        </Stack>
      </Paper>
    </Stack>
  )
}
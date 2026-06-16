import { Alert, Box, Paper, Stack, Typography } from '@mui/material'

export function SupportPage() {
  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
          Support
        </Typography>
        <Typography color="text.secondary">Une base de support client peut être branchée ici ensuite.</Typography>
      </Box>

      <Alert severity="info">Le lien Support fonctionne désormais et mène à une vue dédiée.</Alert>

      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Typography sx={{ fontWeight: 700, mb: 1 }}>Contenus possibles</Typography>
        <Typography color="text.secondary">
          Centre d'aide, questions fréquentes, contact et suivi des demandes.
        </Typography>
      </Paper>
    </Stack>
  )
}
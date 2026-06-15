import { Button, Stack, Typography } from '@mui/material'
import { useApiUrl } from '../hooks/useApiUrl'

export function HomePage() {
  const apiUrl = useApiUrl()

  return (
    <Stack spacing={2} sx={{ alignItems: 'flex-start' }}>
      <Typography component="h1" variant="h3">
        Trouvez le forfait adapte a vos trajets
      </Typography>
      <Typography color="text.secondary">
        Le frontend TypeScript est pret. API configuree : {apiUrl}
      </Typography>
      <Button variant="contained">Commencer</Button>
    </Stack>
  )
}

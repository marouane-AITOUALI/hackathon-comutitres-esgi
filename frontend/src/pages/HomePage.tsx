import { Box, Button, Card, CardContent, Stack, Typography } from '@mui/material'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function HomePage() {
  const { user } = useAuth()

  return (
    <Stack spacing={4}>
      <Box sx={{ bgcolor: 'background.paper', borderRadius: 4, p: { xs: 3, sm: 6 } }}>
        <Stack spacing={2.5} sx={{ alignItems: 'flex-start', maxWidth: 720 }}>
          <Typography color="primary.dark" sx={{ fontWeight: 800 }}>ILE-DE-FRANCE MOBILITES</Typography>
          <Typography component="h1" variant="h3">Le bon forfait, avec un parcours qui vous guide vraiment.</Typography>
          <Typography color="text.secondary" sx={{ fontSize: '1.1rem' }}>
            Repondez a quelques questions. Nous identifions le porteur, le payeur, le forfait adapte et les justificatifs a preparer.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ width: { xs: '100%', sm: 'auto' } }}>
            <Button component={Link} to={user ? '/onboarding' : '/auth/register'} variant="contained">Commencer ma souscription</Button>
            {!user && <Button component={Link} to="/auth/login" variant="outlined">Se connecter</Button>}
          </Stack>
        </Stack>
      </Box>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        {[
          ['Simple', 'Une question a la fois pour ne jamais perdre le fil.'],
          ['Personnalise', 'Une recommandation selon votre age, statut et rythme de transport.'],
          ['Prepare', 'La liste des justificatifs est annoncee avant la souscription.'],
        ].map(([title, text]) => (
          <Card key={title} sx={{ flex: 1 }}>
            <CardContent><Typography sx={{ fontWeight: 800 }} variant="h6">{title}</Typography><Typography color="text.secondary">{text}</Typography></CardContent>
          </Card>
        ))}
      </Stack>
    </Stack>
  )
}

import { Card, CardContent, Grid, Stack, Typography } from '@mui/material'
import { useApiUrl } from '../hooks/useApiUrl'

const stats = [
  { label: 'Souscriptions', value: 0 },
  { label: 'En attente', value: 0 },
  { label: 'Acceptees', value: 0 },
  { label: 'Refusees', value: 0 },
]

export function DashboardPage() {
  const apiUrl = useApiUrl()

  return (
    <Stack spacing={3}>
      <div>
        <Typography component="h1" variant="h4">
          Tableau de bord
        </Typography>
        <Typography color="text.secondary">API configuree : {apiUrl}</Typography>
      </div>
      <Grid container spacing={2}>
        {stats.map((stat) => (
          <Grid key={stat.label} size={{ xs: 12, sm: 6, lg: 3 }}>
            <Card>
              <CardContent>
                <Typography color="text.secondary">{stat.label}</Typography>
                <Typography variant="h4">{stat.value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Stack>
  )
}

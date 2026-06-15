import { Card, CardContent, Chip, Grid, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'

const stats = [
  { label: 'Souscriptions', value: 3 },
  { label: 'En attente', value: 2 },
  { label: 'Acceptees', value: 1 },
  { label: 'Refusees', value: 0 },
]

const subscriptions = [
  { id: 'DEMO-001', type: 'Parent pour enfant', bearer: 'Lea Martin', payer: 'Nora Martin', offer: 'Imagine R Scolaire', status: 'Documents attendus', color: 'warning' as const },
  { id: 'DEMO-002', type: 'Pour soi-meme', bearer: 'Samir Diallo', payer: 'Samir Diallo', offer: 'Navigo Annuel', status: 'A valider', color: 'primary' as const },
  { id: 'DEMO-003', type: 'Association', bearer: 'Camille Robert', payer: 'Association Horizon', offer: 'TST Solidarite 75%', status: 'Acceptee', color: 'success' as const },
]

export function DashboardPage() {
  return (
    <Stack spacing={3}>
      <div>
        <Typography component="h1" variant="h4">
          Pilotage des souscriptions
        </Typography>
        <Typography color="text.secondary">Vue prototype des parcours, porteurs, payeurs et offres recommandees.</Typography>
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
      <Card>
        <CardContent>
          <Typography component="h2" sx={{ fontWeight: 800, mb: 2 }} variant="h6">Dernieres demandes</Typography>
          <TableContainer>
            <Table aria-label="Dernieres demandes de souscription">
              <TableHead><TableRow><TableCell>Reference</TableCell><TableCell>Type de souscription</TableCell><TableCell>Porteur</TableCell><TableCell>Payeur</TableCell><TableCell>Offre recommandee</TableCell><TableCell>Statut</TableCell></TableRow></TableHead>
              <TableBody>
                {subscriptions.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.id}</TableCell><TableCell>{row.type}</TableCell><TableCell>{row.bearer}</TableCell><TableCell>{row.payer}</TableCell><TableCell>{row.offer}</TableCell><TableCell><Chip color={row.color} label={row.status} size="small" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Stack>
  )
}

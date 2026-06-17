import { Alert, Box, Button, Chip, Paper, Stack, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listSubscriptions } from '../services/subscriptions.service'
import type { SubscriptionSummary } from '../types'

const statusLabel: Record<string, string> = {
  draft: 'Brouillon',
  pending_documents: 'Documents attendus',
  pending_payment: 'Paiement attendu',
  pending_validation: 'En validation',
  accepted: 'Acceptee',
  rejected: 'Refusee',
  cancelled: 'Annulee',
  suspended: 'Suspendue',
}

const statusTone: Record<string, 'default' | 'warning' | 'success' | 'error' | 'info'> = {
  draft: 'default',
  pending_documents: 'warning',
  pending_payment: 'warning',
  pending_validation: 'info',
  accepted: 'success',
  rejected: 'error',
  cancelled: 'default',
  suspended: 'warning',
}

export function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionSummary[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    listSubscriptions()
      .then((data) => {
        if (!cancelled) setSubscriptions(data)
      })
      .catch((caught) => {
        if (!cancelled) setError(caught instanceof Error ? caught.message : 'Impossible de charger les souscriptions.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
          Mes souscriptions
        </Typography>
        <Typography color="text.secondary">Consultez vos dossiers, leur statut et les profils rattachés.</Typography>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}
      {loading && <Alert severity="info">Chargement des souscriptions...</Alert>}

      {!loading && subscriptions.length === 0 && (
        <Alert severity="info">Vous n'avez pas encore de souscription. Lancez un parcours depuis le tableau de bord.</Alert>
      )}

      <Stack spacing={2}>
        {subscriptions.map((item) => (
          <Paper key={item.subscription.id} sx={{ p: 3, borderRadius: 3 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' }, mb: 2 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>{item.offer?.name ?? 'Offre non associee'}</Typography>
                <Typography color="text.secondary" variant="body2">{item.subscription.id}</Typography>
              </Box>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ alignItems: { sm: 'center' } }}>
                <Chip color={statusTone[item.subscription.status]} label={statusLabel[item.subscription.status] ?? item.subscription.status} />
                <Button component={Link} size="small" to={`/subscriptions/${item.subscription.id}`} variant="outlined">Voir le suivi</Button>
              </Stack>
            </Stack>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <Paper variant="outlined" sx={{ flex: 1, p: 2, borderRadius: 2 }}>
                <Typography color="text.secondary" variant="body2">Porteur</Typography>
                <Typography sx={{ fontWeight: 700 }}>
                  {item.bearerProfile ? `${item.bearerProfile.firstName} ${item.bearerProfile.lastName}` : 'Non renseigne'}
                </Typography>
              </Paper>
              <Paper variant="outlined" sx={{ flex: 1, p: 2, borderRadius: 2 }}>
                <Typography color="text.secondary" variant="body2">Payeur</Typography>
                <Typography sx={{ fontWeight: 700 }}>
                  {item.payerProfile ? `${item.payerProfile.firstName} ${item.payerProfile.lastName}` : 'Porteur payeur'}
                </Typography>
              </Paper>
              <Paper variant="outlined" sx={{ flex: 1, p: 2, borderRadius: 2 }}>
                <Typography color="text.secondary" variant="body2">Derniere mise a jour</Typography>
                <Typography sx={{ fontWeight: 700 }}>{new Date(item.subscription.updatedAt).toLocaleDateString('fr-FR')}</Typography>
              </Paper>
              <Paper variant="outlined" sx={{ flex: 1, p: 2, borderRadius: 2 }}>
                <Typography color="text.secondary" variant="body2">Documents / paiements</Typography>
                <Typography sx={{ fontWeight: 700 }}>{item.documents?.length ?? 0} doc. - {item.payments?.length ?? 0} paiement(s)</Typography>
              </Paper>
            </Stack>
          </Paper>
        ))}
      </Stack>
    </Stack>
  )
}

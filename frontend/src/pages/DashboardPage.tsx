import { Alert, Box, Button, Chip, Paper, Stack, Typography } from '@mui/material'
import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { listOffers } from '../services/offers.service'
import { listSubscriptions } from '../services/subscriptions.service'
import type { OfferSummary, SubscriptionSummary } from '../types'

const statusLabel: Record<string, string> = {
  draft: 'Brouillon',
  pending_documents: 'Documents attendus',
  pending_validation: 'En validation',
  accepted: 'Acceptee',
  rejected: 'Refusee',
  cancelled: 'Annulee',
  suspended: 'Suspendue',
}

const statusTone: Record<string, 'default' | 'warning' | 'success' | 'error' | 'info'> = {
  draft: 'default',
  pending_documents: 'warning',
  pending_validation: 'info',
  accepted: 'success',
  rejected: 'error',
  cancelled: 'default',
  suspended: 'warning',
}

function countByStatus(subscriptions: SubscriptionSummary[]) {
  return subscriptions.reduce(
    (accumulator, item) => {
      if (item.subscription.status === 'draft') accumulator.drafts += 1
      else accumulator.active += 1
      return accumulator
    },
    { drafts: 0, active: 0 },
  )
}

export function DashboardPage() {
  const { user } = useAuth()
  const [subscriptions, setSubscriptions] = useState<SubscriptionSummary[]>([])
  const [offers, setOffers] = useState<OfferSummary[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    Promise.all([listSubscriptions(), listOffers()])
      .then(([subscriptionsData, offersData]) => {
        if (cancelled) return
        setSubscriptions(subscriptionsData)
        setOffers(offersData)
      })
      .catch((caught) => {
        if (!cancelled) setError(caught instanceof Error ? caught.message : 'Les donnees client sont indisponibles.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const counters = useMemo(() => countByStatus(subscriptions), [subscriptions])
  const recentSubscriptions = subscriptions.slice(0, 3)
  const featuredOffers = offers.slice(0, 3)

  return (
    <Stack spacing={3}>
      {error && <Alert severity="error">{error}</Alert>}

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        <Paper variant="outlined" sx={{ flex: 1, p: 2.5, borderRadius: 3 }}>
          <Typography color="text.secondary" variant="body2">Souscriptions actives</Typography>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>{counters.active}</Typography>
        </Paper>
        <Paper variant="outlined" sx={{ flex: 1, p: 2.5, borderRadius: 3 }}>
          <Typography color="text.secondary" variant="body2">Brouillons en cours</Typography>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>{counters.drafts}</Typography>
        </Paper>
        <Paper variant="outlined" sx={{ flex: 1, p: 2.5, borderRadius: 3 }}>
          <Typography color="text.secondary" variant="body2">Offres au catalogue</Typography>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>{offers.length}</Typography>
        </Paper>
      </Stack>

      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' }, mb: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>Dernieres souscriptions</Typography>
            <Typography color="text.secondary">Vos dossiers les plus recents et leur etat.</Typography>
          </Box>
          <Button component={Link} to="/subscriptions" variant="outlined">Voir toutes les souscriptions</Button>
        </Stack>

        <Stack spacing={1.5}>
          {loading && <Typography color="text.secondary">Chargement des donnees client...</Typography>}
          {!loading && recentSubscriptions.length === 0 && (
            <Alert severity="info">Aucune souscription trouvée. Commencez un parcours pour creer votre premier dossier.</Alert>
          )}
          {recentSubscriptions.map((item) => (
            <Paper key={item.subscription.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' } }}>
                <Box>
                  <Typography sx={{ fontWeight: 700 }}>{item.offer?.name ?? 'Offre non associee'}</Typography>
                  <Typography color="text.secondary" variant="body2">
                    {item.bearerProfile ? `${item.bearerProfile.firstName} ${item.bearerProfile.lastName}` : 'Profil porteur manquant'}
                  </Typography>
                </Box>
                <Chip color={statusTone[item.subscription.status]} label={statusLabel[item.subscription.status] ?? item.subscription.status} />
              </Stack>
            </Paper>
          ))}
        </Stack>
      </Paper>

      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' }, mb: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>Offres recommandees</Typography>
            <Typography color="text.secondary">Catalogue disponible cote client.</Typography>
          </Box>
          <Button component={Link} to="/offers" variant="outlined">Voir toutes les offres</Button>
        </Stack>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          {featuredOffers.map((offer) => (
            <Paper key={offer.id} variant="outlined" sx={{ flex: 1, p: 2.5, borderRadius: 3 }}>
              <Chip sx={{ mb: 1.5 }} color={offer.isActive ? 'success' : 'default'} label={offer.isActive ? 'Active' : 'Inactive'} size="small" />
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>{offer.name}</Typography>
              <Typography color="text.secondary" sx={{ mb: 1.5 }}>{offer.description ?? 'Offre sans description.'}</Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>Documents requis</Typography>
              <Typography color="text.secondary" variant="body2">
                {offer.requiredDocuments.length > 0 ? offer.requiredDocuments.join(' • ') : 'Aucun document particulier.'}
              </Typography>
            </Paper>
          ))}
        </Stack>
      </Paper>
    </Stack>
  )
}
import { Alert, Box, Chip, Paper, Stack, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { listOffers } from '../services/offers.service'
import type { OfferSummary } from '../types'

export function OffersPage() {
  const [offers, setOffers] = useState<OfferSummary[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    listOffers()
      .then((data) => {
        if (!cancelled) setOffers(data)
      })
      .catch((caught) => {
        if (!cancelled) setError(caught instanceof Error ? caught.message : 'Impossible de charger les offres.')
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
          Catalogue des offres
        </Typography>
        <Typography color="text.secondary">Les offres actives remontent directement depuis le backend client.</Typography>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}
      {loading && <Alert severity="info">Chargement des offres...</Alert>}

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {offers.map((offer) => (
          <Paper key={offer.id} sx={{ flex: '1 1 320px', p: 3, borderRadius: 3 }}>
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>{offer.name}</Typography>
                <Typography color="text.secondary" variant="body2">{offer.code}</Typography>
              </Box>
              <Chip color={offer.isActive ? 'success' : 'default'} label={offer.isActive ? 'Active' : 'Inactive'} size="small" />
            </Stack>
            <Typography color="text.secondary" sx={{ mb: 2 }}>{offer.description ?? 'Description non disponible.'}</Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>Public cible</Typography>
            <Typography color="text.secondary" sx={{ mb: 1.5 }}>{offer.target}</Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>Documents requis</Typography>
            <Typography color="text.secondary">{offer.requiredDocuments.length > 0 ? offer.requiredDocuments.join(' • ') : 'Aucun document requis.'}</Typography>
          </Paper>
        ))}
      </Box>
    </Stack>
  )
}
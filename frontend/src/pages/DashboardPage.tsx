import { Alert, Box, Button, Chip, LinearProgress, Paper, Stack, Typography } from '@mui/material'
import { ArrowRight, BadgeCheck, CalendarClock, CreditCard, FileWarning, Route, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { listOffers } from '../services/offers.service'
import { listSubscriptions } from '../services/subscriptions.service'
import { clearRecommendationResult, getRecommendationResult } from '../services/onboarding.service'
import { colors } from '../theme/colors'
import type { OfferSummary, SubscriptionSummary } from '../types'
import { useSubscriptionRealtime } from '../hooks/useSubscriptionRealtime'

const statusLabel: Record<string, string> = {
  draft: 'Brouillon',
  pending_documents: 'Documents attendus',
  pending_payment: 'Paiement attendu',
  pending_validation: 'En validation',
  accepted: 'Actif',
  rejected: 'Refusé',
  cancelled: 'Annulé',
  suspended: 'Suspendu',
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value))
}

function getProgress(status: string) {
  if (status === 'draft') return 20
  if (status === 'pending_documents') return 45
  if (status === 'pending_payment') return 65
  if (status === 'pending_validation') return 82
  if (status === 'accepted') return 100
  return 35
}

function countByStatus(subscriptions: SubscriptionSummary[]) {
  return subscriptions.reduce(
    (accumulator, item) => {
      const status = item.subscription.status
      if (status === 'accepted') accumulator.active += 1
      if (status === 'draft') accumulator.drafts += 1
      if (status === 'pending_documents') accumulator.documents += 1
      if (status === 'pending_payment') accumulator.payments += 1
      if (status === 'pending_validation') accumulator.validations += 1
      return accumulator
    },
    { active: 0, drafts: 0, documents: 0, payments: 0, validations: 0 },
  )
}

function mostUrgentSubscription(subscriptions: SubscriptionSummary[]) {
  const priority = ['pending_payment', 'pending_documents', 'pending_validation', 'draft', 'accepted']
  return [...subscriptions].sort((a, b) => priority.indexOf(a.subscription.status) - priority.indexOf(b.subscription.status))[0]
}

export function DashboardPage() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionSummary[]>([])
  const [offers, setOffers] = useState<OfferSummary[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [pendingRec, setPendingRec] = useState(() => getRecommendationResult())

  useSubscriptionRealtime(() => {
    void listSubscriptions()
      .then(setSubscriptions)
      .catch((caught) => setError(caught instanceof Error ? caught.message : 'Les données client sont indisponibles.'))
  })

  useEffect(() => {
    let cancelled = false

    Promise.all([listSubscriptions(), listOffers()])
      .then(([subscriptionsData, offersData]) => {
        if (cancelled) return
        setSubscriptions(subscriptionsData)
        setOffers(offersData)
      })
      .catch((caught) => {
        if (!cancelled) setError(caught instanceof Error ? caught.message : 'Les données client sont indisponibles.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const counters = useMemo(() => countByStatus(subscriptions), [subscriptions])
  const urgentSubscription = useMemo(() => mostUrgentSubscription(subscriptions), [subscriptions])
  const recentSubscriptions = subscriptions.slice(0, 4)
  const featuredOffers = offers.filter((offer) => offer.isActive).slice(0, 3)
  const documentsToReview = subscriptions.flatMap((item) => item.documents ?? []).filter((document) => document.status !== 'validated').length
  const paymentsToFix = subscriptions.flatMap((item) => item.payments ?? []).filter((payment) => ['pending', 'rejected', 'cancelled'].includes(payment.status)).length

  function dismissRec() {
    clearRecommendationResult()
    setPendingRec(null)
  }

  return (
    <Stack spacing={3}>
      {error && <Alert severity="error">{error}</Alert>}

      {pendingRec && (
        <Paper sx={{
          p: { xs: 2, md: 2.5 },
          borderRadius: 3,
          bgcolor: '#fff1f2',
          border: '1.5px solid #fca5a5',
          borderLeft: '5px solid #dc2626',
        }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}>
            <Box>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.5 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#dc2626', flexShrink: 0 }} />
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', letterSpacing: 0.6 }}>
                  Éligibilité détectée
                </Typography>
              </Stack>
              <Typography sx={{ fontWeight: 800, color: '#7f1d1d', fontSize: 15, lineHeight: 1.3 }}>
                Vous êtes éligible au forfait{' '}
                <Box component="span" sx={{ color: '#dc2626' }}>{pendingRec.offerName}</Box>
              </Typography>
              <Typography sx={{ fontSize: 13, color: '#991b1b', mt: 0.5 }}>
                Correspondance à {pendingRec.confidencePercent} % — complétez votre dossier pour en bénéficier.
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexShrink: 0 }}>
              <Button
                component={Link}
                to="/subscriptions"
                variant="contained"
                size="small"
                sx={{
                  bgcolor: '#dc2626', color: '#fff', borderRadius: 50,
                  fontWeight: 700, fontSize: 13, textTransform: 'none',
                  px: 2.5, py: 0.9, whiteSpace: 'nowrap',
                  '&:hover': { bgcolor: '#b91c1c' },
                }}
              >
                Démarrer mon dossier
              </Button>
              <Button
                onClick={dismissRec}
                size="small"
                sx={{ minWidth: 0, p: 0.75, color: '#dc2626', borderRadius: 50, '&:hover': { bgcolor: '#fee2e2' } }}
              >
                <X size={16} />
              </Button>
            </Stack>
          </Stack>
        </Paper>
      )}

      <Paper
        sx={{
          p: { xs: 2.5, md: 3.5 },
          borderRadius: 3,
          border: `1px solid ${colors.greyMedium}`,
          background: `linear-gradient(135deg, ${colors.white} 0%, ${colors.blueLight} 100%)`,
        }}
      >
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3} sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ maxWidth: 720 }}>
            <Chip icon={<BadgeCheck size={15} />} label="Espace client Comutitres" color="primary" sx={{ mb: 2, fontWeight: 700 }} />
            <Typography variant="h4" sx={{ fontWeight: 850, mb: 1, color: colors.anthracite }}>
              Pilotez vos titres, vos droits et vos justificatifs en un coup d'oeil.
            </Typography>
            <Typography color="text.secondary" sx={{ maxWidth: 650 }}>
              Retrouvez les actions prioritaires pour maintenir vos droits à circuler, suivre les profils porteur/payeur et préparer vos renouvellements.
            </Typography>
          </Box>
          <Stack direction={{ xs: 'row', sm: 'row' }} spacing={1.5} sx={{ alignSelf: { lg: 'center' }, flexWrap: 'wrap' }}>
            <Button
              aria-label="Démarrer un nouveau parcours"
              component={Link}
              to="/onboarding"
              state={{ mode: 'chat' }}
              variant="contained"
              endIcon={<ArrowRight size={18} />}
              sx={{ minWidth: { xs: 132, sm: 144 }, whiteSpace: 'nowrap' }}
            >
              Démarrer
            </Button>
            <Button
              aria-label="Voir mes dossiers"
              component={Link}
              to="/subscriptions"
              variant="outlined"
              sx={{ minWidth: { xs: 118, sm: 132 }, whiteSpace: 'nowrap' }}
            >
              Dossiers
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', xl: 'repeat(4, 1fr)' }, gap: 2 }}>
        {[
          { label: 'Titres actifs', value: counters.active, icon: <BadgeCheck size={20} />, color: colors.greenDark },
          { label: 'Documents à compléter', value: counters.documents + documentsToReview, icon: <FileWarning size={20} />, color: colors.orangeDark },
          { label: 'Paiements à régulariser', value: counters.payments + paymentsToFix, icon: <CreditCard size={20} />, color: colors.redDark },
          { label: 'Dossiers en validation', value: counters.validations, icon: <CalendarClock size={20} />, color: colors.blueInteraction },
        ].map((item) => (
          <Paper key={item.label} variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
            <Stack direction="row" spacing={2} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography color="text.secondary" variant="body2">{item.label}</Typography>
                <Typography variant="h4" sx={{ fontWeight: 850 }}>{item.value}</Typography>
              </Box>
              <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: colors.greyLight40, color: item.color, display: 'grid', placeItems: 'center' }}>
                {item.icon}
              </Box>
            </Stack>
          </Paper>
        ))}
      </Box>

      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3}>
        <Paper sx={{ flex: 1.15, p: 3, borderRadius: 3 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' }, mb: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 850 }}>Dossiers récents</Typography>
              <Typography color="text.secondary">Avancement des souscriptions porteur/payeur.</Typography>
            </Box>
            <Button component={Link} to="/subscriptions" variant="outlined" endIcon={<ArrowRight size={16} />}>
              Tous les dossiers
            </Button>
          </Stack>

          <Stack spacing={1.5}>
            {loading && <Typography color="text.secondary">Chargement des données client...</Typography>}
            {!loading && recentSubscriptions.length === 0 && (
              <Alert severity="info">Aucune souscription trouvée. Lancez un parcours pour obtenir une recommandation personnalisée.</Alert>
            )}
            {recentSubscriptions.map((item) => (
              <Paper key={item.subscription.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' } }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 800 }}>{item.offer?.name ?? 'Offre non associée'}</Typography>
                    <Typography color="text.secondary" variant="body2">
                      {item.bearerProfile ? `${item.bearerProfile.firstName} ${item.bearerProfile.lastName}` : 'Profil porteur manquant'} · maj {formatDate(item.subscription.updatedAt)}
                    </Typography>
                    <LinearProgress variant="determinate" value={getProgress(item.subscription.status)} sx={{ mt: 1.5, height: 7, borderRadius: 99 }} />
                  </Box>
                  <Stack direction={{ xs: 'row', sm: 'column' }} spacing={1} sx={{ alignItems: { xs: 'center', sm: 'flex-end' } }}>
                    <Chip color={statusTone[item.subscription.status]} label={statusLabel[item.subscription.status] ?? item.subscription.status} size="small" />
                    <Button component={Link} size="small" to={`/subscriptions/${item.subscription.id}`} variant="text">
                      Suivre
                    </Button>
                  </Stack>
                </Stack>
              </Paper>
            ))}
          </Stack>
        </Paper>

        <Stack spacing={3} sx={{ flex: 0.85 }}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 850, mb: 1 }}>Prochaine action</Typography>
            {urgentSubscription ? (
              <Stack spacing={2}>
                <Typography color="text.secondary">
                  Priorité sur le dossier {urgentSubscription.offer?.name ?? urgentSubscription.subscription.id.slice(0, 8)}.
                </Typography>
                <Chip color={statusTone[urgentSubscription.subscription.status]} label={statusLabel[urgentSubscription.subscription.status]} sx={{ alignSelf: 'flex-start', fontWeight: 700 }} />
                <Button component={Link} to={`/subscriptions/${urgentSubscription.subscription.id}`} variant="contained" endIcon={<ArrowRight size={18} />}>
                  Traiter maintenant
                </Button>
              </Stack>
            ) : (
              <Alert severity="info">Aucune action urgente pour le moment.</Alert>
            )}
          </Paper>

          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 850, mb: 2 }}>Offres pertinentes</Typography>
            <Stack spacing={1.5}>
              {featuredOffers.map((offer) => (
                <Paper
                  key={offer.id}
                  component={Link}
                  to={`/offers?offer=${offer.id}`}
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    color: 'inherit',
                    display: 'block',
                    textDecoration: 'none',
                    transition: 'border-color 0.2s, transform 0.2s',
                    '&:hover': {
                      borderColor: colors.blueInteraction,
                      transform: 'translateY(-1px)',
                    },
                  }}
                >
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                    <Route size={18} color={colors.blueInteraction} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 800 }}>{offer.name}</Typography>
                      <Typography color="text.secondary" variant="body2">{offer.description ?? 'Offre disponible au catalogue.'}</Typography>
                    </Box>
                    <ArrowRight size={16} color={colors.greyDark} />
                  </Stack>
                </Paper>
              ))}
              {!loading && featuredOffers.length === 0 && <Alert severity="info">Aucune offre active publiée.</Alert>}
            </Stack>
          </Paper>
        </Stack>
      </Stack>
    </Stack>
  )
}

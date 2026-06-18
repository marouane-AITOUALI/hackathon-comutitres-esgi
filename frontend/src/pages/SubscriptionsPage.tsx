import { Alert, Box, Button, Chip, LinearProgress, Paper, Stack, Typography } from '@mui/material'
import { ArrowRight, BadgeCheck, CalendarClock, CreditCard, FileCheck2, FileWarning, FolderOpen, Layers3, Plus, UserRound } from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { listSubscriptions } from '../services/subscriptions.service'
import { colors } from '../theme/colors'
import type { SubscriptionStatus, SubscriptionSummary } from '../types'
import { useSubscriptionRealtime } from '../hooks/useSubscriptionRealtime'

const statusLabel: Record<SubscriptionStatus, string> = {
  draft: 'Brouillon',
  pending_documents: 'Documents attendus',
  pending_payment: 'Paiement attendu',
  pending_validation: 'En validation',
  accepted: 'Actif',
  rejected: 'Refusé',
  cancelled: 'Annulé',
  suspended: 'Suspendu',
}

const statusTone: Record<SubscriptionStatus, 'default' | 'warning' | 'success' | 'error' | 'info'> = {
  draft: 'default',
  pending_documents: 'warning',
  pending_payment: 'warning',
  pending_validation: 'info',
  accepted: 'success',
  rejected: 'error',
  cancelled: 'default',
  suspended: 'warning',
}

const filterOptions: Array<{ key: 'all' | SubscriptionStatus; label: string; icon: ReactNode }> = [
  { key: 'all', label: 'Tous', icon: <Layers3 size={16} /> },
  { key: 'accepted', label: 'Actifs', icon: <BadgeCheck size={16} /> },
  { key: 'pending_documents', label: 'Documents', icon: <FolderOpen size={16} /> },
  { key: 'pending_payment', label: 'Paiement', icon: <CreditCard size={16} /> },
  { key: 'pending_validation', label: 'Validation', icon: <CalendarClock size={16} /> },
  { key: 'draft', label: 'Brouillons', icon: <FileCheck2 size={16} /> },
]

function formatDate(value: string) {
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value))
}

function profileName(profile: SubscriptionSummary['bearerProfile']) {
  return profile ? `${profile.firstName} ${profile.lastName}` : 'Non renseigné'
}

function getProgress(status: SubscriptionStatus) {
  if (status === 'draft') return 18
  if (status === 'pending_documents') return 42
  if (status === 'pending_payment') return 64
  if (status === 'pending_validation') return 82
  if (status === 'accepted') return 100
  if (status === 'suspended') return 55
  return 30
}

function getNextAction(item: SubscriptionSummary) {
  const missingDocuments = (item.documents ?? []).filter((document) => document.status !== 'validated').length
  const paymentsToFix = (item.payments ?? []).filter((payment) => ['pending', 'rejected', 'cancelled'].includes(payment.status)).length

  if (item.subscription.status === 'pending_documents' || missingDocuments > 0) {
    return { label: 'Compléter les justificatifs', tone: colors.orangeDark, icon: <FileWarning size={18} /> }
  }
  if (item.subscription.status === 'pending_payment' || paymentsToFix > 0) {
    return { label: 'Régler le paiement', tone: colors.redDark, icon: <CreditCard size={18} /> }
  }
  if (item.subscription.status === 'pending_validation') {
    return { label: 'Suivre la validation', tone: colors.blueInteraction, icon: <CalendarClock size={18} /> }
  }
  if (item.subscription.status === 'accepted') {
    return { label: 'Titre opérationnel', tone: colors.greenDark, icon: <BadgeCheck size={18} /> }
  }
  return { label: 'Reprendre le dossier', tone: colors.greyDark, icon: <ArrowRight size={18} /> }
}

function countByStatus(subscriptions: SubscriptionSummary[]) {
  return subscriptions.reduce(
    (accumulator, item) => {
      accumulator.total += 1
      if (item.subscription.status === 'accepted') accumulator.active += 1
      if (item.subscription.status === 'pending_documents') accumulator.documents += 1
      if (item.subscription.status === 'pending_payment') accumulator.payments += 1
      if (item.subscription.status === 'pending_validation') accumulator.validation += 1
      return accumulator
    },
    { total: 0, active: 0, documents: 0, payments: 0, validation: 0 },
  )
}

function filterCount(key: 'all' | SubscriptionStatus, subscriptions: SubscriptionSummary[]) {
  if (key === 'all') return subscriptions.length
  return subscriptions.filter((item) => item.subscription.status === key).length
}

export function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionSummary[]>([])
  const [activeFilter, setActiveFilter] = useState<'all' | SubscriptionStatus>('all')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useSubscriptionRealtime(() => {
    void listSubscriptions()
      .then(setSubscriptions)
      .catch((caught) => setError(caught instanceof Error ? caught.message : 'Impossible de charger les souscriptions.'))
  })

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

  const counters = useMemo(() => countByStatus(subscriptions), [subscriptions])
  const filteredSubscriptions = useMemo(
    () => subscriptions.filter((item) => activeFilter === 'all' || item.subscription.status === activeFilter),
    [activeFilter, subscriptions],
  )
  const nextRenewal = subscriptions
    .filter((item) => item.subscription.status === 'accepted')
    .sort((a, b) => new Date(a.subscription.updatedAt).getTime() - new Date(b.subscription.updatedAt).getTime())[0]

  return (
    <Stack spacing={3}>
      <Paper
        sx={{
          p: { xs: 2.5, md: 3.5 },
          border: `1px solid ${colors.greyMedium}`,
          borderRadius: 3,
          background: colors.white,
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.5} sx={{ justifyContent: 'space-between', alignItems: { md: 'center' } }}>
          <Box sx={{ maxWidth: 720 }}>
            <Chip icon={<FileCheck2 size={15} />} label="Abonnements et contrats" color="primary" sx={{ mb: 2, fontWeight: 700 }} />
            <Typography variant="h4" sx={{ fontWeight: 850, mb: 1 }}>
              Suivez vos souscriptions, vos porteurs et les actions restantes.
            </Typography>
            <Typography color="text.secondary">
              Une vue claire pour repérer les dossiers bloqués, vérifier les profils payeur/porteur et accéder rapidement au suivi détaillé.
            </Typography>
          </Box>
          <Button component={Link} to="/onboarding" variant="contained" startIcon={<Plus size={18} />} sx={{ alignSelf: { xs: 'flex-start', md: 'center' } }}>
            Nouveau
          </Button>
        </Stack>
      </Paper>

      {error && <Alert severity="error">{error}</Alert>}
      {loading && <Alert severity="info">Chargement des souscriptions...</Alert>}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', xl: 'repeat(4, 1fr)' }, gap: 2 }}>
        {[
          { label: 'Total dossiers', value: counters.total, icon: <FileCheck2 size={20} />, color: colors.blueInteraction },
          { label: 'Titres actifs', value: counters.active, icon: <BadgeCheck size={20} />, color: colors.greenDark },
          { label: 'À compléter', value: counters.documents + counters.payments, icon: <FileWarning size={20} />, color: colors.orangeDark },
          { label: 'En validation', value: counters.validation, icon: <CalendarClock size={20} />, color: colors.blueFocus },
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
        <Paper sx={{ flex: 1, p: 3, borderRadius: 3 }}>
          <Stack direction={{ xs: 'column', xl: 'row' }} spacing={2.5} sx={{ justifyContent: 'space-between', alignItems: { xl: 'flex-start' }, mb: 2.5 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 850 }}>Mes dossiers</Typography>
              <Typography color="text.secondary">Filtrez par étape et ouvrez le suivi détaillé.</Typography>
            </Box>
            <Box
              aria-label="Filtres des dossiers par étape"
              role="group"
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, minmax(132px, 1fr))', xl: 'repeat(6, auto)' },
                gap: 1,
                width: { xs: '100%', xl: 'auto' },
              }}
            >
              {filterOptions.map((option) => (
                <Button
                  key={option.key}
                  onClick={() => setActiveFilter(option.key)}
                  startIcon={option.icon}
                  variant={activeFilter === option.key ? 'contained' : 'outlined'}
                  sx={{
                    bgcolor: activeFilter === option.key ? colors.blueInteraction : colors.white,
                    borderColor: activeFilter === option.key ? colors.blueInteraction : colors.greyMedium,
                    color: activeFilter === option.key ? colors.white : colors.anthracite,
                    justifyContent: 'flex-start',
                    minHeight: 42,
                    px: 1.5,
                    '&:hover': {
                      bgcolor: activeFilter === option.key ? colors.blueFocus : colors.blueLight,
                      borderColor: colors.blueInteraction,
                    },
                    '& .MuiButton-endIcon': { ml: 'auto' },
                    '& .MuiButton-startIcon': { color: 'inherit', mr: 1 },
                  }}
                  endIcon={
                    <Box
                      component="span"
                      sx={{
                        alignItems: 'center',
                        bgcolor: activeFilter === option.key ? 'rgba(255,255,255,0.22)' : colors.greyLight40,
                        borderRadius: 99,
                        color: activeFilter === option.key ? colors.white : colors.greyDark,
                        display: 'inline-flex',
                        fontSize: 12,
                        fontWeight: 800,
                        height: 22,
                        justifyContent: 'center',
                        minWidth: 28,
                        px: 0.75,
                      }}
                    >
                      {filterCount(option.key, subscriptions)}
                    </Box>
                  }
                >
                  {option.label}
                </Button>
              ))}
            </Box>
          </Stack>

          {!loading && subscriptions.length === 0 && (
            <Alert severity="info">Vous n'avez pas encore de souscription. Lancez un parcours pour obtenir une recommandation adaptée.</Alert>
          )}

          <Stack spacing={2}>
            {filteredSubscriptions.map((item) => {
              const action = getNextAction(item)
              const missingDocuments = (item.documents ?? []).filter((document) => document.status !== 'validated').length
              const paymentsToFix = (item.payments ?? []).filter((payment) => ['pending', 'rejected', 'cancelled'].includes(payment.status)).length

              return (
                <Paper
                  key={item.subscription.id}
                  variant="outlined"
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    transition: 'border-color 0.2s, transform 0.2s',
                    '&:hover': { borderColor: colors.blueInteraction, transform: 'translateY(-1px)' },
                  }}
                >
                  <Stack spacing={2}>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { md: 'flex-start' } }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="h6" sx={{ fontWeight: 850 }}>{item.offer?.name ?? 'Offre non associée'}</Typography>
                        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flexWrap: 'wrap', mt: 0.5 }}>
                          <Typography color="text.secondary" variant="body2">
                            Dossier {item.subscription.id.slice(0, 8)}
                          </Typography>
                          <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', color: colors.greyDark }}>
                            <CalendarClock size={14} />
                            <Typography color="text.secondary" variant="body2">
                              Mis à jour le {formatDate(item.subscription.updatedAt)}
                            </Typography>
                          </Stack>
                        </Stack>
                      </Box>
                      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                        <Chip color={statusTone[item.subscription.status]} label={statusLabel[item.subscription.status]} sx={{ fontWeight: 700 }} />
                        <Button component={Link} to={`/subscriptions/${item.subscription.id}`} variant="outlined" endIcon={<ArrowRight size={16} />}>
                          Suivi
                        </Button>
                      </Stack>
                    </Stack>

                    <LinearProgress variant="determinate" value={getProgress(item.subscription.status)} sx={{ height: 8, borderRadius: 99 }} />

                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', xl: '1.2fr 1.2fr 1fr 1.2fr' }, gap: 1.5 }}>
                      <Paper variant="outlined" sx={{ p: 1.75, borderRadius: 2, bgcolor: colors.greyLight40 }}>
                        <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                          <UserRound size={17} color={colors.greyDark} />
                          <Box>
                            <Typography color="text.secondary" variant="caption">Porteur</Typography>
                            <Typography sx={{ fontWeight: 750 }}>{profileName(item.bearerProfile)}</Typography>
                          </Box>
                        </Stack>
                      </Paper>
                      <Paper variant="outlined" sx={{ p: 1.75, borderRadius: 2, bgcolor: colors.greyLight40 }}>
                        <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                          <UserRound size={17} color={colors.greyDark} />
                          <Box>
                            <Typography color="text.secondary" variant="caption">Payeur</Typography>
                            <Typography sx={{ fontWeight: 750 }}>{item.payerProfile ? profileName(item.payerProfile) : 'Porteur payeur'}</Typography>
                          </Box>
                        </Stack>
                      </Paper>
                      <Paper variant="outlined" sx={{ p: 1.75, borderRadius: 2, bgcolor: colors.greyLight40 }}>
                        <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                          <FolderOpen size={17} color={colors.greyDark} />
                          <Box>
                            <Typography color="text.secondary" variant="caption">Documents</Typography>
                            <Typography sx={{ fontWeight: 750 }}>
                              {item.documents?.length ?? 0} total, {missingDocuments} à traiter
                            </Typography>
                          </Box>
                        </Stack>
                      </Paper>
                      <Paper variant="outlined" sx={{ p: 1.75, borderRadius: 2, bgcolor: colors.greyLight40 }}>
                        <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                          <Box sx={{ color: action.tone, display: 'flex' }}>{action.icon}</Box>
                          <Box>
                            <Typography color="text.secondary" variant="caption">Action</Typography>
                            <Typography sx={{ fontWeight: 750 }}>{paymentsToFix > 0 ? `${paymentsToFix} paiement à revoir` : action.label}</Typography>
                          </Box>
                        </Stack>
                      </Paper>
                    </Box>
                  </Stack>
                </Paper>
              )
            })}
          </Stack>

          {!loading && subscriptions.length > 0 && filteredSubscriptions.length === 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>Aucun dossier ne correspond à ce filtre.</Alert>
          )}
        </Paper>

        <Stack spacing={3} sx={{ width: { xs: '100%', lg: 340 }, flexShrink: 0 }}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 850, mb: 1 }}>À surveiller</Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Les dossiers avec documents ou paiements attendus peuvent suspendre le droit à circuler si rien n'est traité.
            </Typography>
            <Stack spacing={1.25}>
              <Alert severity={counters.documents > 0 ? 'warning' : 'success'}>
                {counters.documents > 0 ? `${counters.documents} dossier(s) attendent un justificatif.` : 'Aucun justificatif bloquant.'}
              </Alert>
              <Alert severity={counters.payments > 0 ? 'warning' : 'success'}>
                {counters.payments > 0 ? `${counters.payments} dossier(s) attendent un paiement.` : 'Aucun paiement bloquant.'}
              </Alert>
            </Stack>
          </Paper>

          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 850, mb: 1 }}>Renouvellement</Typography>
            {nextRenewal ? (
              <Stack spacing={1.5}>
                <Typography color="text.secondary">
                  Dernier titre actif mis à jour le {formatDate(nextRenewal.subscription.updatedAt)}.
                </Typography>
                <Typography sx={{ fontWeight: 800 }}>{nextRenewal.offer?.name ?? 'Offre active'}</Typography>
                <Button component={Link} to={`/subscriptions/${nextRenewal.subscription.id}`} variant="outlined">
                  Consulter
                </Button>
              </Stack>
            ) : (
              <Alert severity="info">Aucun titre actif détecté pour le moment.</Alert>
            )}
          </Paper>
        </Stack>
      </Stack>
    </Stack>
  )
}

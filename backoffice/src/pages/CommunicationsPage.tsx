import { Alert, Box, Button, Chip, Divider, Grid, InputAdornment, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material'
import { BellRing, Clock3, Globe2, Link as LinkIcon, Megaphone, Radio, Search, Send, ShieldCheck, Users } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { EmptyState } from '../components/common/EmptyState'
import { LoadingState } from '../components/common/LoadingState'
import { listCommunications, publishCommunication } from '../services/notifications.service'
import { colors } from '../theme/colors'
import type { Communication, CommunicationAudience, CreateCommunicationPayload, NotificationPriority } from '../types/notification'

const audienceLabels: Record<CommunicationAudience, string> = {
  clients: 'Clients',
  admins: 'Equipe backoffice',
  everyone: 'Tous les utilisateurs',
}

const audienceHelpers: Record<CommunicationAudience, string> = {
  clients: 'Notifications envoyees aux comptes clients.',
  admins: 'Notifications envoyees aux administrateurs.',
  everyone: 'Diffusion aux clients et aux administrateurs.',
}

const priorityLabels: Record<NotificationPriority, string> = {
  low: 'Information',
  normal: 'Standard',
  high: 'Important',
}

const priorityColors: Record<NotificationPriority, 'default' | 'info' | 'error'> = {
  low: 'default',
  normal: 'info',
  high: 'error',
}

const initialForm: CreateCommunicationPayload = {
  audience: 'clients',
  title: '',
  message: '',
  priority: 'normal',
  actionLabel: '',
  actionPath: '',
}

function audienceIcon(audience: CommunicationAudience) {
  if (audience === 'admins') return <ShieldCheck size={18} />
  if (audience === 'everyone') return <Globe2 size={18} />
  return <Users size={18} />
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function StatTile({ icon, label, value, helper }: { icon: ReactNode; label: string; value: string | number; helper: string }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        borderColor: colors.greyMedium,
        borderRadius: 2,
        height: '100%',
        p: 2.25,
      }}
    >
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
        <Box sx={{ color: colors.blueInteraction, display: 'flex', mt: 0.25 }}>{icon}</Box>
        <Box>
          <Typography sx={{ color: colors.greyDark, fontSize: 13, fontWeight: 750 }}>{label}</Typography>
          <Typography sx={{ color: colors.anthracite, fontSize: 26, fontWeight: 950, lineHeight: 1.15 }}>{value}</Typography>
          <Typography color="text.secondary" variant="body2">{helper}</Typography>
        </Box>
      </Stack>
    </Paper>
  )
}

export function CommunicationsPage() {
  const [communications, setCommunications] = useState<Communication[]>([])
  const [form, setForm] = useState<CreateCommunicationPayload>(initialForm)
  const [audienceFilter, setAudienceFilter] = useState<'all' | CommunicationAudience>('all')
  const [priorityFilter, setPriorityFilter] = useState<'all' | NotificationPriority>('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    let mounted = true
    listCommunications()
      .then((response) => {
        if (mounted) setCommunications(response.communications)
      })
      .catch((caught) => setError(caught instanceof Error ? caught.message : 'Communications indisponibles.'))
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [])

  const filteredCommunications = useMemo(() => {
    const term = search.trim().toLowerCase()
    return communications.filter((communication) => {
      const matchesAudience = audienceFilter === 'all' || communication.audience === audienceFilter
      const matchesPriority = priorityFilter === 'all' || communication.priority === priorityFilter
      const matchesSearch = !term
        || communication.title.toLowerCase().includes(term)
        || communication.message.toLowerCase().includes(term)
        || communication.author?.toLowerCase().includes(term)
      return matchesAudience && matchesPriority && matchesSearch
    })
  }, [audienceFilter, communications, priorityFilter, search])

  const totalRecipients = communications.reduce((sum, communication) => sum + communication.recipientCount, 0)
  const highPriorityCount = communications.filter((communication) => communication.priority === 'high').length
  const lastPublishedAt = communications[0]?.publishedAt ? formatDateTime(communications[0].publishedAt) : 'Aucune'
  const actionPairInvalid = Boolean(form.actionLabel?.trim()) !== Boolean(form.actionPath?.trim())
  const canSubmit = form.title.trim().length >= 3 && form.message.trim().length >= 3 && !actionPairInvalid

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!canSubmit) return
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const payload = {
        audience: form.audience,
        title: form.title.trim(),
        message: form.message.trim(),
        priority: form.priority,
        actionLabel: form.actionLabel?.trim() || undefined,
        actionPath: form.actionPath?.trim() || undefined,
      }
      const { communication } = await publishCommunication(payload)
      setCommunications((current) => [communication, ...current])
      setForm(initialForm)
      setSuccess(`Communication publiee a ${communication.recipientCount} destinataire(s).`)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Publication impossible.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingState label="Chargement des communications..." />

  return (
    <Stack spacing={3}>
      <Paper sx={{ borderRadius: 3, p: { xs: 2, md: 3 } }}>
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} sx={{ alignItems: { lg: 'center' }, justifyContent: 'space-between' }}>
          <Box>
            <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', mb: 0.75 }}>
              <Megaphone color={colors.blueInteraction} size={24} />
              <Typography component="h2" sx={{ fontWeight: 950 }} variant="h5">Centre de communications</Typography>
            </Stack>
            <Typography color="text.secondary">
              Publier une information ciblee et suivre les diffusions envoyees en temps reel.
            </Typography>
          </Box>
          <Chip color="success" icon={<Radio size={16} />} label="Diffusion temps reel" sx={{ alignSelf: { xs: 'flex-start', lg: 'center' }, fontWeight: 800 }} />
        </Stack>
      </Paper>

      {error && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success">{success}</Alert>}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatTile icon={<BellRing size={22} />} label="Publications" value={communications.length} helper="Communications envoyees" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatTile icon={<Users size={22} />} label="Destinataires touches" value={totalRecipients} helper="Total des notifications creees" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatTile icon={<ShieldCheck size={22} />} label="Priorite haute" value={highPriorityCount} helper="Messages a forte visibilite" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatTile icon={<Clock3 size={22} />} label="Derniere diffusion" value={lastPublishedAt} helper="Publication la plus recente" />
        </Grid>
      </Grid>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, lg: 5 }}>
          <Paper component="form" onSubmit={submit} sx={{ borderRadius: 3, height: '100%', p: { xs: 2, md: 3 } }}>
            <Stack spacing={2.5}>
              <Box>
                <Typography component="h2" sx={{ fontWeight: 900 }} variant="h6">Nouvelle communication</Typography>
                <Typography color="text.secondary" variant="body2">{audienceHelpers[form.audience]}</Typography>
              </Box>

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField
                  fullWidth
                  label="Audience"
                  onChange={(event) => setForm((current) => ({ ...current, audience: event.target.value as CommunicationAudience }))}
                  select
                  value={form.audience}
                >
                  {Object.entries(audienceLabels).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
                </TextField>
                <TextField
                  fullWidth
                  label="Priorite"
                  onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value as NotificationPriority }))}
                  select
                  value={form.priority}
                >
                  {Object.entries(priorityLabels).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
                </TextField>
              </Stack>

              <TextField
                fullWidth
                label="Titre"
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                required
                slotProps={{ htmlInput: { maxLength: 160 } }}
                value={form.title}
              />
              <TextField
                fullWidth
                label="Message"
                minRows={5}
                multiline
                onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
                required
                slotProps={{ htmlInput: { maxLength: 2000 } }}
                value={form.message}
              />

              <Divider />

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField
                  fullWidth
                  label="Action"
                  onChange={(event) => setForm((current) => ({ ...current, actionLabel: event.target.value }))}
                  placeholder="Voir mon dossier"
                  value={form.actionLabel}
                />
                <TextField
                  fullWidth
                  label="Page cible"
                  onChange={(event) => setForm((current) => ({ ...current, actionPath: event.target.value }))}
                  placeholder="/subscriptions"
                  value={form.actionPath}
                />
              </Stack>
              {actionPairInvalid && (
                <Alert severity="warning">Renseigner a la fois le libelle de l'action et la page cible.</Alert>
              )}

              <Button
                disabled={saving || !canSubmit}
                startIcon={<Send size={17} />}
                sx={{ alignSelf: 'flex-start', fontWeight: 850 }}
                type="submit"
                variant="contained"
              >
                {saving ? 'Publication...' : 'Publier'}
              </Button>
            </Stack>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, lg: 7 }}>
          <Paper sx={{ borderRadius: 3, height: '100%', p: { xs: 2, md: 3 } }}>
            <Stack spacing={2.25}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: { md: 'center' }, justifyContent: 'space-between' }}>
                <Box>
                  <Typography component="h2" sx={{ fontWeight: 900 }} variant="h6">Historique des diffusions</Typography>
                  <Typography color="text.secondary" variant="body2">{filteredCommunications.length} publication(s) affichee(s)</Typography>
                </Box>
                <TextField
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Rechercher"
                  size="small"
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search color={colors.greyDark} size={17} />
                        </InputAdornment>
                      ),
                    },
                  }}
                  sx={{ minWidth: { md: 240 } }}
                  value={search}
                />
              </Stack>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <TextField
                  label="Audience"
                  onChange={(event) => setAudienceFilter(event.target.value as 'all' | CommunicationAudience)}
                  select
                  size="small"
                  sx={{ minWidth: 180 }}
                  value={audienceFilter}
                >
                  <MenuItem value="all">Toutes</MenuItem>
                  {Object.entries(audienceLabels).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
                </TextField>
                <TextField
                  label="Priorite"
                  onChange={(event) => setPriorityFilter(event.target.value as 'all' | NotificationPriority)}
                  select
                  size="small"
                  sx={{ minWidth: 180 }}
                  value={priorityFilter}
                >
                  <MenuItem value="all">Toutes</MenuItem>
                  {Object.entries(priorityLabels).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
                </TextField>
              </Stack>

              <Stack spacing={1.5}>
                {filteredCommunications.map((communication) => (
                  <Paper key={communication.id} variant="outlined" sx={{ borderColor: colors.greyMedium, borderRadius: 2, p: 2 }}>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ justifyContent: 'space-between' }}>
                      <Stack spacing={1.25} sx={{ minWidth: 0 }}>
                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                          <Chip icon={audienceIcon(communication.audience)} label={audienceLabels[communication.audience]} size="small" sx={{ fontWeight: 750 }} />
                          <Chip color={priorityColors[communication.priority]} label={priorityLabels[communication.priority]} size="small" sx={{ fontWeight: 750 }} />
                          <Chip label={`${communication.recipientCount} destinataire(s)`} size="small" variant="outlined" />
                        </Stack>
                        <Box>
                          <Typography sx={{ fontWeight: 900 }}>{communication.title}</Typography>
                          <Typography color="text.secondary">{communication.message}</Typography>
                        </Box>
                        {communication.actionLabel && communication.actionPath && (
                          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', color: colors.blueInteraction, flexWrap: 'wrap' }}>
                            <LinkIcon size={15} />
                            <Typography variant="body2">{communication.actionLabel}</Typography>
                            <Typography color="text.secondary" variant="body2">({communication.actionPath})</Typography>
                          </Stack>
                        )}
                      </Stack>
                      <Box sx={{ flexShrink: 0, minWidth: { md: 170 }, textAlign: { md: 'right' } }}>
                        <Typography sx={{ fontWeight: 800 }}>{formatDateTime(communication.publishedAt)}</Typography>
                        <Typography color="text.secondary" variant="body2">
                          {communication.author ? `Par ${communication.author}` : 'Auteur non renseigne'}
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>
                ))}
                {filteredCommunications.length === 0 && (
                  <EmptyState
                    title="Aucune communication"
                    description="Les publications correspondant aux filtres apparaitront ici."
                  />
                )}
              </Stack>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Stack>
  )
}

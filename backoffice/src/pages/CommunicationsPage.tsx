import { Alert, Button, Chip, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material'
import { useEffect, useState, type FormEvent } from 'react'
import { EmptyState } from '../components/common/EmptyState'
import { LoadingState } from '../components/common/LoadingState'
import { listCommunications, publishCommunication } from '../services/notifications.service'
import type { Communication, CommunicationAudience, CreateCommunicationPayload, NotificationPriority } from '../types/notification'

const audienceLabels: Record<CommunicationAudience, string> = {
  clients: 'Tous les clients',
  admins: 'Toute l’équipe backoffice',
  everyone: 'Clients et backoffice',
}

const priorityLabels: Record<NotificationPriority, string> = {
  low: 'Information légère',
  normal: 'Information standard',
  high: 'Information importante',
}

const initialForm: CreateCommunicationPayload = {
  audience: 'clients',
  title: '',
  message: '',
  priority: 'normal',
  actionLabel: '',
  actionPath: '',
}

export function CommunicationsPage() {
  const [communications, setCommunications] = useState<Communication[]>([])
  const [form, setForm] = useState<CreateCommunicationPayload>(initialForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    let mounted = true
    listCommunications()
      .then((response) => { if (mounted) setCommunications(response.communications) })
      .catch((caught) => setError(caught instanceof Error ? caught.message : 'Communications indisponibles.'))
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  async function submit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const payload = {
        ...form,
        actionLabel: form.actionLabel?.trim() || undefined,
        actionPath: form.actionPath?.trim() || undefined,
      }
      const { communication } = await publishCommunication(payload)
      setCommunications((current) => [communication, ...current])
      setForm(initialForm)
      setSuccess(`Communication publiée auprès de ${communication.recipientCount} destinataire(s).`)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Publication impossible.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingState label="Chargement des communications..." />

  return (
    <Stack spacing={3}>
      <Alert severity="info" sx={{ borderRadius: 3 }}>
        Publiez ici une annonce générale, un rappel de renouvellement, une maintenance ou une consigne importante. Chaque destinataire la reçoit immédiatement dans sa cloche.
      </Alert>
      <Alert severity="warning" sx={{ borderRadius: 3 }}>
        Mode prototype : la publication crée actuellement une notification par destinataire. Pour une diffusion à grande échelle, la communication restera unique et seuls les états lu/masqué seront stockés par utilisateur.
      </Alert>
      {error && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success">{success}</Alert>}

      <Paper component="form" onSubmit={submit} sx={{ borderRadius: 4, p: 3 }}>
        <Typography component="h2" sx={{ fontWeight: 900, mb: 0.5 }} variant="h6">Nouvelle communication</Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Le lien d’action est facultatif et doit correspondre à une page disponible pour l’audience ciblée.
        </Typography>

        <Stack spacing={2.5}>
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
              label="Priorité"
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
            minRows={4}
            multiline
            onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
            required
            slotProps={{ htmlInput: { maxLength: 2000 } }}
            value={form.message}
          />
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              fullWidth
              label="Libellé de l’action (facultatif)"
              onChange={(event) => setForm((current) => ({ ...current, actionLabel: event.target.value }))}
              placeholder="Voir mes renouvellements"
              value={form.actionLabel}
            />
            <TextField
              fullWidth
              label="Chemin interne associé"
              onChange={(event) => setForm((current) => ({ ...current, actionPath: event.target.value }))}
              placeholder="/subscriptions"
              value={form.actionPath}
            />
          </Stack>
          <Button
            disabled={saving || form.title.trim().length < 3 || form.message.trim().length < 3 || Boolean(form.actionLabel) !== Boolean(form.actionPath)}
            size="large"
            sx={{ alignSelf: 'flex-start' }}
            type="submit"
            variant="contained"
          >
            {saving ? 'Publication...' : 'Publier maintenant'}
          </Button>
        </Stack>
      </Paper>

      <Paper sx={{ borderRadius: 4, p: 3 }}>
        <Typography component="h2" sx={{ fontWeight: 900, mb: 2 }} variant="h6">Historique des publications</Typography>
        <Stack spacing={2}>
          {communications.map((communication) => (
            <Paper key={communication.id} variant="outlined" sx={{ borderRadius: 3, p: 2.5 }}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ justifyContent: 'space-between' }}>
                <Stack spacing={1}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                    <Typography sx={{ fontWeight: 900 }}>{communication.title}</Typography>
                    <Chip label={audienceLabels[communication.audience]} size="small" />
                    <Chip color={communication.priority === 'high' ? 'error' : 'default'} label={priorityLabels[communication.priority]} size="small" />
                  </Stack>
                  <Typography color="text.secondary">{communication.message}</Typography>
                  {communication.actionLabel && communication.actionPath && (
                    <Typography color="primary" variant="body2">{communication.actionLabel} → {communication.actionPath}</Typography>
                  )}
                </Stack>
                <Stack sx={{ flexShrink: 0, textAlign: { md: 'right' } }}>
                  <Typography sx={{ fontWeight: 800 }}>{communication.recipientCount} destinataire(s)</Typography>
                  <Typography color="text.secondary" variant="body2">{new Date(communication.publishedAt).toLocaleString('fr-FR')}</Typography>
                  {communication.author && <Typography color="text.secondary" variant="caption">Par {communication.author}</Typography>}
                </Stack>
              </Stack>
            </Paper>
          ))}
          {communications.length === 0 && <EmptyState title="Aucune communication" description="La première publication apparaîtra ici avec son audience et son nombre de destinataires." />}
        </Stack>
      </Paper>
    </Stack>
  )
}

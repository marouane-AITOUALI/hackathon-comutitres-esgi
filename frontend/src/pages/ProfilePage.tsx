import { Alert, Avatar, Box, Button, CircularProgress, FormControlLabel, MenuItem, Paper, Stack, Switch, TextField, Typography } from '@mui/material'
import { CheckCircle2, Home, Mail, Phone, Save, ShieldCheck, UserRound } from 'lucide-react'
import { useMemo, useState, type ChangeEvent } from 'react'
import { searchFrenchAddresses, type AddressSuggestion } from '../services/address.service'
import { updateMe, type UpdateMePayload } from '../services/auth.service'
import { replaceMyAvatar } from '../services/user-files.service'
import { colors } from '../theme/colors'
import type { AccessibilityPreference, AuthUser, ContactPreference } from '../types'
import { useAuth } from '../hooks/useAuth'

const contactLabels: Record<ContactPreference, string> = {
  email: 'Email',
  phone: 'Appel téléphonique',
  sms: 'SMS',
}

const accessibilityLabels: Record<AccessibilityPreference, string> = {
  none: 'Aucune préférence',
  screen_reader: 'Compatible lecteur d’écran',
  large_text: 'Texte plus lisible',
  reduced_motion: 'Animations réduites',
  plain_language: 'Langage simplifié',
  human_support: 'Accompagnement humain',
}

interface ProfileForm {
  firstName: string
  lastName: string
  email: string
  phone: string
  addressLine1: string
  addressLine2: string
  postalCode: string
  city: string
  country: string
  preferredContact: ContactPreference
  accessibilityPreference: AccessibilityPreference
  marketingOptIn: boolean
}

type ProfileErrors = Partial<Record<keyof ProfileForm, string>>

const namePattern = /^[\p{L}][\p{L}\p{M}\s'.-]*$/u
const phonePattern = /^(?:\+33|0)[1-9](?:[ .-]?\d{2}){4}$/
const addressPattern = /^[\p{L}\p{N}\p{M}\s'",.-]+$/u
const addressOptionalPattern = /^[\p{L}\p{N}\p{M}\s'",.-]*$/u
const cityPattern = /^[\p{L}\p{M}\s'.-]+$/u
const postalPattern = /^[a-zA-Z0-9\s-]+$/
const addressSearchMinLength = 3
const avatarMaxSizeBytes = 2 * 1024 * 1024
const avatarAllowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])

function initials(user: AuthUser | null) {
  if (!user) return 'CT'
  return [user.firstName, user.lastName]
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'CT'
}

function formatDate(value?: string | null) {
  if (!value) return 'Non renseigné'
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(value))
}

function buildForm(user: AuthUser | null): ProfileForm {
  return {
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    addressLine1: user?.addressLine1 ?? '',
    addressLine2: user?.addressLine2 ?? '',
    postalCode: user?.postalCode ?? '',
    city: user?.city ?? '',
    country: user?.country ?? 'FR',
    preferredContact: user?.preferredContact ?? 'email',
    accessibilityPreference: user?.accessibilityPreference ?? 'none',
    marketingOptIn: user?.marketingOptIn ?? false,
  }
}

function validateForm(form: ProfileForm): ProfileErrors {
  const errors: ProfileErrors = {}
  const trimmed = {
    ...form,
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    email: form.email.trim(),
    phone: form.phone.trim(),
    addressLine1: form.addressLine1.trim(),
    addressLine2: form.addressLine2.trim(),
    postalCode: form.postalCode.trim(),
    city: form.city.trim(),
    country: form.country.trim().toUpperCase(),
  }

  if (!trimmed.firstName || !namePattern.test(trimmed.firstName)) errors.firstName = 'Prénom invalide.'
  if (!trimmed.lastName || !namePattern.test(trimmed.lastName)) errors.lastName = 'Nom invalide.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed.email)) errors.email = 'Email invalide.'
  if (trimmed.phone && !phonePattern.test(trimmed.phone)) errors.phone = 'Numéro français attendu, ex. 0612345678.'
  if ((trimmed.preferredContact === 'phone' || trimmed.preferredContact === 'sms') && !trimmed.phone) errors.phone = 'Requis pour ce canal de contact.'
  if (trimmed.addressLine1 && (trimmed.addressLine1.length < 3 || !addressPattern.test(trimmed.addressLine1))) errors.addressLine1 = 'Adresse invalide.'
  if (trimmed.addressLine2 && !addressOptionalPattern.test(trimmed.addressLine2)) errors.addressLine2 = 'Complément invalide.'
  if (trimmed.postalCode && !postalPattern.test(trimmed.postalCode)) errors.postalCode = 'Code postal invalide.'
  if (trimmed.city && (trimmed.city.length < 2 || !cityPattern.test(trimmed.city))) errors.city = 'Ville invalide.'
  if (trimmed.country !== 'FR') errors.country = 'Le pays doit rester FR.'

  const hasAddress = Boolean(trimmed.addressLine1 || trimmed.postalCode || trimmed.city)
  if (hasAddress) {
    if (!trimmed.addressLine1) errors.addressLine1 = 'Adresse requise.'
    if (!trimmed.postalCode) errors.postalCode = 'Code postal requis.'
    if (!trimmed.city) errors.city = 'Ville requise.'
  }
  if (trimmed.country === 'FR' && trimmed.postalCode && !/^\d{5}$/.test(trimmed.postalCode)) {
    errors.postalCode = 'Code postal français sur 5 chiffres attendu.'
  }

  return errors
}

export function ProfilePage() {
  const { refreshUser, updateUser, user } = useAuth()
  const [form, setForm] = useState<ProfileForm>(() => buildForm(user))
  const [saving, setSaving] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<ProfileErrors>({})
  const [addressLoading, setAddressLoading] = useState(false)
  const [addressQuery, setAddressQuery] = useState(form.addressLine1)
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([])
  const [success, setSuccess] = useState('')

  const userInitials = useMemo(() => initials(user), [user])
  const savedAddress = user?.addressLine1 && user.postalCode && user.city
    ? `${user.addressLine1}, ${user.postalCode} ${user.city}`
    : 'Non renseignée'

  const updateField = <Key extends keyof ProfileForm>(key: Key, value: ProfileForm[Key]) => {
    setForm((current) => ({ ...current, [key]: value }))
    setFieldErrors((current) => ({ ...current, [key]: undefined }))
    setSuccess('')
    setError('')
  }

  async function searchAddress(value: string) {
    setAddressQuery(value)
    updateField('addressLine1', value)
    updateField('postalCode', '')
    updateField('city', '')
    setAddressSuggestions([])

    if (value.trim().length < addressSearchMinLength) return

    setAddressLoading(true)
    try {
      setAddressSuggestions(await searchFrenchAddresses(value))
    } catch {
      setAddressSuggestions([])
      setFieldErrors((current) => ({ ...current, addressLine1: 'Recherche d’adresse indisponible.' }))
    } finally {
      setAddressLoading(false)
    }
  }

  function selectAddress(suggestion: AddressSuggestion) {
    setAddressQuery(suggestion.label)
    setAddressSuggestions([])
    setForm((current) => ({
      ...current,
      addressLine1: suggestion.addressLine1,
      postalCode: suggestion.postalCode,
      city: suggestion.city,
      country: 'FR',
    }))
    setFieldErrors((current) => ({
      ...current,
      addressLine1: undefined,
      postalCode: undefined,
      city: undefined,
      country: undefined,
    }))
    setSuccess('')
    setError('')
  }

  async function uploadAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setError('')
    setSuccess('')

    if (!avatarAllowedMimeTypes.has(file.type)) {
      setError('Format avatar non autorise. Utilisez JPG, PNG ou WebP.')
      return
    }
    if (file.size > avatarMaxSizeBytes) {
      setError('Avatar trop lourd. Taille maximale : 2 MB.')
      return
    }

    setAvatarUploading(true)
    try {
      await replaceMyAvatar(file)
      await refreshUser()
      setSuccess('Photo de profil mise a jour.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "L'avatar n'a pas pu etre mis a jour.")
    } finally {
      setAvatarUploading(false)
    }
  }

  async function submit() {
    const validationErrors = validateForm(form)
    setFieldErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) {
      setError('Corrigez les champs indiqués avant d’enregistrer.')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    const payload: UpdateMePayload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim() || null,
      addressLine1: form.addressLine1.trim() || null,
      addressLine2: form.addressLine2.trim() || null,
      postalCode: form.postalCode.trim() || null,
      city: form.city.trim() || null,
      country: 'FR',
      preferredContact: form.preferredContact,
      accessibilityPreference: form.accessibilityPreference,
      marketingOptIn: form.marketingOptIn,
    }

    try {
      const { user: updatedUser } = await updateMe(payload)
      updateUser(updatedUser)
      setSuccess('Profil mis à jour.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Mise à jour impossible.')
    } finally {
      setSaving(false)
    }
  }

  if (!user) {
    return (
      <Stack spacing={3}>
        <Typography variant="h4" sx={{ fontWeight: 850 }}>Profil</Typography>
        <Alert severity="info">Aucun utilisateur connecté.</Alert>
      </Stack>
    )
  }

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
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.5} sx={{ alignItems: { md: 'center' }, justifyContent: 'space-between' }}>
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center', minWidth: 0 }}>
            <Avatar
              alt={`${user.firstName} ${user.lastName}`}
              src={user.avatarUrl ?? undefined}
              sx={{
                bgcolor: colors.blueInteraction,
                color: colors.white,
                fontSize: 26,
                fontWeight: 850,
                height: 72,
                width: 72,
              }}
            >
              {userInitials}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h4" sx={{ fontWeight: 850, mb: 0.5 }}>
                {user.firstName} {user.lastName}
              </Typography>
              <Typography color="text.secondary">{user.email}</Typography>
            </Box>
          </Stack>
          <Stack spacing={0.75} sx={{ alignItems: { xs: 'stretch', md: 'flex-end' } }}>
            <Button component="label" disabled={avatarUploading} variant="outlined">
              {avatarUploading ? 'Envoi en cours...' : 'Modifier la photo'}
              <input accept="image/jpeg,image/png,image/webp" hidden onChange={uploadAvatar} type="file" />
            </Button>
            <Typography color="text.secondary" variant="caption">
              JPG, PNG ou WebP. 2 MB maximum.
            </Typography>
          </Stack>
        </Stack>
      </Paper>

      {error && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success">{success}</Alert>}

      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3}>
        <Paper sx={{ flex: 1, p: 3, borderRadius: 3 }}>
          <Stack spacing={2.5}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 850 }}>Informations personnelles</Typography>
              <Typography color="text.secondary">
                Ces données servent à identifier le compte, vous contacter et adapter l’expérience sans collecter de justificatif ici.
              </Typography>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
              <TextField
                error={Boolean(fieldErrors.firstName)}
                helperText={fieldErrors.firstName}
                label="Prénom"
                onChange={(event) => updateField('firstName', event.target.value)}
                required
                value={form.firstName}
              />
              <TextField
                error={Boolean(fieldErrors.lastName)}
                helperText={fieldErrors.lastName}
                label="Nom"
                onChange={(event) => updateField('lastName', event.target.value)}
                required
                value={form.lastName}
              />
              <TextField
                error={Boolean(fieldErrors.email)}
                helperText={fieldErrors.email}
                label="Email"
                onChange={(event) => updateField('email', event.target.value)}
                required
                type="email"
                value={form.email}
              />
              <TextField
                error={Boolean(fieldErrors.phone)}
                helperText={fieldErrors.phone ?? 'Optionnel'}
                label="Téléphone"
                onChange={(event) => updateField('phone', event.target.value)}
                value={form.phone}
              />
              <TextField
                label="Canal de contact préféré"
                onChange={(event) => updateField('preferredContact', event.target.value as ContactPreference)}
                select
                value={form.preferredContact}
              >
                {Object.entries(contactLabels).map(([value, label]) => (
                  <MenuItem key={value} value={value}>{label}</MenuItem>
                ))}
              </TextField>
              <TextField
                label="Préférence d’accessibilité"
                onChange={(event) => updateField('accessibilityPreference', event.target.value as AccessibilityPreference)}
                select
                value={form.accessibilityPreference}
              >
                {Object.entries(accessibilityLabels).map(([value, label]) => (
                  <MenuItem key={value} value={value}>{label}</MenuItem>
                ))}
              </TextField>
            </Box>

            <Box>
              <Typography variant="h6" sx={{ fontWeight: 850, mb: 0.5 }}>Adresse</Typography>
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                Utile pour les courriers, justificatifs et règles locales d’éligibilité quand un dossier le nécessite.
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                <Box sx={{ gridColumn: { md: 'span 2' }, position: 'relative' }}>
                  <TextField
                    error={Boolean(fieldErrors.addressLine1)}
                    fullWidth
                    helperText={fieldErrors.addressLine1 ?? 'Saisissez au moins 3 caractères puis choisissez une adresse proposée.'}
                    label="Rechercher une adresse"
                    onChange={(event) => searchAddress(event.target.value)}
                    sx={{ pr: addressLoading ? 4 : 0 }}
                    value={addressQuery}
                  />
                  {addressLoading && (
                    <CircularProgress
                      size={18}
                      sx={{ position: 'absolute', right: 14, top: 18 }}
                    />
                  )}
                  {addressSuggestions.length > 0 && (
                    <Paper
                      elevation={5}
                      sx={{
                        border: `1px solid ${colors.greyMedium}`,
                        borderRadius: 2,
                        left: 0,
                        mt: 0.75,
                        overflow: 'hidden',
                        position: 'absolute',
                        right: 0,
                        zIndex: 10,
                      }}
                    >
                      {addressSuggestions.map((suggestion) => (
                        <Box
                          component="button"
                          key={suggestion.id}
                          onClick={() => selectAddress(suggestion)}
                          sx={{
                            bgcolor: colors.white,
                            border: 0,
                            borderBottom: `1px solid ${colors.greyMedium}`,
                            color: colors.anthracite,
                            cursor: 'pointer',
                            display: 'block',
                            font: 'inherit',
                            p: 1.5,
                            textAlign: 'left',
                            width: '100%',
                            '&:hover': { bgcolor: colors.blueLight },
                            '&:last-child': { borderBottom: 0 },
                          }}
                          type="button"
                        >
                          <Typography sx={{ fontWeight: 750 }}>{suggestion.label}</Typography>
                          <Typography color="text.secondary" variant="body2">{suggestion.postalCode} {suggestion.city}</Typography>
                        </Box>
                      ))}
                    </Paper>
                  )}
                </Box>
                <TextField
                  error={Boolean(fieldErrors.addressLine2)}
                  helperText={fieldErrors.addressLine2}
                  label="Complément d’adresse"
                  onChange={(event) => updateField('addressLine2', event.target.value)}
                  value={form.addressLine2}
                />
                <TextField
                  error={Boolean(fieldErrors.postalCode)}
                  helperText={fieldErrors.postalCode}
                  label="Code postal"
                  slotProps={{ input: { readOnly: true } }}
                  value={form.postalCode}
                />
                <TextField
                  error={Boolean(fieldErrors.city)}
                  helperText={fieldErrors.city}
                  label="Ville"
                  slotProps={{ input: { readOnly: true } }}
                  value={form.city}
                />
                <TextField
                  error={Boolean(fieldErrors.country)}
                  helperText={fieldErrors.country}
                  label="Pays"
                  slotProps={{ input: { readOnly: true } }}
                  value="FR"
                />
              </Box>
            </Box>

            <FormControlLabel
              control={<Switch checked={form.marketingOptIn} onChange={(event) => updateField('marketingOptIn', event.target.checked)} />}
              label="Recevoir des informations commerciales Comutitres"
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ justifyContent: 'flex-end' }}>
              <Button disabled={saving} onClick={submit} startIcon={<Save size={18} />} variant="contained">
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </Stack>
          </Stack>
        </Paper>

        <Stack spacing={3} sx={{ width: { xs: '100%', lg: 340 }, flexShrink: 0 }}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 850, mb: 2 }}>Données et consentements</Typography>
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                <ShieldCheck size={18} color={colors.greyDark} />
                <Box>
                  <Typography color="text.secondary" variant="caption">Type de compte</Typography>
                  <Typography sx={{ fontWeight: 750 }}>Compte client</Typography>
                </Box>
              </Stack>
              <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                <CheckCircle2 size={18} color={user.rgpdConsent ? colors.greenDark : colors.orangeDark} />
                <Box>
                  <Typography color="text.secondary" variant="caption">Consentement RGPD</Typography>
                  <Typography sx={{ fontWeight: 750 }}>
                    {user.rgpdConsent ? `Accepté le ${formatDate(user.rgpdConsentedAt)}` : 'À compléter'}
                  </Typography>
                </Box>
              </Stack>
              <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                <Mail size={18} color={colors.greyDark} />
                <Box>
                  <Typography color="text.secondary" variant="caption">Contact préféré</Typography>
                  <Typography sx={{ fontWeight: 750 }}>{contactLabels[user.preferredContact]}</Typography>
                </Box>
              </Stack>
              <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                <Phone size={18} color={colors.greyDark} />
                <Box>
                  <Typography color="text.secondary" variant="caption">Téléphone</Typography>
                  <Typography sx={{ fontWeight: 750 }}>{user.phone || 'Non renseigné'}</Typography>
                </Box>
              </Stack>
              <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                <Home size={18} color={colors.greyDark} />
                <Box>
                  <Typography color="text.secondary" variant="caption">Adresse</Typography>
                  <Typography sx={{ fontWeight: 750 }}>{savedAddress}</Typography>
                </Box>
              </Stack>
              <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                <UserRound size={18} color={colors.greyDark} />
                <Box>
                  <Typography color="text.secondary" variant="caption">Dernière mise à jour</Typography>
                  <Typography sx={{ fontWeight: 750 }}>{formatDate(user.profileUpdatedAt ?? user.updatedAt)}</Typography>
                </Box>
              </Stack>
            </Stack>
          </Paper>

          <Alert severity="info" sx={{ borderRadius: 2 }}>
            Les justificatifs et situations d’éligibilité restent liés aux dossiers de souscription, pas au profil compte.
          </Alert>
        </Stack>
      </Stack>
    </Stack>
  )
}

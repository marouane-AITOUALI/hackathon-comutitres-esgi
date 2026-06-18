import { Box, InputAdornment, Stack, TextField, Typography } from '@mui/material'
import { Calendar, CreditCard, Lock, User } from 'lucide-react'
import { colors } from '../../theme/colors'
import { formatCardNumber, formatCvv, formatExpiry } from './cardPaymentUtils'

type CardPaymentFieldsProps = {
  cardNumber: string
  onCardNumberChange: (value: string) => void
  expiry: string
  onExpiryChange: (value: string) => void
  cvv: string
  onCvvChange: (value: string) => void
  cardholderName: string
  onCardholderNameChange: (value: string) => void
}

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 2,
    bgcolor: colors.white,
  },
}

function displayCardNumber(value: string) {
  const digits = value.replace(/\D/g, '')
  if (!digits) return '•••• •••• •••• ••••'
  const padded = digits.padEnd(16, '•')
  return padded.replace(/(.{4})/g, '$1 ').trim()
}

function CardPreview({
  cardNumber,
  expiry,
  cardholderName,
}: Pick<CardPaymentFieldsProps, 'cardNumber' | 'expiry' | 'cardholderName'>) {
  return (
    <Box
      sx={{
        position: 'relative',
        borderRadius: 3,
        p: { xs: 2.5, sm: 3 },
        minHeight: 190,
        color: colors.white,
        background: `linear-gradient(135deg, ${colors.blueFocus} 0%, ${colors.purpleDark} 55%, ${colors.blueInteraction} 100%)`,
        boxShadow: '0 12px 32px rgba(0, 80, 170, 0.28)',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: -40,
          right: -40,
          width: 140,
          height: 140,
          borderRadius: '50%',
          bgcolor: 'rgba(255,255,255,0.08)',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: -50,
          left: -30,
          width: 160,
          height: 160,
          borderRadius: '50%',
          bgcolor: 'rgba(255,255,255,0.06)',
        }}
      />

      <Stack spacing={3} sx={{ position: 'relative', height: '100%', justifyContent: 'space-between' }}>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box
            sx={{
              width: 44,
              height: 32,
              borderRadius: 1,
              background: 'linear-gradient(135deg, #f5d76e 0%, #d4a017 100%)',
              border: '1px solid rgba(255,255,255,0.35)',
            }}
          />
          <Typography sx={{ fontWeight: 700, letterSpacing: 1.5, fontSize: 13, opacity: 0.9 }}>
            PROTOTYPE
          </Typography>
        </Stack>

        <Typography
          sx={{
            fontFamily: 'monospace',
            fontSize: { xs: 20, sm: 22 },
            letterSpacing: 2.5,
            fontWeight: 600,
            wordBreak: 'break-all',
          }}
        >
          {displayCardNumber(cardNumber)}
        </Typography>

        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <Box sx={{ minWidth: 0, pr: 2 }}>
            <Typography sx={{ fontSize: 10, opacity: 0.75, letterSpacing: 1, mb: 0.25 }}>
              TITULAIRE
            </Typography>
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: 14,
                textTransform: 'uppercase',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {cardholderName.trim() || 'NOM PRÉNOM'}
            </Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: 10, opacity: 0.75, letterSpacing: 1, mb: 0.25 }}>
              EXPIRE
            </Typography>
            <Typography sx={{ fontWeight: 700, fontSize: 14, fontFamily: 'monospace' }}>
              {expiry || 'MM/AA'}
            </Typography>
          </Box>
        </Stack>
      </Stack>
    </Box>
  )
}

export function CardPaymentFields({
  cardNumber,
  onCardNumberChange,
  expiry,
  onExpiryChange,
  cvv,
  onCvvChange,
  cardholderName,
  onCardholderNameChange,
}: CardPaymentFieldsProps) {
  return (
    <Stack spacing={2.5}>
      <Box
        sx={{
          display: 'grid',
          gap: 2.5,
          gridTemplateColumns: { xs: '1fr', md: 'minmax(260px, 340px) 1fr' },
          alignItems: 'start',
        }}
      >
        <CardPreview cardNumber={cardNumber} expiry={expiry} cardholderName={cardholderName} />

        <Stack spacing={2}>
          <TextField
            label="Numéro de carte"
            value={cardNumber}
            onChange={(event) => onCardNumberChange(formatCardNumber(event.target.value))}
            placeholder="1234 5678 9012 3456"
            fullWidth
            sx={fieldSx}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <CreditCard size={18} color={colors.greyDark} />
                  </InputAdornment>
                ),
              },
              htmlInput: {
                inputMode: 'numeric',
                autoComplete: 'cc-number',
              },
            }}
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Expiration"
              value={expiry}
              onChange={(event) => onExpiryChange(formatExpiry(event.target.value))}
              placeholder="MM/AA"
              sx={{ ...fieldSx, flex: 1 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Calendar size={18} color={colors.greyDark} />
                    </InputAdornment>
                  ),
                },
                htmlInput: {
                  inputMode: 'numeric',
                  autoComplete: 'cc-exp',
                },
              }}
            />
            <TextField
              label="CVV"
              value={cvv}
              onChange={(event) => onCvvChange(formatCvv(event.target.value))}
              placeholder="•••"
              sx={{ ...fieldSx, flex: 1 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock size={18} color={colors.greyDark} />
                    </InputAdornment>
                  ),
                },
                htmlInput: {
                  inputMode: 'numeric',
                  autoComplete: 'cc-csc',
                  maxLength: 4,
                },
              }}
            />
          </Stack>

          <TextField
            label="Titulaire de la carte"
            value={cardholderName}
            onChange={(event) => onCardholderNameChange(event.target.value)}
            placeholder="Nom Prénom"
            fullWidth
            sx={fieldSx}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <User size={18} color={colors.greyDark} />
                  </InputAdornment>
                ),
              },
              htmlInput: {
                autoComplete: 'cc-name',
              },
            }}
          />
        </Stack>
      </Box>
    </Stack>
  )
}

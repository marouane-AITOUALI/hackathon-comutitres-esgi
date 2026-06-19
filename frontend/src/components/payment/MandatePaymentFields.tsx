import { Box, Checkbox, FormControlLabel, InputAdornment, Stack, TextField, Typography } from '@mui/material'
import { Building2, Landmark, User } from 'lucide-react'
import { colors } from '../../theme/colors'
import { formatBic, formatIban } from './sepaPaymentUtils'

type MandatePaymentFieldsProps = {
  holderName: string
  onHolderNameChange: (value: string) => void
  iban: string
  onIbanChange: (value: string) => void
  bic: string
  onBicChange: (value: string) => void
  mandateAccepted: boolean
  onMandateAcceptedChange: (value: boolean) => void
}

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 2,
    bgcolor: colors.white,
  },
}

export function MandatePaymentFields({
  holderName,
  onHolderNameChange,
  iban,
  onIbanChange,
  bic,
  onBicChange,
  mandateAccepted,
  onMandateAcceptedChange,
}: MandatePaymentFieldsProps) {
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
        <Box
          sx={{
            borderRadius: 3,
            minHeight: 190,
            p: { xs: 2.5, sm: 3 },
            color: colors.white,
            background: `linear-gradient(135deg, ${colors.blueFocus} 0%, ${colors.blueInteraction} 58%, ${colors.purpleDark} 100%)`,
            boxShadow: '0 12px 32px rgba(0, 80, 170, 0.24)',
          }}
        >
          <Stack sx={{ height: '100%', justifyContent: 'space-between' }} spacing={3}>
            <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ bgcolor: 'rgba(255,255,255,0.16)', borderRadius: 1.5, display: 'grid', height: 44, placeItems: 'center', width: 44 }}>
                <Building2 size={23} />
              </Box>
              <Typography sx={{ fontSize: 13, fontWeight: 800, letterSpacing: 1.4 }}>MANDAT SEPA</Typography>
            </Stack>
            <Typography sx={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 650, letterSpacing: 1.4, wordBreak: 'break-word' }}>
              {iban || 'FR76 •••• •••• •••• •••• •••• •••'}
            </Typography>
            <Box>
              <Typography sx={{ fontSize: 10, opacity: 0.75, letterSpacing: 1 }}>TITULAIRE DU COMPTE</Typography>
              <Typography sx={{ fontWeight: 750, textTransform: 'uppercase' }}>{holderName.trim() || 'NOM PRÉNOM'}</Typography>
              <Typography sx={{ fontFamily: 'monospace', fontSize: 12, mt: 0.5, opacity: 0.85 }}>{bic || 'BIC'}</Typography>
            </Box>
          </Stack>
        </Box>

        <Stack spacing={2}>
          <TextField
            label="Titulaire du compte"
            value={holderName}
            onChange={(event) => onHolderNameChange(event.target.value)}
            fullWidth
            sx={fieldSx}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><User size={18} color={colors.greyDark} /></InputAdornment> } }}
          />
          <TextField
            label="IBAN"
            value={iban}
            onChange={(event) => onIbanChange(formatIban(event.target.value))}
            placeholder="FR76 3000 6000 0112 3456 7890 189"
            fullWidth
            sx={fieldSx}
            slotProps={{
              input: { startAdornment: <InputAdornment position="start"><Landmark size={18} color={colors.greyDark} /></InputAdornment> },
              htmlInput: { autoComplete: 'off', maxLength: 42 },
            }}
          />
          <TextField
            label="BIC"
            value={bic}
            onChange={(event) => onBicChange(formatBic(event.target.value))}
            placeholder="AGRIFRPP"
            fullWidth
            sx={fieldSx}
            slotProps={{ htmlInput: { autoComplete: 'off', maxLength: 11 } }}
          />
        </Stack>
      </Box>

      <FormControlLabel
        control={<Checkbox checked={mandateAccepted} onChange={(event) => onMandateAcceptedChange(event.target.checked)} />}
        label="J’autorise les prélèvements SEPA mensuels prévus par l’échéancier."
        sx={{ alignItems: 'flex-start', mx: 0 }}
      />
    </Stack>
  )
}

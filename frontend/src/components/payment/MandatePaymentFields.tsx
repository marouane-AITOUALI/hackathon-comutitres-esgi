import { Box, Checkbox, FormControlLabel, InputAdornment, Stack, TextField, Typography } from '@mui/material'
import { Building2, Hash, User } from 'lucide-react'
import { colors } from '../../theme/colors'

type MandatePaymentFieldsProps = {
  holderName: string
  onHolderNameChange: (value: string) => void
  ibanLast4: string
  onIbanLast4Change: (value: string) => void
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
  ibanLast4,
  onIbanLast4Change,
  mandateAccepted,
  onMandateAcceptedChange,
}: MandatePaymentFieldsProps) {
  return (
    <Stack spacing={2.5}>
      <Box
        sx={{
          borderRadius: 3,
          p: { xs: 2.5, sm: 3 },
          bgcolor: colors.greyLight40,
          border: `1px solid ${colors.greyMedium}`,
        }}
      >
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 2 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 1.5,
              display: 'grid',
              placeItems: 'center',
              bgcolor: colors.blueInteraction,
              color: colors.white,
            }}
          >
            <Building2 size={22} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 800, color: colors.anthracite }}>
              Mandat SEPA (prototype)
            </Typography>
            <Typography color="text.secondary" variant="body2">
              Autorisez le prélèvement sur votre compte bancaire.
            </Typography>
          </Box>
        </Stack>

        <Box
          sx={{
            px: 2,
            py: 1.5,
            borderRadius: 2,
            bgcolor: colors.white,
            border: `1px dashed ${colors.greyMedium}`,
            fontFamily: 'monospace',
            fontSize: 15,
            letterSpacing: 2,
            color: colors.greyDark,
            mb: 2,
          }}
        >
          FR •• •••• •••• •••• •••• {ibanLast4.padEnd(4, '•')}
        </Box>

        <Stack spacing={2}>
          <TextField
            label="Titulaire du compte"
            value={holderName}
            onChange={(event) => onHolderNameChange(event.target.value)}
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
            }}
          />
          <TextField
            label="4 derniers chiffres IBAN"
            value={ibanLast4}
            onChange={(event) => onIbanLast4Change(event.target.value.replace(/\D/g, '').slice(0, 4))}
            fullWidth
            sx={fieldSx}
            slotProps={{
              input: {
                inputMode: 'numeric',
                maxLength: 4,
                startAdornment: (
                  <InputAdornment position="start">
                    <Hash size={18} color={colors.greyDark} />
                  </InputAdornment>
                ),
              },
            }}
          />
        </Stack>
      </Box>

      <FormControlLabel
        control={
          <Checkbox
            checked={mandateAccepted}
            onChange={(event) => onMandateAcceptedChange(event.target.checked)}
            sx={{ '&.Mui-checked': { color: colors.blueInteraction } }}
          />
        }
        label="J’autorise le prélèvement SEPA pour ce forfait"
        sx={{ alignItems: 'flex-start', mx: 0 }}
      />
    </Stack>
  )
}

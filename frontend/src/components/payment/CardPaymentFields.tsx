import { Stack, TextField, Typography } from '@mui/material'
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
    <Stack spacing={2}>
      <Typography color="text.secondary" variant="body2">
        Prototype : ne saisissez pas de vraie carte bancaire.
      </Typography>
      <TextField
        label="Numéro de carte"
        value={cardNumber}
        onChange={(event) => onCardNumberChange(formatCardNumber(event.target.value))}
        placeholder="1234 5678 9012 3456"
        fullWidth
        slotProps={{ htmlInput: { inputMode: 'numeric', autoComplete: 'cc-number' } }}
      />
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField
          label="Expiration (MM/AA)"
          value={expiry}
          onChange={(event) => onExpiryChange(formatExpiry(event.target.value))}
          placeholder="12/28"
          sx={{ flex: 1 }}
          slotProps={{ htmlInput: { inputMode: 'numeric', autoComplete: 'cc-exp' } }}
        />
        <TextField
          label="CVV"
          value={cvv}
          onChange={(event) => onCvvChange(formatCvv(event.target.value))}
          placeholder="123"
          sx={{ flex: 1 }}
          slotProps={{ htmlInput: { inputMode: 'numeric', autoComplete: 'cc-csc', maxLength: 4 } }}
        />
      </Stack>
      <TextField
        label="Titulaire de la carte"
        value={cardholderName}
        onChange={(event) => onCardholderNameChange(event.target.value)}
        placeholder="Nom Prénom"
        fullWidth
        slotProps={{ htmlInput: { autoComplete: 'cc-name' } }}
      />
    </Stack>
  )
}

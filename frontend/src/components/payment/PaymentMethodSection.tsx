import { Box, Checkbox, FormControlLabel, Stack } from '@mui/material'
import { colors } from '../../theme/colors'
import { CardPaymentFields } from './CardPaymentFields'
import { MandatePaymentFields } from './MandatePaymentFields'
import { PaymentMethodSelector, type PaymentMethodChoice } from './PaymentMethodSelector'

type PaymentMethodSectionProps = {
  method: PaymentMethodChoice
  onMethodChange: (value: PaymentMethodChoice) => void
  cardNumber: string
  onCardNumberChange: (value: string) => void
  expiry: string
  onExpiryChange: (value: string) => void
  cvv: string
  onCvvChange: (value: string) => void
  cardholderName: string
  onCardholderNameChange: (value: string) => void
  simulateFailure?: boolean
  onSimulateFailureChange?: (value: boolean) => void
  holderName: string
  onHolderNameChange: (value: string) => void
  ibanLast4: string
  onIbanLast4Change: (value: string) => void
  mandateAccepted: boolean
  onMandateAcceptedChange: (value: boolean) => void
}

export function PaymentMethodSection({
  method,
  onMethodChange,
  cardNumber,
  onCardNumberChange,
  expiry,
  onExpiryChange,
  cvv,
  onCvvChange,
  cardholderName,
  onCardholderNameChange,
  simulateFailure = false,
  onSimulateFailureChange,
  holderName,
  onHolderNameChange,
  ibanLast4,
  onIbanLast4Change,
  mandateAccepted,
  onMandateAcceptedChange,
}: PaymentMethodSectionProps) {
  return (
    <Stack spacing={2.5}>
      <PaymentMethodSelector value={method} onChange={onMethodChange} />

      <Box
        sx={{
          p: { xs: 2, sm: 2.5 },
          borderRadius: 3,
          border: `1px solid ${colors.greyMedium}`,
          bgcolor: colors.greyLight40,
        }}
      >
        {method === 'card' ? (
          <Stack spacing={2}>
            <CardPaymentFields
              cardNumber={cardNumber}
              onCardNumberChange={onCardNumberChange}
              expiry={expiry}
              onExpiryChange={onExpiryChange}
              cvv={cvv}
              onCvvChange={onCvvChange}
              cardholderName={cardholderName}
              onCardholderNameChange={onCardholderNameChange}
            />
            {onSimulateFailureChange && (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={simulateFailure}
                    onChange={(event) => onSimulateFailureChange(event.target.checked)}
                    sx={{ '&.Mui-checked': { color: colors.orangeDark } }}
                  />
                }
                label="Simuler un refus de paiement"
                sx={{ mx: 0 }}
              />
            )}
          </Stack>
        ) : (
          <MandatePaymentFields
            holderName={holderName}
            onHolderNameChange={onHolderNameChange}
            ibanLast4={ibanLast4}
            onIbanLast4Change={onIbanLast4Change}
            mandateAccepted={mandateAccepted}
            onMandateAcceptedChange={onMandateAcceptedChange}
          />
        )}
      </Box>
    </Stack>
  )
}

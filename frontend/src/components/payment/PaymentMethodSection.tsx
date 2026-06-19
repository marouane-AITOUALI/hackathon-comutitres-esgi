import { Alert, Box, Checkbox, FormControlLabel, Stack } from '@mui/material'
import { colors } from '../../theme/colors'
import { CardPaymentFields } from './CardPaymentFields'
import { MandatePaymentFields } from './MandatePaymentFields'
import { PaymentMethodSelector, type PaymentMethodChoice } from './PaymentMethodSelector'

type PaymentMethodSectionProps = {
  method: PaymentMethodChoice
  onMethodChange: (value: PaymentMethodChoice) => void
  allowMandate: boolean
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
  iban: string
  onIbanChange: (value: string) => void
  bic: string
  onBicChange: (value: string) => void
  mandateAccepted: boolean
  onMandateAcceptedChange: (value: boolean) => void
}

export function PaymentMethodSection(props: PaymentMethodSectionProps) {
  const effectiveMethod = props.allowMandate ? props.method : 'card'
  return (
    <Stack spacing={2.5}>
      {props.allowMandate ? (
        <PaymentMethodSelector value={effectiveMethod} onChange={props.onMethodChange} />
      ) : (
        <Alert severity="info">Le paiement unique est réglé par carte bancaire. Le prélèvement SEPA est réservé à la mensualisation.</Alert>
      )}

      <Box sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 3, border: `1px solid ${colors.greyMedium}`, bgcolor: colors.greyLight40 }}>
        {effectiveMethod === 'card' ? (
          <Stack spacing={2}>
            <CardPaymentFields
              cardNumber={props.cardNumber}
              onCardNumberChange={props.onCardNumberChange}
              expiry={props.expiry}
              onExpiryChange={props.onExpiryChange}
              cvv={props.cvv}
              onCvvChange={props.onCvvChange}
              cardholderName={props.cardholderName}
              onCardholderNameChange={props.onCardholderNameChange}
            />
            {props.onSimulateFailureChange && (
              <FormControlLabel
                control={<Checkbox checked={props.simulateFailure ?? false} onChange={(event) => props.onSimulateFailureChange?.(event.target.checked)} />}
                label="Simuler un refus de paiement"
                sx={{ mx: 0 }}
              />
            )}
          </Stack>
        ) : (
          <MandatePaymentFields
            holderName={props.holderName}
            onHolderNameChange={props.onHolderNameChange}
            iban={props.iban}
            onIbanChange={props.onIbanChange}
            bic={props.bic}
            onBicChange={props.onBicChange}
            mandateAccepted={props.mandateAccepted}
            onMandateAcceptedChange={props.onMandateAcceptedChange}
          />
        )}
      </Box>
    </Stack>
  )
}

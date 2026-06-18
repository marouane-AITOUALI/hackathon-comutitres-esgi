import { Box, Stack, Typography } from '@mui/material'
import { CreditCard, Landmark } from 'lucide-react'
import { colors } from '../../theme/colors'

export type PaymentMethodChoice = 'card' | 'mandate'

type PaymentMethodSelectorProps = {
  value: PaymentMethodChoice
  onChange: (value: PaymentMethodChoice) => void
}

const options: { value: PaymentMethodChoice; label: string; description: string; icon: typeof CreditCard }[] = [
  { value: 'card', label: 'Carte bancaire', description: 'Paiement immédiat sécurisé', icon: CreditCard },
  { value: 'mandate', label: 'Prélèvement SEPA', description: 'Mandat de prélèvement', icon: Landmark },
]

export function PaymentMethodSelector({ value, onChange }: PaymentMethodSelectorProps) {
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
      {options.map((option) => {
        const selected = value === option.value
        const Icon = option.icon
        return (
          <Box
            key={option.value}
            component="button"
            type="button"
            onClick={() => onChange(option.value)}
            sx={{
              flex: 1,
              p: 2,
              textAlign: 'left',
              cursor: 'pointer',
              border: '2px solid',
              borderColor: selected ? colors.blueInteraction : colors.greyMedium,
              borderRadius: 2.5,
              bgcolor: selected ? colors.blueLight : colors.white,
              transition: 'border-color 0.2s, background-color 0.2s, box-shadow 0.2s',
              boxShadow: selected ? `0 0 0 1px ${colors.blueInteraction}22` : 'none',
              '&:hover': {
                borderColor: colors.blueInteraction,
                bgcolor: selected ? colors.blueLight : colors.greyLight40,
              },
            }}
          >
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 1.5,
                  display: 'grid',
                  placeItems: 'center',
                  bgcolor: selected ? colors.blueInteraction : colors.greyLight,
                  color: selected ? colors.white : colors.greyDark,
                  flexShrink: 0,
                }}
              >
                <Icon size={20} />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 800, color: colors.anthracite, fontSize: 15 }}>
                  {option.label}
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  {option.description}
                </Typography>
              </Box>
            </Stack>
          </Box>
        )
      })}
    </Stack>
  )
}

import { LinearProgress, Stack, Typography } from '@mui/material'

export function OnboardingProgress({ step }: { step: number }) {
  return (
    <Stack spacing={1} sx={{ mb: 3 }}>
      <Typography color="text.secondary" variant="body2">Etape {step} sur 4</Typography>
      <LinearProgress aria-label={`Progression : etape ${step} sur 4`} value={step * 25} variant="determinate" />
    </Stack>
  )
}

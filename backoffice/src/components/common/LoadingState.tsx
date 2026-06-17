import { CircularProgress, Stack, Typography } from '@mui/material'

export function LoadingState({ label = 'Chargement...' }: { label?: string }) {
  return (
    <Stack spacing={2} sx={{ alignItems: 'center', justifyContent: 'center', minHeight: 220 }}>
      <CircularProgress size={28} />
      <Typography color="text.secondary">{label}</Typography>
    </Stack>
  )
}

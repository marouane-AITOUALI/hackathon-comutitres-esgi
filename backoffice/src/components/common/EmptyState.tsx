import { Paper, Stack, Typography } from '@mui/material'
import type { ReactNode } from 'react'

interface EmptyStateProps {
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <Paper variant="outlined" sx={{ borderRadius: 4, p: 4, textAlign: 'center' }}>
      <Stack spacing={1.5} sx={{ alignItems: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>{title}</Typography>
        {description && <Typography color="text.secondary" sx={{ maxWidth: 520 }}>{description}</Typography>}
        {action && <Stack sx={{ mt: 1 }}>{action}</Stack>}
      </Stack>
    </Paper>
  )
}

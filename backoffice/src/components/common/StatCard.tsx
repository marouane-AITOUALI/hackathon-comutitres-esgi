import { Card, CardContent, Stack, Typography } from '@mui/material'
import type { ReactNode } from 'react'

interface StatCardProps {
  label: string
  value: string | number
  helper?: string
  tone?: 'primary' | 'success' | 'warning' | 'error' | 'neutral'
  icon?: ReactNode
}

const toneColors = {
  primary: 'primary.main',
  success: 'success.main',
  warning: 'warning.main',
  error: 'error.main',
  neutral: 'text.secondary',
}

export function StatCard({ label, value, helper, tone = 'primary', icon }: StatCardProps) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <Typography color="text.secondary" variant="body2">{label}</Typography>
            <Typography variant="h4" sx={{ color: toneColors[tone], fontWeight: 900, mt: 0.5 }}>{value}</Typography>
          </div>
          {icon}
        </Stack>
        {helper && <Typography color="text.secondary" variant="body2" sx={{ mt: 1 }}>{helper}</Typography>}
      </CardContent>
    </Card>
  )
}

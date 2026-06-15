import { Card, CardContent } from '@mui/material'
import type { PropsWithChildren } from 'react'

export function PageCard({ children }: PropsWithChildren) {
  return <Card sx={{ mx: 'auto', maxWidth: 760, boxShadow: 2 }}><CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>{children}</CardContent></Card>
}

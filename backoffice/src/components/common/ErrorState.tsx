import { Alert, Button, Paper, Stack } from '@mui/material'

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Paper sx={{ borderRadius: 4, p: 3 }}>
      <Stack spacing={2}>
        <Alert severity="error">{message}</Alert>
        {onRetry && <Button onClick={onRetry} sx={{ alignSelf: 'flex-start' }} variant="outlined">Reessayer</Button>}
      </Stack>
    </Paper>
  )
}

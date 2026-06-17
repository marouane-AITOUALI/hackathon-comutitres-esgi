import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material'

export function ConfirmDialog({
  confirmLabel = 'Confirmer',
  description,
  loading = false,
  onClose,
  onConfirm,
  open,
  title,
}: {
  confirmLabel?: string
  description: string
  loading?: boolean
  onClose: () => void
  onConfirm: () => void
  open: boolean
  title: string
}) {
  return (
    <Dialog fullWidth maxWidth="xs" onClose={onClose} open={open}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{description}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button disabled={loading} onClick={onClose}>Annuler</Button>
        <Button disabled={loading} onClick={onConfirm} variant="contained">{confirmLabel}</Button>
      </DialogActions>
    </Dialog>
  )
}

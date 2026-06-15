import { Button, Snackbar } from '@mui/material'
import { useState } from 'react'

export function IdfmConnectButton() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button fullWidth onClick={() => setOpen(true)} variant="outlined">Continuer avec Ile-de-France Mobilites Connect</Button>
      <Snackbar
        autoHideDuration={5000}
        message="L'integration Ile-de-France Mobilites Connect sera disponible dans une prochaine version du prototype."
        onClose={() => setOpen(false)}
        open={open}
      />
    </>
  )
}

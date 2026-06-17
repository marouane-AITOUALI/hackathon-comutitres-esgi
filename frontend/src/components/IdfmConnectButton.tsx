import { Box, Button, Snackbar, Stack, Typography } from '@mui/material'
import DirectionsSubwayOutlinedIcon from '@mui/icons-material/DirectionsSubwayOutlined'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { useState } from 'react'

export function IdfmConnectButton() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button
        fullWidth
        onClick={() => setOpen(true)}
        variant="outlined"
        sx={{
          py: 1.5,
          px: 2,
          textTransform: 'none',
          justifyContent: 'flex-start',
          borderColor: 'divider',
          color: 'text.primary',
          gap: 1.5,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 36,
            height: 36,
            bgcolor: 'primary.main',
            borderRadius: 1.5,
            flexShrink: 0,
          }}
        >
          <DirectionsSubwayOutlinedIcon sx={{ color: 'white', fontSize: 20 }} />
        </Box>
        <Stack sx={{ alignItems: 'flex-start', flex: 1 }}>
          <Typography component="span" variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }}>
            Se connecter avec
          </Typography>
          <Typography component="span" variant="body2" sx={{ fontWeight: 600, lineHeight: 1.3, color: 'text.primary' }}>
            Île-de-France Mobilités Connect
          </Typography>
        </Stack>
        <ChevronRightIcon sx={{ color: 'text.secondary', flexShrink: 0 }} />
      </Button>
      <Snackbar
        autoHideDuration={5000}
        message="L'integration Ile-de-France Mobilites Connect sera disponible dans une prochaine version du prototype."
        onClose={() => setOpen(false)}
        open={open}
      />
    </>
  )
}

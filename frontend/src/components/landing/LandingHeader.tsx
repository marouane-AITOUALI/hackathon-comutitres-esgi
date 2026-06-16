import { Box, Button, Stack, Typography } from '@mui/material'
import { Link } from 'react-router-dom'

const BRAND_BLUE = '#1972d2'

const navLinks = ['Comment ça marche', 'Nos forfaits', 'Tarifs & aides', 'Aide']

function Logos() {
  return (
    <Stack direction="row" spacing={1.75} sx={{ alignItems: 'center', flexShrink: 0 }}>
      <Typography
        component={Link}
        to="/"
        sx={{
          fontWeight: 800,
          fontSize: { xs: 18, md: 20 },
          color: '#fff',
          letterSpacing: -0.3,
          textDecoration: 'none',
          lineHeight: 1,
        }}
      >
        comu<span style={{ color: '#93c5fd' }}>titres</span>
      </Typography>

      <Box sx={{ width: '1px', height: 24, bgcolor: 'rgba(255,255,255,0.35)', flexShrink: 0 }} />

      <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
        <Box
          sx={{
            width: 26,
            height: 26,
            borderRadius: '50%',
            border: '2px solid #fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#fff' }} />
        </Box>
        <Typography
          sx={{
            fontWeight: 600,
            fontSize: 10.5,
            lineHeight: 1.15,
            color: 'rgba(255,255,255,0.85)',
            maxWidth: 88,
            display: { xs: 'none', sm: 'block' },
          }}
        >
          Île-de-France
          <br />
          Mobilités
        </Typography>
      </Stack>
    </Stack>
  )
}

export function LandingHeader() {
  return (
    <Box
      component="header"
      sx={{
        position: 'relative',
        zIndex: 2,
        px: { xs: 2, md: 4, lg: 5 },
        pt: 1.5,
        pb: 1,
      }}
    >
      <Box
        sx={{
          maxWidth: 1280,
          mx: 'auto',
          minHeight: 64,
          px: { xs: 1.5, md: 2.5 },
          display: 'grid',
          gridTemplateColumns: { xs: '1fr auto', lg: 'auto 1fr auto' },
          alignItems: 'center',
          gap: 2,
          borderRadius: 3,
          bgcolor: 'rgba(15, 23, 42, 0.22)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.14)',
        }}
      >
        <Logos />

        <Stack
          component="nav"
          direction="row"
          spacing={0.5}
          sx={{
            display: { xs: 'none', lg: 'flex' },
            alignItems: 'center',
            justifyContent: 'center',
            justifySelf: 'center',
          }}
        >
          {navLinks.map((link) => (
            <Typography
              key={link}
              component="a"
              href="#"
              sx={{
                color: 'rgba(255,255,255,0.9)',
                fontWeight: 500,
                fontSize: 14,
                textDecoration: 'none',
                px: 1.75,
                py: 1,
                borderRadius: 2,
                whiteSpace: 'nowrap',
                transition: 'background-color 0.2s, color 0.2s',
                '&:hover': {
                  color: '#fff',
                  bgcolor: 'rgba(255,255,255,0.12)',
                },
              }}
            >
              {link}
            </Typography>
          ))}
        </Stack>

        <Button
          component={Link}
          to="/auth/login"
          sx={{
            justifySelf: 'end',
            bgcolor: '#fff',
            color: BRAND_BLUE,
            fontWeight: 600,
            fontSize: 14,
            borderRadius: 999,
            px: 3,
            height: 42,
            minWidth: { xs: 120, sm: 140 },
            boxShadow: '0 2px 10px rgba(0,0,0,0.12)',
            '&:hover': {
              bgcolor: '#f8fafc',
              boxShadow: '0 4px 14px rgba(0,0,0,0.16)',
            },
          }}
        >
          Se connecter
        </Button>
      </Box>
    </Box>
  )
}

import { Box, Button, Stack, Typography } from '@mui/material'
import { LogIn } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AccessibilityMenu } from '../accessibility/AccessibilityMenu'
import { useAccessibility } from '../accessibility/useAccessibility'
import { BrandLogo } from './BrandLogo'

const BRAND_BLUE = '#1972d2'

function Logos() {
  return <BrandLogo variant="white" />
}

export function Header() {
  const { language } = useAccessibility()
  const navLinks = language === 'fr'
    ? [
        { label: 'Comment ça marche', href: '#comment-ca-marche' },
        { label: 'Nos forfaits', href: '#nos-forfaits' },
        { label: 'Tarifs & aides', href: '#tarifs-et-aides' },
        { label: 'Aide', href: '#aide' },
      ]
    : [
        { label: 'How it works', href: '#comment-ca-marche' },
        { label: 'Travel passes', href: '#nos-forfaits' },
        { label: 'Prices & support', href: '#tarifs-et-aides' },
        { label: 'Help', href: '#aide' },
      ]

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
          gap: { xs: 1, sm: 2 },
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
              key={link.href}
              component="a"
              href={link.href}
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
              {link.label}
            </Typography>
          ))}
        </Stack>

        <Stack direction="row" spacing={1} sx={{ justifySelf: 'end', alignItems: 'center' }}>
          <AccessibilityMenu tone="dark" />
          <Button
            component={Link}
            to="/auth/login"
            sx={{
              position: 'relative',
              overflow: 'hidden',
              color: '#fff',
              fontWeight: 700,
              fontSize: 14,
              borderRadius: 999,
              px: { xs: 2, sm: 3 },
              height: 42,
              minWidth: { xs: 104, sm: 140 },
              gap: 1,
              background: `linear-gradient(120deg, ${BRAND_BLUE}, #3b82f6 55%, #60a5fa)`,
              boxShadow: '0 8px 20px rgba(25,114,210,0.3)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              '&::after': {
                content: '""',
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(110deg, transparent 25%, rgba(255,255,255,0.38) 45%, transparent 65%)',
                transform: 'translateX(-140%)',
                transition: 'transform 0.55s ease',
              },
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 12px 26px rgba(25,114,210,0.42)',
                '&::after': {
                  transform: 'translateX(140%)',
                },
              },
              '&:focus-visible': {
                outline: '3px solid rgba(255,255,255,0.7)',
                outlineOffset: 3,
              },
              '& .MuiButton-startIcon': {
                display: { xs: 'none', sm: 'inherit' },
              },
            }}
            startIcon={<LogIn size={17} strokeWidth={2.3} />}
          >
            {language === 'fr' ? 'Se connecter' : 'Sign in'}
          </Button>
        </Stack>
      </Box>
    </Box>
  )
}

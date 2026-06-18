import { Box, Button, Chip, Paper, Stack, Typography } from '@mui/material'
import { CreditCard, Download, ShieldCheck, Smartphone } from 'lucide-react'
import { useEffect } from 'react'
import { AccessibilityMenu } from '../accessibility/AccessibilityMenu'
import { useAccessibility } from '../accessibility/useAccessibility'
import appPreviewUrl from '../assets/mobile-app-img.png'
import { colors } from '../theme/colors'

function StoreButton({ label, sublabel, href }: { label: string; sublabel: string; href: string }) {
  return (
    <Button
      component="a"
      href={href}
      rel="noreferrer"
      target="_blank"
      variant="contained"
      startIcon={<Download size={18} />}
      sx={{
        bgcolor: colors.anthracite,
        color: colors.white,
        borderRadius: 1,
        px: 2,
        py: 1.15,
        minWidth: { xs: '100%', sm: 190 },
        justifyContent: 'center',
        textTransform: 'none',
        '&:hover': { bgcolor: colors.blueFocus },
        '& .MuiButton-startIcon': {
          mr: 1,
        },
      }}
    >
      <Box sx={{ textAlign: 'center', lineHeight: 1.1 }}>
        <Typography component="span" sx={{ display: 'block', fontSize: 11, opacity: 0.78 }}>
          {sublabel}
        </Typography>
        <Typography component="span" sx={{ display: 'block', fontSize: 15, fontWeight: 850 }}>
          {label}
        </Typography>
      </Box>
    </Button>
  )
}

export function MobileAppPage() {
  const { language } = useAccessibility()
  const isFrench = language === 'fr'
  const benefits = [
    {
      icon: <CreditCard size={18} />,
      title: isFrench ? 'Titres' : 'Travel passes',
      text: isFrench ? 'Vos forfaits à portée de main.' : 'Your travel passes always within reach.',
    },
    {
      icon: <ShieldCheck size={18} />,
      title: isFrench ? 'Espace sécurisé' : 'Secure space',
      text: isFrench ? 'Vos données restent protégées.' : 'Your personal data remains protected.',
    },
    {
      icon: <Smartphone size={18} />,
      title: isFrench ? 'Rapide' : 'Fast',
      text: isFrench ? 'Documents, paiements et support en un geste.' : 'Documents, payments and support in one tap.',
    },
  ]

  useEffect(() => {
    const previousTitle = document.title
    document.title = isFrench ? 'Comutitres App mobile' : 'Comutitres mobile app'

    return () => {
      document.title = previousTitle
    }
  }, [isFrench])

  return (
    <Box
      id="main-content"
      component="main"
      tabIndex={-1}
      sx={{
        minHeight: '100vh',
        bgcolor: colors.appBackground,
        px: { xs: 2, md: 4 },
        py: { xs: 3, md: 5 },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Box sx={{ position: 'fixed', top: 18, right: 18, zIndex: 2 }}>
        <AccessibilityMenu />
      </Box>
      <Box sx={{ maxWidth: 1180, mx: 'auto' }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '0.82fr 1.18fr' },
            gap: { xs: 3, lg: 4 },
            alignItems: 'stretch',
          }}
        >
          <Stack spacing={3} sx={{ justifyContent: 'center' }}>
            <Box>
              <Chip
                icon={<Smartphone size={15} />}
                label={isFrench ? 'Application mobile' : 'Mobile app'}
                sx={{
                  mb: 2,
                  bgcolor: colors.blueMedium,
                  color: colors.blueFocus,
                  fontWeight: 850,
                  '& .MuiChip-icon': { color: colors.blueFocus },
                }}
              />
              <Typography
                variant="h3"
                sx={{
                  color: colors.anthracite,
                  fontWeight: 950,
                  lineHeight: 1.05,
                  maxWidth: 520,
                }}
              >
                {isFrench ? 'Comutitres sur mobile' : 'Comutitres on mobile'}
              </Typography>
              <Typography sx={{ color: colors.greyDark, fontSize: 17, lineHeight: 1.55, mt: 2, maxWidth: 520 }}>
                {isFrench
                  ? 'Suivez vos titres, documents et paiements depuis votre téléphone.'
                  : 'Track your travel passes, documents and payments from your phone.'}
              </Typography>
            </Box>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.25}
              sx={{ justifyContent: 'center', width: '100%' }}
            >
              <StoreButton
                href="https://www.apple.com/app-store/"
                label="App Store"
                sublabel={isFrench ? 'Télécharger sur' : 'Download on the'}
              />
              <StoreButton
                href="https://play.google.com/store"
                label="Google Play"
                sublabel={isFrench ? 'Disponible sur' : 'Get it on'}
              />
            </Stack>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                gap: 1.25,
              }}
            >
              {benefits.map((benefit) => (
                <Paper
                  key={benefit.title}
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: colors.greyMedium,
                    bgcolor: colors.white,
                    textAlign: 'center',
                  }}
                >
                  <Box sx={{ color: colors.blueInteraction, mb: 1, display: 'flex', justifyContent: 'center' }}>{benefit.icon}</Box>
                  <Typography sx={{ color: colors.anthracite, fontWeight: 850, fontSize: 14, mb: 0.5 }}>
                    {benefit.title}
                  </Typography>
                  <Typography sx={{ color: colors.greyDark, fontSize: 13, lineHeight: 1.55 }}>
                    {benefit.text}
                  </Typography>
                </Paper>
              ))}
            </Box>
          </Stack>

          <Paper
            elevation={0}
            sx={{
              minHeight: { xs: 320, md: 540 },
              overflow: 'hidden',
              borderRadius: 2,
              border: '1px solid',
              borderColor: colors.greyMedium,
              bgcolor: colors.white,
            }}
          >
            <Box
              component="img"
              src={appPreviewUrl}
              alt={isFrench ? "Aperçu de l'application mobile Comutitres" : 'Preview of the Comutitres mobile app'}
              sx={{
                display: 'block',
                width: '100%',
                height: '100%',
                minHeight: { xs: 320, md: 540 },
                objectFit: 'cover',
              }}
            />
          </Paper>
        </Box>
      </Box>
    </Box>
  )
}

import { Box, Button, Chip, Paper, Stack, Typography } from '@mui/material'
import { CreditCard, Download, ShieldCheck, Smartphone } from 'lucide-react'
import { useEffect } from 'react'
import appPreviewUrl from '../assets/mobile-app-img.png'
import { colors } from '../theme/colors'

const benefits = [
  {
    icon: <CreditCard size={18} />,
    title: 'Titres',
    text: 'Vos forfaits à portée de main.',
  },
  {
    icon: <ShieldCheck size={18} />,
    title: 'Espace sécurisé',
    text: 'Vos données restent protégées.',
  },
  {
    icon: <Smartphone size={18} />,
    title: 'Rapide',
    text: 'Documents, paiements et support en un geste.',
  },
]

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
  useEffect(() => {
    const previousTitle = document.title
    document.title = 'Comutitres App mobile'

    return () => {
      document.title = previousTitle
    }
  }, [])

  return (
    <Box
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
                label="Application mobile"
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
                Comutitres sur mobile
              </Typography>
              <Typography sx={{ color: colors.greyDark, fontSize: 17, lineHeight: 1.55, mt: 2, maxWidth: 520 }}>
                Suivez vos titres, documents et paiements depuis votre téléphone.
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
                sublabel="Télécharger sur"
              />
              <StoreButton
                href="https://play.google.com/store"
                label="Google Play"
                sublabel="Disponible sur"
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
              alt="Aperçu de l'application mobile Comutitres"
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

import { Box, Button, Chip, Paper, Stack, Typography } from '@mui/material'
import { CreditCard, Download, ShieldCheck, Smartphone } from 'lucide-react'
import appPreviewUrl from '../assets/jour.png'
import { colors } from '../theme/colors'

const benefits = [
  {
    icon: <CreditCard size={18} />,
    title: 'Titres toujours accessibles',
    text: 'Consultez vos forfaits, paiements et documents depuis votre téléphone.',
  },
  {
    icon: <ShieldCheck size={18} />,
    title: 'Espace sécurisé',
    text: 'Gardez vos informations et justificatifs dans un parcours protégé.',
  },
  {
    icon: <Smartphone size={18} />,
    title: 'Pensé mobile',
    text: 'Une navigation rapide pour les démarches courantes et le support.',
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
        borderRadius: 2,
        px: 2,
        py: 1.15,
        minWidth: { xs: '100%', sm: 190 },
        justifyContent: 'flex-start',
        textTransform: 'none',
        '&:hover': { bgcolor: colors.blueFocus },
      }}
    >
      <Box sx={{ textAlign: 'left', lineHeight: 1.1 }}>
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
  return (
    <Box sx={{ maxWidth: 1180, mx: 'auto' }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '0.92fr 1.08fr' },
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
                maxWidth: 560,
              }}
            >
              Votre espace Comutitres dans la poche
            </Typography>
            <Typography sx={{ color: colors.greyDark, fontSize: 17, lineHeight: 1.7, mt: 2, maxWidth: 580 }}>
              Téléchargez l’application pour suivre vos abonnements, consulter vos documents,
              vérifier vos paiements et accéder au support plus rapidement.
            </Typography>
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>
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
                }}
              >
                <Box sx={{ color: colors.blueInteraction, mb: 1 }}>{benefit.icon}</Box>
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
            position: 'relative',
            minHeight: { xs: 360, md: 520 },
            overflow: 'hidden',
            borderRadius: 2,
            border: '1px solid',
            borderColor: colors.greyMedium,
            bgcolor: colors.greyLight40,
          }}
        >
          <Box
            component="img"
            src={appPreviewUrl}
            alt="Aperçu de l'application mobile Comutitres"
            sx={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(90deg, ${colors.white} 0%, rgba(255,255,255,0.62) 28%, rgba(255,255,255,0.08) 72%)`,
            }}
          />
          <Paper
            elevation={0}
            sx={{
              position: 'absolute',
              left: { xs: 18, md: 28 },
              bottom: { xs: 18, md: 28 },
              width: { xs: 'calc(100% - 36px)', sm: 310 },
              p: 2,
              borderRadius: 2,
              border: '1px solid',
              borderColor: colors.greyMedium,
              bgcolor: 'rgba(255,255,255,0.92)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <Typography sx={{ color: colors.anthracite, fontWeight: 900, mb: 0.75 }}>
              Accès rapide mobile
            </Typography>
            <Typography sx={{ color: colors.greyDark, fontSize: 13, lineHeight: 1.55 }}>
              Un raccourci pratique pour suivre votre parcours, retrouver vos documents et contacter le support.
            </Typography>
          </Paper>
        </Paper>
      </Box>
    </Box>
  )
}

import { Box, Stack, Typography } from '@mui/material'
import CreditCardOutlinedIcon from '@mui/icons-material/CreditCardOutlined'
import RouteOutlinedIcon from '@mui/icons-material/RouteOutlined'
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined'
import type { ReactNode } from 'react'

const featureDefs = [
  {
    Icon: CreditCardOutlinedIcon,
    title: 'Gérez vos titres',
    description: 'Achetez et rechargez vos titres en toute simplicité.',
  },
  {
    Icon: RouteOutlinedIcon,
    title: 'Suivez vos trajets',
    description: 'Itinéraires, horaires et info trafic en temps réel.',
  },
  {
    Icon: NotificationsNoneOutlinedIcon,
    title: 'Restez informé',
    description: 'Alertes, perturbations et actualités du réseau.',
  },
]

export function LoginMapPanel() {
  return (
    <Box
      sx={{
        position: 'relative',
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        minHeight: 600,
        overflow: 'hidden',
        backgroundImage: 'url(/images/map-image.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, rgba(25,114,210,0.25) 0%, rgba(13,27,42,0.75) 100%)',
        }}
      />

      <Box
        sx={{
          position: 'absolute',
          bottom: 24,
          left: 24,
          right: 24,
          bgcolor: 'background.paper',
          borderRadius: 3,
          p: 3,
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
        }}
      >
        <Stack spacing={2.5}>
          {featureDefs.map(({ Icon, title, description }) => (
            <FeatureItem key={title} icon={<Icon color="primary" />} title={title} description={description} />
          ))}
        </Stack>
      </Box>
    </Box>
  )
}

function FeatureItem({
  icon,
  title,
  description,
}: {
  icon: ReactNode
  title: string
  description: string
}) {
  return (
    <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 40,
          height: 40,
          borderRadius: 2,
          bgcolor: '#DDEEFF',
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.25 }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </Box>
    </Stack>
  )
}

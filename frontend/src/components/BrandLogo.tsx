import { Box } from '@mui/material'
import { Link } from 'react-router-dom'
import logoBlack from '../assets/comutitres_v_noir.svg'
import logoWhiteTransparent from '../assets/comutitres_v_blanc_transparent.svg'

type BrandLogoProps = {
  variant?: 'black' | 'white'
}

export function BrandLogo({ variant = 'black' }: BrandLogoProps) {
  return (
    <Box
      component={Link}
      to="/"
      aria-label="Comutitres, retour à l’accueil"
      sx={{
        display: 'inline-flex',
        flexShrink: 0,
        borderRadius: 1.5,
        transition: 'opacity 0.2s ease, transform 0.2s ease',
        '&:hover': {
          opacity: 0.9,
          transform: 'translateY(-1px)',
        },
        '&:focus-visible': {
          outline: '3px solid rgba(147,197,253,0.75)',
          outlineOffset: 3,
        },
      }}
    >
      <Box
        component="img"
        src={variant === 'black' ? logoBlack : logoWhiteTransparent}
        alt="Comutitres et Île-de-France Mobilités"
        sx={{
          display: 'block',
          width: { xs: 104, sm: 132 },
          height: 'auto',
        }}
      />
    </Box>
  )
}

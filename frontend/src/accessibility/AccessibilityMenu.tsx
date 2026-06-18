import {
  Box,
  Button,
  Divider,
  FormControlLabel,
  IconButton,
  Menu,
  Stack,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { Accessibility, RotateCcw } from 'lucide-react'
import { useState, type MouseEvent } from 'react'
import { useAccessibility } from './useAccessibility'

interface AccessibilityMenuProps {
  tone?: 'light' | 'dark'
}

export function AccessibilityMenu({ tone = 'light' }: AccessibilityMenuProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const {
    language,
    textSize,
    highContrast,
    reducedMotion,
    underlineLinks,
    setLanguage,
    setTextSize,
    setHighContrast,
    setReducedMotion,
    setUnderlineLinks,
    resetAccessibility,
  } = useAccessibility()
  const isOpen = anchorEl !== null

  const labels = language === 'fr'
    ? {
        aria: 'Langue et accessibilité',
        title: 'Langue et accessibilité',
        language: 'Langue',
        display: 'Affichage',
        normal: 'Standard',
        large: 'Texte +',
        contrast: 'Contraste renforcé',
        motion: 'Réduire les animations',
        underline: 'Souligner les liens',
        reset: 'Réinitialiser',
      }
    : {
        aria: 'Language and accessibility',
        title: 'Language and accessibility',
        language: 'Language',
        display: 'Display',
        normal: 'Standard',
        large: 'Larger text',
        contrast: 'High contrast',
        motion: 'Reduce motion',
        underline: 'Underline links',
        reset: 'Reset',
      }

  const openMenu = (event: MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget)

  return (
    <>
      <IconButton
        aria-label={labels.aria}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={openMenu}
        size="small"
        sx={{
          width: 40,
          height: 40,
          border: isOpen
            ? '1.5px solid #64b5f6'
            : tone === 'dark'
              ? '1px solid rgba(255,255,255,0.28)'
              : '1.5px solid #d4dce6',
          borderRadius: 99,
          bgcolor: isOpen ? '#64b5f6' : tone === 'dark' ? 'rgba(15,23,42,0.2)' : '#fff',
          color: isOpen || tone === 'dark' ? '#fff' : '#52606d',
          backdropFilter: tone === 'dark' ? 'blur(10px)' : 'none',
          transition: 'color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease',
          '&:hover': {
            bgcolor: isOpen ? '#1972d2' : tone === 'dark' ? 'rgba(255,255,255,0.14)' : '#f1f5f9',
          },
        }}
      >
        <Accessibility size={19} aria-hidden="true" />
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={isOpen}
        onClose={() => setAnchorEl(null)}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              width: 300,
              maxWidth: 'calc(100vw - 24px)',
              borderRadius: 3,
              border: '1px solid #dbe3ec',
              boxShadow: '0 18px 50px rgba(15,23,42,0.18)',
            },
          },
        }}
      >
        <Box sx={{ px: 2.25, py: 1.5 }}>
          <Typography sx={{ fontWeight: 850, color: '#1a2b3c' }}>{labels.title}</Typography>
        </Box>
        <Divider />
        <Stack spacing={2} sx={{ p: 2.25 }}>
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 800, color: '#64748b', mb: 1 }}>
              {labels.language}
            </Typography>
            <ToggleButtonGroup
              exclusive
              fullWidth
              size="small"
              value={language}
              onChange={(_event, value) => value && setLanguage(value)}
              aria-label={labels.language}
            >
              <ToggleButton value="fr">Français</ToggleButton>
              <ToggleButton value="en">English</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 800, color: '#64748b', mb: 1 }}>
              {labels.display}
            </Typography>
            <ToggleButtonGroup
              exclusive
              fullWidth
              size="small"
              value={textSize}
              onChange={(_event, value) => value && setTextSize(value)}
              aria-label={labels.display}
            >
              <ToggleButton value="default">{labels.normal}</ToggleButton>
              <ToggleButton value="large">{labels.large}</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <Stack spacing={0.25}>
            <FormControlLabel
              control={<Switch checked={highContrast} onChange={(event) => setHighContrast(event.target.checked)} />}
              label={labels.contrast}
            />
            <FormControlLabel
              control={<Switch checked={reducedMotion} onChange={(event) => setReducedMotion(event.target.checked)} />}
              label={labels.motion}
            />
            <FormControlLabel
              control={<Switch checked={underlineLinks} onChange={(event) => setUnderlineLinks(event.target.checked)} />}
              label={labels.underline}
            />
          </Stack>

          <Button
            variant="text"
            startIcon={<RotateCcw size={16} />}
            onClick={resetAccessibility}
            sx={{ alignSelf: 'flex-start' }}
          >
            {labels.reset}
          </Button>
        </Stack>
      </Menu>
    </>
  )
}

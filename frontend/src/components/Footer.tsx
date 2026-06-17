import { Box, IconButton, Stack, Typography } from '@mui/material'
import { Link } from 'react-router-dom'

const FOOTER_BG = '#0d1b2a'

const footerColumns = [
  { title: 'À propos', links: ['Qui sommes-nous ?', 'Nos engagements'] },
  { title: 'Aide', links: ['FAQ', 'Nous contacter'] },
  { title: 'Informations', links: ['Mentions légales', 'Conditions générales'] },
  { title: 'Confidentialité', links: ['Politique de confidentialité', 'Gestion des cookies'] },
]

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

function SocialIcon({ label }: { label: string }) {
  const paths: Record<string, string> = {
    x: 'M4 4l16 16M20 4 4 20',
    facebook: 'M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3Z',
    instagram: 'M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Z M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z M17.5 6.5h.01',
    linkedin: 'M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-12h4v2M2 9h4v12H2z M4 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
  }

  return (
    <IconButton aria-label={label} sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: '#fff' } }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d={paths[label]} />
      </svg>
    </IconButton>
  )
}

export function Footer() {
  return (
    <Box component="footer" sx={{ bgcolor: FOOTER_BG, color: '#fff', px: { xs: 2, md: 5 }, pt: 6, pb: 3 }}>
      <Box sx={{ maxWidth: 1280, mx: 'auto' }}>
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={5} sx={{ mb: 5 }}>
          <Box sx={{ flex: 1, maxWidth: 360 }}>
            <Logos />
            <Typography sx={{ mt: 2, color: 'rgba(255,255,255,0.65)', fontSize: 14, lineHeight: 1.6 }}>
              La plateforme officielle de souscription de vos forfaits Île-de-France Mobilités.
            </Typography>
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 4, sm: 6 }} sx={{ flex: 2, justifyContent: 'flex-end' }}>
            {footerColumns.map((col) => (
              <Stack key={col.title} spacing={1.25}>
                <Typography sx={{ fontWeight: 800, fontSize: 14 }}>{col.title}</Typography>
                {col.links.map((link) => (
                  <Typography
                    key={link}
                    component="a"
                    href="#"
                    sx={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, textDecoration: 'none', '&:hover': { color: '#fff' } }}
                  >
                    {link}
                  </Typography>
                ))}
              </Stack>
            ))}
          </Stack>
        </Stack>

        <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.12)', pt: 3, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
          <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
            © {new Date().getFullYear()} Comutitres — Île-de-France Mobilités. Tous droits réservés.
          </Typography>
          <Stack direction="row" spacing={0.5}>
            <SocialIcon label="x" />
            <SocialIcon label="facebook" />
            <SocialIcon label="instagram" />
            <SocialIcon label="linkedin" />
          </Stack>
        </Box>
      </Box>
    </Box>
  )
}

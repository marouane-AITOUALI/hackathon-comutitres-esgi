import { Box, IconButton, Stack, Typography } from '@mui/material'
import { Link } from 'react-router-dom'
import { useAccessibility } from '../accessibility/useAccessibility'
import { BrandLogo } from './BrandLogo'

const FOOTER_BG = '#0d1b2a'

const socialLinks: Record<string, string> = {
  x: 'https://x.com/IDFmobilites',
  facebook: 'https://www.facebook.com/IDFmobilites',
  instagram: 'https://www.instagram.com/iledefrancemobilites/',
  linkedin: 'https://www.linkedin.com/company/ile-de-france-mobilites/',
}

function Logos() {
  return <BrandLogo variant="white" />
}

function SocialIcon({ label }: { label: string }) {
  const paths: Record<string, string> = {
    x: 'M18.9 2h3.3l-7.2 8.25L23.5 22h-6.65l-5.2-6.8L5.7 22H2.4l7.7-8.8L2 2h6.8l4.7 6.25L18.9 2Zm-1.15 17.9h1.85L7.8 4H5.8l11.95 15.9Z',
    facebook: 'M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3Z',
    instagram: 'M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Z M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z M17.5 6.5h.01',
    linkedin: 'M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-12h4v2M2 9h4v12H2z M4 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
  }

  return (
    <IconButton
      aria-label={label}
      component="a"
      href={socialLinks[label]}
      rel="noreferrer"
      target="_blank"
      sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: '#fff' } }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d={paths[label]} />
      </svg>
    </IconButton>
  )
}

export function Footer() {
  const { language } = useAccessibility()
  const footerColumns = language === 'fr'
    ? [
        { title: 'À propos', links: [{ label: 'Qui sommes-nous ?', to: '/infos/qui-sommes-nous' }, { label: 'Nos engagements', to: '/infos/engagements' }, { label: 'Application mobile', to: '/mobile-app' }] },
        { title: 'Aide', links: [{ label: 'FAQ', to: '/infos/faq' }, { label: 'Nous contacter', to: '/infos/contact' }] },
        { title: 'Informations', links: [{ label: 'Mentions légales', to: '/infos/mentions-legales' }, { label: 'Conditions générales', to: '/infos/conditions-generales' }] },
        { title: 'Confidentialité', links: [{ label: 'Politique de confidentialité', to: '/infos/confidentialite' }, { label: 'Gestion des cookies', to: '/infos/cookies' }] },
      ]
    : [
        { title: 'About', links: [{ label: 'Who are we?', to: '/infos/qui-sommes-nous' }, { label: 'Our commitments', to: '/infos/engagements' }, { label: 'Mobile app', to: '/mobile-app' }] },
        { title: 'Help', links: [{ label: 'FAQ', to: '/infos/faq' }, { label: 'Contact us', to: '/infos/contact' }] },
        { title: 'Information', links: [{ label: 'Legal notice', to: '/infos/mentions-legales' }, { label: 'Terms and conditions', to: '/infos/conditions-generales' }] },
        { title: 'Privacy', links: [{ label: 'Privacy policy', to: '/infos/confidentialite' }, { label: 'Cookie settings', to: '/infos/cookies' }] },
      ]

  return (
    <Box component="footer" sx={{ bgcolor: FOOTER_BG, color: '#fff', px: { xs: 2, md: 5 }, pt: 6, pb: 3 }}>
      <Box sx={{ maxWidth: 1280, mx: 'auto' }}>
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={5} sx={{ mb: 5 }}>
          <Box sx={{ flex: 1, maxWidth: 360 }}>
            <Logos />
            <Typography sx={{ mt: 2, color: 'rgba(255,255,255,0.65)', fontSize: 14, lineHeight: 1.6 }}>
              {language === 'fr'
                ? 'La plateforme officielle de souscription de vos forfaits Île-de-France Mobilités.'
                : 'The official platform for subscribing to your Île-de-France Mobilités travel passes.'}
            </Typography>
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 4, sm: 6 }} sx={{ flex: 2, justifyContent: 'flex-end' }}>
            {footerColumns.map((col) => (
              <Stack key={col.title} spacing={1.25}>
                <Typography sx={{ fontWeight: 800, fontSize: 14 }}>{col.title}</Typography>
                {col.links.map((link) => (
                  <Typography
                    key={link.to}
                    component={Link}
                    to={link.to}
                    sx={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, textDecoration: 'none', '&:hover': { color: '#fff' } }}
                  >
                    {link.label}
                  </Typography>
                ))}
              </Stack>
            ))}
          </Stack>
        </Stack>

        <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.12)', pt: 3, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
          <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
            © {new Date().getFullYear()} Comutitres · Île-de-France Mobilités. {language === 'fr' ? 'Tous droits réservés.' : 'All rights reserved.'}
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

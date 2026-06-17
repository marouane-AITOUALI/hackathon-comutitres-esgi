import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded'
import LaunchIcon from '@mui/icons-material/Launch'
import { Box, Chip, Divider, Link, Paper, Stack, Typography } from '@mui/material'
import { FloatingSupportChat } from '../components/FloatingSupportChat'
import { colors } from '../theme/colors'

const usefulLinks = [
  {
    section: 'Aide et contacts',
    links: [
      {
        label: 'Aide et contacts Île-de-France Mobilités',
        href: 'https://www.iledefrance-mobilites.fr/aide-et-contacts',
        detail: 'FAQ, démarches et contact usager.',
      },
      {
        label: 'Titres et tarifs',
        href: 'https://www.iledefrance-mobilites.fr/titres-et-tarifs',
        detail: 'Panorama des forfaits et titres disponibles.',
      },
    ],
  },
  {
    section: 'CGVU et supports',
    links: [
      {
        label: 'Forfait Navigo Annuel',
        href: 'https://www.iledefrance-mobilites.fr/titres-et-tarifs/detail/forfait-navigo-annuel',
        detail: 'Conditions, paiement, renouvellement et suspension.',
      },
      {
        label: 'Forfaits imagine R',
        href: 'https://www.iledefrance-mobilites.fr/titres-et-tarifs/liste?d=forfaits-imagine-r',
        detail: 'Élèves, étudiants, junior et justificatifs.',
      },
      {
        label: 'Navigo Liberté+',
        href: 'https://www.iledefrance-mobilites.fr/titres-et-tarifs/detail/liberte-plus',
        detail: 'Paiement à l’usage, passe ou téléphone compatible.',
      },
      {
        label: 'Passe Navigo',
        href: 'https://www.iledefrance-mobilites.fr/titres-et-tarifs/supports/passe-navigo',
        detail: 'Support physique, durée de vie, perte ou remplacement.',
      },
    ],
  },
  {
    section: 'Réductions et données',
    links: [
      {
        label: 'Tarification Solidarité Transport',
        href: 'https://www.iledefrance-mobilites.fr/titres-et-tarifs/solidarite',
        detail: 'Réduction 50%, Solidarité 75%, gratuité et renouvellement.',
      },
      {
        label: 'Données personnelles',
        href: 'https://www.iledefrance-mobilites.fr/donnees-personnelles',
        detail: 'Confidentialité, RGPD et traitement des données.',
      },
    ],
  },
]

export function SupportPage() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, minHeight: 0 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <AutoAwesomeRoundedIcon sx={{ color: colors.blueIleDeFrance }} />
            <Typography variant="h4" sx={{ fontWeight: 850 }}>
              Support intelligent
            </Typography>
          </Stack>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            Posez une question, suivez les vérifications guidées et consultez les ressources utiles.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
          <Chip label="CGVU" sx={{ bgcolor: colors.white, border: '1px solid', borderColor: colors.greyMedium, fontWeight: 800 }} />
          <Chip label="SAV" sx={{ bgcolor: colors.white, border: '1px solid', borderColor: colors.greyMedium, fontWeight: 800 }} />
          <Chip label="TST" sx={{ bgcolor: colors.white, border: '1px solid', borderColor: colors.greyMedium, fontWeight: 800 }} />
        </Stack>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 360px' },
          gap: 2.5,
          minHeight: 0,
          alignItems: 'stretch',
        }}
      >
        <FloatingSupportChat mode="page" />

        <Paper
          elevation={0}
          sx={{
            border: '1px solid',
            borderColor: colors.greyMedium,
            borderRadius: 2,
            bgcolor: colors.white,
            overflow: 'hidden',
          }}
        >
          <Box sx={{ p: 2, bgcolor: colors.greyLight40, borderBottom: '1px solid', borderColor: colors.greyMedium }}>
            <Typography sx={{ fontWeight: 850 }}>Liens utiles</Typography>
            <Typography sx={{ color: colors.greyDark, fontSize: 13, mt: 0.25 }}>
              Ressources issues des besoins projet : CGVU, FAQ, supports et données.
            </Typography>
          </Box>

          <Stack divider={<Divider />} sx={{ maxHeight: { lg: 'calc(100vh - 220px)' }, overflowY: 'auto' }}>
            {usefulLinks.map((group) => (
              <Box key={group.section} sx={{ p: 2 }}>
                <Typography sx={{ color: colors.anthracite, fontSize: 13, fontWeight: 850, mb: 1 }}>
                  {group.section}
                </Typography>
                <Stack spacing={1}>
                  {group.links.map((link) => (
                    <Box key={link.href}>
                      <Link
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        sx={{
                          color: colors.blueInteraction,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 0.5,
                          fontSize: 14,
                          fontWeight: 800,
                          textDecoration: 'none',
                          '&:hover': { textDecoration: 'underline' },
                        }}
                      >
                        {link.label}
                        <LaunchIcon sx={{ fontSize: 14 }} />
                      </Link>
                      <Typography sx={{ color: colors.greyDark, fontSize: 12.5, lineHeight: 1.35 }}>
                        {link.detail}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Box>
            ))}
          </Stack>
        </Paper>
      </Box>
    </Box>
  )
}

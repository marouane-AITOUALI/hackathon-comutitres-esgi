import { Box, Chip, Paper, Stack, Typography } from '@mui/material'
import { Navigate, useParams } from 'react-router-dom'
import { colors } from '../theme/colors'

type FooterPageContent = {
  title: string
  eyebrow: string
  intro: string
  sections: Array<{
    title: string
    body: string
  }>
}

const footerPages: Record<string, FooterPageContent> = {
  'qui-sommes-nous': {
    eyebrow: 'À propos',
    title: 'Qui sommes-nous ?',
    intro:
      'Comutitres accompagne la souscription et le suivi des forfaits de transport en Île-de-France, avec un parcours pensé pour clarifier les offres, les justificatifs et les étapes client.',
    sections: [
      {
        title: 'Notre rôle',
        body:
          'La plateforme centralise les démarches liées aux forfaits, au paiement, aux documents et au support client afin de rendre le parcours plus lisible.',
      },
      {
        title: 'Notre objectif',
        body:
          'Aider chaque usager à choisir le bon titre, comprendre les conditions associées et suivre son dossier depuis un espace unique.',
      },
      {
        title: 'Notre approche',
        body:
          'Nous privilégions une expérience simple, accessible et guidée, avec des informations compréhensibles et des points d’aide au bon moment.',
      },
    ],
  },
  engagements: {
    eyebrow: 'À propos',
    title: 'Nos engagements',
    intro:
      'Nos engagements couvrent la clarté des démarches, l’accessibilité, la protection des données et l’accompagnement des usagers dans les parcours SAV.',
    sections: [
      {
        title: 'Clarté',
        body:
          'Les informations essentielles sont présentées de manière structurée : choix du forfait, rôle du porteur et du payeur, pièces attendues et statuts du dossier.',
      },
      {
        title: 'Accessibilité',
        body:
          'Les parcours sont conçus pour rester utilisables sur mobile, tablette et ordinateur, avec une attention portée à la lisibilité et aux besoins d’assistance.',
      },
      {
        title: 'Accompagnement',
        body:
          'Le support aide à diagnostiquer les blocages courants avant de rediriger vers les bons moyens de contact lorsque la réponse automatique ne suffit pas.',
      },
    ],
  },
  faq: {
    eyebrow: 'Aide',
    title: 'FAQ',
    intro:
      'Retrouvez les réponses aux questions fréquentes sur les forfaits, les justificatifs, les paiements, le support Navigo et le suivi de dossier.',
    sections: [
      {
        title: 'Quel forfait choisir ?',
        body:
          'Le choix dépend du profil et de l’usage : Imagine R pour les élèves et étudiants, Navigo Annuel pour les trajets réguliers, Liberté+ pour certains usages occasionnels.',
      },
      {
        title: 'Quels justificatifs fournir ?',
        body:
          'Les documents varient selon le titre demandé : identité, scolarité, bourse, justificatif social ou document lié au payeur.',
      },
      {
        title: 'Que faire en cas de blocage ?',
        body:
          'Commencez par consulter la page Support. L’assistant peut guider le diagnostic et fournir les contacts utiles si la situation nécessite un conseiller.',
      },
    ],
  },
  contact: {
    eyebrow: 'Aide',
    title: 'Nous contacter',
    intro:
      'Pour une demande précise, préparez votre email de compte, le forfait concerné, le statut du dossier et les documents ou paiements liés.',
    sections: [
      {
        title: 'Téléphone',
        body: 'Le support est joignable au 09 69 39 22 22 pour les situations qui nécessitent un conseiller.',
      },
      {
        title: 'Email',
        body: 'Vous pouvez écrire à support@comutitres.fr en indiquant le contexte de la demande et les références disponibles.',
      },
      {
        title: 'Support en ligne',
        body: 'La page Support propose un assistant qui répond aux questions fréquentes et oriente vers les contacts adaptés.',
      },
    ],
  },
  'mentions-legales': {
    eyebrow: 'Informations',
    title: 'Mentions légales',
    intro:
      'Cette page regroupe les informations légales relatives à l’édition, l’hébergement et l’utilisation de la plateforme Comutitres.',
    sections: [
      {
        title: 'Éditeur',
        body:
          'Comutitres met à disposition une plateforme de souscription et de suivi des forfaits de transport. Les informations détaillées peuvent être complétées par l’administrateur du service.',
      },
      {
        title: 'Hébergement',
        body:
          'L’hébergement technique doit garantir la disponibilité, la sécurité et la protection des données traitées dans le cadre des services proposés.',
      },
      {
        title: 'Responsabilité',
        body:
          'Les informations affichées ont vocation à guider l’usager. Les conditions contractuelles applicables restent celles du titre ou du service concerné.',
      },
    ],
  },
  'conditions-generales': {
    eyebrow: 'Informations',
    title: 'Conditions générales',
    intro:
      'Les conditions générales encadrent la souscription, le paiement, le renouvellement, la suspension et l’utilisation des forfaits proposés.',
    sections: [
      {
        title: 'Souscription',
        body:
          'La souscription nécessite des informations exactes, l’acceptation des conditions applicables et, selon le forfait, la transmission de justificatifs.',
      },
      {
        title: 'Paiement',
        body:
          'Le payeur est responsable du moyen de paiement fourni, des prélèvements éventuels et de la régularisation en cas d’impayé.',
      },
      {
        title: 'Renouvellement et suspension',
        body:
          'Les règles varient selon le titre : date anniversaire, fin de droits, justificatifs à renouveler ou conditions spécifiques de résiliation.',
      },
    ],
  },
  confidentialite: {
    eyebrow: 'Confidentialité',
    title: 'Politique de confidentialité',
    intro:
      'La politique de confidentialité explique comment les données personnelles sont collectées, utilisées, protégées et conservées dans le cadre du service.',
    sections: [
      {
        title: 'Données collectées',
        body:
          'Les données peuvent concerner l’identité, les coordonnées, le profil de souscription, les justificatifs, les paiements et les préférences d’accompagnement.',
      },
      {
        title: 'Finalités',
        body:
          'Elles servent à créer le compte, gérer la souscription, vérifier les droits, traiter les paiements et assurer le support client.',
      },
      {
        title: 'Sécurité',
        body:
          'Les documents sensibles doivent être transmis via les espaces sécurisés prévus, avec des accès limités aux besoins du traitement.',
      },
    ],
  },
  cookies: {
    eyebrow: 'Confidentialité',
    title: 'Gestion des cookies',
    intro:
      'Les cookies permettent d’assurer le fonctionnement du site, de mémoriser certains choix et, selon les paramètres, d’améliorer l’expérience utilisateur.',
    sections: [
      {
        title: 'Cookies nécessaires',
        body:
          'Ils permettent le bon fonctionnement du service, notamment la sécurité, la session utilisateur et l’accès aux pages essentielles.',
      },
      {
        title: 'Préférences',
        body:
          'Certains cookies peuvent mémoriser les choix d’affichage ou les préférences de confort pour faciliter les prochaines visites.',
      },
      {
        title: 'Contrôle',
        body:
          'L’utilisateur doit pouvoir comprendre les catégories utilisées et adapter ses choix lorsque des cookies non nécessaires sont proposés.',
      },
    ],
  },
}

export function FooterInfoPage() {
  const { page = '' } = useParams()
  const content = footerPages[page]

  if (!content) return <Navigate replace to="/" />

  return (
    <Box sx={{ maxWidth: 960, mx: 'auto' }}>
      <Chip
        label={content.eyebrow}
        sx={{
          mb: 2,
          bgcolor: colors.blueMedium,
          color: colors.blueFocus,
          fontWeight: 800,
        }}
      />
      <Typography variant="h3" sx={{ color: colors.anthracite, fontWeight: 900, mb: 2 }}>
        {content.title}
      </Typography>
      <Typography sx={{ color: colors.greyDark, fontSize: 18, lineHeight: 1.7, maxWidth: 780, mb: 4 }}>
        {content.intro}
      </Typography>

      <Stack spacing={2}>
        {content.sections.map((section) => (
          <Paper
            key={section.title}
            elevation={0}
            sx={{
              p: { xs: 2.25, md: 3 },
              borderRadius: 2,
              border: '1px solid',
              borderColor: colors.greyMedium,
              bgcolor: colors.white,
            }}
          >
            <Typography variant="h6" sx={{ color: colors.anthracite, fontWeight: 850, mb: 1 }}>
              {section.title}
            </Typography>
            <Typography sx={{ color: colors.greyDark, lineHeight: 1.7 }}>
              {section.body}
            </Typography>
          </Paper>
        ))}
      </Stack>
    </Box>
  )
}

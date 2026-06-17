export const colors = {
  // Blues
  blueIleDeFrance: '#64B5F6',   // bleu clair Île-de-France (sidebar accent, CTA secondaire)
  blueInteraction: '#1972D2',   // bleu principal, actions primaires, liens
  blueFocus: '#0050AA',         // bleu foncé, hover / focus des actions primaires
  blueLight: '#F5F9FF',         // fond global très clair (background default)
  blueMedium: '#DDEEFF',        // fond actif sidebar, pills

  // Neutrals
  anthracite: '#253038',        // texte principal
  greyDark: '#53606E',          // texte secondaire, icônes inactives
  greyMedium: '#DDDDDD',        // bordures, séparateurs
  greyLight: '#F0F0F0',         // hover neutre, fond input
  greyLight40: '#F9F9F9',       // fond alternatif très léger
  appBackground: '#F3F3F3',
  sidebarBackground: '#FAFAFA',

  // Misc
  white: '#FFFFFF',

  // Status
  redDark: '#C52625',           // erreur, destructif
  redLight: '#DB5454',          // erreur secondaire / hover
  orangeDark: '#F39224',        // avertissement
  orangeLight: '#FFE500',       // avertissement léger / badge

  // Accent
  pinkDark: '#E72F69',
  pinkLight: '#FFA3A3',
  purpleDark: '#4F3388',
  purpleLight: '#9385BE',
  greenDark: '#007D44',         // succès
  greenLight: '#53B476',        // succès secondaire
} as const

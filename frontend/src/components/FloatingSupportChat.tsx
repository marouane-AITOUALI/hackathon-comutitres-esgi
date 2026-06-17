import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded'
import CloseIcon from '@mui/icons-material/Close'
import OpenInFullIcon from '@mui/icons-material/OpenInFull'
import SendIcon from '@mui/icons-material/Send'
import {
  alpha,
  Avatar,
  Badge,
  Box,
  Chip,
  Divider,
  Fab,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { colors } from '../theme/colors'

type SupportMessage = {
  id: number
  from: 'bot' | 'user'
  text: string
  feedback?: 'up' | 'down'
  allowFeedback?: boolean
  contactCard?: boolean
  guidedCheck?: GuidedCheck
  guidanceAnswered?: boolean
  guidanceAnswer?: boolean
  context?: string
}

type SupportAnswer = {
  title: string
  keywords: string[]
  weight?: number
  answer: string
}

type ResolvedSupportAnswer = {
  text: string
  shouldOfferContact?: boolean
  guidedCheck?: GuidedCheck
}

type GuidedCheck = {
  question: string
  yes: string
  no: string
}

const quickQuestions = [
  'Quel forfait choisir ?',
  'Quels justificatifs fournir ?',
  'J’ai perdu mon passe',
  'Changer de payeur',
]

const supportContact = {
  phone: '09 69 39 22 22',
  email: 'support@comutitres.fr',
} as const

const contactAnswer =
  "Je suis désolé, ma réponse n'a pas l'air suffisante.\n\n"
  + "Voici les moyens de contact pour résoudre le problème avec un conseiller."

const dissatisfactionKeywords = [
  'pas utile',
  'inutile',
  'ca aide pas',
  'ça aide pas',
  'ca ne m aide pas',
  'ça ne m aide pas',
  'pas pertinent',
  'mauvaise reponse',
  'mauvaise réponse',
  'tu comprends pas',
  'je comprends pas',
  'pas compris',
  'ça marche pas',
  'ca marche pas',
  'ne marche pas',
  'toujours bloque',
  'toujours bloqué',
  'je veux un conseiller',
  'je veux parler a quelqu un',
  'je veux parler à quelqu un',
  'humain',
  'agent',
  'contact support',
]

const supportKnowledge: SupportAnswer[] = [
  {
    title: 'Choix du forfait',
    keywords: [
      'forfait',
      'abonnement',
      'titre',
      'choisir',
      'choix',
      'conseille',
      'recommande',
      'adapté',
      'adapte',
      'offre',
      'navigo',
      'imagine',
      'imagine r',
      'liberté',
      'liberte',
      'annuel',
      'mensuel',
      'mois',
      'semaine',
      'hebdo',
      'trajet',
      'transport',
      'quotidien',
      'occasionnel',
      'étudiant',
      'etudiant',
      'scolaire',
      'senior',
      'jeune',
    ],
    answer:
      "Le choix dépend surtout du profil et de l'usage. Pour des trajets quotidiens, Navigo Annuel est souvent adapté. Pour les élèves et étudiants, on regarde Imagine R. Pour un usage occasionnel, Navigo Liberté+ peut être plus pertinent. Le parcours d'onboarding sert justement à croiser âge, statut, fréquence et support souhaité.",
  },
  {
    title: 'Porteur et payeur',
    keywords: [
      'porteur',
      'payeur',
      'payer',
      'paie',
      'paye',
      'paiement',
      'finance',
      'financer',
      'parent',
      'enfant',
      'mineur',
      'tuteur',
      'responsable',
      'association',
      'employeur',
      'entreprise',
      'beneficiaire',
      'bénéficiaire',
      'utilisateur',
      'utilise',
      'contrat',
      'changer de payeur',
    ],
    answer:
      "Le porteur est la personne qui utilise le titre de transport. Le payeur est la personne ou structure qui finance l'abonnement. Ils peuvent être identiques, mais pas toujours : un parent peut payer pour son enfant, une association pour un bénéficiaire, ou un employeur pour un salarié.",
  },
  {
    title: 'Justificatifs',
    keywords: [
      'document',
      'documents',
      'justificatif',
      'justificatifs',
      'papier',
      'papiers',
      'preuve',
      'preuves',
      'pièce',
      'piece',
      'identité',
      'identite',
      'carte identite',
      'cni',
      'passeport',
      'attestation',
      'certificat',
      'scolarité',
      'scolarite',
      'bourse',
      'boursier',
      'upload',
      'televerser',
      'téléverser',
      'envoyer',
      'deposer',
      'déposer',
      'fichier',
      'pdf',
      'photo',
    ],
    answer:
      "Les justificatifs dépendent du titre demandé. Une pièce d'identité peut être demandée pour sécuriser le contrat, une attestation de scolarité ou de bourse pour Imagine R, et des justificatifs sociaux pour la Tarification Solidarité Transport. Les fichiers sont déposés dans l'espace Documents.",
  },
  {
    title: 'Tarification Solidarité Transport',
    keywords: [
      'tst',
      'solidarité',
      'solidarite',
      'tarification solidarite',
      'rsa',
      'aah',
      'caf',
      'cmu',
      'css',
      'chomage',
      'demandeur emploi',
      'aide sociale',
      'gratuité',
      'gratuite',
      'gratuit',
      'réduction',
      'reduction',
      'réduit',
      'reduit',
      '75',
      '50',
      'precarite',
      'précarité',
      'droits sociaux',
    ],
    answer:
      "La Tarification Solidarité Transport concerne certains bénéficiaires sociaux. Elle peut donner droit à une réduction de 50%, à Solidarité 75% ou à la gratuité. Contrairement aux forfaits annuels classiques, les droits TST sont vérifiés et renouvelés par périodes plus courtes, souvent autour de 3 mois.",
  },
  {
    title: 'Renouvellement',
    keywords: [
      'renouvellement',
      'renouveler',
      'renouvelle',
      'anniversaire',
      'automatique',
      'reconduction',
      'date',
      'expiration',
      'expire',
      'fin',
      'suspendre',
      'suspension',
      'arreter',
      'arrêter',
      'résilier',
      'resilier',
      'annuler',
      'continuer',
    ],
    answer:
      "Le renouvellement dépend du titre. Navigo Annuel et Navigo Senior peuvent être reconduits à date anniversaire selon les conditions du contrat. Imagine R se renouvelle chaque année. La TST suit ses propres périodes de droits. Si les conditions ne sont plus remplies, le contrat ou les prélèvements peuvent être suspendus.",
  },
  {
    title: 'RGPD et données',
    keywords: [
      'rgpd',
      'donnée',
      'donnee',
      'données',
      'donnees',
      'confidentialité',
      'confidentialite',
      'vie privée',
      'vie privee',
      'sécurité',
      'securite',
      'personnel',
      'personnelles',
      'conservation',
      'suppression',
      'supprimer',
      'traitement',
      'consentement',
      'protection',
      'privacy',
    ],
    answer:
      "Les données personnelles servent à créer le compte, gérer la souscription, vérifier les droits et traiter les paiements. Les justificatifs doivent être manipulés avec prudence, uniquement côté serveur, et conservés selon les règles prévues par les CGVU et la politique de confidentialité.",
  },
  {
    title: 'Support téléphone ou passe',
    keywords: [
      'support',
      'passe',
      'pass',
      'carte',
      'navigo',
      'téléphone',
      'telephone',
      'mobile',
      'smartphone',
      'iphone',
      'android',
      'nfc',
      'physique',
      'dematerialise',
      'dématérialisé',
      'valider',
    ],
    answer:
      "Selon le titre, le support peut être un passe Navigo physique ou un téléphone compatible NFC. Certains forfaits imposent un passe physique, notamment Imagine R. Les titres comme Navigo Annuel, mois, semaine ou Liberté+ peuvent être compatibles avec le téléphone selon les conditions du support.",
  },
  {
    title: 'Perte, vol ou remplacement du passe',
    keywords: [
      'perdu',
      'perte',
      'vol',
      'vole',
      'volé',
      'casse',
      'cassé',
      'abime',
      'abîmé',
      'remplacer',
      'remplacement',
      'duplicata',
      'refaire',
      'nouveau passe',
      'nouvelle carte',
      'changer carte',
      'bloquer',
      'opposition',
      'support perdu',
      'passe perdu',
      'carte perdue',
      'navigo perdu',
    ],
    answer:
      "En cas de perte, vol ou passe abîmé, le parcours SAV doit d'abord identifier le support concerné, puis bloquer l'ancien si nécessaire et demander un remplacement. L'utilisateur doit vérifier ses informations personnelles et l'adresse d'envoi. Selon le titre, un duplicata ou une réémission du passe peut être demandé depuis l'espace client ou via le support.",
  },
  {
    title: 'Paiement',
    keywords: [
      'prix',
      'tarif',
      'cout',
      'coût',
      'payer',
      'paiement',
      'prelevement',
      'prélèvement',
      'mensualité',
      'mensualite',
      'facture',
      'iban',
      'mandat',
      'cb',
      'carte bancaire',
      'refus',
      'rejet',
      'regularisation',
      'régularisation',
      'impaye',
      'impayé',
    ],
    answer:
      "Le paiement dépend de l'offre : certains titres peuvent être payés au comptant, d'autres par prélèvement ou paiement direct. Le payeur est responsable des prélèvements et des régularisations en cas de rejet. Dans l'espace Paiements, vous pouvez suivre les paiements, mandats et éventuelles régularisations.",
  },
  {
    title: 'Changement de payeur',
    keywords: [
      'changer de payeur',
      'changement payeur',
      'nouveau payeur',
      'modifier payeur',
      'remplacer payeur',
      'autre payeur',
      'parent payeur',
      'iban payeur',
      'coordonnees bancaires',
      'coordonnées bancaires',
      'mandat sepa',
      'responsable paiement',
      'qui paye',
      'qui paie',
      'payer a la place',
      'payeur ne veut plus',
    ],
    answer:
      "Pour changer de payeur, il faut distinguer le porteur du contrat et la personne qui finance. Le nouveau payeur doit fournir ses informations, accepter les CGVU payeur et valider le moyen de paiement ou le mandat SEPA. Selon l'état du contrat, le changement peut nécessiter une validation avant les prochains prélèvements.",
  },
  {
    title: 'Suspension, arrêt ou résiliation',
    keywords: [
      'suspendre abonnement',
      'suspension abonnement',
      'arreter abonnement',
      'arrêter abonnement',
      'resilier abonnement',
      'résilier abonnement',
      'annuler abonnement',
      'mettre en pause',
      'pause contrat',
      'stopper',
      'interrompre',
      'demenagement',
      'déménagement',
      'plus besoin',
      'je ne prends plus',
      'fin contrat',
    ],
    answer:
      "Pour suspendre ou arrêter un abonnement, le parcours SAV doit vérifier le type de titre, l'état du contrat, le mode de paiement et les conditions CGVU. Certains contrats peuvent être suspendus si les droits ne sont plus validés, d'autres nécessitent une demande de résiliation ou d'annulation avant une date limite.",
  },
  {
    title: 'Paiement rejeté ou impayé',
    keywords: [
      'paiement rejete',
      'paiement rejeté',
      'prelevement rejete',
      'prélèvement rejeté',
      'rejet bancaire',
      'impaye',
      'impayé',
      'regulariser',
      'régulariser',
      'regularisation',
      'régularisation',
      'retard paiement',
      'echec paiement',
      'échec paiement',
      'carte refusee',
      'carte refusée',
      'banque refuse',
      'recouvrement',
    ],
    answer:
      "En cas de paiement rejeté ou d'impayé, l'utilisateur doit régulariser le paiement et vérifier son moyen de paiement. Le SAV doit afficher le montant, l'échéance concernée et le statut du contrat. Si la régularisation n'est pas faite, le contrat peut être suspendu selon les règles de gestion.",
  },
  {
    title: 'Suivi de dossier et validation',
    keywords: [
      'suivi dossier',
      'statut dossier',
      'ou en est',
      'où en est',
      'validation',
      'valider dossier',
      'en attente',
      'attente validation',
      'document refuse',
      'document refusé',
      'document accepte',
      'document accepté',
      'piece refusee',
      'pièce refusée',
      'combien de temps',
      'delai',
      'délai',
      'traitement dossier',
      'relancer',
    ],
    answer:
      "Pour suivre un dossier, il faut regarder le statut de la souscription, les documents attendus et les paiements associés. Si un document est refusé, l'utilisateur doit lire le motif, renvoyer un justificatif conforme, puis attendre une nouvelle validation. Les statuts importants sont : documents en attente, paiement en attente, validation en cours, accepté ou rejeté.",
  },
  {
    title: 'Modification des informations personnelles',
    keywords: [
      'modifier mes infos',
      'changer mes infos',
      'adresse',
      'nouvelle adresse',
      'mail',
      'email',
      'telephone',
      'téléphone',
      'nom',
      'prenom',
      'prénom',
      'profil',
      'coordonnees',
      'coordonnées',
      'erreur informations',
      'corriger profil',
      'mettre a jour',
      'mettre à jour',
    ],
    answer:
      "Les informations personnelles se modifient depuis le profil client. Certaines données simples comme l'adresse, l'email ou le téléphone peuvent être mises à jour directement. Pour les données sensibles liées au contrat ou à l'identité du porteur, une vérification ou un justificatif peut être nécessaire.",
  },
  {
    title: 'Renouvellement des droits TST ou réduction',
    keywords: [
      'renouveler droits',
      'droits expires',
      'droits expirés',
      'droit tst',
      'fin des droits',
      'renouvellement tst',
      'renouvellement reduction',
      'renouvellement réduction',
      'attestation caf',
      'justificatif social',
      'perdre reduction',
      'perdre réduction',
      'retour plein tarif',
      'plein tarif',
    ],
    answer:
      "Pour la TST ou les réductions liées à une situation sociale, les droits doivent être revérifiés régulièrement. Si les droits expirent, le client doit fournir un justificatif à jour. Sans validation, le contrat peut basculer vers le plein tarif ou être suspendu selon les conditions applicables.",
  },
  {
    title: 'Besoin d’un conseiller',
    keywords: [
      'conseiller',
      'humain',
      'agent',
      'contact',
      'telephone support',
      'téléphone support',
      'mail support',
      'aide humaine',
      'parler quelqu un',
      'parler à quelqu un',
      'reclamation',
      'réclamation',
      'litige',
      'urgence',
      'bloque',
      'bloqué',
    ],
    answer:
      "Si la demande est bloquante, sensible ou ne rentre pas dans les cas simples, le parcours SAV doit proposer un contact avec un conseiller. Il faut idéalement joindre le numéro de dossier, le titre concerné, le statut actuel et les documents ou paiements liés pour éviter de répéter les informations.",
  },
]

const fallbackAnswer =
  "Je peux aider sur les forfaits, le rôle porteur/payeur, les justificatifs, la TST, le renouvellement, les paiements, la perte de passe, le changement de payeur, le suivi de dossier et les règles RGPD. Pour un cas précis, formule ta question avec le titre ou le problème concerné."

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function words(value: string) {
  return normalize(value).split(' ').filter((word) => word.length > 2)
}

function scoreKeyword(question: string, questionWords: Set<string>, keyword: string) {
  const normalizedKeyword = normalize(keyword)
  if (!normalizedKeyword) return 0

  const keywordWords = words(normalizedKeyword)
  if (keywordWords.length > 1) return question.includes(normalizedKeyword) ? keywordWords.length + 2 : 0
  if (questionWords.has(normalizedKeyword)) return 2
  if ([...questionWords].some((word) => word.startsWith(normalizedKeyword) || normalizedKeyword.startsWith(word))) return 1
  return question.includes(normalizedKeyword) ? 1 : 0
}

function isDissatisfied(question: string) {
  const normalizedQuestion = normalize(question)
  return dissatisfactionKeywords.some((keyword) => normalizedQuestion.includes(normalize(keyword)))
}

function findAnswer(question: string): ResolvedSupportAnswer {
  if (isDissatisfied(question)) {
    return {
      text: contactAnswer,
      shouldOfferContact: true,
    }
  }

  const normalizedQuestion = normalize(question)
  const questionWords = new Set(words(question))
  const scored = supportKnowledge
    .map((item) => ({
      item,
      score: item.keywords.reduce((total, keyword) => total + scoreKeyword(normalizedQuestion, questionWords, keyword), item.weight ?? 0),
    }))
    .sort((a, b) => b.score - a.score)

  if (!scored[0] || scored[0].score < 2) {
    return {
      text: `${fallbackAnswer}\n\n${contactAnswer}`,
      shouldOfferContact: true,
    }
  }

  return { text: scored[0].item.answer, guidedCheck: getGuidedCheck(scored[0].item.title) }
}

function getGuidedCheck(title: string): GuidedCheck {
  const checks: Record<string, GuidedCheck> = {
    'Choix du forfait': {
      question: 'Est-ce que vous avez déjà fait le parcours de recommandation dans l’onboarding ?',
      yes: 'Parfait. Comparez maintenant l’offre recommandée avec votre fréquence réelle de transport et les justificatifs demandés avant de poursuivre la souscription.',
      no: 'Je vous conseille de lancer le parcours d’onboarding : il croise profil, âge, statut, fréquence, support et aides possibles pour éviter un mauvais choix.',
    },
    'Porteur et payeur': {
      question: 'Est-ce que vous avez vérifié qui utilise le titre et qui le finance ?',
      yes: 'Très bien. Assurez-vous ensuite que le payeur accepte les CGVU et que ses informations de paiement sont prêtes.',
      no: 'Commencez par identifier le porteur, c’est la personne qui voyage, puis le payeur, c’est la personne ou structure qui règle l’abonnement.',
    },
    Justificatifs: {
      question: 'Est-ce que le document est lisible, complet et au bon format ?',
      yes: 'Dans ce cas, vérifiez aussi qu’il correspond exactement au justificatif demandé : identité, scolarité, bourse, domicile ou droit social.',
      no: 'Refaites un dépôt avec un fichier net, complet, non coupé, idéalement en PDF, JPG ou PNG selon ce qui est accepté.',
    },
    'Tarification Solidarité Transport': {
      question: 'Est-ce que vous avez un justificatif social récent pour prouver le droit TST ?',
      yes: 'Très bien. Déposez-le dans les documents demandés et surveillez la date de fin de droits, car la TST se renouvelle par période courte.',
      no: 'Il faut d’abord récupérer un justificatif à jour auprès de l’organisme concerné, par exemple CAF ou autre organisme social.',
    },
    Renouvellement: {
      question: 'Est-ce que vous connaissez la date anniversaire ou la date de fin de droits ?',
      yes: 'Parfait. Vérifiez quelques jours avant cette date si des justificatifs ou une validation de paiement sont attendus.',
      no: 'Consultez le détail de votre abonnement : la date de renouvellement ou de fin de droits sert à anticiper suspension, bascule tarifaire ou paiement.',
    },
    'RGPD et données': {
      question: 'Est-ce que votre demande concerne une donnée personnelle ou un justificatif sensible ?',
      yes: 'Dans ce cas, évitez de partager le document dans le chat. Passez par les espaces sécurisés de dépôt ou contactez le support.',
      no: 'Vous pouvez continuer ici pour une question générale, mais les documents et données sensibles doivent rester dans les parcours sécurisés.',
    },
    'Support téléphone ou passe': {
      question: 'Est-ce que vous savez déjà si votre forfait accepte le téléphone NFC ?',
      yes: 'Très bien. Vérifiez aussi que votre téléphone est compatible et que le titre choisi autorise ce support.',
      no: 'Par défaut, le passe Navigo physique reste le support le plus universel. Le téléphone dépend du forfait et de la compatibilité iPhone ou Android.',
    },
    'Perte, vol ou remplacement du passe': {
      question: 'Est-ce que vous avez déjà bloqué ou signalé le passe perdu/volé ?',
      yes: 'Bien. La suite consiste à demander un remplacement ou duplicata, puis vérifier l’adresse d’envoi et le titre à réassocier.',
      no: 'Première étape : signaler la perte ou le vol pour éviter l’usage du support, puis demander le remplacement depuis l’espace client ou le support.',
    },
    Paiement: {
      question: 'Est-ce que vous avez vérifié le moyen de paiement et les échéances ?',
      yes: 'Très bien. Si tout semble correct mais que le paiement reste bloqué, contactez le support avec la référence du paiement.',
      no: 'Vérifiez d’abord l’IBAN ou la carte, le mandat SEPA, la date d’échéance et l’état du paiement dans votre espace client.',
    },
    'Changement de payeur': {
      question: 'Est-ce que le nouveau payeur a déjà ses informations et son moyen de paiement prêts ?',
      yes: 'Parfait. Il faudra ensuite lui faire accepter les CGVU payeur et valider le mandat ou moyen de paiement.',
      no: 'Préparez d’abord l’identité du nouveau payeur, son email, son lien avec le porteur et son moyen de paiement.',
    },
    'Suspension, arrêt ou résiliation': {
      question: 'Est-ce que vous avez vérifié les conditions de votre forfait avant d’arrêter ?',
      yes: 'Très bien. Regardez ensuite les délais et effets sur les prélèvements avant de confirmer la demande.',
      no: 'Commencez par vérifier les CGVU du titre : les règles changent selon Navigo Annuel, Imagine R, TST ou Améthyste.',
    },
    'Paiement rejeté ou impayé': {
      question: 'Est-ce que vous avez déjà tenté une régularisation du paiement ?',
      yes: 'Si la régularisation est faite, surveillez le statut du contrat. S’il reste bloqué, contactez le support avec la référence de paiement.',
      no: 'Priorité : régulariser le paiement depuis l’espace Paiements pour éviter une suspension du contrat.',
    },
    'Suivi de dossier et validation': {
      question: 'Est-ce que vous avez consulté le statut exact du dossier et des documents ?',
      yes: 'Très bien. S’il y a un refus, lisez le motif et renvoyez uniquement le justificatif concerné.',
      no: 'Allez d’abord dans le détail de la souscription : regardez le statut global, les documents attendus et les paiements associés.',
    },
    'Modification des informations personnelles': {
      question: 'Est-ce que l’information à modifier est liée à l’identité officielle du porteur ?',
      yes: 'Dans ce cas, un justificatif ou une validation support peut être nécessaire. Ne modifiez pas au hasard si le contrat est déjà actif.',
      no: 'Pour une adresse, un email ou un téléphone, passez par la page Profil puis enregistrez les changements.',
    },
    'Renouvellement des droits TST ou réduction': {
      question: 'Est-ce que vos droits ou justificatifs sont encore valides ?',
      yes: 'Parfait. Gardez quand même un justificatif récent sous la main pour le prochain contrôle ou renouvellement.',
      no: 'Il faut renouveler le justificatif rapidement, sinon le contrat peut basculer au plein tarif ou être suspendu selon les règles.',
    },
    'Besoin d’un conseiller': {
      question: 'Est-ce que vous avez déjà votre numéro de dossier ou la souscription concernée ?',
      yes: 'Très bien. Contactez le support avec cette référence, le titre concerné et le blocage rencontré.',
      no: 'Avant de contacter le support, récupérez si possible l’email du compte, le titre concerné, le statut et les documents ou paiements liés.',
    },
  }

  return checks[title] ?? {
    question: 'Est-ce que vous avez déjà vérifié votre espace client avant de contacter le support ?',
    yes: 'Parfait. Si le blocage reste présent, contactez le support avec le contexte exact.',
    no: 'Commencez par vérifier le détail de votre souscription, les documents et les paiements associés.',
  }
}

function initials(firstName?: string, lastName?: string) {
  return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.trim().toUpperCase() || 'U'
}

interface FloatingSupportChatProps {
  mode?: 'floating' | 'page'
}

export function FloatingSupportChat({ mode = 'floating' }: FloatingSupportChatProps = {}) {
  const isPageMode = mode === 'page'
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const [open, setOpen] = useState(isPageMode)
  const [hasUnread, setHasUnread] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<SupportMessage[]>([
    {
      id: 1,
      from: 'bot',
      text: "Bonjour, je suis l'assistant support Comutitres. Pose-moi une question sur les forfaits, les justificatifs, la TST, les CGVU ou le parcours de souscription.",
      allowFeedback: false,
    },
  ])
  const listRef = useRef<HTMLDivElement>(null)
  const openRef = useRef(open)
  const idRef = useRef(1)
  const replyTimeoutsRef = useRef<number[]>([])
  const pendingRepliesRef = useRef(0)

  useEffect(() => {
    openRef.current = open
    if (open) setHasUnread(false)
  }, [open])

  useEffect(() => {
    const list = listRef.current
    if (list) list.scrollTop = list.scrollHeight
  }, [messages, open, isTyping])

  useEffect(() => () => {
    replyTimeoutsRef.current.forEach(window.clearTimeout)
  }, [])

  function nextId() {
    idRef.current += 1
    return idRef.current
  }

  function handleFeedback(message: SupportMessage, feedback: 'up' | 'down') {
    if (!message.allowFeedback || message.feedback) return

    setMessages((current) => current.map((item) => (item.id === message.id ? { ...item, feedback } : item)))

    if (feedback === 'up') {
      setMessages((current) => [
        ...current,
        {
          id: nextId(),
          from: 'bot',
          text: 'Merci pour votre retour, ravi d’avoir pu vous aider. Je reste disponible si vous avez une autre question.',
          allowFeedback: false,
        },
      ])
      return
    }

    const context = message.context ?? message.text
    setMessages((current) => [
      ...current,
      {
        id: nextId(),
        from: 'bot',
        text: contactAnswer,
        allowFeedback: false,
        contactCard: true,
        context,
      },
    ])
  }

  function handleGuidedCheck(message: SupportMessage, checked: boolean) {
    if (!message.guidedCheck || message.guidanceAnswered) return
    const guidedCheck = message.guidedCheck

    setMessages((current) => current.map((item) => (item.id === message.id ? { ...item, guidanceAnswered: true, guidanceAnswer: checked } : item)))
    setMessages((current) => [
      ...current,
      {
        id: nextId(),
        from: 'user',
        text: checked ? 'Oui' : 'Non',
      },
      {
        id: nextId(),
        from: 'bot',
        text: checked ? guidedCheck.yes : guidedCheck.no,
        allowFeedback: true,
        context: message.context,
      },
    ])
  }

  function ask(question: string) {
    const trimmed = question.trim()
    if (!trimmed) return
    const answer = findAnswer(trimmed)
    setMessages((current) => [...current, { id: nextId(), from: 'user', text: trimmed }])
    setInput('')
    pendingRepliesRef.current += 1
    setIsTyping(true)

    const timeout = window.setTimeout(() => {
      setMessages((current) => [
        ...current,
        {
          id: nextId(),
          from: 'bot',
          text: answer.text,
          allowFeedback: !answer.shouldOfferContact,
          contactCard: Boolean(answer.shouldOfferContact),
          guidedCheck: answer.guidedCheck,
          context: trimmed,
        },
      ])
      pendingRepliesRef.current -= 1
      if (pendingRepliesRef.current <= 0) {
        pendingRepliesRef.current = 0
        setIsTyping(false)
      }
      if (!openRef.current) setHasUnread(true)

    }, 850)
    replyTimeoutsRef.current.push(timeout)
  }

  const chatWindow = (
        <Paper
          elevation={isPageMode ? 0 : 8}
          sx={{
            width: isPageMode ? '100%' : { xs: 'calc(100vw - 32px)', sm: 390 },
            height: isPageMode ? { xs: 'calc(100vh - 220px)', md: 'calc(100vh - 170px)' } : { xs: 560, sm: 600 },
            minHeight: isPageMode ? { xs: 560, md: 640 } : undefined,
            maxHeight: isPageMode ? undefined : 'calc(100vh - 32px)',
            borderRadius: 2,
            overflow: 'hidden',
            border: '1px solid',
            borderColor: alpha(colors.blueIleDeFrance, isPageMode ? 0.75 : 0.55),
            boxShadow: isPageMode ? 'none' : `0 14px 34px ${alpha(colors.anthracite, 0.16)}`,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Box
            sx={{
              px: 2,
              py: 1.5,
              bgcolor: colors.white,
              color: colors.anthracite,
              borderBottom: '1px solid',
              borderColor: alpha(colors.blueIleDeFrance, 0.36),
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
            }}
          >
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                bgcolor: alpha(colors.blueIleDeFrance, 0.16),
                color: colors.blueInteraction,
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
              }}
            >
              <AutoAwesomeRoundedIcon fontSize="small" />
            </Box>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography sx={{ fontWeight: 800, lineHeight: 1.2 }}>Assistant support</Typography>
              <Typography sx={{ color: colors.greyDark, fontSize: 12 }}>Réponses CGVU et parcours client</Typography>
            </Box>
            <Tooltip title="Ouvrir la page support">
              <span>
                <IconButton color="inherit" disabled={isPageMode} onClick={() => navigate('/support')} size="small" sx={{ display: isPageMode ? 'none' : 'inline-flex' }}>
                  <OpenInFullIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            {!isPageMode ? (
              <Tooltip title="Fermer">
                <IconButton color="inherit" onClick={() => setOpen(false)} size="small">
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            ) : null}
          </Box>

          <Box ref={listRef} sx={{ flex: 1, overflowY: 'auto', p: 2, bgcolor: colors.greyLight40 }}>
            <Stack spacing={1.25}>
              {messages.map((message) => (
                <Box
                  key={message.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: message.from === 'user' ? 'flex-end' : 'flex-start',
                    gap: 1,
                  }}
                >
                  {message.from === 'bot' ? (
                    <Avatar
                      sx={{
                        width: 30,
                        height: 30,
                        bgcolor: alpha(colors.blueIleDeFrance, 0.18),
                        color: colors.blueInteraction,
                        flexShrink: 0,
                      }}
                    >
                      <AutoAwesomeRoundedIcon sx={{ fontSize: 17 }} />
                    </Avatar>
                  ) : null}

                  <Stack spacing={0.5} sx={{ maxWidth: '78%', alignItems: message.from === 'user' ? 'flex-end' : 'flex-start' }}>
                    <Box
                      sx={{
                        px: 1.5,
                        py: 1.15,
                        borderRadius: 2,
                        bgcolor: message.from === 'user' ? colors.blueIleDeFrance : colors.white,
                        color: message.from === 'user' ? colors.white : colors.anthracite,
                        border: '1px solid',
                        borderColor: message.from === 'user' ? alpha(colors.blueIleDeFrance, 0.72) : colors.greyMedium,
                        boxShadow: message.from === 'bot' ? `0 1px 4px ${alpha(colors.anthracite, 0.08)}` : 'none',
                      }}
                    >
                      <Typography sx={{ fontSize: 14, lineHeight: 1.45, whiteSpace: 'pre-line' }}>{message.text}</Typography>
                      {message.contactCard ? (
                        <Stack spacing={0.75} sx={{ mt: 1.25 }}>
                          <Box
                            component="a"
                            href={`tel:${supportContact.phone.replace(/\s/g, '')}`}
                            sx={{
                              color: colors.blueInteraction,
                              fontSize: 13,
                              fontWeight: 800,
                              textDecoration: 'none',
                              '&:hover': { textDecoration: 'underline' },
                            }}
                          >
                            Appeler le support : {supportContact.phone}
                          </Box>
                          <Box
                            component="a"
                            href={`mailto:${supportContact.email}`}
                            sx={{
                              color: colors.blueInteraction,
                              fontSize: 13,
                              fontWeight: 800,
                              textDecoration: 'none',
                              '&:hover': { textDecoration: 'underline' },
                            }}
                          >
                            Envoyer un email au support
                          </Box>
                        </Stack>
                      ) : null}
                    </Box>

                    {message.from === 'bot' && message.allowFeedback ? (
                      <Stack direction="row" spacing={0.5}>
                        <Tooltip title="Réponse utile">
                          <IconButton
                            aria-label="Réponse utile"
                            disabled={Boolean(message.feedback)}
                            onClick={() => handleFeedback(message, 'up')}
                            size="small"
                            sx={{
                              width: 28,
                              height: 28,
                              bgcolor: message.feedback === 'up' ? alpha(colors.greenDark, 0.16) : colors.white,
                              border: '1px solid',
                              borderColor: message.feedback === 'up' ? colors.greenDark : colors.greyMedium,
                              '&:hover': { bgcolor: alpha(colors.greenDark, 0.12) },
                            }}
                          >
                            <Typography component="span" sx={{ fontSize: 15, lineHeight: 1 }}>👍</Typography>
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Réponse non utile">
                          <IconButton
                            aria-label="Réponse non utile"
                            disabled={Boolean(message.feedback)}
                            onClick={() => handleFeedback(message, 'down')}
                            size="small"
                            sx={{
                              width: 28,
                              height: 28,
                              bgcolor: message.feedback === 'down' ? alpha(colors.redDark, 0.14) : colors.white,
                              border: '1px solid',
                              borderColor: message.feedback === 'down' ? colors.redDark : colors.greyMedium,
                              '&:hover': { bgcolor: alpha(colors.redDark, 0.1) },
                            }}
                          >
                            <Typography component="span" sx={{ fontSize: 15, lineHeight: 1 }}>👎</Typography>
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    ) : null}

                    {message.from === 'bot' && message.guidedCheck ? (
                      <Box
                        sx={{
                          bgcolor: colors.white,
                          border: '1px solid',
                          borderColor: alpha(colors.blueIleDeFrance, 0.38),
                          borderRadius: 2,
                          p: 1,
                          boxShadow: `0 1px 4px ${alpha(colors.anthracite, 0.06)}`,
                        }}
                      >
                        <Typography sx={{ color: colors.anthracite, fontSize: 13, fontWeight: 750, mb: 0.75 }}>
                          {message.guidedCheck.question}
                        </Typography>
                        <Stack direction="row" spacing={0.75}>
                          <Chip
                            label="Oui"
                            disabled={message.guidanceAnswered}
                            onClick={() => handleGuidedCheck(message, true)}
                            size="small"
                            sx={{
                              bgcolor: message.guidanceAnswer === true ? colors.blueIleDeFrance : colors.white,
                              border: '1px solid',
                              borderColor: message.guidanceAnswer === true ? colors.blueIleDeFrance : colors.greyMedium,
                              color: message.guidanceAnswer === true ? colors.white : colors.anthracite,
                              opacity: '1 !important',
                              fontWeight: 800,
                              minWidth: 64,
                              '&:hover': { bgcolor: colors.blueInteraction },
                            }}
                          />
                          <Chip
                            label="Non"
                            disabled={message.guidanceAnswered}
                            onClick={() => handleGuidedCheck(message, false)}
                            size="small"
                            sx={{
                              bgcolor: message.guidanceAnswer === false ? colors.blueIleDeFrance : colors.greyLight,
                              color: message.guidanceAnswer === false ? colors.white : colors.anthracite,
                              opacity: '1 !important',
                              fontWeight: 800,
                              minWidth: 64,
                              '&:hover': { bgcolor: colors.greyMedium },
                            }}
                          />
                        </Stack>
                      </Box>
                    ) : null}
                  </Stack>

                  {message.from === 'user' ? (
                    <Avatar
                      alt={user ? `${user.firstName} ${user.lastName}` : 'Utilisateur'}
                      src={user?.avatarUrl ?? undefined}
                      sx={{
                        width: 30,
                        height: 30,
                        bgcolor: colors.anthracite,
                        color: colors.white,
                        fontSize: 12,
                        fontWeight: 800,
                        flexShrink: 0,
                      }}
                    >
                      {initials(user?.firstName, user?.lastName)}
                    </Avatar>
                  ) : null}
                </Box>
              ))}
              {isTyping ? (
                <Box
                  aria-label="L'assistant est en train d'ecrire"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    gap: 1,
                    '@keyframes supportTypingDot': {
                      '0%, 80%, 100%': { opacity: 0.35, transform: 'translateY(0)' },
                      '40%': { opacity: 1, transform: 'translateY(-3px)' },
                    },
                  }}
                >
                  <Avatar
                    sx={{
                      width: 30,
                      height: 30,
                      bgcolor: alpha(colors.blueIleDeFrance, 0.18),
                      color: colors.blueInteraction,
                      flexShrink: 0,
                    }}
                  >
                    <AutoAwesomeRoundedIcon sx={{ fontSize: 17 }} />
                  </Avatar>
                  <Box
                    sx={{
                      px: 1.5,
                      py: 1.15,
                      borderRadius: 2,
                      bgcolor: colors.white,
                      border: '1px solid',
                      borderColor: colors.greyMedium,
                      boxShadow: `0 1px 4px ${alpha(colors.anthracite, 0.08)}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.55,
                    }}
                  >
                    {[0, 1, 2].map((index) => (
                      <Box
                        key={index}
                        component="span"
                        sx={{
                          width: 7,
                          height: 7,
                          borderRadius: '50%',
                          bgcolor: colors.greyDark,
                          animation: 'supportTypingDot 1.1s ease-in-out infinite',
                          animationDelay: `${index * 0.16}s`,
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              ) : null}
            </Stack>
          </Box>

          <Divider />
          <Box sx={{ p: 1.5, bgcolor: colors.white }}>
            <Stack direction="row" spacing={1}>
              <TextField
                fullWidth
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') ask(input)
                }}
                placeholder="Écrire une question..."
                size="small"
              />
              <Tooltip title="Envoyer">
                <span>
                  <IconButton
                    disabled={!input.trim()}
                    onClick={() => ask(input)}
                    sx={{
                      width: 42,
                      height: 42,
                      bgcolor: input.trim() ? colors.blueIleDeFrance : colors.greyLight,
                      color: input.trim() ? colors.white : colors.greyDark,
                      '&:hover': {
                        bgcolor: input.trim() ? colors.blueInteraction : colors.greyLight,
                      },
                    }}
                  >
                    <SendIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>

            <Box sx={{ mt: 1.25 }}>
              <Typography sx={{ color: colors.greyDark, fontSize: 12, fontWeight: 700, mb: 0.75 }}>
                Questions fréquentes
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 0.75 }}>
                {quickQuestions.map((question) => (
                  <Chip
                    key={question}
                    label={question}
                    onClick={() => ask(question)}
                    size="small"
                    sx={{
                      minWidth: 0,
                      width: '100%',
                      height: 34,
                      borderRadius: 1.5,
                      justifyContent: 'flex-start',
                      bgcolor: colors.white,
                      border: '1px solid',
                      borderColor: alpha(colors.blueIleDeFrance, 0.34),
                      color: colors.anthracite,
                      '& .MuiChip-label': {
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      },
                      '&:hover': {
                        bgcolor: colors.blueMedium,
                      },
                    }}
                  />
                ))}
              </Box>
            </Box>

          </Box>
        </Paper>
  )

  if (isPageMode) return chatWindow

  return (
    <Box sx={{ position: 'fixed', right: { xs: 16, md: 28 }, bottom: { xs: 16, md: 28 }, zIndex: 1400 }}>
      {open ? chatWindow : (
        <Tooltip title="Ouvrir le support">
          <Box
            key={location.pathname}
            sx={{
              position: 'relative',
              display: 'inline-flex',
              '@keyframes supportFabEnter': {
                '0%': { opacity: 0, transform: 'translateY(18px) scale(0.72) rotate(-12deg)' },
                '58%': { opacity: 1, transform: 'translateY(-5px) scale(1.08) rotate(5deg)' },
                '78%': { transform: 'translateY(2px) scale(0.98) rotate(-2deg)' },
                '100%': { opacity: 1, transform: 'translateY(0) scale(1) rotate(0deg)' },
              },
              '@keyframes supportFabHalo': {
                '0%': { opacity: 0.42, transform: 'scale(0.9)' },
                '70%': { opacity: 0, transform: 'scale(1.42)' },
                '100%': { opacity: 0, transform: 'scale(1.42)' },
              },
              animation: 'supportFabEnter 620ms cubic-bezier(0.2, 0.85, 0.25, 1.25) both',
              '&::before, &::after': {
                content: '""',
                position: 'absolute',
                inset: 4,
                borderRadius: '50%',
                border: '1px solid',
                borderColor: alpha(colors.blueIleDeFrance, 0.55),
                animation: 'supportFabHalo 2.4s ease-out infinite',
                pointerEvents: 'none',
              },
              '&::after': {
                animationDelay: '0.8s',
              },
            }}
          >
            <Badge color="error" invisible={!hasUnread} overlap="circular" variant="dot">
              <Fab
                aria-label="Ouvrir l'assistant IA"
                onClick={() => setOpen(true)}
                sx={{
                  color: colors.white,
                  bgcolor: colors.blueIleDeFrance,
                  background: colors.blueIleDeFrance,
                  boxShadow: `0 12px 28px ${alpha(colors.blueIleDeFrance, 0.42)}`,
                  transition: 'transform 160ms ease, background-color 160ms ease, box-shadow 160ms ease',
                  '&:hover': {
                    bgcolor: colors.blueInteraction,
                    background: colors.blueInteraction,
                    boxShadow: `0 14px 32px ${alpha(colors.blueInteraction, 0.44)}`,
                    transform: 'translateY(-2px) scale(1.04)',
                  },
                  '&:active': {
                    transform: 'translateY(0) scale(0.98)',
                  },
                }}
              >
                <AutoAwesomeRoundedIcon />
              </Fab>
            </Badge>
          </Box>
        </Tooltip>
      )}
    </Box>
  )
}

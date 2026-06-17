import type {
  AmethystEligibilityInput,
  ExplainEligibilityInput,
  ScholarshipEligibilityInput,
  SeniorEligibilityInput,
  TstEligibilityInput,
} from '../validation/eligibility.schemas.js'

export interface EligibilityResult {
  eligible: boolean
  confidencePercent: number
  reasons: string[]
  requiredDocuments: string[]
  warnings: string[]
  suggestedOfferCodes: string[]
}

export interface EligibilityRule {
  code: string
  name: string
  description: string
  requiredDocuments: string[]
  feedsRecommendationWith: string[]
}

const IDENTITY_DOC = 'Piece identite'
const SOCIAL_DOC = 'Justificatif de situation sociale'
const SCHOLARSHIP_DOC = 'Notification de bourse'
const SCHOOL_DOC = 'Certificat de scolarite'
const AGE_DOC = 'Justificatif age'
const ADDRESS_DOC = 'Justificatif de domicile'
const DEPARTMENT_DOC = 'Justificatif departemental'

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

function unique(values: string[]) {
  return Array.from(new Set(values))
}

function result(input: {
  eligible: boolean
  confidencePercent: number
  reasons: string[]
  requiredDocuments: string[]
  warnings?: string[]
  suggestedOfferCodes: string[]
}): EligibilityResult {
  return {
    eligible: input.eligible,
    confidencePercent: clampPercent(input.confidencePercent),
    reasons: unique(input.reasons),
    requiredDocuments: unique(input.requiredDocuments),
    warnings: unique(input.warnings ?? []),
    suggestedOfferCodes: unique(input.suggestedOfferCodes),
  }
}

function yearsBetween(dateValue: string, now = new Date()) {
  const birthDate = new Date(`${dateValue}T00:00:00.000Z`)
  if (Number.isNaN(birthDate.getTime())) return undefined
  let age = now.getUTCFullYear() - birthDate.getUTCFullYear()
  const currentMonth = now.getUTCMonth()
  const birthMonth = birthDate.getUTCMonth()
  if (currentMonth < birthMonth || (currentMonth === birthMonth && now.getUTCDate() < birthDate.getUTCDate())) age -= 1
  return Math.max(0, age)
}

function resolveAge(input: SeniorEligibilityInput) {
  return input.age ?? (input.birthDate ? yearsBetween(input.birthDate) : undefined)
}

export function checkTstEligibility(input: TstEligibilityInput): EligibilityResult {
  const hasSocialSignal = !!input.solidarity || input.status === 'solidarity' || input.socialSituation === 'social_beneficiary'
  const hasBenefitSignal = !!input.cafBeneficiary || !!input.rsaBeneficiary || !!input.assBeneficiary
  const eligible = hasSocialSignal || hasBenefitSignal
  const warnings: string[] = []
  if (input.socialSituation === 'social_beneficiary' && !input.solidarity && !hasBenefitSignal) {
    warnings.push('La situation sociale indique une piste TST, mais le justificatif exact reste a confirmer.')
  }
  if (input.isBearerPayer === false) warnings.push('Les justificatifs du payeur peuvent etre demandes en complement.')

  return result({
    eligible,
    confidencePercent: eligible ? (hasBenefitSignal ? 92 : 78) : 35,
    reasons: eligible ? ['Signal de tarification solidarite detecte'] : ['Aucun signal solidarite explicite'],
    requiredDocuments: [IDENTITY_DOC, SOCIAL_DOC],
    warnings,
    suggestedOfferCodes: input.socialSituation === 'social_beneficiary' || input.rsaBeneficiary ? ['TST_GRATUITE', 'TST_75', 'TST_50'] : ['TST_75', 'TST_50'],
  })
}

export function checkScholarshipEligibility(input: ScholarshipEligibilityInput): EligibilityResult {
  const hasScholarshipSignal = !!input.scholarship || input.socialSituation === 'scholarship' || !!input.hasScholarshipNotice
  const hasEducationSignal = input.status === 'student' || input.status === 'school' || input.socialSituation === 'student' || input.educationLevel === 'student' || input.educationLevel === 'school'
  const eligible = hasScholarshipSignal && hasEducationSignal
  const warnings: string[] = []
  if (hasScholarshipSignal && !hasEducationSignal) warnings.push('Le statut scolaire ou etudiant doit etre confirme.')
  if (!hasScholarshipSignal && hasEducationSignal) warnings.push('Le statut etudiant seul ne confirme pas une reduction boursiere.')

  return result({
    eligible,
    confidencePercent: eligible ? 91 : hasScholarshipSignal || hasEducationSignal ? 55 : 25,
    reasons: eligible ? ['Statut boursier et parcours scolaire/etudiant detectes'] : ['Eligibilite boursiere insuffisamment etablie'],
    requiredDocuments: [IDENTITY_DOC, SCHOLARSHIP_DOC, SCHOOL_DOC],
    warnings,
    suggestedOfferCodes: ['TST_50', 'IMAGINE_R_ETUDIANT', 'IMAGINE_R_SCOLAIRE'],
  })
}

export function checkSeniorEligibility(input: SeniorEligibilityInput): EligibilityResult {
  const age = resolveAge(input)
  const hasSeniorSignal = input.status === 'senior' || input.socialSituation === 'senior'
  const eligible = typeof age === 'number' ? age >= 62 : hasSeniorSignal
  const warnings: string[] = []
  if (hasSeniorSignal && typeof age === 'number' && age < 62) warnings.push('Le statut senior semble incoherent avec l age fourni.')
  if (typeof age !== 'number') warnings.push('Age ou date de naissance manquant: controle senior moins fiable.')

  return result({
    eligible,
    confidencePercent: eligible ? (typeof age === 'number' && age >= 62 ? 94 : 68) : 30,
    reasons: eligible ? ['Profil senior detecte'] : ['Age senior non confirme'],
    requiredDocuments: [IDENTITY_DOC, AGE_DOC],
    warnings,
    suggestedOfferCodes: ['NAVIGO_SENIOR'],
  })
}

export function checkAmethystEligibility(input: AmethystEligibilityInput): EligibilityResult {
  const seniorEligible = typeof input.age === 'number' && input.age >= 62
  const hasDepartment = !!input.department
  const hasSpecificSignal = !!input.disabilityCard || !!input.veteranCard
  const eligible = hasDepartment && (seniorEligible || hasSpecificSignal)
  const warnings: string[] = []
  if (!hasDepartment) warnings.push("Le departement est requis pour verifier Amethyste.")
  if (input.isResidentIleDeFrance === false) warnings.push("Amethyste est rattache a des criteres territoriaux d'Ile-de-France.")
  if (hasDepartment) warnings.push("Les regles Amethyste varient selon le departement.")

  return result({
    eligible,
    confidencePercent: eligible ? 76 : hasDepartment || seniorEligible || hasSpecificSignal ? 48 : 20,
    reasons: eligible ? ['Profil potentiellement eligible Amethyste'] : ['Eligibilite Amethyste non confirmee'],
    requiredDocuments: [IDENTITY_DOC, ADDRESS_DOC, DEPARTMENT_DOC],
    warnings,
    suggestedOfferCodes: ['AMETHYSTE'],
  })
}

export function getEligibilityRules(): EligibilityRule[] {
  return [
    {
      code: 'tst',
      name: 'Tarification Solidarite Transport',
      description: 'Controle les signaux de solidarite et prestations sociales pour orienter vers TST.',
      requiredDocuments: [IDENTITY_DOC, SOCIAL_DOC],
      feedsRecommendationWith: ['solidarity', 'socialSituation', 'status'],
    },
    {
      code: 'scholarship',
      name: 'Boursier',
      description: 'Controle le statut boursier combine a un profil scolaire ou etudiant.',
      requiredDocuments: [IDENTITY_DOC, SCHOLARSHIP_DOC, SCHOOL_DOC],
      feedsRecommendationWith: ['scholarship', 'socialSituation', 'status'],
    },
    {
      code: 'senior',
      name: 'Senior',
      description: 'Controle l age ou le statut senior pour les offres dediees.',
      requiredDocuments: [IDENTITY_DOC, AGE_DOC],
      feedsRecommendationWith: ['age', 'status', 'socialSituation'],
    },
    {
      code: 'amethyst',
      name: 'Amethyste',
      description: 'Controle une eligibilite departementale potentielle, notamment senior ou situation specifique.',
      requiredDocuments: [IDENTITY_DOC, ADDRESS_DOC, DEPARTMENT_DOC],
      feedsRecommendationWith: ['age', 'department', 'socialSituation'],
    },
  ]
}

export function explainEligibility(input: ExplainEligibilityInput) {
  const checks = {
    tst: checkTstEligibility(input),
    scholarship: checkScholarshipEligibility(input),
    senior: checkSeniorEligibility(input),
    amethyst: checkAmethystEligibility(input),
  }
  const eligibleRules = Object.entries(checks).filter(([, check]) => check.eligible).map(([rule]) => rule)

  return {
    eligibleRules,
    checks,
    recommendationHints: {
      solidarity: checks.tst.eligible,
      scholarship: checks.scholarship.eligible,
      status: checks.senior.eligible ? 'senior' : input.status ?? 'other',
      socialSituation: checks.scholarship.eligible ? 'scholarship' : checks.senior.eligible ? 'senior' : input.socialSituation ?? 'other',
      suggestedOfferCodes: unique(Object.values(checks).flatMap((check) => check.suggestedOfferCodes)),
    },
  }
}

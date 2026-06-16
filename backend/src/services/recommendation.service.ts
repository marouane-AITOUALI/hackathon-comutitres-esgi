import type { RecommendationInput, RecommendationSimulationInput } from '../validation/recommendation.schemas.js'
import { requireDb } from '../db/client.js'
import { offers } from '../db/schema.js'
import { AppError } from '../utils/app-error.js'

export interface OfferRecommendation {
  offerId: string | null
  offerCode: string
  offerName: string
  confidencePercent: number
  reasons: string[]
  requiredDocuments: string[]
  warnings: string[]
}

export interface RecommendationExplanation {
  recommendation: OfferRecommendation
  rulesTriggered: string[]
  decisionSummary: string
  alternatives: OfferRecommendation[]
}

const DEFAULT_IDENTITY = ["Piece identite"]
const SOCIAL_DOCS = ['Piece identite', 'Justificatif de situation sociale']
const STUDENT_DOCS = ['Piece identite', 'Certificat de scolarite']
const SCHOLARSHIP_DOCS = ['Piece identite', 'Notification de bourse']
const SENIOR_DOCS = ['Piece identite', 'Justificatif age']
const PAYER_DOCS = ['Justificatif du payeur']

const OFFER_LABELS: Record<string, string> = {
  NAVIGO_ANNUEL: 'Navigo Annuel',
  NAVIGO_SENIOR: 'Navigo Annuel Senior',
  NAVIGO_MOIS: 'Navigo Mois',
  NAVIGO_SEMAINE: 'Navigo Semaine',
  IMAGINE_R_JUNIOR: 'Imagine R Junior',
  IMAGINE_R_SCOLAIRE: 'Imagine R Scolaire',
  IMAGINE_R_ETUDIANT: 'Imagine R Etudiant',
  LIBERTE_PLUS: 'Liberte+',
  TST_50: 'TST Reduction 50%',
  TST_75: 'TST Solidarite 75%',
  TST_GRATUITE: 'TST Solidarite Gratuite',
  AMETHYSTE: 'Amethyste',
}

function toPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value * 100)))
}

function unique(values: string[]) {
  return Array.from(new Set(values))
}

function makeResult(offer: any | null, code: string, score: number, reasons: string[], warnings: string[], fallbackDocuments = DEFAULT_IDENTITY): OfferRecommendation {
  const offerId = offer ? offer.id : null
  const offerCode = offer ? offer.code : code
  const offerName = offer ? offer.name : OFFER_LABELS[code] ?? code
  const requiredDocuments = (offer && (offer.required_documents ?? offer.requiredDocuments)) || fallbackDocuments
  return { offerId, offerCode, offerName, confidencePercent: toPercent(score), reasons: unique(reasons), requiredDocuments: unique(requiredDocuments), warnings: unique(warnings) }
}

function getWarnings(input: RecommendationInput) {
  const age = Number(input.age ?? 0)
  const isBearerPayer = !!input.isBearerPayer
  const frequency = input.frequency ?? null
  const planPreference = input.planPreference ?? null
  const status = input.status ?? null
  const socialSituation = input.socialSituation ?? null
  const scholarship = !!input.scholarship
  const solidarity = !!input.solidarity
  const support = input.support ?? null

  const warnings: string[] = []
  if (!isBearerPayer) warnings.push('Les justificatifs du payeur seront demandes separement.')
  if (input.department) warnings.push("L'eligibilite Amethyste varie selon le departement.")
  if (support === 'phone') warnings.push("La compatibilite du forfait avec le telephone devra etre confirmee.")
  if (status === 'senior' && age > 0 && age < 62) {
    warnings.push('Le statut senior est incoherent avec l age saisi; la recommandation se base sur l age.')
  }
  if (status === 'school' && age >= 18) {
    warnings.push('Le statut scolaire est incoherent avec l age saisi; la recommandation se base sur l age.')
  }
  if (status === 'student' && age >= 30) {
    warnings.push('Le statut etudiant semble incoherent avec l age saisi; la recommandation se base sur l age.')
  }
  if (socialSituation === 'senior' && age > 0 && age < 62) {
    warnings.push('La situation senior est incoherente avec l age saisi; la recommandation se base sur l age.')
  }
  if (socialSituation === 'social_beneficiary' && !solidarity) {
    warnings.push('La situation sociale beneficiaire peut ouvrir droit a la tarification solidarite.')
  }
  if (socialSituation === 'scholarship' && !scholarship) {
    warnings.push('La situation boursiere peut ouvrir droit a une reduction sociale.')
  }
  if (frequency === 'occasional' && planPreference === 'monthly') {
    warnings.push('La frequence occasionnelle correspond davantage a un forfait a l usage ou hebdomadaire.')
  }
  if (frequency === 'daily' && planPreference === 'pay_as_you_go') {
    warnings.push('Une frequence quotidienne correspond rarement a un paiement a l usage.')
  }
  if (planPreference === 'annual' && age < 18) {
    warnings.push('Un forfait annuel peut etre pertinent mais le statut age doit etre confirme selon le profil.')
  }

  return warnings
}

async function loadOffers() {
  const db = requireDb()
  const allOffers = await db.select().from(offers)
  return {
    allOffers,
    findOffer: (code: string) => allOffers.find((offer: any) => offer.code === code) ?? null,
  }
}

function scoreCandidates(input: RecommendationInput) {
  const age = Number(input.age ?? 0)
  const warnings = getWarnings(input)
  const candidates: Array<{ code: string, score: number, reasons: string[], documents?: string[] }> = []
  const add = (code: string, score: number, reasons: string[], documents = DEFAULT_IDENTITY) => candidates.push({ code, score, reasons, documents })

  if (input.solidarity || input.status === 'solidarity') {
    const code = input.socialSituation === 'social_beneficiary' ? 'TST_GRATUITE' : 'TST_75'
    add(code, 0.9, ['Eligibilite sociale detectee'], SOCIAL_DOCS)
    add('TST_50', 0.74, ['Profil potentiellement eligible a une reduction solidaire'], SOCIAL_DOCS)
  }

  if (input.scholarship || input.socialSituation === 'scholarship') {
    add('TST_50', 0.92, ['Statut boursier detecte'], SCHOLARSHIP_DOCS)
  }

  if (age > 0 && age < 11) add('IMAGINE_R_JUNIOR', 0.94, ['Porteur junior de moins de 11 ans'], ['Piece identite'])
  if (input.status === 'school' || (age > 0 && age < 18)) add('IMAGINE_R_SCOLAIRE', 0.9, ['Porteur scolaire ou mineur'], STUDENT_DOCS)
  if (input.status === 'student' || input.socialSituation === 'student') add('IMAGINE_R_ETUDIANT', 0.91, ['Porteur etudiant'], STUDENT_DOCS)
  if (age >= 62 || input.status === 'senior' || input.socialSituation === 'senior') add('NAVIGO_SENIOR', age >= 62 ? 0.88 : 0.68, ['Profil senior'], SENIOR_DOCS)
  if (input.frequency === 'occasional' || input.planPreference === 'pay_as_you_go') add('LIBERTE_PLUS', 0.87, ['Usage occasionnel / paiement a l usage'])
  if (input.planPreference === 'weekly') add('NAVIGO_SEMAINE', 0.85, ['Besoin hebdomadaire'])
  if (input.planPreference === 'monthly' || input.frequency === 'regular') add('NAVIGO_MOIS', 0.84, ['Besoin mensuel / usage regulier'])
  if (input.planPreference === 'annual' || input.frequency === 'daily') add('NAVIGO_ANNUEL', 0.86, ['Usage frequent ou preference annuelle'])
  if (age >= 62 && input.department) add('AMETHYSTE', 0.64, ['Profil senior avec eligibilite departementale a verifier'], SENIOR_DOCS)

  if (!candidates.length) add('NAVIGO_ANNUEL', 0.86, ['Aucune regle specifique: forfait annuel recommande'])

  const byCode = new Map<string, { code: string, score: number, reasons: string[], documents: string[] }>()
  for (const candidate of candidates) {
    const existing = byCode.get(candidate.code)
    const documents = input.isBearerPayer ? candidate.documents ?? DEFAULT_IDENTITY : [...candidate.documents ?? DEFAULT_IDENTITY, ...PAYER_DOCS]
    if (!existing || candidate.score > existing.score) {
      byCode.set(candidate.code, { code: candidate.code, score: candidate.score, reasons: candidate.reasons, documents })
    } else {
      existing.reasons = unique([...existing.reasons, ...candidate.reasons])
      existing.documents = unique([...existing.documents, ...documents])
    }
  }

  return { candidates: Array.from(byCode.values()).sort((a, b) => b.score - a.score), warnings }
}

export async function compareOffers(input: RecommendationInput): Promise<OfferRecommendation[]> {
  const { findOffer } = await loadOffers()
  const { candidates, warnings } = scoreCandidates(input)
  return candidates.map((candidate) => makeResult(findOffer(candidate.code), candidate.code, candidate.score, candidate.reasons, warnings, candidate.documents))
}

export async function recommendOffer(input: RecommendationInput): Promise<OfferRecommendation> {
  const [recommendation] = await compareOffers(input)
  if (!recommendation) throw new AppError(500, "Aucune recommandation n'a pu etre calculee.")
  return recommendation
}

export async function explainRecommendation(input: RecommendationInput): Promise<RecommendationExplanation> {
  const comparison = await compareOffers(input)
  const recommendation = comparison[0]
  if (!recommendation) throw new AppError(500, "Aucune recommandation n'a pu etre expliquee.")
  return {
    recommendation,
    rulesTriggered: recommendation.reasons,
    decisionSummary: `${recommendation.offerName} ressort avec un score de confiance de ${recommendation.confidencePercent}% selon le profil transmis.`,
    alternatives: comparison.slice(1, 4),
  }
}

export async function simulateRecommendations(input: RecommendationSimulationInput) {
  const baseline = await explainRecommendation(input.base)
  const simulations = await Promise.all(input.scenarios.map(async (scenario) => {
    const simulatedInput = { ...input.base, ...scenario.changes }
    return {
      label: scenario.label,
      input: simulatedInput,
      ...(await explainRecommendation(simulatedInput)),
    }
  }))

  return { baseline, simulations }
}

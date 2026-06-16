import type { RecommendationInput } from '../validation/recommendation.schemas.js'
import { requireDb } from '../db/client.js'
import { offers } from '../db/schema.js'

export interface OfferRecommendation {
  offerId: string | null
  offerCode: string
  offerName: string
  confidencePercent: number
  reasons: string[]
  requiredDocuments: string[]
  warnings: string[]
}

const DEFAULT_IDENTITY = ["Piece identite"]

function toPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value * 100)))
}

function makeResult(offer: any | null, score: number, reasons: string[], warnings: string[]): OfferRecommendation {
  const offerId = offer ? offer.id : null
  const offerCode = offer ? offer.code : 'NAVIGO_ANNUEL'
  const offerName = offer ? offer.name : 'Navigo Annuel'
  const requiredDocuments = (offer && (offer.required_documents ?? offer.requiredDocuments)) || DEFAULT_IDENTITY
  return { offerId, offerCode, offerName, confidencePercent: toPercent(score), reasons, requiredDocuments, warnings }
}

export async function recommendOffer(input: RecommendationInput): Promise<OfferRecommendation> {
  // Normalisation
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

  // Get offers from DB to return ids and required documents
  const db = requireDb()
  const allOffers = await db.select().from(offers)

  const findOffer = (code: string) => allOffers.find((o: any) => o.code === code) ?? null

  // Priority rules (from most specific to general)
  if (solidarity || status === 'solidarity') {
    const code = socialSituation === 'social_beneficiary' ? 'TST_GRATUITE' : 'TST_75'
    const offer = findOffer(code)
    return makeResult(offer, 0.9, ['Eligibilite sociale detectee'], [...warnings, "L'eligibilite TST devra etre confirmee."])
  }

  if (scholarship || socialSituation === 'scholarship') {
    const offer = findOffer('TST_50')
    return makeResult(offer, 0.72, ['Statut boursier detecte'], [...warnings, "L'eligibilite TST devra etre confirmee."])
  }

  if (age > 0 && age < 11) {
    const offer = findOffer('IMAGINE_R_JUNIOR')
    return makeResult(offer, 0.94, ['Porteur junior de moins de 11 ans'], warnings)
  }

  if (status === 'school' || (age > 0 && age < 18)) {
    const offer = findOffer('IMAGINE_R_SCOLAIRE')
    return makeResult(offer, 0.9, ['Porteur scolaire ou mineur'], warnings)
  }

  if (status === 'student' || socialSituation === 'student') {
    const offer = findOffer('IMAGINE_R_ETUDIANT')
    return makeResult(offer, 0.91, ['Porteur etudiant'], warnings)
  }

  if (age >= 62) {
    const offer = findOffer('NAVIGO_SENIOR')
    return makeResult(offer, 0.88, ['Porteur senior (>=62)'], warnings)
  }

  if (frequency === 'occasional' || planPreference === 'pay_as_you_go') {
    const offer = findOffer('LIBERTE_PLUS')
    return makeResult(offer, 0.87, ['Usage occasionnel / paiement a l usage'], warnings)
  }

  if (planPreference === 'weekly') {
    const offer = findOffer('NAVIGO_SEMAINE')
    return makeResult(offer, 0.85, ['Besoin hebdomadaire'], warnings)
  }

  if (planPreference === 'monthly' || frequency === 'regular') {
    const offer = findOffer('NAVIGO_MOIS')
    return makeResult(offer, 0.84, ['Besoin mensuel / usage regulier'], warnings)
  }

  // fallback
  const fallback = findOffer('NAVIGO_ANNUEL')
  return makeResult(fallback, 0.86, ['Aucune regle specifique: forfait annuel recommande'], warnings)
}

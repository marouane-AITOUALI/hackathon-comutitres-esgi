import { and, asc, eq, ilike, inArray } from 'drizzle-orm'
import { requireDb } from '../db/client.js'
import { offers } from '../db/schema.js'
import { AppError } from '../utils/app-error.js'
import type { CompareOffersQuery, ListOffersQuery } from '../validation/offer.schemas.js'

const offerSelection = {
  id: offers.id,
  code: offers.code,
  name: offers.name,
  description: offers.description,
  target: offers.target,
  requiredDocuments: offers.requiredDocuments,
  isActive: offers.isActive,
  createdAt: offers.createdAt,
  updatedAt: offers.updatedAt,
}

const conditionsByCode: Record<string, string[]> = {
  NAVIGO_ANNUEL: ['Usage regulier ou quotidien', 'Paiement annuel ou mensualise selon le parcours'],
  NAVIGO_SENIOR: ['Avoir 62 ans ou plus', 'Justifier son identite'],
  NAVIGO_MOIS: ['Besoin de transport sur un mois', 'Support Navigo ou telephone compatible'],
  NAVIGO_SEMAINE: ['Besoin de transport sur une semaine', 'Support Navigo ou telephone compatible'],
  IMAGINE_R_JUNIOR: ['Avoir moins de 11 ans', 'Souscription par un representant legal si mineur'],
  IMAGINE_R_SCOLAIRE: ['Etre scolarise', 'Fournir un certificat de scolarite'],
  IMAGINE_R_ETUDIANT: ['Etre etudiant', 'Fournir un certificat de scolarite ou justificatif equivalent'],
  LIBERTE_PLUS: ["Usage occasionnel avec paiement a l'usage", 'RIB requis pour la facturation'],
  TST_50: ['Eligibilite sociale a confirmer', 'Verification documentaire ou partenaire'],
  TST_75: ['Eligibilite sociale a confirmer', 'Verification documentaire ou partenaire'],
  TST_GRATUITE: ['Eligibilite sociale a confirmer', 'Verification documentaire ou partenaire'],
  AMETHYSTE: ['Eligibilite selon departement', 'Justificatif de domicile ou situation specifique'],
}

const warningsByCode: Record<string, string[]> = {
  AMETHYSTE: ['Les regles Amethyste dependent du departement financeur.'],
  TST_50: ["L'eligibilite TST devra etre confirmee avant validation."],
  TST_75: ["L'eligibilite TST devra etre confirmee avant validation."],
  TST_GRATUITE: ["L'eligibilite TST devra etre confirmee avant validation."],
}

export async function listOffers(query: ListOffersQuery) {
  const where = and(
    query.includeInactive ? undefined : eq(offers.isActive, true),
    query.target ? ilike(offers.target, `%${query.target}%`) : undefined,
  )

  return requireDb()
    .select(offerSelection)
    .from(offers)
    .where(where)
    .orderBy(asc(offers.name))
}

export async function getOfferByCode(code: string) {
  const [offer] = await requireDb()
    .select(offerSelection)
    .from(offers)
    .where(eq(offers.code, code))
    .limit(1)

  if (!offer) throw new AppError(404, 'Offre introuvable.')
  return offer
}

export async function getOfferRequiredDocuments(code: string) {
  const offer = await getOfferByCode(code)
  return {
    code: offer.code,
    name: offer.name,
    requiredDocuments: offer.requiredDocuments,
  }
}

export async function getOfferConditions(code: string) {
  const offer = await getOfferByCode(code)
  return {
    code: offer.code,
    name: offer.name,
    target: offer.target,
    conditions: conditionsByCode[offer.code] ?? ['Conditions a confirmer lors de la souscription.'],
    warnings: warningsByCode[offer.code] ?? [],
  }
}

export async function compareOffers(query: CompareOffersQuery) {
  const rows = await requireDb()
    .select(offerSelection)
    .from(offers)
    .where(inArray(offers.code, query.codes))

  const foundCodes = new Set(rows.map((offer) => offer.code))
  const missingCodes = query.codes.filter((code) => !foundCodes.has(code))
  if (missingCodes.length > 0) throw new AppError(404, 'Certaines offres sont introuvables.', { missingCodes })

  return {
    comparedCodes: query.codes,
    offers: query.codes.map((code) => {
      const offer = rows.find((row) => row.code === code)
      if (!offer) throw new AppError(404, 'Offre introuvable.')
      return {
        ...offer,
        conditions: conditionsByCode[offer.code] ?? [],
        warnings: warningsByCode[offer.code] ?? [],
      }
    }),
  }
}

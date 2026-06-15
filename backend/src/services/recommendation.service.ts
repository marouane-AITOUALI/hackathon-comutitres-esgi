import type { RecommendationInput } from '../validation/recommendation.schemas.js'
export interface OfferRecommendation { offerCode: string; offerName: string; confidence: number; reasons: string[]; requiredDocuments: string[]; warnings: string[] }
const identity = ["Piece d'identite", "Photo d'identite"]
const result = (offerCode: string, offerName: string, confidence: number, reason: string, requiredDocuments: string[], warnings: string[]): OfferRecommendation => ({ offerCode, offerName, confidence, reasons: [reason], requiredDocuments, warnings })

export function recommendOffer(input: RecommendationInput): OfferRecommendation {
  const warnings = input.isBearerPayer ? [] : ['Les justificatifs du payeur seront demandes separement.']
  if (input.department) warnings.push("L'eligibilite Amethyste varie selon le departement.")
  if (input.support === 'phone') warnings.push("La compatibilite du forfait avec le telephone devra etre confirmee.")
  if (input.solidarity || input.status === 'solidarity') return result(input.socialSituation === 'social_beneficiary' ? 'TST_GRATUITE' : 'TST_75', input.socialSituation === 'social_beneficiary' ? 'TST Solidarite Gratuite' : 'TST Solidarite 75%', .9, 'Le profil indique une eligibilite potentielle a la tarification solidarite.', [...identity, 'Justificatif de situation sociale'], [...warnings, "L'eligibilite TST devra etre confirmee."])
  if (input.scholarship || input.socialSituation === 'scholarship') return result('TST_50', 'TST Reduction 50%', .72, 'Le statut boursier peut ouvrir droit a une reduction sous conditions.', [...identity, 'Justificatif de situation sociale'], [...warnings, "L'eligibilite TST devra etre confirmee."])
  if (input.age < 11) return result('IMAGINE_R_JUNIOR', 'Imagine R Junior', .94, 'Le porteur a moins de 11 ans.', [...identity, 'Justificatif de scolarite'], warnings)
  if (input.status === 'school' || input.age < 18) return result('IMAGINE_R_SCOLAIRE', 'Imagine R Scolaire', .9, 'Le porteur est scolaire ou mineur.', [...identity, 'Certificat de scolarite'], warnings)
  if (input.status === 'student' || input.socialSituation === 'student') return result('IMAGINE_R_ETUDIANT', 'Imagine R Etudiant', .91, 'Le porteur poursuit des etudes.', [...identity, 'Certificat de scolarite'], warnings)
  if (input.age >= 62 || input.status === 'senior') return result('NAVIGO_SENIOR', 'Navigo Annuel Senior', .88, 'Le porteur a 62 ans ou plus ou declare un statut senior.', identity, warnings)
  if (input.frequency === 'occasional' || input.planPreference === 'pay_as_you_go') return result('LIBERTE_PLUS', 'Liberte+', .87, "Les trajets occasionnels correspondent au paiement a l'usage.", ["Piece d'identite", 'RIB'], warnings)
  if (input.planPreference === 'weekly') return result('NAVIGO_SEMAINE', 'Navigo Semaine', .85, 'Le besoin indique une couverture hebdomadaire.', identity, warnings)
  if (input.planPreference === 'monthly' || input.frequency === 'regular') return result('NAVIGO_MOIS', 'Navigo Mois', .84, 'Le rythme regulier correspond a un forfait mensuel flexible.', identity, warnings)
  return result('NAVIGO_ANNUEL', 'Navigo Annuel', .86, 'Les trajets quotidiens sont mieux couverts par un forfait annuel.', [...identity, 'RIB'], warnings)
}

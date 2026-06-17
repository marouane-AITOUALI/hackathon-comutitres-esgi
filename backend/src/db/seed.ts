import { closeDb, requireDb } from './client.js'
import { offers } from './schema.js'
const docs = ['Piece identite']
const data = [
  ['NAVIGO_ANNUEL', 'Navigo Annuel', 'Adulte voyageant quotidiennement'],
  ['NAVIGO_SENIOR', 'Navigo Annuel Senior', 'Personne de 62 ans ou plus'],
  ['NAVIGO_MOIS', 'Navigo Mois', 'Voyageur regulier'],
  ['NAVIGO_SEMAINE', 'Navigo Semaine', 'Besoin hebdomadaire'],
  ['IMAGINE_R_JUNIOR', 'Imagine R Junior', 'Enfant de moins de 11 ans'],
  ['IMAGINE_R_SCOLAIRE', 'Imagine R Scolaire', 'Scolaire'],
  ['IMAGINE_R_ETUDIANT', 'Imagine R Etudiant', 'Etudiant'],
  ['LIBERTE_PLUS', 'Liberte+', 'Voyageur occasionnel'],
  ['TST_50', 'TST Reduction 50%', 'Beneficiaire solidarite'],
  ['TST_75', 'TST Solidarite 75%', 'Beneficiaire solidarite'],
  ['TST_GRATUITE', 'TST Solidarite Gratuite', 'Beneficiaire social'],
  ['AMETHYSTE', 'Amethyste', 'Profil eligible selon departement'],
] as const
try {
  for (const [code, name, target] of data) {
    await requireDb().insert(offers).values({ code, name, target, requiredDocuments: docs }).onConflictDoUpdate({ target: offers.code, set: { name, target, requiredDocuments: docs, isActive: true, updatedAt: new Date() } })
  }
  console.log(`${data.length} offres preparees.`)
} finally {
  await closeDb()
}

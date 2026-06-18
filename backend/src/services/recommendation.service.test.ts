import assert from 'node:assert/strict'
import test, { after } from 'node:test'
import { closeDb } from '../db/client.js'
import { recommendOffer } from './recommendation.service.js'
const base = { age: 35, status: 'active' as const, frequency: 'daily' as const, planPreference: 'annual' as const, socialSituation: 'other' as const, support: 'navigo_pass' as const, isBearerPayer: true, scholarship: false, solidarity: false }
after(async () => closeDb())
test('junior', async () => assert.equal((await recommendOffer({ ...base, age: 9, status: 'junior' })).offerCode, 'IMAGINE_R_JUNIOR'))
test('occasional', async () => assert.equal((await recommendOffer({ ...base, frequency: 'occasional' })).offerCode, 'LIBERTE_PLUS'))
test('student age 25', async () => assert.equal((await recommendOffer({ ...base, age: 25, status: 'student', socialSituation: 'student' })).offerCode, 'IMAGINE_R_ETUDIANT'))
test('adult never receives junior', async () => assert.notEqual((await recommendOffer({ ...base, age: 25, status: 'active' })).offerCode, 'IMAGINE_R_JUNIOR'))
test('solidarity', async () => assert.match((await recommendOffer({ ...base, solidarity: true })).offerCode, /^TST_/))
test('scholarship', async () => assert.equal((await recommendOffer({ ...base, scholarship: true })).offerCode, 'TST_50'))

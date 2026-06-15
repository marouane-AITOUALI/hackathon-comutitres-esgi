import assert from 'node:assert/strict'
import test from 'node:test'
import { recommendOffer } from './recommendation.service.js'
const base = { age: 35, status: 'active' as const, frequency: 'daily' as const, planPreference: 'annual' as const, socialSituation: 'other' as const, support: 'navigo_pass' as const, isBearerPayer: true, scholarship: false, solidarity: false }
test('junior', () => assert.equal(recommendOffer({ ...base, age: 9, status: 'junior' }).offerCode, 'IMAGINE_R_JUNIOR'))
test('occasional', () => assert.equal(recommendOffer({ ...base, frequency: 'occasional' }).offerCode, 'LIBERTE_PLUS'))
test('solidarity', () => assert.match(recommendOffer({ ...base, solidarity: true }).offerCode, /^TST_/))
test('scholarship', () => assert.equal(recommendOffer({ ...base, scholarship: true }).offerCode, 'TST_50'))

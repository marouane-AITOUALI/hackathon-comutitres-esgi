import assert from 'node:assert/strict'
import test from 'node:test'
import { checkAmethystEligibility, checkScholarshipEligibility, checkSeniorEligibility, checkTstEligibility, explainEligibility } from './eligibility.service.js'

test('tst detects solidarity signals', () => {
  const result = checkTstEligibility({ solidarity: true, isBearerPayer: false })
  assert.equal(result.eligible, true)
  assert.match(result.suggestedOfferCodes.join(','), /TST_/)
  assert.ok(result.warnings.length > 0)
})

test('scholarship requires scholarship and education signal', () => {
  const result = checkScholarshipEligibility({ scholarship: true, status: 'student' })
  assert.equal(result.eligible, true)
  assert.ok(result.requiredDocuments.includes('Notification de bourse'))
})

test('senior checks age from birth date', () => {
  const result = checkSeniorEligibility({ birthDate: '1950-01-01' })
  assert.equal(result.eligible, true)
  assert.ok(result.suggestedOfferCodes.includes('NAVIGO_SENIOR'))
})

test('amethyst needs department plus a qualifying signal', () => {
  const result = checkAmethystEligibility({ age: 67, department: '75' })
  assert.equal(result.eligible, true)
  assert.ok(result.warnings.some((warning) => warning.includes('departement')))
})

test('explain exposes recommendation hints', () => {
  const result = explainEligibility({ scholarship: true, status: 'student', age: 20 })
  assert.ok(result.eligibleRules.includes('scholarship'))
  assert.equal(result.recommendationHints.scholarship, true)
})

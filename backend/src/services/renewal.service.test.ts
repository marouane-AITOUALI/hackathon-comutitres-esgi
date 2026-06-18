import assert from 'node:assert/strict'
import test from 'node:test'
import { annualRenewalWindow, nextAnnualRenewalDate } from './renewal.service.js'
import { endOfCurrentMonth, terminationEffectiveAt } from './termination.service.js'

test('ouvre le renouvellement exactement trois mois avant la prochaine echeance annuelle', () => {
  const start = new Date('2025-09-15T10:00:00.000Z')
  const before = annualRenewalWindow(start, new Date('2026-06-14T23:59:59.000Z'))
  const open = annualRenewalWindow(start, new Date('2026-06-15T10:00:00.000Z'))

  assert.equal(before.renewalWindowStartsAt.toISOString(), '2026-06-15T10:00:00.000Z')
  assert.equal(before.isOpen, false)
  assert.equal(open.isOpen, true)
})

test('calcule la prochaine date anniversaire future', () => {
  const result = nextAnnualRenewalDate(
    new Date('2023-02-10T08:30:00.000Z'),
    new Date('2026-03-01T00:00:00.000Z'),
  )
  assert.equal(result.toISOString(), '2027-02-10T08:30:00.000Z')
})

test('programme la resiliation a la fin du mois courant', () => {
  assert.equal(
    endOfCurrentMonth(new Date('2026-06-18T12:00:00.000Z')).toISOString(),
    '2026-06-30T23:59:59.999Z',
  )
})

test('permet de choisir le mois effectif de resiliation', () => {
  assert.equal(
    terminationEffectiveAt('2026-09', new Date('2026-06-18T12:00:00.000Z')).toISOString(),
    '2026-09-30T23:59:59.999Z',
  )
})

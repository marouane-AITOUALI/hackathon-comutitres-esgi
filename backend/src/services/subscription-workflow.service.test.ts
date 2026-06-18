import assert from 'node:assert/strict'
import test from 'node:test'
import { buildSubscriptionWorkflow, isSchoolCertificateBlocking } from './subscription-workflow.service.js'
import { createInstallmentSchedule } from './payments.service.js'
import { onboardingSchema } from '../validation/onboarding.schemas.js'

const baseWorkflow = {
  status: 'draft' as const,
  submittedAt: null,
  requiredDocuments: ['identity', 'school_certificate'],
  documents: [{ type: 'identity', status: 'validated' as const }],
  payments: [{ status: 'accepted' }],
}

test('le certificat de scolarite ne bloque pas avant le 1er decembre', () => {
  const workflow = buildSubscriptionWorkflow({ ...baseWorkflow, now: new Date('2026-11-30T12:00:00Z') })
  assert.equal(isSchoolCertificateBlocking(new Date('2026-11-30T12:00:00Z')), false)
  assert.equal(workflow.canSubmit, true)
})

test('le certificat de scolarite bloque a partir du 1er decembre', () => {
  const workflow = buildSubscriptionWorkflow({ ...baseWorkflow, now: new Date('2026-12-01T12:00:00Z') })
  assert.equal(workflow.canSubmit, false)
  assert.deepEqual(workflow.missingBlockingDocuments, ['school_certificate'])
})

test('un dossier soumis avec une piece refusee demande une action utilisateur', () => {
  const workflow = buildSubscriptionWorkflow({
    ...baseWorkflow,
    submittedAt: new Date('2026-10-01T12:00:00Z'),
    documents: [{ type: 'identity', status: 'rejected' }],
    now: new Date('2026-10-02T12:00:00Z'),
  })
  assert.equal(workflow.state, 'needs_action')
  assert.equal(workflow.desiredStatus, 'pending_documents')
  assert.deepEqual(workflow.replaceableDocumentTypes, ['identity'])
})

test('echeancier ajuste les centimes sur la derniere mensualite', () => {
  const schedule = createInstallmentSchedule(38_622, 10, new Date('2026-06-18T00:00:00Z'))
  assert.equal(schedule.installmentAmountCents, 3_862)
  assert.equal(schedule.lastInstallmentAmountCents, 3_864)
  assert.equal(schedule.schedule.reduce((sum, installment) => sum + installment.amountCents, 0), 38_622)
})

test('onboarding refuse une date future et accepte une adresse francaise complete', () => {
  const result = onboardingSchema.safeParse({
    subscriptionFor: 'self',
    isBearerPayer: true,
    currentStep: 'result',
    address: { addressLine1: '1 rue de Paris', postalCode: '75001', city: 'Paris', country: 'FR' },
    bearer: { firstName: 'Ada', lastName: 'Lovelace', birthDate: '2999-01-01', status: 'student' },
    answers: {},
  })
  assert.equal(result.success, false)
})

import assert from 'node:assert/strict'
import test from 'node:test'
import { buildSubscriptionWorkflow, isSchoolCertificateBlocking, normalizeDocumentType } from './subscription-workflow.service.js'
import { createInstallmentSchedule } from './payments.service.js'
import { onboardingSchema } from '../validation/onboarding.schemas.js'
import { mandatePaymentSchema } from '../validation/payment.schemas.js'

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

test('une piece en revue humaine permet de payer et envoyer le dossier au backoffice', () => {
  const workflow = buildSubscriptionWorkflow({
    ...baseWorkflow,
    documents: [
      { type: 'identity', status: 'validated' },
      { type: 'school_certificate', status: 'needs_manual_review' },
    ],
    now: new Date('2026-12-02T12:00:00Z'),
  })
  assert.equal(workflow.documentsUploaded, true)
  assert.equal(workflow.documentsReady, false)
  assert.equal(workflow.requiresDocumentReview, true)
  assert.equal(workflow.canSubmit, true)
  assert.equal(workflow.state, 'ready_to_submit')
})

test('normalise les anciens libelles de justificatifs stockes dans les offres', () => {
  assert.equal(normalizeDocumentType('identité'), 'identity')
  assert.equal(normalizeDocumentType('certificat_scolarite'), 'school_certificate')
  assert.equal(normalizeDocumentType('piece-identite'), 'identity')
})

test('un brouillon avec les anciens libelles autorise le depot des pieces canoniques', () => {
  const workflow = buildSubscriptionWorkflow({
    status: 'draft',
    submittedAt: null,
    requiredDocuments: ['identité', 'certificat_scolarite'],
    documents: [],
    payments: [],
    now: new Date('2026-06-19T12:00:00Z'),
  })

  assert.deepEqual(workflow.requiredDocumentTypes, ['identity', 'school_certificate'])
  assert.deepEqual(workflow.replaceableDocumentTypes, ['identity', 'school_certificate'])
  assert.equal(workflow.canUpload, true)
})

test("un document depose reste en attente d'analyse jusqu'a l'envoi final", () => {
  const workflow = buildSubscriptionWorkflow({
    ...baseWorkflow,
    documents: [
      { type: 'identity', status: 'pending' },
      { type: 'school_certificate', status: 'pending' },
    ],
  })

  assert.equal(workflow.documentsUploaded, true)
  assert.equal(workflow.requiresDocumentAnalysis, true)
  assert.equal(workflow.requiresDocumentReview, false)
  assert.deepEqual(workflow.pendingAnalysisDocumentTypes, ['identity', 'school_certificate'])
  assert.equal(workflow.canSubmit, true)
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

test('le mandat SEPA est reserve a la mensualisation', () => {
  const base = {
    subscriptionId: '11111111-1111-4111-8111-111111111111',
    holderName: 'Ada Lovelace',
    ibanLast4: '0189',
    bic: 'AGRIFRPP',
    mandateAccepted: true,
  }
  assert.equal(mandatePaymentSchema.safeParse({ ...base, paymentMode: 'one_time' }).success, false)
  assert.equal(mandatePaymentSchema.safeParse({ ...base, paymentMode: 'monthly' }).success, true)
})

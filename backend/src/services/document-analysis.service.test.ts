import assert from 'node:assert/strict'
import test from 'node:test'
import { analyzeDocumentWithRules, checkDocumentFraud } from './document-analysis.service.js'

test('validates a matching school certificate filename', () => {
  const analysis = analyzeDocumentWithRules({ type: 'school_certificate', fileUrl: 'certificat-scolarite-2026.pdf' })
  assert.equal(analysis.detectedDocumentType, 'school_certificate')
  assert.equal(analysis.suggestedStatus, 'validated')
  assert.ok(analysis.confidence >= 85)
})

test('flags risky document filenames', () => {
  const fraudCheck = checkDocumentFraud({ type: 'identity', fileUrl: 'fake-identite-modified.exe' })
  assert.equal(fraudCheck.needsManualReview, true)
  assert.ok(fraudCheck.fraudSignals.length >= 1)
})

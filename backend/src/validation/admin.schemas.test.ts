import assert from 'node:assert/strict'
import test from 'node:test'
import { adminUpdateUserArchiveSchema } from './admin.schemas.js'

test('adminUpdateUserArchiveSchema accepts explicit archive states', () => {
  assert.deepEqual(adminUpdateUserArchiveSchema.parse({ archived: true }), { archived: true })
  assert.deepEqual(adminUpdateUserArchiveSchema.parse({ archived: false }), { archived: false })
})

test('adminUpdateUserArchiveSchema rejects ambiguous values', () => {
  assert.equal(adminUpdateUserArchiveSchema.safeParse({ archived: 'true' }).success, false)
  assert.equal(adminUpdateUserArchiveSchema.safeParse({}).success, false)
})

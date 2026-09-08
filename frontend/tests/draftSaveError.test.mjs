import test from 'node:test'
import assert from 'node:assert/strict'
import { draftSaveError } from '../src/utils/draftSaveError.mjs'
test('editor shows detailed approval errors', () => {
  assert.equal(draftSaveError({ response: { data: { message: 'Validation failed', errors: ['Marks must be a number', { msg: 'Diagram is invalid' }] } } }, 'Failed'), 'Validation failed: Marks must be a number: Diagram is invalid')
  assert.equal(draftSaveError({}, 'Failed to save draft'), 'Failed to save draft')
})

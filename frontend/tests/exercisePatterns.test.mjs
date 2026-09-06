import test from 'node:test'
import assert from 'node:assert/strict'
import { getExercisePatterns } from '../src/utils/exercisePatterns.mjs'
const patterns = [
  { chapterName: 'Fractions', topics: ['Addition'], questionType: 'numerical' },
  { chapterName: 'Fractions', topics: [], questionType: 'short-answer' },
  { chapterName: 'Plants', topics: ['Roots'], questionType: 'true-false' }
]
test('generation UI selects only formats from the selected chapter and topics', () => {
  assert.deepEqual(getExercisePatterns(patterns, 'Fractions', ['Addition']), patterns.slice(0, 2))
  assert.deepEqual(getExercisePatterns(patterns, 'Fractions', ['Subtraction']), [patterns[1]])
  assert.deepEqual(getExercisePatterns(patterns, 'Plants', ['Roots']), [patterns[2]])
})
test('no detected formats preserves manual generation fallback', () => {
  assert.deepEqual(getExercisePatterns([], 'Fractions', ['Addition']), [])
})

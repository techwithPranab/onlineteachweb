import test from 'node:test'
import assert from 'node:assert/strict'
import { parseNumericalAnswer, hasNumericalAnswerConflict } from '../src/utils/numericalAnswer.mjs'
import backend from '../../backend/utils/numericalAnswer.js'
test('review and backend agree on exact fractional answers', () => {
  for (const answer of ['5/8', '$\\frac{5}{8}$', '0.625', '-3/4', '0', '1/0', '5 apples out of 8']) {
    assert.equal(parseNumericalAnswer(answer), backend.parseNumericalAnswer(answer))
    for (const value of [5, 0.625]) {
      const question = { type: 'numerical', correctAnswer: answer, numericalAnswer: { value, tolerance: 0.1 } }
      assert.equal(hasNumericalAnswerConflict(question), backend.hasNumericalAnswerConflict(question))
    }
  }
  assert.equal(hasNumericalAnswerConflict({ type: 'numerical', correctAnswer: '5/8', numericalAnswer: { value: 5 } }), true)
})

import test from 'node:test'
import assert from 'node:assert/strict'
import { asOpenTextFraction } from '../src/utils/fractionAnswer.mjs'
import backend from '../../backend/utils/fractionAnswer.js'
test('review converts legacy fraction grading to text consistently with approval', () => {
  for (const answer of ['5/8', '1 2/3', '$\\frac{5}{8}$']) {
    const question = { type: 'numerical', correctAnswer: answer, numericalAnswer: { value: 5, tolerance: 0.1 } }
    const text = asOpenTextFraction(question)
    assert.deepEqual(text, backend.asOpenTextFraction(question))
    assert.equal(text.type, 'short-answer')
    assert.equal(text.expectedAnswer, answer)
    assert.equal(text.numericalAnswer, undefined)
    assert.equal(question.type, 'numerical')
  }
})

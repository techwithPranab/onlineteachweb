import test from 'node:test'
import assert from 'node:assert/strict'
import { getCourseDifficulties } from '../src/utils/courseDifficulty.mjs'
import backend from '../../backend/utils/courseDifficulty.js'

for (const subject of ['Olympiad-Mathematics', 'Olympiad-Science', 'OLYMPIAD Science', 'Mathematics', 'Science', 'Computer']) {
  test(`generation rules for ${subject}`, () => {
    const course = { subject }
    const expected = /olympiad/i.test(subject) ? ['olympiad'] : ['easy', 'medium', 'hard']
    assert.deepEqual(getCourseDifficulties(course), expected)
    assert.deepEqual(backend.getCourseDifficulties(course), expected)
    assert.equal(backend.validateCourseDifficulties(course, expected), null)
    for (const level of ['easy', 'medium', 'hard', 'olympiad']) {
      assert.equal(backend.validateCourseDifficulties(course, [level]) === null, expected.includes(level))
    }
    assert.ok(backend.validateCourseDifficulties(course, []))
    assert.ok(backend.validateCourseDifficulties(course, ['easy', 'olympiad']))
  })
}
test('no course enables no difficulty options', () => assert.deepEqual(getCourseDifficulties(null), []))

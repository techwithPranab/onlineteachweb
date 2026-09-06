import test from 'node:test'
import assert from 'node:assert/strict'
import { mergeExpectedFormats, getResponseQuestions, safePdfUrl } from '../src/utils/courseQuestionFormats.mjs'
const format = { sourceFileName: 'Math.pdf', chapterName: 'Fractions', topics: ['Addition'], label: 'Fill in the blanks', questionType: 'short-answer', example: '1/5 + 2/5 = ___' }
test('merges scan and prompt evidence while retaining origin and example', () => {
  const result = mergeExpectedFormats([format], [{ sourceSnapshot: { exercisePatterns: [format] } }])
  assert.equal(result.length, 1)
  assert.deepEqual(result[0].origins, ['Scanned PDF', 'Generation prompt'])
  assert.equal(result[0].example, format.example)
})
test('different chapters and examples remain separate', () => {
  assert.equal(mergeExpectedFormats([format, { ...format, chapterName: 'Decimals' }, { ...format, example: 'Different example' }]).length, 3)
})
test('parses current and older double-encoded responses', () => {
  const questions = [{ text: 'Complete ___', type: 'short-answer' }]
  for (const response of [questions, { questions }, JSON.stringify(questions), JSON.stringify(JSON.stringify(questions))]) assert.deepEqual(getResponseQuestions({ aiResponse: response }), questions)
})
test('malformed responses use populated questions without inventing types', () => {
  assert.deepEqual(getResponseQuestions({ aiResponse: 'API failed' }), [])
  assert.deepEqual(getResponseQuestions({ aiResponse: 'API failed', generatedQuestions: [{ text: 'Saved' }, 'id-only'] }), [{ text: 'Saved' }])
})
test('PDF links allow HTTPS and local uploads but reject executable URLs', () => {
  assert.equal(safePdfUrl('https://res.cloudinary.com/cloud/raw/upload/math.pdf'), 'https://res.cloudinary.com/cloud/raw/upload/math.pdf')
  assert.equal(safePdfUrl('/uploads/math.pdf'), '/uploads/math.pdf')
  assert.equal(safePdfUrl('javascript:alert(1)'), null)
})

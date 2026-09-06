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

test('merging scan and prompt evidence retains all PDF page references', () => {
  const result = mergeExpectedFormats([{ ...format, sourcePages: [2] }], [{ sourceSnapshot: { exercisePatterns: [{ ...format, sourcePages: [2, 4] }] } }]);
  assert.deepEqual(result[0].sourcePages, [2, 4]);
});

import { resolveExpectedFormats } from '../src/utils/courseQuestionFormats.mjs'

test('empty structure response does not hide formats already saved on the course', () => {
  const formats = resolveExpectedFormats({ course: { exercisePatterns: [format] }, structure: { exercisePatterns: [] } })
  assert.equal(formats.length, 1)
  assert.equal(formats[0].label, format.label)
})

test('material-only formats are visible while structure or history is unavailable', () => {
  const formats = resolveExpectedFormats({ course: { exercisePatterns: [] }, materials: [{ exercisePatterns: [format] }], structure: undefined })
  assert.equal(formats.length, 1)
  assert.equal(formats[0].sourceFileName, format.sourceFileName)
})

test('course, material, structure and generation evidence is combined without duplicate cards', () => {
  const formats = resolveExpectedFormats({ course: { exercisePatterns: [format] }, materials: [{ exercisePatterns: [format] }], structure: { exercisePatterns: [format] }, generations: [{ sourceSnapshot: { exercisePatterns: [format] } }] })
  assert.equal(formats.length, 1)
  assert.deepEqual(formats[0].origins, ['Scanned PDF', 'Generation prompt'])
})

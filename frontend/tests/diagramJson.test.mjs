import test from 'node:test'
import assert from 'node:assert/strict'
import { parseDiagramJson } from '../src/utils/diagramJson.mjs'
test('diagram edits preserve structured data for preview and saving', () => {
  const diagram = { type: 'fraction', params: { style: 'triangle', numerator: 1, denominator: 3, shadedIndices: [2], showLabel: false }, caption: 'Triangle' }
  assert.deepEqual(parseDiagramJson(JSON.stringify(diagram, null, 2)), { diagram, error: '' })
})
test('invalid syntax and invalid diagram structure cannot be saved', () => {
  for (const text of ['{', '[]', 'null', '{}', '{"type":2}', '{"type":"fraction","params":[]}', '{"type":"fraction","caption":true}']) {
    const result = parseDiagramJson(text)
    assert.ok(result.error, text)
    assert.equal(result.diagram, null)
  }
})
test('empty editor explicitly removes a diagram', () => assert.deepEqual(parseDiagramJson('  '), { diagram: null, error: '' }))

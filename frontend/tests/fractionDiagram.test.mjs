import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire, Module } from 'node:module'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { fractionValue, fractionRegions, polygonArea } from '../src/components/diagrams/fractionGeometry.mjs'
import { FRACTION_EXAMPLES } from '../src/components/diagrams/fractionExamples.mjs'
import validator from '../../backend/ai/validation/fractionDiagram.js'
const require = createRequire(import.meta.url)
const { buildSync } = require('esbuild')
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
function loadComponent(relativePath) {
  const filename = fileURLToPath(new URL(relativePath, import.meta.url))
  const bundle = buildSync({ entryPoints: [filename], bundle: true, write: false, platform: 'node', format: 'cjs', jsx: 'automatic', external: ['react', 'react-dom'] })
  const componentModule = new Module(filename)
  componentModule.paths = Module._nodeModulePaths(dirname(filename))
  componentModule._compile(bundle.outputFiles[0].text, filename)
  return componentModule.exports
}
const FractionDiagram = loadComponent('../src/components/diagrams/diagrams/FractionDiagram.jsx').default
const render = params => renderToStaticMarkup(React.createElement(FractionDiagram, { params }))

test('all scan-inspired examples validate and render without exposing answer labels', () => {
  for (const example of FRACTION_EXAMPLES) {
    assert.deepEqual(validator.validateFractionParams(example.diagram.params), [], example.name)
    const markup = render(example.diagram.params)
    assert.match(markup, /<svg/, example.name)
    assert.doesNotMatch(markup, /NaN|Infinity|<text|needs correction/, example.name)
    if (typeof example.answer === 'number' && !example.diagram.params.panels) assert.ok(Math.abs(fractionValue(example.diagram.params) - example.answer) < 1e-9, example.name)
  }
})
test('zero, a whole, and improper fractions render faithfully', () => {
  assert.equal(fractionValue({ numerator: 0, denominator: 4 }), 0)
  assert.doesNotMatch(render({ numerator: 0, denominator: 4 }), /fill="#64748b"/)
  assert.match(render({ numerator: 1, denominator: 1 }), /A 47 47/)
  assert.equal((render({ numerator: 9, denominator: 4 }).match(/<svg/g) || []).length, 3)
  assert.equal((render({ style: 'triangle', numerator: 4, denominator: 3 }).match(/<svg/g) || []).length, 2)
})
test('half cells and unequal polygons use area, not piece counts', () => {
  assert.equal(fractionValue({ style: 'grid', rows: 1, cols: 2, cells: ['full', 'top-left'] }), 0.75)
  const p = { style: 'regions', regions: [
    { points: [[0, 0], [25, 0], [25, 100], [0, 100]], shaded: true },
    { points: [[25, 0], [100, 0], [100, 100], [25, 100]], shaded: false },
  ] }
  assert.equal(fractionValue(p), 0.25)
  assert.deepEqual(validator.validateFractionParams(p), [])
  assert.equal(polygonArea(p.regions[0].points), 2500)
})
test('weighted and concentric areas account for angular and radial size', () => {
  assert.equal(fractionValue({ style: 'pie', sectorWeights: [3, 1], denominator: 2, numerator: 1 }), 0.75)
  assert.equal(fractionValue({ style: 'pie', sectorWeights: [1, 1], denominator: 2, rings: [
    { innerRadius: 0, outerRadius: 0.5, shadedIndices: [0, 1] },
    { innerRadius: 0.5, outerRadius: 1, shadedIndices: [] },
  ] }), 0.25)
})
test('explicit shading preserves scattered positions for bars and pies', () => {
  const p = { style: 'bar', numerator: 2, denominator: 4, shadedIndices: [1, 3] }
  assert.deepEqual(fractionRegions(p).map(r => r.shaded), [false, true, false, true])
  assert.equal(fractionValue({ ...p, style: 'pie' }), 0.5)
})
test('visual multiple choice examples have exactly one correct figure', () => {
  const necklace = FRACTION_EXAMPLES.find(e => e.name === 'Necklace choices')
  assert.deepEqual(necklace.diagram.params.panels.filter(p => fractionValue(p) === 4 / 7).map(p => p.label), [necklace.answer])
  const match = FRACTION_EXAMPLES.find(e => e.name === 'Match an unshaded fraction')
  const [reference, ...options] = match.diagram.params.panels
  assert.deepEqual(options.filter(p => !p.text && 1 - fractionValue(p) === fractionValue(reference)).map(p => p.label), [match.answer])
})
test('invalid data is rejected before generated questions can be saved', () => {
  for (const p of [
    { denominator: 0 }, { numerator: -1 }, { denominator: 4, numerator: 49 },
    { denominator: 4, numerator: 2, shadedIndices: [1, 1] },
    { style: 'triangle', denominator: 4 },
    { style: 'grid', rows: 2, cols: 3, cells: ['full'] },
    { style: 'grid', rows: 1, cols: 1, cells: ['quarter'] },
    { style: 'pie', denominator: 2, sectorWeights: [1, 0] },
    { style: 'set', items: [{ shape: 'unknown', shaded: true }] },
    { panels: [{ label: 'A', panels: [{ label: 'B' }] }] },
    { style: 'regions', regions: [{ points: [[0, 0], [0, 0], [0, 0]], shaded: true }] },
    { style: 'regions', regions: [true, false].map(shaded => ({ points: [[0, 0], [100, 0], [0, 100]], shaded })) },
  ]) assert.ok(validator.validateFractionParams(p).length, JSON.stringify(p))
})

test('student question cards display figure panels alongside selectable options', () => {
  const QuestionCard = loadComponent('../src/components/quiz/QuestionCard.jsx').default
  const example = FRACTION_EXAMPLES.find(e => e.name === 'Necklace choices')
  const markup = renderToStaticMarkup(React.createElement(QuestionCard, {
    questionNumber: 1,
    question: { text: example.question, type: 'mcq-single', diagram: example.diagram, options: ['A', 'B', 'C', 'D'].map(text => ({ _id: text, text })) },
    onAnswerChange: () => {},
  }))
  assert.match(markup, /Which necklace/)
  assert.equal((markup.match(/aria-label="Fraction figure/g) || []).length, 4)
  assert.match(markup, /<button/)
})
test('frontend and backend generation contracts stay aligned', () => {
  const { DIAGRAM_CATALOG } = loadComponent('../src/components/diagrams/diagramCatalog.js')
  assert.equal(DIAGRAM_CATALOG.find(d => d.type === 'fraction').aiInstruction, require('../../backend/ai/prompts/fractionDiagramPrompt.js'))
})
test('malformed saved diagrams render a correction message instead of crashing', () => {
  for (const params of [{ style: 'grid', rows: 1, cols: 1, cells: ['bad'] }, { style: 'regions', regions: [null] }, { panels: [null] }]) {
    assert.match(render(params), /needs correction/)
  }
})

test('question view renders saved top-level set diagrams identically to fraction sets', () => {
  const MathDiagram = loadComponent('../src/components/diagrams/MathDiagram.jsx').default
  const params = { numerator: 2, denominator: 5, showLabel: false }
  const renderDiagram = diagram => renderToStaticMarkup(React.createElement(MathDiagram, { diagram }))
  const expected = renderDiagram({ type: 'fraction', params: { ...params, style: 'set' }, caption: 'Count the shaded objects.' })
  for (const type of ['set', 'SET', ' set ']) {
    const actual = renderDiagram({ type, params, caption: 'Count the shaded objects.' })
    assert.equal(actual, expected)
    assert.equal((actual.match(/<circle/g) || []).length, 5)
    assert.doesNotMatch(actual, /Unknown diagram/)
  }
  const items = [{ shape: 'triangle', shaded: true }, { shape: 'square', shaded: false }]
  assert.equal(renderDiagram({ type: 'set', params: { items } }), renderDiagram({ type: 'fraction', params: { items, style: 'set' } }))
})

test('every fraction style alias renders like the canonical fraction diagram', () => {
  const MathDiagram = loadComponent('../src/components/diagrams/MathDiagram.jsx').default
  const renderDiagram = diagram => renderToStaticMarkup(React.createElement(MathDiagram, { diagram }))
  const examples = {
    pie: { numerator: 3, denominator: 4 },
    bar: { numerator: 2, denominator: 5 },
    set: { numerator: 2, denominator: 5 },
    triangle: { numerator: 2, denominator: 3 },
    grid: { rows: 1, cols: 2, cells: ['full', 'top-left'] },
    regions: { regions: [{ points: [[0, 0], [100, 0], [0, 100]], shaded: true }] },
  }
  for (const [style, params] of Object.entries(examples)) {
    const expected = renderDiagram({ type: 'fraction', params: { ...params, style } })
    for (const type of [style, style.toUpperCase(), ` ${style} `]) {
      const actual = renderDiagram({ type, params })
      assert.equal(actual, expected, type)
      assert.match(actual, /<svg/)
      assert.doesNotMatch(actual, /Unknown diagram|needs correction/)
    }
  }
  assert.match(renderDiagram({ type: 'pieChart', params: { data: [{ label: 'A', value: 3 }, { label: 'B', value: 2 }] } }), /<svg/)
  assert.match(renderDiagram({ type: 'unsupported-example' }), /Unknown diagram/)
})

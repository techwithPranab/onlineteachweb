const { describedFraction, fractionDiagramIssues, diagramFromDescription } = require('./fractionDiagramConsistency');
const validator = require('../ai/validation/QuestionValidator');
const text = 'Look at the diagram above showing a triangle divided into three equal smaller triangles, with one small triangle shaded. Which of the following is the correct fraction of the triangle that is shaded?';
const question = { text, topic: 'Fractions', difficultyLevel: 'easy', type: 'short-answer', correctAnswer: '1/3', expectedAnswer: '1/3' };
test('recognizes the reported explicit triangle description', () => {
  expect(describedFraction(question)).toEqual({ shape: 'triangle', denominator: 3, numerator: 1 });
  expect(diagramFromDescription(question)).toEqual({ type: 'fraction', params: { style: 'triangle', numerator: 1, denominator: 3, showLabel: false } });
});
test.each([
  { style: 'pie', numerator: 1, denominator: 3 },
  { style: 'triangle', numerator: 2, denominator: 3 },
  { style: 'triangle', numerator: 1, denominator: 4 },
  { style: 'triangle', numerator: 1, denominator: 3, shadedIndices: [1, 2] },
])('rejects mismatched geometry before saving', params => {
  const result = validator.validate({ ...question, diagram: { type: 'fraction', params } });
  expect(result.isValid).toBe(false);
});
test('accepts the matching figure and preserves its one shaded region', () => {
  const result = validator.validate({ ...question, diagram: diagramFromDescription(question) });
  expect(result.errors).toEqual([]);
  expect(result.sanitized.diagram.params.numerator).toBe(1);
});
test('checks rectangular descriptions without inferring shading from unshaded answers', () => {
  const q = { text: 'A rectangle is divided into 8 equal parts, with 3 parts shaded. What fraction is unshaded?', correctAnswer: '5/8' };
  expect(diagramFromDescription(q).params).toMatchObject({ numerator: 3, denominator: 8 });
  expect(fractionDiagramIssues({ ...q, diagram: { type: 'bar', params: { numerator: 5, denominator: 8 } } }).length).toBeGreaterThan(0);
});
test('does not guess figures for comparisons or unsupported triangular subdivisions', () => {
  expect(describedFraction({ text: 'Compare the figures: each triangle is divided into three equal parts with one part shaded.' })).toBeNull();
  expect(diagramFromDescription({ text: 'A triangle is divided into four equal parts with one part shaded.' })).toBeNull();
});

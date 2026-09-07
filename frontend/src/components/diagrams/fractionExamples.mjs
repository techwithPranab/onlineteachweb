// Original examples of the visual question formats reviewed in the scan.
export const FRACTION_EXAMPLES = [
  {
    name: 'Mixed wholes', answer: 9 / 4,
    question: 'Each circle is one whole. What mixed number is shaded?',
    diagram: { type: 'fraction', params: { style: 'pie', numerator: 9, denominator: 4 }, caption: 'Each circle represents one whole.' },
  },
  {
    name: 'Triangle wholes', answer: 4 / 3,
    question: 'Each triangle is one whole. What fraction is shaded?',
    diagram: { type: 'fraction', params: { style: 'triangle', numerator: 4, denominator: 3 } },
  },
  {
    name: 'Half-cell area', answer: 7 / 20,
    question: 'What fraction of this rectangle is shaded? Each small square has equal area.',
    diagram: { type: 'fraction', params: { style: 'grid', rows: 4, cols: 5, cells: ['empty', 'bottom-right', 'full', 'full', 'bottom-left', 'empty', 'empty', 'full', 'full', 'empty', 'empty', 'empty', 'empty', 'full', 'empty', 'empty', 'empty', 'empty', 'empty', 'full'] } },
  },
  {
    name: 'Composite area', answer: 1 / 2,
    question: 'What fraction of the combined triangular regions is unshaded?',
    diagram: { type: 'fraction', params: { style: 'regions', regions: [
      { points: [[50, 0], [50, 50], [0, 50]], shaded: true },
      { points: [[50, 0], [100, 50], [50, 50]], shaded: false },
      { points: [[0, 50], [50, 50], [50, 100]], shaded: false },
      { points: [[50, 50], [100, 50], [50, 100]], shaded: true },
    ] } },
  },
  {
    name: 'Shape collection', answer: 5 / 16,
    question: 'What fraction of the objects are circles?',
    diagram: { type: 'fraction', params: { style: 'set', cols: 4, outline: true, items: ['triangle', 'circle', 'triangle', 'square', 'square', 'circle', 'triangle', 'circle', 'circle', 'triangle', 'square', 'square', 'triangle', 'circle', 'triangle', 'square'].map(shape => ({ shape, shaded: shape === 'circle' })) } },
  },
  {
    name: 'Necklace choices', answer: 'B',
    question: 'Which necklace has four-sevenths of its beads shaded?',
    diagram: { type: 'fraction', params: { panels: [3, 4, 5, 2].map((n, i) => ({ label: 'ABCD'[i], style: 'set', layout: 'necklace', numerator: n, denominator: 7 })) } },
  },
  {
    name: 'Match an unshaded fraction', answer: 'A',
    question: 'Which option has an unshaded fraction equal to the shaded fraction of X?',
    diagram: { type: 'fraction', params: { panels: [
      { label: 'X', style: 'grid', rows: 2, cols: 2, cells: ['top-left', 'bottom-right', 'top-left', 'bottom-right'] },
      { label: 'A', style: 'pie', numerator: 4, denominator: 8, shadedIndices: [0, 2, 4, 6] },
      { label: 'B', style: 'triangle', numerator: 2, denominator: 3 },
      { label: 'C', style: 'bar', numerator: 1, denominator: 4 },
      { label: 'D', text: 'None of these' },
    ] } },
  },
  {
    name: 'Count qualifying figures', answer: 1,
    question: 'How many figures have more than half their area shaded?',
    diagram: { type: 'fraction', params: { panels: [
      { label: '(i)', style: 'pie', numerator: 4, denominator: 8, shadedIndices: [0, 1, 4, 6] },
      { label: '(ii)', style: 'triangle', numerator: 2, denominator: 3 },
      { label: '(iii)', style: 'grid', rows: 2, cols: 4, cells: ['top-left', 'full', 'empty', 'empty', 'empty', 'full', 'empty', 'empty'] },
    ] } },
  },
  {
    name: 'Unequal circular parts', answer: 1 / 2,
    question: 'What fraction of the disk is shaded? Some sectors are larger than others.',
    diagram: { type: 'fraction', params: { style: 'pie', denominator: 6, numerator: 3, sectorWeights: [2, 1, 1, 2, 1, 1], shadedIndices: [0, 2, 4] } },
  },
  {
    name: 'Concentric circle comparison', answer: 1 / 2,
    question: 'What fraction of the whole disk is shaded? The inner radius is half the outer radius.',
    diagram: { type: 'fraction', params: { style: 'pie', denominator: 8, sectorWeights: Array(8).fill(1), rings: [
      { innerRadius: 0, outerRadius: 0.5, shadedIndices: [1, 3, 5, 7] },
      { innerRadius: 0.5, outerRadius: 1, shadedIndices: [0, 2, 4, 6] },
    ] } },
  },
].map(example => ({ ...example, diagram: { ...example.diagram, params: { ...example.diagram.params, showLabel: false } } }))

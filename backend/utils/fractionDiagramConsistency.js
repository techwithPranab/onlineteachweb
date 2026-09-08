// Check explicit descriptions of a single equally partitioned whole only.
// Comparisons, collections, mixed wholes and custom areas need separate reasoning.
const words = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
const countPattern = '(\\d+|' + words.join('|') + ')';
const count = text => /^\d+$/.test(text) ? Number(text) : words.indexOf(text);
function describedFraction(question) {
  const text = String(question.text || question.question || '').toLowerCase();
  if (/\b(each|figures|diagrams|compare|comparison)\b/.test(text)) return null;
  const whole = text.match(new RegExp('\\b(triangle|rectangle|square|circle|disk)\\b[^.!?]{0,80}?\\bdivided into\\s+' + countPattern + '\\s+equal\\s+(?:smaller\\s+)?(?:parts|triangles|sectors|pieces|regions)\\b'));
  const shaded = text.match(new RegExp('\\b' + countPattern + '\\s+(?:small(?:er)?\\s+)?(?:parts?|triangles?|sectors?|pieces?|regions?)\\s+(?:(?:is|are|being)\\s+)?shaded\\b'));
  if (!whole || !shaded) return null;
  const denominator = count(whole[2]), numerator = count(shaded[1]);
  if (denominator < 1 || denominator > 100 || numerator < 0 || numerator > denominator) return null;
  return { shape: whole[1], denominator, numerator };
}
function fractionDiagramIssues(question) {
  const described = describedFraction(question);
  if (!described || !question.diagram) return [];
  const params = question.diagram.params || {};
  if (params.panels || params.regions || params.rings || params.sectorWeights) return [];
  const type = String(question.diagram.type || '').trim().toLowerCase();
  const style = type === 'fraction' ? params.style || 'pie' : type;
  const permitted = { triangle: ['triangle'], rectangle: ['grid', 'bar'], square: ['grid'], circle: ['pie'], disk: ['pie'] };
  const issues = [];
  if (!permitted[described.shape].includes(style)) issues.push(`The question describes a ${described.shape}, but the diagram uses ${style}.`);
  const denominator = style === 'grid' ? params.rows * params.cols : Number(params.denominator ?? (style === 'triangle' ? 3 : 4));
  const numerator = style === 'grid' && Array.isArray(params.cells)
    ? params.cells.reduce((sum, c) => sum + (c === 'full' ? 1 : c === 'empty' ? 0 : 0.5), 0)
    : Array.isArray(params.shadedIndices) ? params.shadedIndices.length : Number(params.numerator ?? 1);
  if (denominator !== described.denominator) issues.push(`The question describes ${described.denominator} equal parts, but the diagram has ${denominator}.`);
  if (numerator !== described.numerator) issues.push(`The question describes ${described.numerator} shaded parts, but the diagram shades ${numerator}.`);
  return issues;
}
function diagramFromDescription(question) {
  const description = describedFraction(question);
  if (!description || question.diagram?.params?.panels) return null;
  const { shape, numerator, denominator } = description;
  if (shape === 'triangle' && denominator !== 3) return null;
  if (shape === 'square' && !Number.isInteger(Math.sqrt(denominator))) return null;
  const params = shape === 'square'
    ? { style: 'grid', rows: Math.sqrt(denominator), cols: Math.sqrt(denominator), cells: Array.from({ length: denominator }, (_, i) => i < numerator ? 'full' : 'empty'), showLabel: false }
    : { style: shape === 'triangle' ? 'triangle' : shape === 'rectangle' ? 'bar' : 'pie', numerator, denominator, showLabel: false };
  return { type: 'fraction', params };
}
module.exports = { describedFraction, fractionDiagramIssues, diagramFromDescription };

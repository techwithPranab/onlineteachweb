// Parse complete numeric answers only; never truncate a fraction with parseFloat.
function parseNumericalAnswer(answer) {
  if (typeof answer === 'number') return Number.isFinite(answer) ? answer : null;
  if (typeof answer !== 'string') return null;
  const text = answer.trim().replace(/^\$+|\$+$/g, '').trim()
    .replace(/\\(?:dfrac|tfrac|frac)\s*\{\s*([+-]?\d+)\s*\}\s*\{\s*([+-]?\d+)\s*\}/g, '$1/$2');
  const fraction = text.match(/^([+-]?\d+)\s*\/\s*([+-]?\d+)$/);
  if (fraction) return Number(fraction[2]) !== 0 ? Number(fraction[1]) / Number(fraction[2]) : null;
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(text)) return null;
  const value = Number(text);
  return Number.isFinite(value) ? value : null;
}

function hasNumericalAnswerConflict(question) {
  if (question.type !== 'numerical' || !question.numericalAnswer) return false;
  const expected = parseNumericalAnswer(question.correctAnswer);
  const actual = question.numericalAnswer.value;
  return expected !== null && (!Number.isFinite(actual) || Math.abs(expected - actual) > 1e-9 * Math.max(1, Math.abs(expected)));
}
module.exports = { parseNumericalAnswer, hasNumericalAnswerConflict };

const { canonicalName, validateExerciseReview } = require('./exerciseReviewValidation');

test('canonical name matching only accepts a unique full normalized name', () => {
  expect(canonicalName('Chapter 4: Fraction', ['Fractions'])).toBe('Fractions');
  expect(canonicalName('ADDITION OF FRACTIONS', ['Addition of Fractions'])).toBe('Addition of Fractions');
  expect(canonicalName('Fractions', ['Addition of Fractions', 'Comparison of Fractions'])).toBeNull();
  expect(canonicalName('fraction', ['Fraction', 'Fractions'])).toBeNull();
  expect(canonicalName('Plants', ['Fractions'])).toBeNull();
});

test('null and malformed patterns produce diagnostics rather than property access exceptions', () => {
  const result = validateExerciseReview({ status: 'complete', analysisReport: 'Report', exercisePatterns: [null] }, { chapters: [] });
  expect(result.issues).toContain('exercisePatterns[0].example: missing readable source evidence');
  expect(result.issues).toContain('exercisePatterns[0].sourcePages: must contain at least one positive 1-based PDF page number');
});

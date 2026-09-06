jest.mock('fs', () => ({ promises: { readFile: jest.fn().mockResolvedValue(Buffer.from('%PDF-original scan')) } }));
const { extractExercisePatterns } = require('./scanMaterial.service');
const { EXERCISE_EXTRACTION_PROMPT } = require('./exerciseExtractionPrompt');
const course = { title: 'Math', chapters: [{ name: 'Fractions', topics: ['Addition'] }] };
const file = { originalname: 'Math.pdf', path: '/tmp/scan.pdf', mimetype: 'application/pdf' };
const blank = { description: 'A missing value in a fractional expression', skillTested: 'Equivalent fractions', cognitiveLevel: 2, chapterName: 'Fractions', topics: ['Addition'], label: 'Fill in the blanks — missing numerator', questionType: 'short-answer', instructions: 'Fill the missing numerator', example: '$1/5 + 2/5 = \\frac{\\square}{5}$', sourcePages: [4] };
const originalFetch = global.fetch;
beforeEach(() => { global.fetch = jest.fn(); });
afterEach(() => { global.fetch = originalFetch; });
const respond = review => global.fetch.mockResolvedValue({ ok: true, json: async () => ({ output_text: JSON.stringify({ analysisReport: 'DOCUMENT ANALYSIS\nQUESTION FORMAT SUMMARY\nRECOMMENDED WORKSHEET MIX', ...review }) }) });

test('dedicated prompt reviews the original PDF, and records safe auditable evidence', async () => {
  respond({ status: 'complete', reviewNote: 'All pages reviewed', exercisePatterns: [blank] });
  const onExchange = jest.fn();
  const onAnalysisReport = jest.fn();
  const result = await extractExercisePatterns(file, course, 2, { onExchange, onAnalysisReport });
  const request = JSON.parse(global.fetch.mock.calls[0][1].body);
  expect(request.instructions).toBe(EXERCISE_EXTRACTION_PROMPT);
  expect(onAnalysisReport).toHaveBeenCalledWith({ sourceFileName: 'Math.pdf', report: expect.stringContaining('RECOMMENDED WORKSHEET MIX') });
  expect(request.input[0].content[1].file_data).toBe(`data:application/pdf;base64,${Buffer.from('%PDF-original scan').toString('base64')}`);
  expect(result).toEqual([{ ...blank, sourceFileIndex: 2, sourceFileName: 'Math.pdf' }]);
  expect(onExchange).toHaveBeenCalledWith(expect.objectContaining({ stage: 'exercise-format-review-3-Math.pdf', responsePayload: expect.any(Object) }));
  expect(onExchange.mock.calls[0][0].requestPayload.input[0].content[1].file_data).toContain('binary PDF omitted');
});

test('distinct formats sharing short-answer storage are retained separately', async () => {
  const matching = { ...blank, label: 'Match the following', instructions: 'Match both columns', example: '| A | B |\n| 1/2 | one half |' };
  respond({ status: 'complete', reviewNote: 'Two formats', exercisePatterns: [blank, matching] });
  expect(await extractExercisePatterns(file, course, 0)).toHaveLength(2);
});

test.each([
  ['unreadable', { status: 'unreadable', reviewNote: 'Page 4 is blurred', exercisePatterns: [] }, 'clearer scan'],
  ['missing inventory', { status: 'complete', exercisePatterns: [] }, 'inconsistent inventory'],
  ['contradictory absence', { status: 'no_exercises', exercisePatterns: [blank] }, 'inconsistent inventory'],
  ['missing page evidence', { status: 'complete', exercisePatterns: [{ ...blank, sourcePages: [] }] }, 'missing evidence'],
  ['wrong chapter', { status: 'complete', exercisePatterns: [{ ...blank, chapterName: 'Plants' }] }, 'unmatched chapter/topic'],
  ['wrong topic', { status: 'complete', exercisePatterns: [{ ...blank, topics: ['Roots'] }] }, 'unmatched chapter/topic']
])('rejects %s instead of silently publishing inaccurate formats', async (_, review, error) => {
  respond(review);
  await expect(extractExercisePatterns(file, course, 0)).rejects.toThrow(error);
});

test('reviewed PDF without exercises returns an explicit empty inventory', async () => {
  respond({ status: 'no_exercises', reviewNote: 'Only explanatory text', exercisePatterns: [] });
  expect(await extractExercisePatterns(file, course, 0)).toEqual([]);
});

test('truncated review is rejected', async () => {
  global.fetch.mockResolvedValue({ ok: true, json: async () => ({ status: 'incomplete', output_text: '{}' }) });
  await expect(extractExercisePatterns(file, course, 0)).rejects.toThrow('truncated');
});

test('uses the supplied visual taxonomy, evidence table, level summary and worksheet mix', () => {
  for (const instruction of ['expert educational consultant', 'all visual content', 'Figure-to-Fraction Visual Question', 'Statement I / Statement II', '| # | Question Format | Description | Skill Tested | Example Pattern | Page(s) | Difficulty |', 'RECOMMENDED WORKSHEET MIX']) {
    expect(EXERCISE_EXTRACTION_PROMPT).toContain(instruction);
  }
});

test('requires the document report and a valid five-level classification', async () => {
  respond({ status: 'complete', analysisReport: '', exercisePatterns: [blank] });
  await expect(extractExercisePatterns(file, course, 0)).rejects.toThrow('no document analysis');
  respond({ status: 'complete', exercisePatterns: [{ ...blank, cognitiveLevel: 6 }] });
  await expect(extractExercisePatterns(file, course, 0)).rejects.toThrow('missing evidence');
});

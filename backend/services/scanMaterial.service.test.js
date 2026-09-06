jest.mock('fs', () => ({ promises: { readFile: jest.fn().mockResolvedValue(Buffer.from('%PDF-test')) } }));
const { generateCourseFromScans } = require('./scanMaterial.service');

describe('course scan material mapping', () => {
  const originalFetch = global.fetch;
  const originalKey = process.env.OPENAI_API_KEY;
  const pdf = name => ({ originalname: name, path: `/tmp/${name}`, mimetype: 'application/pdf' });
  const respond = text => ({ ok: true, json: async () => ({ output_text: text }) });

  beforeEach(() => {
    process.env.OPENAI_API_KEY = 'test';
    global.fetch = jest.fn().mockResolvedValue(respond(JSON.stringify({ status: 'no_exercises', analysisReport: 'DOCUMENT ANALYSIS: No exercises', reviewNote: 'No exercises', exercisePatterns: [] })));
  });
  afterEach(() => {
    global.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalKey;
  });

  test('one PDF with five chapter metadata entries retains the entire transcription', async () => {
    const chapters = Array.from({ length: 5 }, (_, i) => ({ name: `Chapter ${i + 1}` }));
    const transcription = chapters.map(chapter => `# ${chapter.name}\nFull lesson`).join('\n');
    global.fetch.mockResolvedValueOnce(respond(transcription)).mockResolvedValueOnce(respond(JSON.stringify({
      course: { title: 'Computer', chapters }, materials: chapters.map(chapter => ({ title: chapter.name, content: '' }))
    })));
    const result = await generateCourseFromScans([pdf('Textbook.pdf')]);
    expect(result.course.chapters).toEqual(chapters);
    expect(result.materials).toHaveLength(1);
    expect(result.materials[0].title).toBe('Textbook');
    expect(result.materials[0].content).toBe(transcription);
  });

  test.each([0, 1, 5])('two PDFs preserve source order when AI returns %i materials', async count => {
    global.fetch.mockResolvedValueOnce(respond('First complete PDF'))
      .mockResolvedValueOnce(respond('Second complete PDF'))
      .mockResolvedValueOnce(respond(JSON.stringify({ course: { title: 'Course' }, materials: Array.from({ length: count }, () => ({ title: 'Unmapped chapter' })) })));
    const result = await generateCourseFromScans([pdf('First.pdf'), pdf('Second.pdf')]);
    expect(result.materials.map(item => item.title)).toEqual(['First', 'Second']);
    expect(result.materials.map(item => item.content)).toEqual(['First complete PDF', 'Second complete PDF']);
  });

  test('matching metadata is retained while content comes from OCR', async () => {
    global.fetch.mockResolvedValueOnce(respond('Full source content'))
      .mockResolvedValueOnce(respond(JSON.stringify({ course: { title: 'Course' }, materials: [{ title: 'AI title', description: 'Summary', chapterName: 'Chapter', content: 'Shortened text' }] })));
    const result = await generateCourseFromScans([pdf('Chapter.pdf')]);
    expect(result.materials[0]).toEqual({ title: 'AI title', description: 'Summary', chapterName: 'Chapter', content: 'Full source content', exercisePatterns: [], exercisePatternsReviewed: true, exerciseAnalysisReport: 'DOCUMENT ANALYSIS: No exercises' });
  });
  test('retains exercise formats on their original PDF when material metadata count differs', async () => {
    const patterns = [
      { description: 'Complete a missing fraction', skillTested: 'Addition', cognitiveLevel: 2, sourceFileIndex: 0, chapterName: 'Fractions', topics: ['Addition'], label: 'Fill in the blanks', questionType: 'short-answer', instructions: 'Complete the blanks', example: '1/5 + 2/5 = ___', sourcePages: [2] },
      { description: 'Judge a statement', skillTested: 'Recall', cognitiveLevel: 1, sourceFileIndex: 1, chapterName: 'Plants', topics: [], label: 'True or false', questionType: 'true-false', instructions: 'State true or false', example: 'Plants need water.', sourcePages: [3] }
    ];
    global.fetch.mockResolvedValueOnce(respond('Fraction exercises')).mockResolvedValueOnce(respond('Plant exercises'))
      .mockResolvedValueOnce(respond(JSON.stringify({ course: { title: 'Course', exercisePatterns: [{ label: 'Wrong synthesis format' }] }, materials: [] })))
      .mockResolvedValueOnce(respond(JSON.stringify({ status: 'complete', analysisReport: 'DOCUMENT ANALYSIS: Exercise report', reviewNote: 'Reviewed all pages', exercisePatterns: [patterns[0]] })))
      .mockResolvedValueOnce(respond(JSON.stringify({ status: 'complete', analysisReport: 'DOCUMENT ANALYSIS: Exercise report', reviewNote: 'Reviewed all pages', exercisePatterns: [patterns[1]] })));
    const result = await generateCourseFromScans([pdf('Math.pdf'), pdf('Science.pdf')]);
    expect(result.course.exercisePatterns).toHaveLength(2);
    expect(result.course.exerciseAnalysisReports).toEqual([{ sourceFileName: 'Math.pdf', report: 'DOCUMENT ANALYSIS: Exercise report' }, { sourceFileName: 'Science.pdf', report: 'DOCUMENT ANALYSIS: Exercise report' }]);
    expect(result.materials[1].exerciseAnalysisReport).toBe('DOCUMENT ANALYSIS: Exercise report');
    expect(result.materials[0].exercisePatterns[0]).toMatchObject({ ...patterns[0], sourceFileName: 'Math.pdf' });
    expect(result.materials[1].exercisePatterns[0]).toMatchObject({ ...patterns[1], sourceFileName: 'Science.pdf' });
    const synthesis = JSON.parse(global.fetch.mock.calls[2][1].body);
    expect(synthesis.text.format.schema.properties.course.required).toContain('exercisePatterns');
  });

});

test('truncated OCR is not silently saved as a complete course without its final exercises', async () => {
  const originalFetch = global.fetch;
  const originalKey = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = 'test';
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ status: 'incomplete', output_text: 'Only the beginning of the chapter' }) });
  try {
    await expect(generateCourseFromScans([{ originalname: 'Long.pdf', path: '/tmp/Long.pdf', mimetype: 'application/pdf' }])).rejects.toThrow('Split the PDF');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  } finally {
    global.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalKey;
  }
});

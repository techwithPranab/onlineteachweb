jest.mock('fs', () => ({ promises: { readFile: jest.fn().mockResolvedValue(Buffer.from('%PDF-test')) } }));
const { generateCourseFromScans } = require('./scanMaterial.service');

describe('course scan material mapping', () => {
  const originalFetch = global.fetch;
  const originalKey = process.env.OPENAI_API_KEY;
  const pdf = name => ({ originalname: name, path: `/tmp/${name}`, mimetype: 'application/pdf' });
  const respond = text => ({ ok: true, json: async () => ({ output_text: text }) });

  beforeEach(() => {
    process.env.OPENAI_API_KEY = 'test';
    global.fetch = jest.fn();
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
    expect(result.materials[0]).toEqual({ title: 'AI title', description: 'Summary', chapterName: 'Chapter', content: 'Full source content' });
  });
});

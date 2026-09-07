const mongoose = require('mongoose');
const QuestionGeneration = require('./QuestionGeneration.model');

const makeRecord = sourceSnapshot => new QuestionGeneration({
  courseId: new mongoose.Types.ObjectId(),
  chapterName: 'Fractions',
  topic: 'Equivalent Fractions',
  aiProvider: 'openai',
  model: 'test-model',
  prompt: 'Generate fraction figure questions.',
  sourceSnapshot
});

test('source snapshots accept and preserve material and syllabus metadata', () => {
  const materialId = new mongoose.Types.ObjectId();
  const capturedAt = new Date('2026-09-07T10:00:00Z');
  const updatedAt = new Date('2026-09-06T10:00:00Z');
  const record = makeRecord({
    content: 'Fraction lesson text',
    contentHash: 'source-content-hash',
    capturedAt,
    sources: [
      { type: 'material', materialId: materialId.toString(), title: 'Fraction scan', updatedAt },
      { type: 'syllabus' }
    ]
  });

  expect(record.validateSync()).toBeUndefined();
  const snapshot = record.toObject().sourceSnapshot;
  expect(snapshot).toMatchObject({ content: 'Fraction lesson text', contentHash: 'source-content-hash', capturedAt });
  expect(snapshot.sources).toHaveLength(2);
  expect(snapshot.sources[0]).toMatchObject({ type: 'material', materialId, title: 'Fraction scan', updatedAt });
  expect(snapshot.sources[1]).toMatchObject({ type: 'syllabus' });
});

test('source metadata remains optional for legacy and prompt-only generation records', () => {
  for (const snapshot of [undefined, {}, { sources: [] }]) {
    expect(makeRecord(snapshot).validateSync()).toBeUndefined();
  }
});

test('source material IDs still receive ObjectId validation', () => {
  const record = makeRecord({ sources: [{ type: 'material', materialId: 'invalid-id' }] });
  expect(record.validateSync().errors['sourceSnapshot.sources.0.materialId'].kind).toBe('ObjectId');
});

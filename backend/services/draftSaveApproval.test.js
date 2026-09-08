jest.mock('../utils/logger', () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn() }));
const mongoose = require('mongoose');
const Draft = require('../models/AIQuestionDraft.model');
const Question = require('../models/Question.model');
const service = require('../ai/AIQuestionGenerationService');
const courseId = new mongoose.Types.ObjectId();
const userId = new mongoose.Types.ObjectId();
const payload = { courseId, courseTitle: 'Class 4', grade: 4, subject: 'Mathematics', chapterName: 'Fractions', topic: 'Fractions', difficultyLevel: 'easy', type: 'short-answer', text: 'Give the fraction shaded.', correctAnswer: '1/3', expectedAnswer: '1/3', explanation: 'One out of three equal parts is shaded.', marks: 1, diagram: { type: 'fraction', params: { style: 'triangle', denominator: 3, numerator: 1 } } };
afterEach(() => jest.restoreAllMocks());
test('Save Only persists draft edits and history without publishing', async () => {
  const draft = new Draft({ questionPayload: payload, modelUsed: 'openai/test', createdBy: userId, status: 'draft' });
  const save = jest.spyOn(draft, 'save').mockImplementation(async () => { expect(draft.validateSync()).toBeUndefined(); return draft; });
  const create = jest.spyOn(Question, 'create');
  await draft.recordEdit(userId, { text: 'Updated question', diagram: null }, 'Manual save');
  expect(save).toHaveBeenCalledTimes(1);
  expect(draft.status).toBe('draft');
  expect(draft.questionPayload.text).toBe('Updated question');
  expect(draft.questionPayload.diagram).toBeNull();
  expect(draft.questionPayload.courseId.toString()).toBe(courseId.toString());
  expect(draft.editHistory[0].previousPayload.text).toBe(payload.text);
  expect(create).not.toHaveBeenCalled();
});
test('Save & Approve retains required course metadata after validation', async () => {
  const draft = new Draft({ questionPayload: payload, modelUsed: 'openai/test', createdBy: userId, status: 'draft' });
  jest.spyOn(Draft, 'findById').mockResolvedValue(draft);
  jest.spyOn(draft, 'save').mockImplementation(async () => { expect(draft.validateSync()).toBeUndefined(); return draft; });
  const create = jest.spyOn(Question, 'create').mockImplementation(async data => {
    const question = new Question(data);
    expect(question.validateSync()).toBeUndefined();
    return question;
  });
  const result = await service.approveDraft(draft._id, userId, { ...payload, text: 'Edited question', marks: 2 });
  expect(create).toHaveBeenCalledTimes(1);
  expect(result.question.courseId.toString()).toBe(courseId.toString());
  expect(result.question.grade).toBe(4);
  expect(result.question.subject).toBe('Mathematics');
  expect(draft.questionPayload.text).toBe('Edited question');
  expect(draft.questionPayload.marks).toBe(2);
  expect(draft.status).toBe('approved');
});
test('Save Only cannot change an approved draft', () => {
  const draft = new Draft({ questionPayload: payload, modelUsed: 'openai/test', createdBy: userId, status: 'approved' });
  expect(() => draft.recordEdit(userId, { text: 'Changed' })).toThrow('Only pending drafts');
});

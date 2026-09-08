const { asOpenTextFraction } = require('./fractionAnswer');
const validator = require('../ai/validation/QuestionValidator');
const service = require('../ai/AIQuestionGenerationService');
const Draft = require('../models/AIQuestionDraft.model');
const Question = require('../models/Question.model');
const { generateQuestionPrompt } = require('../ai/prompts/questionPrompts');
const question = { type: 'numerical', text: 'What fraction of the rectangle is unshaded?', topic: 'Fractions', difficultyLevel: 'easy', correctAnswer: '5/8', numericalAnswer: { value: 5, tolerance: 0.1 }, chapterName: 'Fractions' };
test('fraction validation saves open text and removes numerical grading', () => {
  const result = validator.validate(question);
  expect(result.errors).toEqual([]);
  expect(result.sanitized).toMatchObject({ type: 'short-answer', correctAnswer: '5/8', expectedAnswer: '5/8' });
  expect(result.sanitized.numericalAnswer).toBeUndefined();
  expect(question.type).toBe('numerical');
});
test('ordinary numerical and multiple-choice questions are unchanged', () => {
  const numeric = { type: 'numerical', text: 'What is 2+3?', correctAnswer: '5' };
  expect(asOpenTextFraction(numeric)).toBe(numeric);
  const mcq = { ...question, type: 'mcq-single' };
  expect(asOpenTextFraction(mcq)).toBe(mcq);
});
test('fraction generation uses text-answer schema even when numerical was requested', () => {
  const { userPrompt } = generateQuestionPrompt({ topic: 'Fractions', content: '', difficultyLevel: 'easy', questionType: 'numerical', count: 1, context: {} });
  expect(userPrompt).toContain('expectedAnswer');
  expect(userPrompt).not.toContain('"numericalAnswer":');
});
test('old fraction drafts approve as open text without manual decimal correction', async () => {
  const save = jest.fn();
  const draft = { status: 'draft', questionPayload: { ...question, courseId: 'course' }, modelUsed: 'openai/test', save };
  const find = jest.spyOn(Draft, 'findById').mockResolvedValue(draft);
  const create = jest.spyOn(Question, 'create').mockResolvedValue({ _id: 'saved' });
  try {
    await service.approveDraft('draft', 'user');
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ type: 'short-answer', correctAnswer: '5/8', expectedAnswer: '5/8' }));
    expect(create.mock.calls[0][0].numericalAnswer).toBeUndefined();
  } finally { find.mockRestore(); create.mockRestore(); }
});
test('open text accepts the fraction itself and does not grade against a numerator', () => {
  const { evaluateAnswer } = require('./answerEvaluation');
  const text = asOpenTextFraction(question);
  expect(evaluateAnswer(text, '5/8')).toBe(true);
  expect(evaluateAnswer(text, '5')).toBe(false);
});

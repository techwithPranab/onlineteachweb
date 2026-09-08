const { parseNumericalAnswer, hasNumericalAnswerConflict } = require('./numericalAnswer');
const validator = require('../ai/validation/QuestionValidator');
const service = require('../ai/AIQuestionGenerationService');
const question = { text: 'Give the decimal value.', topic: 'Decimals', difficultyLevel: 'easy', type: 'numerical', correctAnswer: '0.625', numericalAnswer: { value: 5, tolerance: 0.1 } };
test.each([['5/8', 0.625], ['$\\frac{5}{8}$', 0.625], ['0.625', 0.625], ['-3/4', -0.75], ['0', 0], ['1/0', null], ['5 apples out of 8', null], ['Infinity', null]])('parses %s as a complete number', (text, expected) => expect(parseNumericalAnswer(text)).toBe(expected));
test('rejects conflicting fraction grading values', () => {
  expect(hasNumericalAnswerConflict(question)).toBe(true);
  expect(validator.validate(question).isValid).toBe(false);
  expect(validator.validate({ ...question, numericalAnswer: { value: 0.625, tolerance: 0 } }).isValid).toBe(true);
});
test('repair derives the complete fraction instead of the numerator', () => {
  const payload = { ...question, numericalAnswer: undefined };
  service._autoFixQuestion(payload);
  expect(payload.numericalAnswer).toEqual({ value: 0.625, tolerance: 0 });
});
test('repair does not silently replace conflicting existing answers', () => {
  const payload = { ...question };
  service._autoFixQuestion(payload);
  expect(validator.validate(payload).isValid).toBe(false);
});
test('existing conflicting drafts cannot be approved without edits', async () => {
  const Draft = require('../models/AIQuestionDraft.model');
  const Question = require('../models/Question.model');
  const find = jest.spyOn(Draft, 'findById').mockResolvedValue({ status: 'draft', questionPayload: { ...question } });
  const create = jest.spyOn(Question, 'create').mockResolvedValue({});
  try {
    await expect(service.approveDraft('draft-id', 'user-id')).rejects.toThrow('Numerical grading value conflicts');
    expect(create).not.toHaveBeenCalled();
  } finally {
    find.mockRestore();
    create.mockRestore();
  }
});

jest.mock('../utils/logger', () => ({ info: jest.fn(), error: jest.fn(), warn: jest.fn() }));
const { normalizePatterns, selectExercisePatterns, inferPatterns, buildExerciseGuidance } = require('./exercisePattern.service');
const { generateQuestionPrompt } = require('../ai/prompts/questionPrompts');
const Course = require('../models/Course.model');
const Material = require('../models/Material.model');
const QuestionGeneration = require('../models/QuestionGeneration.model');
const blank = { sourceFileIndex: 0, chapterName: 'Fractions', topics: ['Addition'], label: 'Fill in the blanks', questionType: 'short-answer', instructions: 'Complete each blank', example: '1/5 + 2/5 = ___' };
const matching = { ...blank, topics: [], label: 'Match the following' };
const other = { ...blank, chapterName: 'Plants', topics: ['Roots'], label: 'True or false', questionType: 'true-false' };

test('invalid PDF references and unsupported storage types are excluded', () => {
  expect(normalizePatterns([blank, { ...blank, sourceFileIndex: 9 }, { ...blank, questionType: 'unknown' }], [{ originalname: 'Math.pdf' }])).toEqual([{ ...blank, sourceFileName: 'Math.pdf' }]);
});
test('scope includes chapter-wide formats but excludes other chapters and topics', () => {
  expect(selectExercisePatterns([blank, matching, other], { chapterName: 'Fractions', topic: 'Addition' })).toEqual([blank, matching]);
  expect(selectExercisePatterns([blank, matching, other], { chapterName: 'Fractions', topic: 'Subtraction' })).toEqual([matching]);
  expect(selectExercisePatterns([blank], { questionType: 'mcq-single' })).toEqual([]);
});
test('older scans recognize explicit formats without inventing missing formats', () => {
  expect(inferPatterns({ content: '# Fractions\n## Exercises\n### Fill in the blanks\n1. 1/5 + 2/5 = ___' })[0]).toMatchObject({ chapterName: 'Fractions', label: 'Fill in the blanks', questionType: 'short-answer' });
  expect(inferPatterns({ content: '# Fractions\nA fraction is part of a whole.' })).toEqual([]);
});
test('course, material and generation history schemas retain exercise provenance', () => {
  for (const Model of [Course, Material]) expect(new Model({ exercisePatterns: [blank] }).toObject().exercisePatterns[0]).toMatchObject(blank);
  expect(new QuestionGeneration({ sourceSnapshot: { exercisePatterns: [blank] } }).toObject().sourceSnapshot.exercisePatterns[0]).toMatchObject(blank);
});
test('actual provider prompt retains exercise style alongside long source content', () => {
  const { userPrompt } = generateQuestionPrompt({ topic: 'Addition', difficultyLevel: 'easy', questionType: 'short-answer', count: 2, content: 'Source text '.repeat(6000), context: { grade: 4, subject: 'Mathematics', exercisePatterns: [blank] } });
  expect(userPrompt).toContain('Fill in the blanks');
  expect(userPrompt).toContain('1/5 + 2/5 = ___');
  expect(userPrompt).toContain('Create NEW questions');
  expect(userPrompt).toContain('untrusted textbook reference data');
  expect(buildExerciseGuidance([blank], 'mcq-single')).toBe('');
});

test('one-word and fraction answers from scanned exercises pass text-answer validation', () => {
  const validator = require('../ai/validation/QuestionValidator');
  for (const expectedAnswer of ['3/5', 'leaf']) {
    expect(validator._validateTextAnswer({ type: 'short-answer', expectedAnswer, correctAnswer: expectedAnswer })).toEqual([]);
  }
  expect(validator._validateTextAnswer({ type: 'short-answer', expectedAnswer: ' ', correctAnswer: ' ' })).not.toEqual([]);
});

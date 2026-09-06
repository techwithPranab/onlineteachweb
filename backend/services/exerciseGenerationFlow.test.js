jest.mock('../utils/logger', () => ({ info: jest.fn(), error: jest.fn(), warn: jest.fn() }));
jest.mock('../ai/providers/AIProviderFactory', () => ({ getBestAvailable: jest.fn() }));
jest.mock('../ai/validation/QuestionValidator', () => ({ validateBatch: jest.fn(q => ({ valid: q, validCount: q.length, invalidCount: 0 })) }));
jest.mock('../ai/validation/ContentFilter', () => ({ filterBatch: jest.fn(q => ({ passed: q, passedCount: q.length })) }));
jest.mock('../ai/validation/DuplicateDetector', () => ({ checkBatchDuplicates: jest.fn(q => ({ uniqueQuestions: q, duplicateCount: 0 })) }));
jest.mock('./exercisePattern.service', () => ({ ...jest.requireActual('./exercisePattern.service'), loadExercisePatterns: jest.fn() }));
const Course = require('../models/Course.model');
const Question = require('../models/Question.model');
const QuestionGeneration = require('../models/QuestionGeneration.model');
const QuestionOfflinePrompt = require('../models/QuestionOfflinePrompt.model');
const patterns = require('./exercisePattern.service');
const factory = require('../ai/providers/AIProviderFactory');
const service = require('../ai/AIQuestionGenerationService');
const offline = require('./offlinePromptService');
const queue = require('./aiGenerationQueue.service');
const course = { _id: 'course', title: 'Math', grade: 4, subject: 'Mathematics', syllabus: ['Fractions'], chapters: [{ name: 'Fractions', topics: ['Addition'], learningObjectives: ['Add fractions'] }] };
const blank = { chapterName: 'Fractions', topics: ['Addition'], label: 'Fill in the blanks', questionType: 'short-answer', instructions: 'Complete the blanks', example: '1/5 + 2/5 = ___' };
const provider = { getName: () => 'mock', getVersion: () => 'test', generateQuestions: jest.fn() };
beforeEach(() => {
  jest.spyOn(Course, 'findById').mockResolvedValue(course);
  patterns.loadExercisePatterns.mockResolvedValue([blank]);
  factory.getBestAvailable.mockResolvedValue(provider);
});
afterEach(() => { jest.restoreAllMocks(); jest.clearAllMocks(); });

test('generation defaults to detected exercise types for the topic and keeps manual override', async () => {
  jest.spyOn(service, '_prepareContent').mockResolvedValue({ combinedContent: 'Fractions', snapshot: {} });
  const generate = jest.spyOn(service, '_generateForCombination').mockResolvedValue([{ text: 'A new blank' }]);
  jest.spyOn(Question, 'find').mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });
  jest.spyOn(service, '_saveDrafts').mockResolvedValue([{ _id: 'draft' }]);
  await service.generateQuestions({ courseId: 'course', difficultyLevels: ['easy'], questionTypes: ['mcq-single'], materialIds: ['pdf-material'] });
  expect(patterns.loadExercisePatterns).toHaveBeenCalledWith(course, ['pdf-material']);
  expect(generate).toHaveBeenLastCalledWith(expect.objectContaining({ type: 'short-answer', exercisePatterns: [blank], chapterName: 'Fractions' }));
  await service.generateQuestions({ courseId: 'course', difficultyLevels: ['easy'], questionTypes: ['mcq-single'], useExercisePatterns: false });
  expect(generate).toHaveBeenLastCalledWith(expect.objectContaining({ type: 'mcq-single' }));
});

test('saved prompt and actual provider receive the same exercise evidence', async () => {
  jest.spyOn(QuestionGeneration, 'create').mockResolvedValue({ _id: 'generation' });
  jest.spyOn(QuestionGeneration, 'findByIdAndUpdate').mockResolvedValue({});
  provider.generateQuestions.mockResolvedValue([]);
  await service._generateForCombination({ provider, topic: 'Addition', difficulty: 'easy', type: 'short-answer', count: 2, content: { combinedContent: 'Fractions', snapshot: {} }, course, courseId: 'course', exercisePatterns: [blank], chapterName: 'Fractions' });
  expect(QuestionGeneration.create).toHaveBeenCalledWith(expect.objectContaining({ finalPrompt: expect.stringContaining('Fill in the blanks'), sourceSnapshot: expect.objectContaining({ exercisePatterns: [blank] }) }));
  expect(provider.generateQuestions).toHaveBeenCalledWith(expect.objectContaining({ context: expect.objectContaining({ exercisePatterns: [blank] }), questionType: 'short-answer' }));
});

test('offline prompt records the same exercise examples and chapter curriculum', async () => {
  jest.spyOn(QuestionOfflinePrompt, 'create').mockImplementation(async data => ({ ...data, _id: 'offline' }));
  await offline.generateOfflinePrompt({ courseId: 'course', chapterName: 'Fractions', topic: 'Addition', grade: 4, subject: 'Mathematics', questionType: 'short-answer', difficultyLevel: 'easy', questionsCount: 2, saveToFile: false }, 'admin');
  const saved = QuestionOfflinePrompt.create.mock.calls[0][0];
  expect(saved.promptText).toContain('Fill in the blanks');
  expect(saved.promptText).toContain('1/5 + 2/5 = ___');
  expect(saved.promptText).toContain('Add fractions');
});

test('queued jobs forward source/type settings and collect generated draft IDs', async () => {
  const generate = jest.spyOn(service, 'generateQuestions').mockResolvedValue({ drafts: ['draft'], errors: [] });
  jest.spyOn(queue, 'notifyUser').mockResolvedValue();
  const data = { courseId: 'course', topics: [], materialIds: ['pdf'], sources: ['materials'], questionTypes: ['short-answer'], difficultyLevels: ['easy'], questionsPerTopic: 2, useExercisePatterns: true, userId: 'admin' };
  const job = { id: 'test-job', data, results: [], errors: [], totalItems: 1, retryCount: 0 };
  await queue.processJob(job);
  expect(generate).toHaveBeenCalledWith(data);
  expect(job.status).toBe('completed');
  expect(job.results).toEqual(['draft']);
});

test('single-type generator passes textbook evidence and real course context to the provider', async () => {
  factory.get = jest.fn(() => provider);
  provider.generateQuestions.mockResolvedValue([{ text: 'Complete the blank: 1/5 + 2/5 = ___', expectedAnswer: '3/5' }]);
  const legacy = require('./aiQuestionGenerator');
  const result = await legacy.generateQuestionsWithAI({ prompt: 'Fallback', chapterName: 'Fractions', topic: 'Addition', questionType: 'short-answer', difficultyLevel: 'easy', count: 1,
    context: { grade: 4, subject: 'Mathematics', exercisePatterns: [blank], sourceContent: 'Fraction addition' } });
  expect(result.success).toBe(true);
  expect(provider.generateQuestions).toHaveBeenLastCalledWith(expect.objectContaining({ content: 'Fraction addition', context: expect.objectContaining({ grade: 4, subject: 'Mathematics', exercisePatterns: [blank] }) }));
  expect(result.finalPrompt).toContain('Fill in the blanks');
  expect(result.finalPrompt).not.toContain('EVERY question MUST have complete answer options with ONE marked as correct');
});

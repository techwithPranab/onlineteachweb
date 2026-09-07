const QuestionValidator = require('./QuestionValidator');
const { generateQuestionPrompt } = require('../prompts/questionPrompts');
const fractionPrompt = require('../prompts/fractionDiagramPrompt');
const base = {
  text: 'Which figure shows half of its area shaded?', topic: 'Fractions', type: 'mcq-single', difficultyLevel: 'olympiad',
  options: [{ text: 'A', isCorrect: true }, { text: 'B', isCorrect: false }, { text: 'C', isCorrect: false }, { text: 'D', isCorrect: false }],
  correctAnswer: 'A',
  explanation: 'Figure A has two shaded quarters, which is one half.',
  diagram: { type: 'fraction', params: { showLabel: false, panels: [
    { label: 'A', style: 'pie', numerator: 2, denominator: 4 },
    { label: 'B', style: 'triangle', numerator: 1, denominator: 3 },
    { label: 'C', style: 'grid', rows: 1, cols: 2, cells: ['full', 'top-left'] },
    { label: 'D', text: 'None of these' },
  ] } },
};
test('generation prompt describes the new contract and avoids answer disclosure', () => {
  const { userPrompt } = generateQuestionPrompt({ topic: 'Fractions', content: '', difficultyLevel: 'olympiad', questionType: 'mcq-single', count: 4, context: { grade: 4, subject: 'Mathematics' }, imageBased: true, diagramTypes: ['fraction'] });
  expect(userPrompt).toContain(fractionPrompt);
  expect(userPrompt).toContain('showLabel:false');
  expect(userPrompt).toContain('not inside options');
  expect(userPrompt).toContain('exactly one answer is correct');
});
test('question validation preserves all panels for storage and student rendering', () => {
  const result = QuestionValidator.validate(base);
  expect(result.errors).toEqual([]);
  expect(result.sanitized.diagram.params).toEqual(base.diagram.params);
});
test('invalid fraction geometry prevents a generated question passing validation', () => {
  const result = QuestionValidator.validate({ ...base, diagram: { type: 'fraction', params: { style: 'grid', rows: 5, cols: 5, cells: ['full'] } } });
  expect(result.isValid).toBe(false);
  expect(result.sanitized).toBeNull();
  expect(result.errors.join(' ')).toContain('one valid shading value per cell');
});

test('Olympiad Mathematics courses select fraction diagrams', () => {
  const { getDiagramTypesForContext } = require('../diagramTypeMatcher');
  for (const subject of ['Mathematics', 'Olympiad-Mathematics', 'Olympiad Mathematics']) {
    expect(getDiagramTypesForContext({ grade: 4, subject, topic: 'Fractions' })).toContain('fraction');
  }
  expect(getDiagramTypesForContext({ grade: 4, subject: 'Olympiad Science', topic: 'Fractions' })).not.toContain('fraction');
});
test('active quizzes and session snapshots retain nested figure geometry', () => {
  const ActiveQuiz = require('../../models/ActiveQuiz.model');
  const QuizSession = require('../../models/QuizSession.model');
  const mongoose = require('mongoose');
  const id = new mongoose.Types.ObjectId();
  const active = new ActiveQuiz({ questions: [{ id: id.toString(), question: base.text, diagram: base.diagram }] });
  const session = new QuizSession({ selectedQuestions: [{ questionId: id, question: base.text, diagram: base.diagram }] });
  expect(active.toObject().questions[0].diagram).toEqual(base.diagram);
  expect(session.toObject().selectedQuestions[0].diagram).toEqual(base.diagram);
});

test('set shorthand is validated and stored as a fraction set without mutating input', () => {
  for (const type of ['set', 'SET', ' set ']) {
    const question = { ...base, diagram: { type, params: { numerator: 2, denominator: 5 }, caption: 'Objects' } };
    const result = QuestionValidator.validate(question);
    expect(result.errors).toEqual([]);
    expect(result.sanitized.diagram).toEqual({ type: 'fraction', params: { numerator: 2, denominator: 5, style: 'set' }, caption: 'Objects' });
    expect(question.diagram.type).toBe(type);
    expect(question.diagram.params.style).toBeUndefined();
  }
});

test('set shorthand cannot bypass fraction geometry validation', () => {
  const result = QuestionValidator.validate({ ...base, diagram: { type: 'set', params: { numerator: 6, denominator: 5 } } });
  expect(result.isValid).toBe(false);
  expect(result.errors.join(' ')).toContain('set numerator cannot exceed');
});

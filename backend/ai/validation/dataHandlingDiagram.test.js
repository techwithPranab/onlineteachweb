const QuestionValidator = require('./QuestionValidator');
const { generateQuestionPrompt } = require('../prompts/questionPrompts');
const { getDiagramTypesForContext } = require('../diagramTypeMatcher');

const question = diagram => ({
  text: 'Study the diagram. How many more apples were sold on Monday than Tuesday?',
  topic: 'Pictographs', difficultyLevel: 'easy', type: 'mcq-single', diagram,
  options: [
    { text: '10', isCorrect: true }, { text: '2', isCorrect: false },
    { text: '20', isCorrect: false }, { text: '5', isCorrect: false }
  ],
  correctAnswer: '10', explanation: 'Two additional symbols represent ten apples.', tags: ['data handling']
});

test('pictographs are selected for data handling and described in the generation prompt', () => {
  expect(getDiagramTypesForContext({ grade: 4, subject: 'Mathematics', topic: 'Pictographs' })).toContain('pictograph');
  const { userPrompt } = generateQuestionPrompt({ topic: 'Pictographs', content: '', difficultyLevel: 'easy', questionType: 'mcq-single', count: 1, context: { grade: 4, subject: 'Mathematics' }, imageBased: true, diagramTypes: ['pictograph'] });
  expect(userPrompt).toContain('count * valuePerSymbol');
  expect(userPrompt).toContain('hypothetical changes');
});

test('valid pictograph question passes validation', () => {
  const result = QuestionValidator.validate(question({ type: 'pictograph', params: { data: [{ label: 'Monday', count: 4 }, { label: 'Tuesday', count: 2 }], symbol: 'apple', valuePerSymbol: 5, unit: 'apples' } }));
  expect(result.errors).toEqual([]);
});

test('invalid pictograph and unreadable bar scales are rejected', () => {
  expect(QuestionValidator.validate(question({ type: 'pictograph', params: { data: [{ label: 'Monday', count: 1.5 }], symbol: 'apple', valuePerSymbol: 0, unit: '' } })).isValid).toBe(false);
  const result = QuestionValidator.validate(question({ type: 'barGraph', params: { data: [{ label: 'A', value: 12 }, { label: 'B', value: 20 }], tickStep: 5 } }));
  expect(result.errors.join(' ')).toContain('align exactly');
});

const OpenAIProvider = require('./OpenAIProvider');

const originalFetch = global.fetch;
afterEach(() => { global.fetch = originalFetch; });

const mockResponse = content => ({
  ok: true,
  json: async () => ({ choices: [{ message: { content: JSON.stringify(content) } }] })
});

function expectModernTokenLimit(expected) {
  const payload = JSON.parse(global.fetch.mock.calls.at(-1)[1].body);
  expect(payload.max_completion_tokens).toBe(expected);
  expect(payload).not.toHaveProperty('max_tokens');
}

test('question generation uses max_completion_tokens with current OpenAI models', async () => {
  global.fetch = jest.fn().mockResolvedValue(mockResponse({ questions: [{
    text: 'What does the pictograph show?', topic: 'Pictographs', difficultyLevel: 'easy', type: 'mcq-single',
    options: [{ text: 'Apples', isCorrect: true }, { text: 'Cars', isCorrect: false }],
    correctAnswer: 'Apples', explanation: 'The symbols are apples.'
  }] }));
  const provider = new OpenAIProvider({ apiKey: 'test', model: 'gpt-5.6-luna' });
  await provider.generateQuestions({ topic: 'Pictographs', content: '', difficultyLevel: 'easy', questionType: 'mcq-single', count: 2 });
  expectModernTokenLimit(1600);
});

test('content extraction and validation use max_completion_tokens', async () => {
  global.fetch = jest.fn().mockResolvedValue(mockResponse({ valid: true }));
  const provider = new OpenAIProvider({ apiKey: 'test', model: 'gpt-5.6-luna' });
  await provider.extractContent('A pictograph lesson', 'Pictographs');
  expectModernTokenLimit(2000);
  await provider.validateQuestion({ text: 'Question' });
  expectModernTokenLimit(500);
});

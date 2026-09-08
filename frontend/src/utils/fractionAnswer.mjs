export function isFractionAnswer(question) {
  const answer = String(question.correctAnswer ?? question.expectedAnswer ?? '');
  return /\d\s*\/\s*\d|\\(?:dfrac|tfrac|frac)\s*\{/.test(answer)
    || /\bfractions?\b|\bmixed numbers?\b/i.test([question.text, question.question, question.topic, question.chapterName].filter(Boolean).join(' '));
}

export function asOpenTextFraction(question) {
  if (!question || question.type !== 'numerical' || !isFractionAnswer(question)) return question;
  const result = { ...question, type: 'short-answer' };
  const answer = String(question.correctAnswer ?? question.expectedAnswer ?? '').trim();
  result.correctAnswer = answer;
  result.expectedAnswer = answer;
  delete result.numericalAnswer;
  return result;
}


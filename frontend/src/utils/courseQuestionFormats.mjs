export const QUESTION_TYPE_LABELS = {
  'mcq-single': 'Multiple choice (single answer)',
  'mcq-multiple': 'Multiple choice (multiple answers)',
  'true-false': 'True / false',
  numerical: 'Numerical answer',
  'short-answer': 'Short answer',
  'long-answer': 'Long answer',
  'case-based': 'Case-based'
}

export function mergeExpectedFormats(patterns = [], generations = []) {
  const merged = new Map()
  const add = (pattern, origin) => {
    if (!pattern?.label || !pattern.questionType) return
    const key = JSON.stringify([pattern.sourceFileName || '', pattern.chapterName || '', pattern.topics || [], pattern.label, pattern.questionType, pattern.instructions || '', pattern.example || ''])
    const item = merged.get(key) || { ...pattern, origins: [] }
    if (!item.origins.includes(origin)) item.origins.push(origin)
    merged.set(key, item)
  }
  patterns.forEach(pattern => add(pattern, 'Scanned PDF'))
  generations.forEach(generation => (generation.sourceSnapshot?.exercisePatterns || []).forEach(pattern => add(pattern, 'Generation prompt')))
  return [...merged.values()]
}

export function getResponseQuestions(generation) {
  let response = generation.aiResponse
  try {
    // Older generation records contain a JSON string inside another JSON string.
    for (let depth = 0; depth < 2 && typeof response === 'string'; depth += 1) response = JSON.parse(response)
  } catch { response = null }
  const questions = Array.isArray(response) ? response : response?.questions
  if (Array.isArray(questions)) return questions.filter(item => item && typeof item === 'object')
  if (response?.text || response?.question) return [response]
  return (generation.generatedQuestions || []).filter(item => item && typeof item === 'object' && item.text)
}

export function safePdfUrl(url) {
  return typeof url === 'string' && (/^https?:\/\//i.test(url) || /^\/uploads\//.test(url)) ? url : null
}

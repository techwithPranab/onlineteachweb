const key = value => String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

export function getExercisePatterns(patterns = [], chapterName, topics = []) {
  return patterns.filter(pattern =>
    (!chapterName || !pattern.chapterName || key(pattern.chapterName) === key(chapterName)) &&
    (!topics.length || !pattern.topics?.length || pattern.topics.some(topic => topics.some(selected => key(selected) === key(topic))))
  )
}

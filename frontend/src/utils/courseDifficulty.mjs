export function getCourseDifficulties(course) {
  if (!course) return []
  return /\bolympiad\b/i.test(course.subject || '')
    ? ['olympiad']
    : ['easy', 'medium', 'hard']
}

function getCourseDifficulties(course) {
  return /\bolympiad\b/i.test(course.subject || '')
    ? ['olympiad']
    : ['easy', 'medium', 'hard'];
}

function validateCourseDifficulties(course, levels) {
  const allowed = getCourseDifficulties(course);
  if (!Array.isArray(levels) || !levels.length || levels.some(level => !allowed.includes(level))) {
    return `This course only supports ${allowed.join(', ')} question difficulty.`;
  }
  return null;
}

module.exports = { getCourseDifficulties, validateCourseDifficulties };

const { exerciseExtractionSchema } = require('./exerciseExtractionPrompt');
const TYPES = exerciseExtractionSchema.properties.exercisePatterns.items.properties.questionType.enum;
const nonempty = value => typeof value === 'string' && value.trim().length > 0;

function nameKey(value) {
  return String(value || '').normalize('NFKC').toLowerCase().trim()
    .replace(/^(?:chapter|unit|lesson)\s+(?:\d+|[ivxlcdm]+)\b\s*[:.)–—-]?\s*/i, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
    .split(/\s+/).map(word => word.length > 3 && /s$/.test(word) && !/(ss|us|is)$/.test(word) ? word.slice(0, -1) : word).join(' ');
}

function canonicalName(value, names) {
  if (!nonempty(value)) return null;
  // Prefer the exact name. Normalize only if there is a single possible match;
  // never use substring matching or assign the only chapter arbitrarily.
  if (names.includes(value)) return value;
  const matches = [...new Set(names.filter(name => nameKey(name) === nameKey(value)))];
  return matches.length === 1 ? matches[0] : null;
}

function validateExerciseReview(review, course) {
  const issues = [];
  const report = review && typeof review === 'object' ? review : {};
  if (!['complete', 'no_exercises'].includes(report.status)) issues.push('status: must be complete or no_exercises for a readable PDF');
  if (!nonempty(report.analysisReport)) issues.push('analysisReport: missing document analysis');
  if (!Array.isArray(report.exercisePatterns)) {
    issues.push('exercisePatterns: must be an array');
    return { issues, patterns: [] };
  }
  if (report.status === 'complete' && !report.exercisePatterns.length) issues.push('exercisePatterns: complete status requires at least one evidenced format');
  if (report.status === 'no_exercises' && report.exercisePatterns.length) issues.push('exercisePatterns: no_exercises status requires an empty inventory');
  const chapters = course.chapters || [];
  const patterns = report.exercisePatterns.map((input, index) => {
    const pattern = input && typeof input === 'object' ? { ...input } : {};
    const issue = (field, reason) => issues.push(`exercisePatterns[${index}].${field}: ${reason}`);
    for (const field of ['label', 'description', 'skillTested', 'instructions', 'example']) {
      if (!nonempty(pattern[field])) issue(field, 'missing readable source evidence');
      else pattern[field] = pattern[field].trim();
    }
    if (!TYPES.includes(pattern.questionType)) issue('questionType', `must be one of ${TYPES.join(', ')}`);
    if (!Number.isInteger(pattern.cognitiveLevel) || pattern.cognitiveLevel < 1 || pattern.cognitiveLevel > 5) issue('cognitiveLevel', 'must be an integer from 1 to 5');
    if (!Array.isArray(pattern.sourcePages) || !pattern.sourcePages.length || pattern.sourcePages.some(page => !Number.isInteger(page) || page < 1)) {
      issue('sourcePages', 'must contain at least one positive 1-based PDF page number');
    } else pattern.sourcePages = [...new Set(pattern.sourcePages)].sort((a, b) => a - b);

    const canonicalChapter = canonicalName(pattern.chapterName, chapters.map(chapter => chapter.name));
    if (chapters.length && !canonicalChapter) issue('chapterName', `no unique match for ${JSON.stringify(pattern.chapterName)} in the course outline`);
    if (canonicalChapter) pattern.chapterName = canonicalChapter;
    const chapter = chapters.find(item => item.name === canonicalChapter);
    if (!Array.isArray(pattern.topics)) issue('topics', 'must be an array of canonical topic names, or [] for chapter-wide exercises');
    else {
      pattern.topics = pattern.topics.map(topic => {
        if (!nonempty(topic)) { issue('topics', 'topic names must be nonempty strings'); return topic; }
        if (!chapter) return topic.trim();
        const canonicalTopic = canonicalName(topic, chapter.topics || []);
        if (!canonicalTopic) issue('topics', `no unique match for ${JSON.stringify(topic)} in chapter ${JSON.stringify(chapter.name)}`);
        return canonicalTopic || topic;
      });
      pattern.topics = [...new Set(pattern.topics)];
    }
    return pattern;
  });
  return { issues, patterns };
}

module.exports = { canonicalName, validateExerciseReview };

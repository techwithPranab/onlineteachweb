/**
 * AI-Ready Question Selection Algorithm
 * 
 * Purpose: Intelligently select questions for quiz based on:
 * - Student's past performance (weak topics prioritization)
 * - Difficulty level requirements
 * - Question variety and recency
 * - Topic coverage balance
 * 
 * This is designed to be easily replaced with ML/AI model in future
 */

/**
 * Mock student performance data structure
 * In production, this would come from analytics service
 */
const mockStudentPerformance = {
  studentId: null,
  topicMastery: {
    // topicId: { attempts: number, successRate: number, lastAttempt: Date, avgTimeSpent: number }
  },
  weakTopics: [], // Array of topic IDs sorted by weakness
  recentQuestions: [], // Recently attempted question IDs (last 50)
  difficultyPreference: {
    easy: 0.3,
    medium: 0.5,
    hard: 0.2
  }
}

/**
 * Question data structure (mocked)
 */
const mockQuestionPool = [
  // {
  //   id: string,
  //   subject: string,
  //   courseId: string,
  //   topic: string,
  //   difficulty: 'easy' | 'medium' | 'hard',
  //   lastUsed: Date,
  //   avgSuccessRate: number,
  //   estimatedTime: number (seconds)
  // }
]

/**
 * Main Algorithm: Select Questions for Quiz
 * 
 * @param {Object} pastPerformance - Student's historical performance data
 * @param {Object} quizConfig - Quiz configuration from setup page
 * @returns {Array} - Selected question IDs with metadata
 */
export const selectQuestionsAlgorithm = (pastPerformance, quizConfig) => {
  console.log('[Algorithm] Starting question selection...')
  console.log('[Algorithm] Config:', quizConfig)
  console.log('[Algorithm] Performance:', pastPerformance)

  const {
    courseId,
    subject,
    difficulty,
    questionCount,
    duration,
    topicPreferences = [] // Optional: specific topics to focus
  } = quizConfig

  // Step 1: Filter available questions by course and subject
  const availableQuestions = filterQuestionsByCourse(courseId, subject)
  console.log(`[Algorithm] Available questions: ${availableQuestions.length}`)

  // Step 2: Identify weak topics for prioritization
  const weakTopics = identifyWeakTopics(pastPerformance, courseId)
  console.log(`[Algorithm] Weak topics identified: ${weakTopics.length}`)

  // Step 3: Exclude recently attempted questions
  const recentQuestionIds = pastPerformance?.recentQuestions || []
  const freshQuestions = availableQuestions.filter(
    q => !recentQuestionIds.includes(q.id)
  )
  console.log(`[Algorithm] Fresh questions: ${freshQuestions.length}`)

  // Step 4: Score and rank questions
  const scoredQuestions = scoreQuestions(
    freshQuestions,
    weakTopics,
    difficulty,
    pastPerformance
  )

  // Step 5: Select top questions based on score
  const selectedQuestions = selectTopQuestions(
    scoredQuestions,
    questionCount,
    difficulty
  )

  // Step 6: Ensure difficulty distribution
  const balancedQuestions = balanceDifficulty(
    selectedQuestions,
    questionCount,
    difficulty
  )

  // Step 7: Shuffle for randomness
  const shuffledQuestions = shuffleArray(balancedQuestions)

  console.log(`[Algorithm] Selected ${shuffledQuestions.length} questions`)
  
  return shuffledQuestions.map(q => ({
    questionId: q.id,
    topic: q.topic,
    difficulty: q.difficulty,
    estimatedTime: q.estimatedTime,
    reason: q.selectionReason // For AI tracking
  }))
}

/**
 * Filter questions by course and subject
 */
const filterQuestionsByCourse = (courseId, subject) => {
  // TODO: Replace with actual API call
  // For now, return mock data
  const mockQuestions = generateMockQuestions(courseId, subject, 100)
  return mockQuestions
}

/**
 * Identify weak topics from past performance
 * 
 * AI-Ready: This data structure enables ML models to:
 * - Predict mastery levels
 * - Identify learning gaps
 * - Recommend personalized study paths
 */
const identifyWeakTopics = (performance, courseId) => {
  if (!performance || !performance.topicMastery) {
    return []
  }

  const topics = Object.entries(performance.topicMastery)
    .filter(([topicId, data]) => {
      // Consider topic weak if:
      // - Success rate < 60%
      // - OR attempts < 3 (needs more practice)
      return data.successRate < 0.6 || data.attempts < 3
    })
    .sort((a, b) => {
      // Sort by success rate (ascending) and recency
      const scoreA = a[1].successRate - (isRecent(a[1].lastAttempt) ? 0.1 : 0)
      const scoreB = b[1].successRate - (isRecent(b[1].lastAttempt) ? 0.1 : 0)
      return scoreA - scoreB
    })
    .map(([topicId]) => topicId)

  return topics.slice(0, 10) // Top 10 weak topics
}

/**
 * Check if a date is within last 7 days
 */
const isRecent = (date) => {
  if (!date) return false
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  return new Date(date) > weekAgo
}

/**
 * Score questions based on multiple factors
 * 
 * Scoring criteria:
 * - Weak topic priority: +50 points
 * - Difficulty match: +30 points
 * - Not recently attempted: +20 points
 * - Student's historical difficulty with this type: +variable
 * - Topic variety bonus: +10 points
 */
const scoreQuestions = (questions, weakTopics, targetDifficulty, performance) => {
  return questions.map(question => {
    let score = 0
    let reasons = []

    // Weak topic bonus
    if (weakTopics.includes(question.topic)) {
      const weaknessRank = weakTopics.indexOf(question.topic)
      score += 50 - (weaknessRank * 3) // Higher score for weaker topics
      reasons.push(`Weak topic priority (rank ${weaknessRank + 1})`)
    }

    // Difficulty match
    if (question.difficulty === targetDifficulty) {
      score += 30
      reasons.push('Difficulty match')
    } else if (
      (targetDifficulty === 'medium' && question.difficulty !== 'medium') ||
      (targetDifficulty === 'easy' && question.difficulty === 'hard') ||
      (targetDifficulty === 'hard' && question.difficulty === 'easy')
    ) {
      score -= 20 // Penalize far-off difficulties
    }

    // Recency penalty (avoid recently used questions)
    if (question.lastUsed) {
      const daysSinceUsed = Math.floor(
        (Date.now() - new Date(question.lastUsed)) / (1000 * 60 * 60 * 24)
      )
      if (daysSinceUsed > 30) {
        score += 15
        reasons.push('Not used recently')
      } else if (daysSinceUsed < 7) {
        score -= 25
      }
    }

    // Student's success rate with this question type
    const topicMastery = performance?.topicMastery?.[question.topic]
    if (topicMastery) {
      if (topicMastery.successRate < 0.5) {
        score += 25
        reasons.push('Low mastery topic')
      } else if (topicMastery.successRate > 0.8) {
        score -= 10 // Slightly deprioritize mastered topics
      }
    }

    return {
      ...question,
      score,
      selectionReason: reasons.join(', ')
    }
  })
}

/**
 * Select top N questions based on score
 */
const selectTopQuestions = (scoredQuestions, count, difficulty) => {
  return scoredQuestions
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.min(count * 1.5, scoredQuestions.length)) // Get extra for balancing
}

/**
 * Balance difficulty distribution
 * 
 * Target distribution:
 * - Easy quiz: 70% easy, 20% medium, 10% hard
 * - Medium quiz: 20% easy, 60% medium, 20% hard
 * - Hard quiz: 10% easy, 30% medium, 60% hard
 */
const balanceDifficulty = (questions, totalCount, targetDifficulty) => {
  const distribution = {
    easy: { easy: 0.7, medium: 0.2, hard: 0.1 },
    medium: { easy: 0.2, medium: 0.6, hard: 0.2 },
    hard: { easy: 0.1, medium: 0.3, hard: 0.6 }
  }

  const target = distribution[targetDifficulty]
  const needed = {
    easy: Math.floor(totalCount * target.easy),
    medium: Math.floor(totalCount * target.medium),
    hard: Math.ceil(totalCount * target.hard)
  }

  const selected = {
    easy: [],
    medium: [],
    hard: []
  }

  // Separate questions by difficulty
  questions.forEach(q => {
    selected[q.difficulty].push(q)
  })

  // Select from each difficulty pool
  const final = []
  
  Object.keys(needed).forEach(diff => {
    const count = needed[diff]
    const available = selected[diff]
    final.push(...available.slice(0, count))
  })

  // If we don't have enough, fill from remaining
  while (final.length < totalCount && questions.length > final.length) {
    const remaining = questions.filter(q => !final.includes(q))
    if (remaining.length === 0) break
    final.push(remaining[0])
  }

  return final.slice(0, totalCount)
}

/**
 * Shuffle array using Fisher-Yates algorithm
 */
const shuffleArray = (array) => {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * Generate mock questions for testing
 * TODO: Replace with actual API call
 */
const generateMockQuestions = (courseId, subject, count = 100) => {
  const topics = [
    'Algebra Basics',
    'Geometry Fundamentals',
    'Calculus Intro',
    'Statistics',
    'Probability',
    'Trigonometry',
    'Linear Equations',
    'Quadratic Functions'
  ]

  const difficulties = ['easy', 'medium', 'hard']

  return Array.from({ length: count }, (_, i) => ({
    id: `question_${courseId}_${i}`,
    subject,
    courseId,
    topic: topics[i % topics.length],
    difficulty: difficulties[i % 3],
    lastUsed: i % 5 === 0 ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) : null,
    avgSuccessRate: 0.5 + Math.random() * 0.4,
    estimatedTime: 60 + Math.floor(Math.random() * 180) // 1-4 minutes
  }))
}

/**
 * Calculate estimated quiz completion time
 */
export const calculateEstimatedTime = (selectedQuestions) => {
  const totalSeconds = selectedQuestions.reduce(
    (sum, q) => sum + (q.estimatedTime || 120),
    0
  )
  return Math.ceil(totalSeconds / 60) // Convert to minutes
}

/**
 * Analyze quiz results for performance tracking
 * 
 * AI-Ready: This data feeds into student performance model
 */
export const analyzeQuizResults = (quizResults, quizConfig, selectedQuestions) => {
  const {
    answers,
    correctAnswers,
    timeSpent,
    score
  } = quizResults

  // Calculate per-topic performance
  const topicPerformance = {}
  
  selectedQuestions.forEach((q, index) => {
    if (!topicPerformance[q.topic]) {
      topicPerformance[q.topic] = {
        total: 0,
        correct: 0,
        timeSpent: 0
      }
    }

    topicPerformance[q.topic].total++
    if (answers[index] === correctAnswers[index]) {
      topicPerformance[q.topic].correct++
    }
    topicPerformance[q.topic].timeSpent += timeSpent[index] || 0
  })

  // Calculate mastery updates
  const masteryUpdates = Object.entries(topicPerformance).map(([topic, perf]) => ({
    topic,
    successRate: perf.correct / perf.total,
    avgTimePerQuestion: perf.timeSpent / perf.total,
    questionsAttempted: perf.total,
    timestamp: new Date().toISOString()
  }))

  // Identify learning opportunities
  const weakAreas = masteryUpdates
    .filter(m => m.successRate < 0.6)
    .map(m => m.topic)

  const strongAreas = masteryUpdates
    .filter(m => m.successRate >= 0.8)
    .map(m => m.topic)

  return {
    overallScore: score,
    topicPerformance: masteryUpdates,
    weakAreas,
    strongAreas,
    totalTimeSpent: Object.values(timeSpent).reduce((a, b) => a + b, 0),
    efficiency: calculateEfficiency(timeSpent, selectedQuestions),
    recommendations: generateRecommendations(weakAreas, strongAreas, quizConfig)
  }
}

/**
 * Calculate time efficiency score
 */
const calculateEfficiency = (actualTime, selectedQuestions) => {
  const estimatedTotal = selectedQuestions.reduce((sum, q) => sum + q.estimatedTime, 0)
  const actualTotal = Object.values(actualTime).reduce((a, b) => a + b, 0)
  
  if (actualTotal === 0) return 0
  
  // Efficiency = estimated / actual (1.0 is perfect, >1.0 is faster, <1.0 is slower)
  return estimatedTotal / actualTotal
}

/**
 * Generate AI-ready recommendations
 */
const generateRecommendations = (weakAreas, strongAreas, quizConfig) => {
  const recommendations = []

  if (weakAreas.length > 0) {
    recommendations.push({
      type: 'PRACTICE',
      priority: 'HIGH',
      message: `Focus on: ${weakAreas.slice(0, 3).join(', ')}`,
      topics: weakAreas,
      suggestedAction: 'Take targeted practice quizzes on weak topics'
    })
  }

  if (strongAreas.length >= 5) {
    recommendations.push({
      type: 'LEVEL_UP',
      priority: 'MEDIUM',
      message: 'You\'re mastering these topics! Try a harder difficulty.',
      topics: strongAreas,
      suggestedAction: 'Increase difficulty to "hard" for these topics'
    })
  }

  if (weakAreas.length === 0 && quizConfig.difficulty !== 'hard') {
    recommendations.push({
      type: 'CHALLENGE',
      priority: 'LOW',
      message: 'Great performance! Ready for a challenge?',
      suggestedAction: 'Try a harder difficulty level'
    })
  }

  return recommendations
}

/**
 * Update student performance profile
 * This would integrate with backend analytics service
 */
export const updateStudentPerformance = (studentId, quizAnalysis) => {
  // TODO: API call to update student performance
  console.log('[Performance Update]', {
    studentId,
    updates: quizAnalysis.topicPerformance
  })

  // Mock localStorage update for now
  const performanceKey = `student_performance_${studentId}`
  const existing = JSON.parse(localStorage.getItem(performanceKey) || '{}')

  quizAnalysis.topicPerformance.forEach(update => {
    if (!existing.topicMastery) {
      existing.topicMastery = {}
    }

    const current = existing.topicMastery[update.topic] || {
      attempts: 0,
      successRate: 0,
      totalTime: 0
    }

    // Update with exponential moving average for success rate
    existing.topicMastery[update.topic] = {
      attempts: current.attempts + update.questionsAttempted,
      successRate: (current.successRate * 0.7) + (update.successRate * 0.3), // Weighted average
      lastAttempt: update.timestamp,
      avgTimeSpent: (current.totalTime + update.avgTimePerQuestion) / (current.attempts + 1)
    }
  })

  localStorage.setItem(performanceKey, JSON.stringify(existing))
  
  return existing
}

export default {
  selectQuestionsAlgorithm,
  analyzeQuizResults,
  updateStudentPerformance,
  calculateEstimatedTime
}

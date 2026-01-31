/**
 * Quiz Analysis Utilities
 * 
 * Purpose: Analyze quiz performance and identify improvement areas
 * 
 * This module provides rule-based analysis functions that can be
 * easily extended with AI-powered insights in the future.
 */

/**
 * Calculate overall quiz score and metrics
 * 
 * @param {Array} questions - Array of quiz questions
 * @param {Object} answers - User's answers
 * @param {Object} evaluation - Evaluation data from backend
 * @returns {Object} Comprehensive score analysis
 */
export function calculateQuizScore(questions, answers, evaluation = null) {
  if (evaluation) {
    // Use backend evaluation if available
    return {
      totalQuestions: evaluation.overallAnalysis?.totalQuestions || questions.length,
      correct: evaluation.overallAnalysis?.correct || 0,
      wrong: evaluation.overallAnalysis?.wrong || 0,
      unattempted: evaluation.overallAnalysis?.unattempted || 0,
      score: evaluation.score || 0,
      totalMarks: evaluation.totalMarks || 0,
      percentage: evaluation.percentage || 0,
      accuracy: evaluation.overallAnalysis?.accuracy || 0,
      passed: evaluation.passed || false
    }
  }
  
  // Frontend calculation
  let correct = 0
  let wrong = 0
  let unattempted = 0
  let totalScore = 0
  let maxScore = 0
  
  questions.forEach((question) => {
    // Use questionId to match answers
    const questionId = question.questionId || question.id
    const answer = answers[questionId]
    const marks = question.marks || 1
    maxScore += marks
    
    console.log(`Checking question ${questionId}: answer=${answer}, correctAnswer=${question.correctAnswer}`)
    
    if (!answer || answer === '' || (Array.isArray(answer) && answer.length === 0)) {
      unattempted++
      return
    }
    
    const isCorrect = checkAnswer(question, answer)
    console.log(`Question ${questionId} is ${isCorrect ? 'CORRECT' : 'WRONG'}`)
    
    if (isCorrect) {
      correct++
      totalScore += marks
    } else {
      wrong++
    }
  })
  
  const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0
  const accuracy = questions.length > 0 ? (correct / questions.length) * 100 : 0
  
  console.log(`Score calculation: ${correct}/${questions.length} correct, ${totalScore}/${maxScore} marks, ${percentage}%`)
  
  return {
    totalQuestions: questions.length,
    correct,
    wrong,
    unattempted,
    score: totalScore,
    totalMarks: maxScore,
    percentage: Math.round(percentage * 10) / 10,
    accuracy: Math.round(accuracy * 10) / 10,
    passed: percentage >= 60 // Default passing percentage
  }
}

/**
 * Check if an answer is correct
 * 
 * @param {Object} question - Question object
 * @param {*} answer - User's answer
 * @returns {boolean} True if correct
 */
function checkAnswer(question, answer) {
  switch (question.type) {
    case 'mcq-single':
    case 'mcq':
    case 'true-false':
      return question.correctAnswer === answer
    
    case 'mcq-multiple':
    case 'multiple-select':
      if (!Array.isArray(answer)) return false
      const correctAnswers = question.correctAnswer.split(',').map(id => id.trim())
      return correctAnswers.length === answer.length && 
             correctAnswers.every(correctId => answer.includes(correctId))
    
    case 'numerical':
      if (!question.numericalAnswer) return false
      const userNum = parseFloat(answer)
      const correctNum = parseFloat(question.numericalAnswer.value)
      const tolerance = question.numericalAnswer.tolerance || 0
      return Math.abs(userNum - correctNum) <= tolerance
    
    case 'short-answer':
    case 'long-answer':
      if (!question.expectedAnswer) return false
      // Simple string comparison (case-insensitive)
      return answer.toLowerCase().trim() === question.expectedAnswer.toLowerCase().trim()
    
    default:
      return false
  }
}

/**
 * Analyze performance by topic
 * 
 * @param {Array} questions - Array of quiz questions
 * @param {Object} answers - User's answers
 * @returns {Array} Topic-wise performance analysis
 */
export function analyzeByTopic(questions, answers) {
  if (!questions || !Array.isArray(questions)) {
    return []
  }
  
  const topicMap = new Map()
  
  questions.forEach((question, index) => {
    const topic = question.topic || question.subject || 'General'
    const answer = answers ? answers[index.toString()] : undefined
    
    if (!topicMap.has(topic)) {
      topicMap.set(topic, {
        topic,
        total: 0,
        correct: 0,
        wrong: 0,
        unattempted: 0,
        accuracy: 0
      })
    }
    
    const topicData = topicMap.get(topic)
    topicData.total++
    
    if (!answer || answer === '' || (Array.isArray(answer) && answer.length === 0)) {
      topicData.unattempted++
    } else {
      const isCorrect = checkAnswer(question, answer)
      if (isCorrect) {
        topicData.correct++
      } else {
        topicData.wrong++
      }
    }
  })
  
  // Calculate accuracy for each topic
  const topicAnalysis = Array.from(topicMap.values()).map(topic => ({
    ...topic,
    accuracy: topic.total > 0 ? (topic.correct / topic.total) * 100 : 0
  }))
  
  // Sort by accuracy (lowest first for improvement focus)
  return topicAnalysis.sort((a, b) => a.accuracy - b.accuracy)
}

/**
 * Analyze performance by difficulty level
 * 
 * @param {Array} questions - Array of quiz questions
 * @param {Object} answers - User's answers
 * @returns {Object} Difficulty-wise performance
 */
export function analyzeByDifficulty(questions, answers) {
  const difficultyStats = {
    easy: { total: 0, correct: 0, wrong: 0, unattempted: 0, accuracy: 0 },
    medium: { total: 0, correct: 0, wrong: 0, unattempted: 0, accuracy: 0 },
    hard: { total: 0, correct: 0, wrong: 0, unattempted: 0, accuracy: 0 }
  }
  
  questions.forEach((question, index) => {
    const difficulty = question.difficulty || 'medium'
    const answer = answers[index.toString()]
    const stats = difficultyStats[difficulty]
    
    if (!stats) return
    
    stats.total++
    
    if (!answer || answer === '' || (Array.isArray(answer) && answer.length === 0)) {
      stats.unattempted++
    } else {
      const isCorrect = checkAnswer(question, answer)
      if (isCorrect) {
        stats.correct++
      } else {
        stats.wrong++
      }
    }
  })
  
  // Calculate accuracy
  Object.keys(difficultyStats).forEach(level => {
    const stats = difficultyStats[level]
    stats.accuracy = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0
  })
  
  return difficultyStats
}

/**
 * Analyze time management
 * 
 * @param {Array} questions - Array of quiz questions
 * @param {Object} timeSpentPerQuestion - Time spent on each question (seconds)
 * @param {number} totalDuration - Total quiz duration (seconds)
 * @returns {Object} Time management analysis
 */
export function analyzeTimeManagement(questions, timeSpentPerQuestion, totalDuration) {
  const totalTime = Object.values(timeSpentPerQuestion).reduce((sum, time) => sum + time, 0)
  const avgTimePerQuestion = totalTime / questions.length
  const expectedTimePerQuestion = totalDuration / questions.length
  
  // Find questions that took too long or too short
  const timeAnalysis = questions.map((question, index) => {
    const timeSpent = timeSpentPerQuestion[index.toString()] || 0
    const ratio = avgTimePerQuestion > 0 ? timeSpent / avgTimePerQuestion : 1
    
    return {
      questionIndex: index,
      timeSpent,
      ratio,
      tooSlow: ratio > 1.5,
      tooFast: ratio < 0.5
    }
  })
  
  const tooSlowQuestions = timeAnalysis.filter(q => q.tooSlow)
  const tooFastQuestions = timeAnalysis.filter(q => q.tooFast)
  
  // Determine overall time management rating
  let rating = 'good'
  const timeUtilization = (totalTime / totalDuration) * 100
  
  if (timeUtilization > 95) {
    rating = 'rushed'
  } else if (timeUtilization < 60) {
    rating = 'underutilized'
  } else if (timeUtilization >= 80 && timeUtilization <= 95) {
    rating = 'excellent'
  }
  
  return {
    totalTimeSpent: totalTime,
    avgTimePerQuestion: Math.round(avgTimePerQuestion),
    expectedTimePerQuestion: Math.round(expectedTimePerQuestion),
    timeUtilization: Math.round(timeUtilization),
    rating,
    tooSlowCount: tooSlowQuestions.length,
    tooFastCount: tooFastQuestions.length,
    recommendations: getTimeManagementRecommendations(rating, tooSlowQuestions, tooFastQuestions)
  }
}

/**
 * Get time management recommendations
 */
function getTimeManagementRecommendations(rating, slowQuestions, fastQuestions) {
  const recommendations = []
  
  if (rating === 'rushed') {
    recommendations.push('Try to pace yourself better - you may be rushing through questions')
    recommendations.push('Read questions carefully to avoid careless mistakes')
  } else if (rating === 'underutilized') {
    recommendations.push('You finished with time to spare - use it to review your answers')
    recommendations.push('Double-check difficult questions before submitting')
  }
  
  if (slowQuestions.length > 0) {
    recommendations.push(`You spent too much time on ${slowQuestions.length} question(s) - practice to improve speed`)
  }
  
  if (fastQuestions.length > 0) {
    recommendations.push(`You rushed through ${fastQuestions.length} question(s) - ensure you read carefully`)
  }
  
  if (rating === 'excellent') {
    recommendations.push('Excellent time management! Keep up the good work')
  }
  
  return recommendations
}

/**
 * Identify improvement areas
 * 
 * @param {Object} scoreAnalysis - Overall score analysis
 * @param {Array} topicAnalysis - Topic-wise analysis
 * @param {Object} difficultyAnalysis - Difficulty-wise analysis
 * @param {Object} timeAnalysis - Time management analysis
 * @returns {Object} Comprehensive improvement areas
 */
export function identifyImprovementAreas(scoreAnalysis, topicAnalysis, difficultyAnalysis, timeAnalysis) {
  const weakAreas = []
  const strongAreas = []
  const recommendations = []
  
  // Ensure inputs are valid
  if (!scoreAnalysis) scoreAnalysis = {}
  if (!topicAnalysis || !Array.isArray(topicAnalysis)) topicAnalysis = []
  if (!difficultyAnalysis) difficultyAnalysis = {}
  if (!timeAnalysis) timeAnalysis = {}
  
  // Analyze topics
  if (topicAnalysis && Array.isArray(topicAnalysis)) {
    topicAnalysis.forEach(topic => {
      if (topic.accuracy < 60) {
        weakAreas.push({
          type: 'topic',
          area: topic.topic,
          accuracy: topic.accuracy,
          priority: topic.accuracy < 40 ? 'high' : 'medium',
          recommendation: `Focus on ${topic.topic} - your accuracy is ${topic.accuracy.toFixed(1)}%`
        })
      } else if (topic.accuracy >= 80) {
        strongAreas.push({
          type: 'topic',
          area: topic.topic,
          accuracy: topic.accuracy
        })
      }
    })
  }
  
  // Analyze difficulty levels
  Object.entries(difficultyAnalysis).forEach(([level, stats]) => {
    if (stats.total > 0 && stats.accuracy < 60) {
      weakAreas.push({
        type: 'difficulty',
        area: `${level} questions`,
        accuracy: stats.accuracy,
        priority: level === 'easy' ? 'high' : 'medium',
        recommendation: `Practice more ${level} level questions to build confidence`
      })
    }
  })
  
  // Analyze time management
  if (timeAnalysis.rating === 'rushed' || timeAnalysis.rating === 'underutilized') {
    recommendations.push({
      type: 'time-management',
      priority: 'medium',
      message: timeAnalysis.recommendations[0]
    })
  }
  
  // Overall performance recommendations
  if (scoreAnalysis.accuracy < 60) {
    recommendations.push({
      type: 'overall',
      priority: 'high',
      message: 'Your overall accuracy needs improvement. Review fundamental concepts and practice regularly.'
    })
  } else if (scoreAnalysis.accuracy >= 80) {
    recommendations.push({
      type: 'overall',
      priority: 'low',
      message: 'Great performance! Focus on maintaining consistency and challenging yourself with harder questions.'
    })
  }
  
  // Unattempted questions
  if (scoreAnalysis.unattempted > 0) {
    recommendations.push({
      type: 'completion',
      priority: 'high',
      message: `You left ${scoreAnalysis.unattempted} question(s) unanswered. Try to attempt all questions, even if unsure.`
    })
  }
  
  return {
    weakAreas: weakAreas.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    }),
    strongAreas,
    recommendations: recommendations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })
  }
}

/**
 * Generate suggested next actions
 * 
 * @param {Object} improvementAreas - Improvement areas analysis
 * @param {Object} scoreAnalysis - Score analysis
 * @returns {Array} Suggested actions
 */
export function generateNextActions(improvementAreas, scoreAnalysis) {
  const actions = []
  
  // Ensure inputs are valid
  if (!improvementAreas) improvementAreas = { weakAreas: [], strongAreas: [], recommendations: [] }
  if (!scoreAnalysis) scoreAnalysis = { accuracy: 0 }
  
  // Review study material
  if (improvementAreas.weakAreas && improvementAreas.weakAreas.length > 0) {
    const weakTopics = improvementAreas.weakAreas
      .filter(area => area.type === 'topic')
      .map(area => area.area)
      .slice(0, 3)
    
    actions.push({
      type: 'study',
      icon: '📚',
      title: 'Review Study Material',
      description: `Focus on: ${weakTopics.join(', ')}`,
      priority: 'high'
    })
  }
  
  // Reattempt quiz
  if (scoreAnalysis.accuracy < 80) {
    actions.push({
      type: 'reattempt',
      icon: '🔄',
      title: 'Reattempt Quiz',
      description: 'Practice makes perfect! Try the quiz again to improve your score.',
      priority: 'medium'
    })
  }
  
  // Talk to mentor
  if (scoreAnalysis.accuracy < 60 || improvementAreas.weakAreas.length > 2) {
    actions.push({
      type: 'mentor',
      icon: '👨‍🏫',
      title: 'Talk to a Mentor',
      description: 'Get personalized guidance on your weak areas.',
      priority: 'high'
    })
  }
  
  // Practice more
  if (scoreAnalysis.accuracy >= 60 && scoreAnalysis.accuracy < 80) {
    actions.push({
      type: 'practice',
      icon: '💪',
      title: 'Practice Similar Questions',
      description: 'Build confidence with more practice questions.',
      priority: 'medium'
    })
  }
  
  // Challenge yourself
  if (scoreAnalysis.accuracy >= 80) {
    actions.push({
      type: 'challenge',
      icon: '🎯',
      title: 'Take Harder Quizzes',
      description: 'Challenge yourself with more difficult questions.',
      priority: 'low'
    })
  }
  
  return actions.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })
}

/**
 * Store quiz attempt in history
 * 
 * @param {Object} attemptData - Quiz attempt data
 */
export function storeQuizAttempt(attemptData) {
  try {
    const history = JSON.parse(localStorage.getItem('quizHistory') || '[]')
    
    const attempt = {
      id: `attempt_${Date.now()}`,
      sessionId: attemptData.sessionId,
      quizId: attemptData.quizId,
      quizTitle: attemptData.quizTitle,
      subject: attemptData.subject,
      difficulty: attemptData.difficulty,
      score: attemptData.score,
      totalMarks: attemptData.totalMarks,
      accuracy: attemptData.accuracy,
      percentage: attemptData.percentage,
      passed: attemptData.passed,
      totalQuestions: attemptData.totalQuestions,
      correct: attemptData.correct,
      wrong: attemptData.wrong,
      unattempted: attemptData.unattempted,
      timeSpent: attemptData.timeSpent,
      completedAt: attemptData.completedAt || new Date().toISOString(),
      passingPercentage: attemptData.passingPercentage || 60
    }
    
    history.unshift(attempt)
    
    // Keep only last 100 attempts
    if (history.length > 100) {
      history.splice(100)
    }
    
    localStorage.setItem('quizHistory', JSON.stringify(history))
    
    return attempt
  } catch (error) {
    console.error('Error storing quiz attempt:', error)
    return null
  }
}

/**
 * Get quiz history
 * 
 * @returns {Array} Quiz attempt history
 */
export function getQuizHistory() {
  try {
    return JSON.parse(localStorage.getItem('quizHistory') || '[]')
  } catch (error) {
    console.error('Error loading quiz history:', error)
    return []
  }
}

/**
 * Clear quiz history
 */
export function clearQuizHistory() {
  try {
    localStorage.removeItem('quizHistory')
    return true
  } catch (error) {
    console.error('Error clearing quiz history:', error)
    return false
  }
}

/**
 * Comprehensive quiz results analysis
 * 
 * @param {Object} results - Quiz results object
 * @param {Object} quizData - Quiz metadata
 * @param {Array} questions - Array of quiz questions
 * @returns {Object} Complete analysis including score, accuracy, and detailed breakdowns
 */
export function analyzeQuizResults(results, quizData, questions) {
  // Convert answers array to object format expected by analysis functions
  // Use questionId as key to match the answers state in QuizAttempt
  const answersObject = {}
  
  if (results.answers && Array.isArray(results.answers)) {
    results.answers.forEach(answer => {
      // Use questionId from answer object
      if (answer.questionId) {
        answersObject[answer.questionId] = answer.answer
      }
    })
  }

  // Debug logging
  console.log('analyzeQuizResults - answersObject:', answersObject)
  console.log('analyzeQuizResults - questions:', questions)

  // Calculate overall score
  const scoreAnalysis = calculateQuizScore(questions, answersObject)
  
  console.log('analyzeQuizResults - scoreAnalysis:', scoreAnalysis)
  
  // Analyze by topic
  const topicAnalysis = analyzeByTopic(questions, answersObject) || []
  
  // Analyze by difficulty
  const difficultyAnalysis = analyzeByDifficulty(questions, answersObject) || {}
  
  // Analyze time management (mock data since we don't have per-question timing)
  const timeAnalysis = analyzeTimeManagement(questions, {}, results.totalTime) || {}
  
  // Identify improvement areas
  const improvementAreas = identifyImprovementAreas(scoreAnalysis, topicAnalysis, difficultyAnalysis, timeAnalysis) || {}
  
  // Generate next actions
  const nextActions = generateNextActions(improvementAreas, scoreAnalysis) || []

  return {
    // Basic metrics
    score: scoreAnalysis.score || 0,
    totalMarks: scoreAnalysis.totalMarks || 0,
    percentage: scoreAnalysis.percentage || 0,
    accuracy: scoreAnalysis.accuracy || 0,
    passed: scoreAnalysis.passed || false,
    
    // Detailed breakdowns
    overallAnalysis: scoreAnalysis,
    topicAnalysis,
    difficultyAnalysis,
    timeAnalysis,
    improvementAreas,
    nextActions,
    
    // Metadata
    totalQuestions: questions ? questions.length : 0,
    timeTaken: results ? results.timeTaken : 0,
    totalTime: results ? results.totalTime : 0
  }
}

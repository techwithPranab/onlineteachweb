const QuestionSelectionStrategy = require('./QuestionSelectionStrategy');
const Question = require('../models/Question.model');

/**
 * Adaptive Question Selection Strategy
 * Selects questions based on student's past performance to optimize learning
 */
class AdaptiveQuestionSelectionStrategy extends QuestionSelectionStrategy {
  constructor() {
    super();
    this.version = 'v2.0-adaptive';
  }
  
  getVersion() {
    return this.version;
  }
  
  /**
   * Select questions adaptively based on student performance
   * @param {Object} criteria
   * @param {string} criteria.courseId - Course ID
   * @param {string} criteria.difficultyLevel - Primary difficulty level
   * @param {Object} criteria.questionConfig - Quiz question configuration
   * @param {Array} criteria.excludeQuestionIds - Questions to exclude
   * @param {Object} criteria.settings - Quiz settings
   * @param {string} criteria.studentId - Student ID for adaptive selection
   * @param {Object} criteria.studentPerformance - Past performance data
   * @returns {Promise<Array>} Selected questions with order
   */
  async select(criteria) {
    const {
      courseId,
      difficultyLevel,
      questionConfig,
      excludeQuestionIds = [],
      settings = {},
      studentId,
      studentPerformance = {}
    } = criteria;
    
    const { totalQuestions, topicWeightage } = questionConfig;
    
    // Build base query
    const baseQuery = {
      courseId,
      isActive: true
    };
    
    if (excludeQuestionIds.length > 0) {
      baseQuery._id = { $nin: excludeQuestionIds };
    }
    
    const availableQuestions = await Question.find(baseQuery).lean();
    
    if (availableQuestions.length === 0) {
      throw new Error('No questions available for this quiz configuration');
    }
    
    // Score each question based on adaptive criteria
    const scoredQuestions = availableQuestions.map(q => ({
      ...q,
      adaptiveScore: this._calculateAdaptiveScore(q, studentPerformance, difficultyLevel)
    }));
    
    // Sort by adaptive score (higher is better for learning)
    scoredQuestions.sort((a, b) => b.adaptiveScore - a.adaptiveScore);
    
    // Select questions considering topic distribution
    const selectedQuestions = [];
    const topicCounts = new Map();
    
    if (topicWeightage && topicWeightage.size > 0) {
      const topicWeights = Object.fromEntries(topicWeightage);
      const totalWeight = Object.values(topicWeights).reduce((a, b) => a + b, 0);
      
      // Calculate target count per topic
      const topicTargets = new Map();
      for (const [topic, weight] of Object.entries(topicWeights)) {
        topicTargets.set(topic, Math.round((weight / totalWeight) * totalQuestions));
        topicCounts.set(topic, 0);
      }
      
      // Select questions respecting topic targets
      for (const question of scoredQuestions) {
        if (selectedQuestions.length >= totalQuestions) break;
        
        const topic = question.topic;
        const currentCount = topicCounts.get(topic) || 0;
        const targetCount = topicTargets.get(topic) || 0;
        
        if (currentCount < targetCount || !topicTargets.has(topic)) {
          selectedQuestions.push(question);
          topicCounts.set(topic, currentCount + 1);
        }
      }
      
      // Fill remaining slots
      const remaining = totalQuestions - selectedQuestions.length;
      if (remaining > 0) {
        const selectedIds = new Set(selectedQuestions.map(q => q._id.toString()));
        const remainingQuestions = scoredQuestions.filter(
          q => !selectedIds.has(q._id.toString())
        );
        selectedQuestions.push(...remainingQuestions.slice(0, remaining));
      }
    } else {
      selectedQuestions.push(...scoredQuestions.slice(0, totalQuestions));
    }
    
    // Shuffle if required
    let orderedQuestions = [...selectedQuestions];
    if (settings.shuffleQuestions) {
      orderedQuestions = this._shuffle(orderedQuestions);
    }
    
    // Shuffle options if required
    if (settings.shuffleOptions) {
      orderedQuestions = orderedQuestions.map(q => {
        if (q.options && q.options.length > 0) {
          return { ...q, options: this._shuffle([...q.options]) };
        }
        return q;
      });
    }
    
    // Prepare final output
    return orderedQuestions.map((q, index) => ({
      questionId: q._id,
      originalOrder: selectedQuestions.findIndex(sq => sq._id.toString() === q._id.toString()),
      displayOrder: index,
      snapshot: {
        text: q.text,
        type: q.type,
        caseStudy: q.caseStudy,
        options: q.options ? q.options.map((opt, optIndex) => ({
          _id: opt._id,
          text: opt.text,
          displayOrder: optIndex
        })) : [],
        marks: q.marks,
        negativeMarks: q.negativeMarks,
        topic: q.topic,
        difficultyLevel: q.difficultyLevel
      }
    }));
  }
  
  /**
   * Calculate adaptive score for a question
   * Higher score = better question for the student's learning
   */
  _calculateAdaptiveScore(question, performance, targetDifficulty) {
    let score = 100; // Base score
    
    // Factor 1: Difficulty match (25 points)
    if (question.difficultyLevel === targetDifficulty) {
      score += 25;
    } else {
      const difficultyOrder = ['easy', 'medium', 'hard'];
      const targetIndex = difficultyOrder.indexOf(targetDifficulty);
      const questionIndex = difficultyOrder.indexOf(question.difficultyLevel);
      score += 25 - (Math.abs(targetIndex - questionIndex) * 10);
    }
    
    // Factor 2: Topic weakness (30 points)
    // Prioritize topics where student is weak
    if (performance.topicAccuracy) {
      const topicAccuracy = performance.topicAccuracy[question.topic];
      if (topicAccuracy !== undefined) {
        // Lower accuracy = higher priority
        score += (100 - topicAccuracy) * 0.3;
      } else {
        // Unknown topic - medium priority
        score += 15;
      }
    }
    
    // Factor 3: Question success rate (20 points)
    // Prefer questions with moderate success rate (not too easy, not too hard)
    const successRate = question.totalAttempts > 0 
      ? (question.correctAttempts / question.totalAttempts) * 100 
      : 50;
    
    // Optimal success rate is around 60-70%
    const optimalRate = 65;
    const deviation = Math.abs(successRate - optimalRate);
    score += Math.max(0, 20 - deviation * 0.4);
    
    // Factor 4: Usage count (15 points)
    // Prefer less used questions for variety
    const usageScore = Math.max(0, 15 - (question.usageCount || 0) * 0.5);
    score += usageScore;
    
    // Factor 5: Random factor (10 points)
    // Add some randomness to prevent predictable patterns
    score += Math.random() * 10;
    
    return score;
  }
  
  /**
   * Fisher-Yates shuffle
   */
  _shuffle(array) {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}

module.exports = AdaptiveQuestionSelectionStrategy;

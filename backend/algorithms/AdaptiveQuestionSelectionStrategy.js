const QuestionSelectionStrategy = require('./QuestionSelectionStrategy');
const Question = require('../models/Question.model');
const logger = require('../utils/logger');

/**
 * Adaptive Question Selection Strategy (v2.0)
 * Selects questions based on student's past performance to optimize learning
 * 
 * Features:
 * - Prioritizes weak topics for focused learning
 * - Adjusts difficulty based on performance
 * - Maintains question diversity across topics
 * - Intelligent question scoring combining multiple factors
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
    // DEBUG: Log entry point
    console.log('[DEBUG] AdaptiveQuestionSelectionStrategy.select() called');
    logger.info('[AdaptiveSelection] ===== ADAPTIVE SELECTION STARTED =====');
    
    const {
      courseId,
      difficultyLevel,
      questionConfig,
      excludeQuestionIds = [],
      settings = {},
      studentId,
      studentPerformance = {}
    } = criteria;
    
    logger.info(`[AdaptiveSelection] courseId: ${courseId}`);
    logger.info(`[AdaptiveSelection] difficultyLevel: ${difficultyLevel}`);
    logger.info(`[AdaptiveSelection] excludeQuestionIds count: ${excludeQuestionIds.length}`);
    
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
    
    logger.info(`[AdaptiveSelection] Found ${availableQuestions.length} available questions`);
    console.log('[DEBUG] Available questions count:', availableQuestions.length);
    
    if (availableQuestions.length === 0) {
      logger.warn('[AdaptiveSelection] No questions available for this quiz configuration');
      throw new Error('No questions available for this quiz configuration');
    }
    
    // Score each question based on adaptive criteria
    const scoredQuestions = availableQuestions.map(q => ({
      ...q,
      adaptiveScore: this._calculateAdaptiveScore(q, studentPerformance, difficultyLevel)
    }));
    
    logger.info(`[AdaptiveSelection] Scoring complete`);
    console.log('[DEBUG] Scoring complete for', scoredQuestions.length, 'questions');
    
    // Sort by adaptive score (higher is better for learning)
    scoredQuestions.sort((a, b) => b.adaptiveScore - a.adaptiveScore);
    
    logger.info(`[AdaptiveSelection] Sorted questions by adaptive score`);
    logger.info(`[AdaptiveSelection] Scored ${scoredQuestions.length} questions`);
    logger.info(`[AdaptiveSelection] Top 5 scored questions: ${scoredQuestions.slice(0, 5).map(q => `${q.topic}(${q.adaptiveScore.toFixed(1)})`).join(', ')}`);
    
    // Select questions considering topic distribution
    const selectedQuestions = [];
    const topicCounts = new Map();
    
    if (topicWeightage && topicWeightage.size > 0) {
      logger.info('[AdaptiveSelection] Using specified topic weightage');
      
      const topicWeights = Object.fromEntries(topicWeightage);
      const totalWeight = Object.values(topicWeights).reduce((a, b) => a + b, 0);
      
      // Calculate target count per topic
      const topicTargets = new Map();
      for (const [topic, weight] of Object.entries(topicWeights)) {
        topicTargets.set(topic, Math.round((weight / totalWeight) * totalQuestions));
        topicCounts.set(topic, 0);
      }
      
      // Select highest-scoring questions while respecting topic targets
      for (const question of scoredQuestions) {
        if (selectedQuestions.length >= totalQuestions) break;
        
        const topic = question.topic;
        const currentCount = topicCounts.get(topic) || 0;
        const targetCount = topicTargets.get(topic) || 0;
        
        if (currentCount < targetCount || !topicTargets.has(topic)) {
          selectedQuestions.push(question);
          topicCounts.set(topic, currentCount + 1);
          logger.info(`[AdaptiveSelection] Selected adaptive question from ${topic} (score: ${question.adaptiveScore.toFixed(1)})`);
        }
      }
      
      // Fill remaining slots with highest-scoring questions
      const remaining = totalQuestions - selectedQuestions.length;
      if (remaining > 0) {
        logger.info(`[AdaptiveSelection] Filling ${remaining} remaining slots with highest-scoring questions`);
        
        const selectedIds = new Set(selectedQuestions.map(q => q._id.toString()));
        const remainingQuestions = scoredQuestions.filter(
          q => !selectedIds.has(q._id.toString())
        );
        selectedQuestions.push(...remainingQuestions.slice(0, remaining));
      }
    } else {
      // No topic weightage - ensure diverse topic distribution with adaptive scoring
      logger.info('[AdaptiveSelection] No topic weightage - ensuring diverse topic selection with adaptive scoring');
      
      // Group questions by topic
      const questionsByTopic = this._groupByTopic(scoredQuestions);
      const topics = Object.keys(questionsByTopic);
      
      logger.info(`[AdaptiveSelection] Found ${topics.length} unique topics: ${topics.join(', ')}`);
      
      // Distribute adaptively: more questions from weak topics
      const questionsPerTopic = Math.ceil(totalQuestions / topics.length);
      
      // First pass: Select top-scoring (most relevant) questions from each topic
      for (const topic of topics) {
        const topicQuestions = questionsByTopic[topic];
        const selectCount = Math.min(questionsPerTopic, topicQuestions.length);
        
        // Top questions from this topic are already sorted by adaptive score
        const selected = topicQuestions.slice(0, selectCount);
        
        topicCounts.set(topic, selected.length);
        
        selected.forEach(q => {
          selectedQuestions.push(q);
          logger.info(`[AdaptiveSelection] Selected adaptive question from ${topic} (score: ${q.adaptiveScore.toFixed(1)})`);
        });
        
        // Stop if we have enough
        if (selectedQuestions.length >= totalQuestions) {
          break;
        }
      }
      
      logger.info(`[AdaptiveSelection] After first pass: ${selectedQuestions.length} questions selected`);
      
      // Second pass: Fill remaining with round-robin from highest-scoring available
      if (selectedQuestions.length < totalQuestions) {
        const remaining = totalQuestions - selectedQuestions.length;
        logger.info(`[AdaptiveSelection] Filling ${remaining} remaining slots with round-robin adaptive selection`);
        
        const selectedIds = new Set(selectedQuestions.map(q => q._id.toString()));
        let topicIndex = 0;
        let attempts = 0;
        const maxAttempts = topics.length * 10;
        
        while (selectedQuestions.length < totalQuestions && attempts < maxAttempts) {
          const topic = topics[topicIndex % topics.length];
          const topicQuestions = questionsByTopic[topic];
          
          const unusedTopicQuestions = topicQuestions.filter(
            q => !selectedIds.has(q._id.toString())
          );
          
          if (unusedTopicQuestions.length > 0) {
            const selected = unusedTopicQuestions[0]; // Already sorted by score
            selectedQuestions.push(selected);
            selectedIds.add(selected._id.toString());
            const currentCount = (topicCounts.get(topic) || 0) + 1;
            topicCounts.set(topic, currentCount);
            logger.info(`[AdaptiveSelection] Added adaptive question from ${topic} (score: ${selected.adaptiveScore.toFixed(1)})`);
          }
          
          topicIndex++;
          attempts++;
        }
        
        logger.info(`[AdaptiveSelection] After second pass: ${selectedQuestions.length} questions selected`);
      }
      
      // Log final topic distribution with scores
      logger.info('[AdaptiveSelection] Final topic distribution with adaptive scores:');
      Object.entries(topicCounts).forEach(([topic, count]) => {
        const topicQuestions = selectedQuestions.filter(q => q.topic === topic);
        const avgScore = topicQuestions.reduce((sum, q) => sum + q.adaptiveScore, 0) / count;
        logger.info(`[AdaptiveSelection]   - ${topic}: ${count} questions (avg adaptive score: ${avgScore.toFixed(1)})`);
      });
    }
    
    // ── DEDUP + TRIM ────────────────────────────────────────────────────────────
    // Remove any duplicate question IDs and trim to exactly totalQuestions.
    const seenAdaptiveIds = new Set();
    const dedupedSelected = [];
    for (const q of selectedQuestions) {
      const idStr = q._id.toString();
      if (!seenAdaptiveIds.has(idStr)) {
        seenAdaptiveIds.add(idStr);
        dedupedSelected.push(q);
      }
    }
    const trimmedSelected = dedupedSelected.slice(0, totalQuestions);
    if (trimmedSelected.length < selectedQuestions.length) {
      logger.warn(`[AdaptiveSelection] Trimmed from ${selectedQuestions.length} → ${trimmedSelected.length} (removed ${selectedQuestions.length - trimmedSelected.length} over-selected/duplicate questions)`);
    }

    // Shuffle if required
    let orderedQuestions = [...trimmedSelected];
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
    logger.info(`[AdaptiveSelection] Preparing final output with ${orderedQuestions.length} questions`);
    console.log('[DEBUG] Final output prepared:', orderedQuestions.length, 'questions');
    
    const result = orderedQuestions.map((q, index) => ({
      questionId: q._id,
      originalOrder: trimmedSelected.findIndex(sq => sq._id.toString() === q._id.toString()),
      displayOrder: index,
      snapshot: {
        question: q.text,
        text: q.text,
        type: q.type,
        caseStudy: q.caseStudy,
        options: q.options ? q.options.map((opt, optIndex) => ({
          _id: opt._id,
          id: opt.id,
          text: opt.text,
          displayOrder: optIndex
        })) : [],
        correctAnswer: q.correctAnswer,
        expectedAnswer: q.expectedAnswer,
        numericalAnswer: q.numericalAnswer,
        marks: q.marks,
        negativeMarks: q.negativeMarks,
        topic: q.topic,
        subject: q.subject,
        difficulty: q.difficultyLevel,
        difficultyLevel: q.difficultyLevel,
        explanation: q.explanation
      }
    }));
    
    logger.info(`[AdaptiveSelection] ===== ADAPTIVE SELECTION COMPLETED ===== Returning ${result.length} questions`);
    console.log('[DEBUG] AdaptiveSelection complete, returning', result.length, 'questions');
    
    return result;
  }
  
  /**
   * Group questions by topic for diverse selection
   */
  _groupByTopic(questions) {
    const grouped = {};
    
    questions.forEach(q => {
      const topic = q.topic || 'General';
      if (!grouped[topic]) {
        grouped[topic] = [];
      }
      grouped[topic].push(q);
    });
    
    return grouped;
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
      const difficultyOrder = ['easy', 'medium', 'hard', 'olympiad'];
      const targetIndex = difficultyOrder.indexOf(targetDifficulty);
      const questionIndex = difficultyOrder.indexOf(question.difficultyLevel);
      score += 25 - (Math.abs(targetIndex - questionIndex) * 10);
    }
    
    // Factor 2: Topic weakness (30 points)
    // Prioritize topics where student is weak
    if (performance && performance.topicAccuracy) {
      const topicAccuracy = performance.topicAccuracy[question.topic];
      if (topicAccuracy !== undefined) {
        // Lower accuracy = higher priority
        score += (100 - topicAccuracy) * 0.3;
      } else {
        // Unknown topic - medium priority
        score += 15;
      }
    } else {
      // No performance data - give medium score
      score += 15;
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

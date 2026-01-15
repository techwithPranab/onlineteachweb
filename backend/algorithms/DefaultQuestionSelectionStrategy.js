const QuestionSelectionStrategy = require('./QuestionSelectionStrategy');
const Question = require('../models/Question.model');

/**
 * Default Question Selection Strategy
 * Implements random selection with topic weightage, difficulty balancing,
 * and avoids repetition from past attempts
 */
class DefaultQuestionSelectionStrategy extends QuestionSelectionStrategy {
  constructor() {
    super();
    this.version = 'v1.0';
  }
  
  getVersion() {
    return this.version;
  }
  
  /**
   * Select questions based on quiz configuration
   * @param {Object} criteria
   * @param {string} criteria.courseId - Course ID
   * @param {string} criteria.difficultyLevel - Primary difficulty level
   * @param {Object} criteria.questionConfig - Quiz question configuration
   * @param {Array} criteria.excludeQuestionIds - Questions to exclude (from past attempts)
   * @param {Object} criteria.settings - Quiz settings
   * @returns {Promise<Array>} Selected questions with order
   */
  async select(criteria) {
    const {
      courseId,
      difficultyLevel,
      questionConfig,
      excludeQuestionIds = [],
      settings = {}
    } = criteria;
    
    const { totalQuestions, topicWeightage, typeDistribution, difficultyDistribution } = questionConfig;
    
    // Build base query
    const baseQuery = {
      courseId,
      isActive: true
    };
    
    // Exclude questions from past attempts
    if (excludeQuestionIds.length > 0) {
      baseQuery._id = { $nin: excludeQuestionIds };
    }
    
    // Get all available questions
    let availableQuestions = await Question.find(baseQuery).lean();
    
    if (availableQuestions.length === 0) {
      throw new Error('No questions available for this quiz configuration');
    }
    
    // If not enough questions even without filters, relax constraints
    if (availableQuestions.length < totalQuestions) {
      // Try including excluded questions if we don't have enough
      if (excludeQuestionIds.length > 0) {
        const additionalQuery = { ...baseQuery };
        delete additionalQuery._id;
        availableQuestions = await Question.find(additionalQuery).lean();
      }
    }
    
    const selectedQuestions = [];
    const usedQuestionIds = new Set();
    
    // Step 1: Select by topic weightage if specified
    if (topicWeightage && topicWeightage.size > 0) {
      const topicWeights = Object.fromEntries(topicWeightage);
      const totalWeight = Object.values(topicWeights).reduce((a, b) => a + b, 0);
      
      for (const [topic, weight] of Object.entries(topicWeights)) {
        const topicQuestionCount = Math.round((weight / totalWeight) * totalQuestions);
        const topicQuestions = this._filterByTopic(availableQuestions, topic, usedQuestionIds);
        
        // Apply difficulty filter
        const difficultyFiltered = this._filterByDifficulty(
          topicQuestions,
          difficultyLevel,
          difficultyDistribution
        );
        
        // Randomly select from filtered questions
        const selected = this._randomSelect(difficultyFiltered, topicQuestionCount);
        
        selected.forEach(q => {
          selectedQuestions.push(q);
          usedQuestionIds.add(q._id.toString());
        });
      }
    } else {
      // No topic weightage - just filter by difficulty
      const difficultyFiltered = this._filterByDifficulty(
        availableQuestions,
        difficultyLevel,
        difficultyDistribution
      );
      
      const selected = this._randomSelect(difficultyFiltered, totalQuestions);
      selected.forEach(q => {
        selectedQuestions.push(q);
        usedQuestionIds.add(q._id.toString());
      });
    }
    
    // Step 2: Fill remaining slots if needed
    const remaining = totalQuestions - selectedQuestions.length;
    if (remaining > 0) {
      const unselectedQuestions = availableQuestions.filter(
        q => !usedQuestionIds.has(q._id.toString())
      );
      
      // Prioritize questions matching the primary difficulty
      const prioritized = unselectedQuestions.sort((a, b) => {
        if (a.difficultyLevel === difficultyLevel && b.difficultyLevel !== difficultyLevel) {
          return -1;
        }
        if (a.difficultyLevel !== difficultyLevel && b.difficultyLevel === difficultyLevel) {
          return 1;
        }
        return 0;
      });
      
      const additional = this._randomSelect(prioritized, remaining);
      additional.forEach(q => selectedQuestions.push(q));
    }
    
    // Step 3: Apply type distribution if specified
    if (typeDistribution && typeDistribution.size > 0) {
      // Re-balance based on question types
      selectedQuestions.sort((a, b) => {
        const typeWeights = Object.fromEntries(typeDistribution);
        const aWeight = typeWeights[a.type] || 0;
        const bWeight = typeWeights[b.type] || 0;
        return bWeight - aWeight;
      });
    }
    
    // Step 4: Shuffle if required
    let orderedQuestions = [...selectedQuestions];
    if (settings.shuffleQuestions) {
      orderedQuestions = this._shuffle(orderedQuestions);
    }
    
    // Step 5: Shuffle options if required
    if (settings.shuffleOptions) {
      orderedQuestions = orderedQuestions.map(q => {
        if (q.options && q.options.length > 0) {
          return {
            ...q,
            options: this._shuffle([...q.options])
          };
        }
        return q;
      });
    }
    
    // Step 6: Prepare final output with order
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
   * Filter questions by topic
   */
  _filterByTopic(questions, topic, excludeIds) {
    return questions.filter(q => 
      q.topic === topic && !excludeIds.has(q._id.toString())
    );
  }
  
  /**
   * Filter questions by difficulty level with distribution support
   */
  _filterByDifficulty(questions, primaryDifficulty, distribution) {
    if (distribution && (distribution.easy || distribution.medium || distribution.hard)) {
      // Custom distribution specified
      return questions;
    }
    
    // Primary difficulty filter with fallback
    const primaryFiltered = questions.filter(q => q.difficultyLevel === primaryDifficulty);
    
    if (primaryFiltered.length > 0) {
      return primaryFiltered;
    }
    
    // Fallback to adjacent difficulty levels
    const difficultyOrder = ['easy', 'medium', 'hard'];
    const currentIndex = difficultyOrder.indexOf(primaryDifficulty);
    
    // Try adjacent levels
    const adjacentLevels = [];
    if (currentIndex > 0) adjacentLevels.push(difficultyOrder[currentIndex - 1]);
    if (currentIndex < difficultyOrder.length - 1) adjacentLevels.push(difficultyOrder[currentIndex + 1]);
    
    const adjacentFiltered = questions.filter(q => adjacentLevels.includes(q.difficultyLevel));
    
    return adjacentFiltered.length > 0 ? adjacentFiltered : questions;
  }
  
  /**
   * Randomly select n questions from array
   */
  _randomSelect(questions, count) {
    const shuffled = this._shuffle([...questions]);
    return shuffled.slice(0, Math.min(count, shuffled.length));
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

module.exports = DefaultQuestionSelectionStrategy;

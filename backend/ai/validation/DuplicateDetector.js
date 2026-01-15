const crypto = require('crypto');
const logger = require('../../utils/logger');

/**
 * Duplicate Question Detector
 * Uses text similarity and content hashing to detect duplicate questions
 */
class DuplicateDetector {
  constructor() {
    // Similarity threshold (0-1, higher means more strict)
    this.similarityThreshold = 0.85;
  }

  /**
   * Check if a question is a duplicate of existing questions
   * @param {Object} newQuestion - New question to check
   * @param {Array} existingQuestions - Existing questions to compare against
   * @returns {Object} Duplicate detection result
   */
  checkDuplicate(newQuestion, existingQuestions) {
    const newText = this._normalizeText(newQuestion.text);
    const newHash = this._hashText(newText);
    
    for (const existing of existingQuestions) {
      const existingText = this._normalizeText(existing.text);
      const existingHash = this._hashText(existingText);
      
      // Exact match by hash
      if (newHash === existingHash) {
        return {
          isDuplicate: true,
          matchType: 'exact',
          matchedQuestion: existing._id || existing.id,
          similarity: 1.0
        };
      }
      
      // Similarity check
      const similarity = this._calculateSimilarity(newText, existingText);
      if (similarity >= this.similarityThreshold) {
        return {
          isDuplicate: true,
          matchType: 'similar',
          matchedQuestion: existing._id || existing.id,
          similarity
        };
      }
    }
    
    return {
      isDuplicate: false,
      matchType: null,
      matchedQuestion: null,
      similarity: 0
    };
  }

  /**
   * Batch check for duplicates
   */
  checkBatchDuplicates(newQuestions, existingQuestions) {
    const results = [];
    const uniqueNew = [];
    
    for (const question of newQuestions) {
      // Check against existing questions
      let result = this.checkDuplicate(question, existingQuestions);
      
      if (!result.isDuplicate) {
        // Also check against already accepted new questions
        result = this.checkDuplicate(question, uniqueNew);
        
        if (!result.isDuplicate) {
          uniqueNew.push(question);
        }
      }
      
      results.push({
        question,
        ...result
      });
    }
    
    return {
      results,
      uniqueCount: uniqueNew.length,
      duplicateCount: results.filter(r => r.isDuplicate).length,
      uniqueQuestions: uniqueNew
    };
  }

  /**
   * Normalize text for comparison
   */
  _normalizeText(text) {
    if (!text) return '';
    
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ')    // Normalize whitespace
      .trim();
  }

  /**
   * Create hash of text
   */
  _hashText(text) {
    return crypto.createHash('md5').update(text).digest('hex');
  }

  /**
   * Calculate similarity between two texts using Jaccard similarity
   */
  _calculateSimilarity(text1, text2) {
    const words1 = new Set(text1.split(' ').filter(w => w.length > 2));
    const words2 = new Set(text2.split(' ').filter(w => w.length > 2));
    
    if (words1.size === 0 && words2.size === 0) return 1;
    if (words1.size === 0 || words2.size === 0) return 0;
    
    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  /**
   * Set similarity threshold
   */
  setThreshold(threshold) {
    if (threshold < 0 || threshold > 1) {
      throw new Error('Threshold must be between 0 and 1');
    }
    this.similarityThreshold = threshold;
  }
}

module.exports = new DuplicateDetector();

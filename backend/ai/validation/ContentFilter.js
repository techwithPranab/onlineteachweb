const logger = require('../../utils/logger');

/**
 * Content Filter
 * Filters inappropriate, biased, or unsafe content from AI-generated questions
 */
class ContentFilter {
  constructor() {
    // Inappropriate word patterns (simplified, should be expanded)
    this.inappropriatePatterns = [
      /\b(hate|violent|discriminat|racist|sexist)\w*/gi,
      /\b(kill|murder|assault|abuse)\w*/gi,
      /\b(drug|alcohol|tobacco)\w*/gi
    ];
    
    // Bias patterns
    this.biasPatterns = [
      /\b(always|never|all|none|every)\s+(men|women|boys|girls)\b/gi,
      /\b(superior|inferior)\s+(race|gender|religion)\b/gi
    ];
    
    // Placeholder/incomplete content patterns
    this.placeholderPatterns = [
      /\[.*?\]/g,        // Square bracket placeholders
      /\{.*?\}/g,        // Curly bracket placeholders
      /TODO|FIXME/gi,    // Common dev placeholders
      /lorem ipsum/gi,   // Lorem ipsum text
      /placeholder/gi
    ];
    
    // Minimum quality thresholds
    this.minQuestionLength = 15;
    this.maxQuestionLength = 2000;
    this.minOptionLength = 2;
  }

  /**
   * Filter a single question
   * @param {Object} question - Question to filter
   * @returns {Object} Filter result
   */
  filter(question) {
    const issues = [];
    const flags = [];
    
    // Check question text
    const textIssues = this._checkText(question.text, 'Question text');
    issues.push(...textIssues.issues);
    flags.push(...textIssues.flags);
    
    // Check options if present
    if (question.options) {
      for (let i = 0; i < question.options.length; i++) {
        const optIssues = this._checkText(question.options[i].text, `Option ${i + 1}`);
        issues.push(...optIssues.issues);
        flags.push(...optIssues.flags);
        
        // Check option explanation
        if (question.options[i].explanation) {
          const expIssues = this._checkText(question.options[i].explanation, `Option ${i + 1} explanation`);
          issues.push(...expIssues.issues);
          flags.push(...expIssues.flags);
        }
      }
    }
    
    // Check explanation
    if (question.explanation) {
      const expIssues = this._checkText(question.explanation, 'Explanation');
      issues.push(...expIssues.issues);
      flags.push(...expIssues.flags);
    }
    
    // Check case study if present
    if (question.caseStudy) {
      const caseIssues = this._checkText(question.caseStudy, 'Case study');
      issues.push(...caseIssues.issues);
      flags.push(...caseIssues.flags);
    }
    
    // Check expected answer if present
    if (question.expectedAnswer) {
      const ansIssues = this._checkText(question.expectedAnswer, 'Expected answer');
      issues.push(...ansIssues.issues);
      flags.push(...ansIssues.flags);
    }
    
    // Quality checks
    const qualityIssues = this._checkQuality(question);
    issues.push(...qualityIssues);
    
    return {
      passed: issues.length === 0,
      issues,
      flags,
      requiresReview: flags.length > 0
    };
  }

  /**
   * Check text for issues
   */
  _checkText(text, fieldName) {
    const issues = [];
    const flags = [];
    
    if (!text) return { issues, flags };
    
    // Check for inappropriate content
    for (const pattern of this.inappropriatePatterns) {
      if (pattern.test(text)) {
        issues.push(`${fieldName} contains potentially inappropriate content`);
        break;
      }
    }
    
    // Check for bias
    for (const pattern of this.biasPatterns) {
      if (pattern.test(text)) {
        flags.push(`${fieldName} may contain biased language`);
        break;
      }
    }
    
    // Check for placeholders
    for (const pattern of this.placeholderPatterns) {
      if (pattern.test(text)) {
        issues.push(`${fieldName} contains placeholder content`);
        break;
      }
    }
    
    return { issues, flags };
  }

  /**
   * Quality checks
   */
  _checkQuality(question) {
    const issues = [];
    
    // Question length
    if (question.text && question.text.length < this.minQuestionLength) {
      issues.push(`Question text is too short (minimum ${this.minQuestionLength} characters)`);
    }
    
    if (question.text && question.text.length > this.maxQuestionLength) {
      issues.push(`Question text is too long (maximum ${this.maxQuestionLength} characters)`);
    }
    
    // Option length
    if (question.options) {
      const shortOptions = question.options.filter(o => 
        o.text && o.text.length < this.minOptionLength
      );
      
      if (shortOptions.length > 0) {
        issues.push(`Some options are too short (minimum ${this.minOptionLength} characters)`);
      }
    }
    
    // Check for duplicate options
    if (question.options) {
      const optionTexts = question.options.map(o => o.text?.toLowerCase().trim());
      const uniqueOptions = new Set(optionTexts);
      
      if (uniqueOptions.size < optionTexts.length) {
        issues.push('Duplicate options detected');
      }
    }
    
    // Check numerical answer has valid value
    if (question.numericalAnswer) {
      if (typeof question.numericalAnswer.value !== 'number' || 
          isNaN(question.numericalAnswer.value)) {
        issues.push('Numerical answer value is invalid');
      }
    }
    
    return issues;
  }

  /**
   * Filter batch of questions
   */
  filterBatch(questions) {
    const results = {
      passed: [],
      failed: [],
      flagged: [],
      passedCount: 0,
      failedCount: 0,
      flaggedCount: 0
    };
    
    for (const question of questions) {
      const result = this.filter(question);
      
      if (result.passed) {
        if (result.requiresReview) {
          results.flagged.push({ question, flags: result.flags });
          results.flaggedCount++;
        } else {
          results.passed.push(question);
          results.passedCount++;
        }
      } else {
        results.failed.push({ question, issues: result.issues });
        results.failedCount++;
      }
    }
    
    return results;
  }
}

module.exports = new ContentFilter();

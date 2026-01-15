const logger = require('../../utils/logger');

/**
 * Question Schema Validator
 * Validates AI-generated questions against the platform's Question model
 */
class QuestionValidator {
  constructor() {
    // Valid enums
    this.validDifficulties = ['easy', 'medium', 'hard'];
    this.validTypes = ['mcq-single', 'mcq-multiple', 'true-false', 'numerical', 'short-answer', 'long-answer', 'case-based'];
    
    // Required fields per question type
    this.requiredFieldsByType = {
      'mcq-single': ['options'],
      'mcq-multiple': ['options'],
      'true-false': ['options'],
      'numerical': ['numericalAnswer'],
      'short-answer': ['expectedAnswer'],
      'long-answer': ['expectedAnswer'],
      'case-based': ['caseStudy', 'options']
    };
  }

  /**
   * Validate a single question
   * @param {Object} question - Question to validate
   * @returns {Object} Validation result with isValid, errors, and sanitized question
   */
  validate(question) {
    const errors = [];
    const warnings = [];
    
    // Check required base fields
    if (!question.text || typeof question.text !== 'string' || question.text.trim().length === 0) {
      errors.push('Question text is required and must be a non-empty string');
    }
    
    if (!question.topic || typeof question.topic !== 'string') {
      errors.push('Topic is required and must be a string');
    }
    
    if (!this.validDifficulties.includes(question.difficultyLevel)) {
      errors.push(`Invalid difficulty level. Must be one of: ${this.validDifficulties.join(', ')}`);
    }
    
    if (!this.validTypes.includes(question.type)) {
      errors.push(`Invalid question type. Must be one of: ${this.validTypes.join(', ')}`);
    }
    
    // Validate type-specific fields
    if (question.type && this.validTypes.includes(question.type)) {
      const typeErrors = this._validateTypeSpecificFields(question);
      errors.push(...typeErrors);
    }
    
    // Validate marks
    if (question.marks !== undefined) {
      if (typeof question.marks !== 'number' || question.marks < 0) {
        errors.push('Marks must be a non-negative number');
      }
    }
    
    if (question.negativeMarks !== undefined) {
      if (typeof question.negativeMarks !== 'number' || question.negativeMarks < 0) {
        errors.push('Negative marks must be a non-negative number');
      }
    }
    
    // Quality warnings (not errors)
    if (!question.explanation || question.explanation.trim().length < 10) {
      warnings.push('Explanation is missing or too short');
    }
    
    if (!question.tags || !Array.isArray(question.tags) || question.tags.length === 0) {
      warnings.push('Tags are recommended for better organization');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitized: errors.length === 0 ? this._sanitize(question) : null
    };
  }

  /**
   * Validate type-specific fields
   */
  _validateTypeSpecificFields(question) {
    const errors = [];
    const requiredFields = this.requiredFieldsByType[question.type] || [];
    
    for (const field of requiredFields) {
      if (!question[field]) {
        errors.push(`${field} is required for ${question.type} questions`);
      }
    }
    
    // Detailed validation per type
    switch (question.type) {
      case 'mcq-single':
        errors.push(...this._validateMCQSingle(question));
        break;
      case 'mcq-multiple':
        errors.push(...this._validateMCQMultiple(question));
        break;
      case 'true-false':
        errors.push(...this._validateTrueFalse(question));
        break;
      case 'numerical':
        errors.push(...this._validateNumerical(question));
        break;
      case 'short-answer':
      case 'long-answer':
        errors.push(...this._validateTextAnswer(question));
        break;
      case 'case-based':
        errors.push(...this._validateCaseBased(question));
        break;
    }
    
    return errors;
  }

  _validateMCQSingle(question) {
    const errors = [];
    
    if (!Array.isArray(question.options)) {
      errors.push('Options must be an array');
      return errors;
    }
    
    if (question.options.length < 2) {
      errors.push('MCQ must have at least 2 options');
    }
    
    if (question.options.length > 6) {
      errors.push('MCQ should not have more than 6 options');
    }
    
    const correctOptions = question.options.filter(o => o.isCorrect);
    if (correctOptions.length !== 1) {
      errors.push('MCQ single must have exactly one correct answer');
    }
    
    // Validate each option has text and explanation
    question.options.forEach((opt, idx) => {
      if (!opt.text || typeof opt.text !== 'string') {
        errors.push(`Option ${idx + 1} must have a text field`);
      }
      if (!opt.explanation || typeof opt.explanation !== 'string') {
        errors.push(`Option ${idx + 1} should have an explanation`);
      }
    });
    
    // Validate correctAnswer field exists
    if (!question.correctAnswer || typeof question.correctAnswer !== 'string') {
      errors.push('correctAnswer field is required and must contain the correct answer text');
    }
    
    return errors;
  }

  _validateMCQMultiple(question) {
    const errors = [];
    
    if (!Array.isArray(question.options)) {
      errors.push('Options must be an array');
      return errors;
    }
    
    if (question.options.length < 3) {
      errors.push('Multiple select MCQ must have at least 3 options');
    }
    
    const correctOptions = question.options.filter(o => o.isCorrect);
    if (correctOptions.length < 2) {
      errors.push('Multiple select MCQ must have at least 2 correct answers');
    }
    
    // Validate each option has explanation
    question.options.forEach((opt, idx) => {
      if (!opt.explanation || typeof opt.explanation !== 'string') {
        errors.push(`Option ${idx + 1} should have an explanation`);
      }
    });
    
    // Validate correctAnswer field exists
    if (!question.correctAnswer || typeof question.correctAnswer !== 'string') {
      errors.push('correctAnswer field is required');
    }
    
    return errors;
  }

  _validateTrueFalse(question) {
    const errors = [];
    
    if (!Array.isArray(question.options)) {
      errors.push('Options must be an array');
      return errors;
    }
    
    if (question.options.length !== 2) {
      errors.push('True/False must have exactly 2 options');
    }
    
    const hasTrue = question.options.some(o => o.text?.toLowerCase() === 'true');
    const hasFalse = question.options.some(o => o.text?.toLowerCase() === 'false');
    
    if (!hasTrue || !hasFalse) {
      errors.push('True/False must have "True" and "False" options');
    }
    
    const correctOptions = question.options.filter(o => o.isCorrect);
    if (correctOptions.length !== 1) {
      errors.push('True/False must have exactly one correct answer');
    }
    
    // Validate correctAnswer field exists
    if (!question.correctAnswer || typeof question.correctAnswer !== 'string') {
      errors.push('correctAnswer field is required (should be "True" or "False")');
    }
    
    return errors;
  }

  _validateNumerical(question) {
    const errors = [];
    
    if (!question.numericalAnswer) {
      errors.push('Numerical answer object is required');
      return errors;
    }
    
    if (typeof question.numericalAnswer.value !== 'number') {
      errors.push('Numerical answer value must be a number');
    }
    
    if (question.numericalAnswer.tolerance !== undefined && 
        typeof question.numericalAnswer.tolerance !== 'number') {
      errors.push('Tolerance must be a number');
    }
    
    // Validate correctAnswer field exists
    if (!question.correctAnswer) {
      errors.push('correctAnswer field is required (should contain the numerical answer with unit)');
    }
    
    return errors;
  }

  _validateTextAnswer(question) {
    const errors = [];
    
    if (!question.expectedAnswer || typeof question.expectedAnswer !== 'string') {
      errors.push('Expected answer is required and must be a string');
    }
    
    // Validate correctAnswer field exists
    if (!question.correctAnswer || typeof question.correctAnswer !== 'string') {
      errors.push('correctAnswer field is required and must contain the model answer');
    }
    if (question.expectedAnswer && question.expectedAnswer.trim().length < 10) {
      errors.push('Expected answer should be at least 10 characters');
    }
    
    return errors;
  }

  _validateCaseBased(question) {
    const errors = [];
    
    if (!question.caseStudy || typeof question.caseStudy !== 'string') {
      errors.push('Case study text is required');
    }
    
    if (question.caseStudy && question.caseStudy.trim().length < 50) {
      errors.push('Case study should be at least 50 characters');
    }
    
    // Validate options if present
    if (question.options) {
      errors.push(...this._validateMCQSingle({ ...question, type: 'mcq-single' }));
    }
    
    return errors;
  }

  /**
   * Sanitize question to match schema
   */
  _sanitize(question) {
    const sanitized = {
      text: question.text.trim(),
      topic: question.topic.trim(),
      difficultyLevel: question.difficultyLevel,
      type: question.type,
      explanation: question.explanation?.trim() || '',
      marks: question.marks || (question.difficultyLevel === 'easy' ? 1 : question.difficultyLevel === 'medium' ? 2 : 3),
      negativeMarks: question.negativeMarks || 0,
      recommendedTime: question.recommendedTime || (question.difficultyLevel === 'easy' ? 60 : question.difficultyLevel === 'medium' ? 120 : 180),
      tags: Array.isArray(question.tags) ? question.tags.map(t => t.trim()) : []
    };
    
    // Type-specific fields
    if (question.options) {
      sanitized.options = question.options.map(opt => ({
        text: opt.text.trim(),
        isCorrect: Boolean(opt.isCorrect),
        explanation: opt.explanation?.trim() || ''
      }));
    }
    
    if (question.numericalAnswer) {
      sanitized.numericalAnswer = {
        value: Number(question.numericalAnswer.value),
        tolerance: Number(question.numericalAnswer.tolerance) || 0,
        unit: question.numericalAnswer.unit?.trim() || ''
      };
    }
    
    if (question.expectedAnswer) {
      sanitized.expectedAnswer = question.expectedAnswer.trim();
    }
    
    if (question.keywords) {
      sanitized.keywords = Array.isArray(question.keywords) 
        ? question.keywords.map(k => k.trim())
        : [];
    }
    
    if (question.caseStudy) {
      sanitized.caseStudy = question.caseStudy.trim();
    }
    
    // Preserve metadata if present
    if (question._metadata) {
      sanitized._metadata = question._metadata;
    }
    
    return sanitized;
  }

  /**
   * Validate batch of questions
   */
  validateBatch(questions) {
    const results = {
      valid: [],
      invalid: [],
      totalCount: questions.length,
      validCount: 0,
      invalidCount: 0,
      allWarnings: []
    };
    
    for (const question of questions) {
      const validation = this.validate(question);
      
      if (validation.isValid) {
        results.valid.push(validation.sanitized);
        results.validCount++;
      } else {
        results.invalid.push({
          question,
          errors: validation.errors
        });
        results.invalidCount++;
      }
      
      if (validation.warnings.length > 0) {
        results.allWarnings.push({
          question: question.text?.substring(0, 50),
          warnings: validation.warnings
        });
      }
    }
    
    return results;
  }
}

module.exports = new QuestionValidator();

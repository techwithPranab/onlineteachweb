const { body, param, query } = require('express-validator');

/**
 * Validation rules for AI Question Generation API
 */

const generateQuestionsValidation = [
  body('courseId')
    .notEmpty()
    .withMessage('courseId is required')
    .isMongoId()
    .withMessage('courseId must be a valid MongoDB ObjectId'),
  
  body('topics')
    .optional()
    .isArray()
    .withMessage('topics must be an array'),
  
  body('topics.*')
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Each topic must be a non-empty string'),
  
  body('difficultyLevels')
    .optional()
    .isArray()
    .withMessage('difficultyLevels must be an array'),
  
  body('difficultyLevels.*')
    .optional()
    .isIn(['easy', 'medium', 'hard'])
    .withMessage('Each difficulty level must be easy, medium, or hard'),
  
  body('questionTypes')
    .optional()
    .isArray()
    .withMessage('questionTypes must be an array'),
  
  body('questionTypes.*')
    .optional()
    .isIn(['mcq-single', 'mcq-multiple', 'true-false', 'numerical', 'short-answer', 'long-answer', 'case-based'])
    .withMessage('Invalid question type'),
  
  body('questionsPerTopic')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('questionsPerTopic must be between 1 and 20'),
  
  body('sources')
    .optional()
    .isArray()
    .withMessage('sources must be an array'),
  
  body('sources.*')
    .optional()
    .isIn(['syllabus', 'materials', 'external'])
    .withMessage('Invalid source type'),
  
  body('providerName')
    .optional()
    .isString()
    .trim()
    .withMessage('providerName must be a string')
];

const getDraftsValidation = [
  query('courseId')
    .optional()
    .isMongoId()
    .withMessage('courseId must be a valid MongoDB ObjectId'),
  
  query('status')
    .optional()
    .isIn(['draft', 'approved', 'rejected'])
    .withMessage('Invalid status'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('limit must be between 1 and 100')
];

const draftIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid draft ID')
];

const jobIdValidation = [
  param('jobId')
    .notEmpty()
    .withMessage('jobId is required')
    .isString()
    .withMessage('jobId must be a string')
];

const rejectDraftValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid draft ID'),
  
  body('reason')
    .notEmpty()
    .withMessage('Rejection reason is required')
    .isString()
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Reason must be between 5 and 500 characters')
];

const bulkApproveValidation = [
  body('draftIds')
    .isArray({ min: 1 })
    .withMessage('draftIds must be a non-empty array'),
  
  body('draftIds.*')
    .isMongoId()
    .withMessage('Each draftId must be a valid MongoDB ObjectId')
];

const bulkRejectValidation = [
  body('draftIds')
    .isArray({ min: 1 })
    .withMessage('draftIds must be a non-empty array'),
  
  body('draftIds.*')
    .isMongoId()
    .withMessage('Each draftId must be a valid MongoDB ObjectId'),
  
  body('reason')
    .notEmpty()
    .withMessage('Rejection reason is required')
    .isString()
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Reason must be between 5 and 500 characters')
];

const editDraftValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid draft ID'),
  
  body('questionPayload')
    .notEmpty()
    .withMessage('questionPayload is required')
    .isObject()
    .withMessage('questionPayload must be an object'),
  
  body('changeDescription')
    .optional()
    .isString()
    .trim()
    .withMessage('changeDescription must be a string')
];

module.exports = {
  generateQuestionsValidation,
  getDraftsValidation,
  draftIdValidation,
  jobIdValidation,
  rejectDraftValidation,
  bulkApproveValidation,
  bulkRejectValidation,
  editDraftValidation
};

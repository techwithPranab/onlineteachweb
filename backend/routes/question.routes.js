const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const questionController = require('../controllers/question.controller');
const aiGenerationController = require('../controllers/aiGeneration.controller');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

// All routes require authentication and tutor/admin role
router.use(authenticate);
router.use(authorize('tutor', 'admin'));

// Create a new question
router.post('/',
  [
    body('courseId').isMongoId().withMessage('Valid course ID is required'),
    body('chapterName').trim().notEmpty().withMessage('Chapter name is required'),
    body('topic').trim().notEmpty().withMessage('Topic is required'),
    body('difficultyLevel').isIn(['easy', 'medium', 'hard']).withMessage('Valid difficulty level is required'),
    body('type').isIn(['mcq-single', 'mcq-multiple', 'true-false', 'numerical', 'short-answer', 'long-answer', 'case-based']).withMessage('Valid question type is required'),
    body('text').trim().notEmpty().withMessage('Question text is required'),
    body('marks').optional().isFloat({ min: 0 }).withMessage('Marks must be positive'),
    body('negativeMarks').optional().isFloat({ min: 0 }).withMessage('Negative marks must be positive'),
    validate
  ],
  questionController.createQuestion
);

// Create multiple questions (bulk)
router.post('/bulk',
  [
    body('questions').isArray({ min: 1 }).withMessage('Questions array is required'),
    body('questions.*.courseId').isMongoId().withMessage('Valid course ID is required'),
    body('questions.*.topic').trim().notEmpty().withMessage('Topic is required'),
    body('questions.*.difficultyLevel').isIn(['easy', 'medium', 'hard']).withMessage('Valid difficulty level is required'),
    body('questions.*.type').isIn(['mcq-single', 'mcq-multiple', 'true-false', 'numerical', 'short-answer', 'long-answer', 'case-based']).withMessage('Valid question type is required'),
    body('questions.*.text').trim().notEmpty().withMessage('Question text is required'),
    validate
  ],
  questionController.createBulkQuestions
);

// Get questions with filters
router.get('/',
  [
    query('courseId').optional().isMongoId().withMessage('Valid course ID required'),
    query('difficultyLevel').optional().isIn(['easy', 'medium', 'hard']),
    query('type').optional().isIn(['mcq-single', 'mcq-multiple', 'true-false', 'numerical', 'short-answer', 'long-answer', 'case-based']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    validate
  ],
  questionController.getQuestions
);

// Get topics for a course
router.get('/topics/:courseId',
  [
    param('courseId').isMongoId().withMessage('Valid course ID required'),
    validate
  ],
  questionController.getTopicsForCourse
);

// Get question statistics for a course
router.get('/stats/:courseId',
  [
    param('courseId').isMongoId().withMessage('Valid course ID required'),
    validate
  ],
  questionController.getQuestionStats
);

// Get course structure (chapters and topics)
router.get('/course/:courseId/structure',
  [
    param('courseId').isMongoId().withMessage('Valid course ID required'),
    validate
  ],
  questionController.getCourseStructure
);

// AI Question Generation Routes
// Generate questions with AI
router.post('/generate',
  [
    body('courseId').isMongoId().withMessage('Valid course ID is required'),
    body('chapterName').trim().notEmpty().withMessage('Chapter name is required'),
    body('topic').trim().notEmpty().withMessage('Topic is required'),
    body('difficultyLevel').isIn(['easy', 'medium', 'hard']).withMessage('Valid difficulty level is required'),
    body('questionType').isIn(['mcq-single', 'mcq-multiple', 'true-false', 'numerical', 'short-answer', 'long-answer', 'case-based']).withMessage('Valid question type is required'),
    body('count').optional().isInt({ min: 1, max: 20 }).withMessage('Count must be between 1 and 20'),
    body('aiProvider').optional().isIn(['openai', 'anthropic', 'google', 'rule-based']),
    body('model').optional().isString(),
    validate
  ],
  aiGenerationController.generateQuestionsWithAI
);

// Get generation history
router.get('/generate/history',
  [
    query('courseId').optional().isMongoId(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    validate
  ],
  aiGenerationController.getGenerationHistory
);

// Get generation by ID
router.get('/generate/:id',
  [
    param('id').isMongoId().withMessage('Valid generation ID required'),
    validate
  ],
  aiGenerationController.getGenerationById
);

// Get a single question
router.get('/:id',
  [
    param('id').isMongoId().withMessage('Valid question ID required'),
    validate
  ],
  questionController.getQuestionById
);

// Update a question
router.put('/:id',
  [
    param('id').isMongoId().withMessage('Valid question ID required'),
    validate
  ],
  questionController.updateQuestion
);

// Delete (deactivate) a question
router.delete('/:id',
  [
    param('id').isMongoId().withMessage('Valid question ID required'),
    validate
  ],
  questionController.deleteQuestion
);

module.exports = router;

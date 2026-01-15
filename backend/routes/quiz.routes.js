const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const quizController = require('../controllers/quiz.controller');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

// =====================
// QUIZ MANAGEMENT ROUTES (Tutor/Admin)
// =====================

// Create a new quiz
router.post('/',
  authenticate,
  authorize('tutor', 'admin'),
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('courseId').isMongoId().withMessage('Valid course ID is required'),
    body('difficultyLevel').isIn(['easy', 'medium', 'hard']).withMessage('Valid difficulty level is required'),
    body('duration').isInt({ min: 1, max: 300 }).withMessage('Duration must be between 1 and 300 minutes'),
    body('totalMarks').isInt({ min: 1 }).withMessage('Total marks is required'),
    body('passingPercentage').optional().isFloat({ min: 0, max: 100 }),
    body('attemptsAllowed').optional().isInt({ min: 1, max: 10 }),
    body('questionConfig.totalQuestions').isInt({ min: 1, max: 100 }).withMessage('Total questions is required'),
    validate
  ],
  quizController.createQuiz
);

// Get all quizzes (Tutor/Admin)
router.get('/',
  authenticate,
  authorize('tutor', 'admin'),
  [
    query('courseId').optional().isMongoId(),
    query('status').optional().isIn(['draft', 'published', 'archived']),
    query('difficultyLevel').optional().isIn(['easy', 'medium', 'hard']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
    validate
  ],
  quizController.getQuizzes
);

// Get available quizzes for a course (Student)
router.get('/course/:courseId/available',
  authenticate,
  [
    param('courseId').isMongoId().withMessage('Valid course ID required'),
    validate
  ],
  quizController.getAvailableQuizzes
);

// Get quiz by ID
router.get('/:id',
  authenticate,
  [
    param('id').isMongoId().withMessage('Valid quiz ID required'),
    validate
  ],
  quizController.getQuizById
);

// Update quiz
router.put('/:id',
  authenticate,
  authorize('tutor', 'admin'),
  [
    param('id').isMongoId().withMessage('Valid quiz ID required'),
    validate
  ],
  quizController.updateQuiz
);

// Delete quiz
router.delete('/:id',
  authenticate,
  authorize('admin'),
  [
    param('id').isMongoId().withMessage('Valid quiz ID required'),
    validate
  ],
  quizController.deleteQuiz
);

// Publish quiz
router.post('/:id/publish',
  authenticate,
  authorize('tutor', 'admin'),
  [
    param('id').isMongoId().withMessage('Valid quiz ID required'),
    validate
  ],
  quizController.publishQuiz
);

// Get quiz attempts (Tutor/Admin)
router.get('/:id/attempts',
  authenticate,
  authorize('tutor', 'admin'),
  [
    param('id').isMongoId().withMessage('Valid quiz ID required'),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
    query('status').optional().isIn(['in-progress', 'submitted', 'auto-submitted', 'evaluating', 'completed']),
    validate
  ],
  quizController.getQuizAttempts
);

// =====================
// STUDENT QUIZ ROUTES
// =====================

// Start a quiz
router.post('/:id/start',
  authenticate,
  [
    param('id').isMongoId().withMessage('Valid quiz ID required'),
    validate
  ],
  quizController.startQuiz
);

// Save answer
router.post('/sessions/:sessionId/answer',
  authenticate,
  [
    param('sessionId').isMongoId().withMessage('Valid session ID required'),
    body('questionId').isMongoId().withMessage('Valid question ID required'),
    body('answer').exists().withMessage('Answer is required'),
    body('timeSpent').optional().isInt({ min: 0 }),
    validate
  ],
  quizController.saveAnswer
);

// Mark question for review
router.post('/sessions/:sessionId/mark-review',
  authenticate,
  [
    param('sessionId').isMongoId().withMessage('Valid session ID required'),
    body('questionId').isMongoId().withMessage('Valid question ID required'),
    body('marked').isBoolean().withMessage('Marked status is required'),
    validate
  ],
  quizController.markForReview
);

// Submit quiz
router.post('/:id/submit',
  authenticate,
  [
    param('id').isMongoId().withMessage('Valid quiz ID required'),
    body('sessionId').isMongoId().withMessage('Valid session ID required'),
    validate
  ],
  quizController.submitQuiz
);

// Get quiz result (Student)
router.get('/:id/result',
  authenticate,
  [
    param('id').isMongoId().withMessage('Valid quiz ID required'),
    query('sessionId').optional().isMongoId(),
    validate
  ],
  quizController.getQuizResult
);

// Get session details (Tutor/Admin)
router.get('/sessions/:sessionId',
  authenticate,
  authorize('tutor', 'admin'),
  [
    param('sessionId').isMongoId().withMessage('Valid session ID required'),
    validate
  ],
  quizController.getSessionDetails
);

module.exports = router;

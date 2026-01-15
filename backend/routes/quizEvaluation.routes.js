const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const quizEvaluationController = require('../controllers/quizEvaluation.controller');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

// Get pending evaluations (Tutor/Admin)
router.get('/pending',
  authenticate,
  authorize('tutor', 'admin'),
  [
    query('courseId').optional().isMongoId(),
    query('quizId').optional().isMongoId(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
    validate
  ],
  quizEvaluationController.getPendingEvaluations
);

// Get session for manual evaluation (Tutor/Admin)
router.get('/session/:sessionId',
  authenticate,
  authorize('tutor', 'admin'),
  [
    param('sessionId').isMongoId().withMessage('Valid session ID required'),
    validate
  ],
  quizEvaluationController.getSessionForEvaluation
);

// Submit manual evaluation for a question
router.post('/manual',
  authenticate,
  authorize('tutor', 'admin'),
  [
    body('sessionId').isMongoId().withMessage('Valid session ID required'),
    body('questionId').isMongoId().withMessage('Valid question ID required'),
    body('marksAwarded').isFloat({ min: 0 }).withMessage('Marks must be non-negative'),
    body('feedback').optional().trim(),
    validate
  ],
  quizEvaluationController.submitManualEvaluation
);

// Submit bulk manual evaluations
router.post('/manual/bulk',
  authenticate,
  authorize('tutor', 'admin'),
  [
    body('sessionId').isMongoId().withMessage('Valid session ID required'),
    body('evaluations').isArray({ min: 1 }).withMessage('Evaluations array is required'),
    body('evaluations.*.questionId').isMongoId().withMessage('Valid question ID required'),
    body('evaluations.*.marksAwarded').isFloat({ min: 0 }).withMessage('Marks must be non-negative'),
    validate
  ],
  quizEvaluationController.submitBulkManualEvaluation
);

// Override auto-evaluated score
router.post('/override',
  authenticate,
  authorize('tutor', 'admin'),
  [
    body('sessionId').isMongoId().withMessage('Valid session ID required'),
    body('questionId').isMongoId().withMessage('Valid question ID required'),
    body('newMarks').isFloat({ min: 0 }).withMessage('New marks must be non-negative'),
    body('reason').trim().notEmpty().withMessage('Reason is required'),
    validate
  ],
  quizEvaluationController.overrideScore
);

// Get student analytics
router.get('/analytics/student/:studentId',
  authenticate,
  [
    param('studentId').isMongoId().withMessage('Valid student ID required'),
    query('courseId').optional().isMongoId(),
    validate
  ],
  quizEvaluationController.getStudentAnalytics
);

// Get quiz analytics (Tutor/Admin)
router.get('/analytics/quiz/:quizId',
  authenticate,
  authorize('tutor', 'admin'),
  [
    param('quizId').isMongoId().withMessage('Valid quiz ID required'),
    validate
  ],
  quizEvaluationController.getQuizAnalytics
);

// Publish evaluation result
router.post('/:evaluationId/publish',
  authenticate,
  authorize('tutor', 'admin'),
  [
    param('evaluationId').isMongoId().withMessage('Valid evaluation ID required'),
    validate
  ],
  quizEvaluationController.publishEvaluation
);

module.exports = router;

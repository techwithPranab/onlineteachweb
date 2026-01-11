const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const evaluationController = require('../controllers/evaluation.controller');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

// Create evaluation
router.post('/',
  authenticate,
  authorize('tutor'),
  [
    body('sessionId').notEmpty().withMessage('Session ID is required'),
    body('studentId').notEmpty().withMessage('Student ID is required'),
    body('grade').isInt({ min: 0, max: 100 }).withMessage('Grade must be between 0 and 100'),
    body('feedback').trim().notEmpty().withMessage('Feedback is required'),
    validate
  ],
  evaluationController.createEvaluation
);

// Get evaluations for student
router.get('/student/:id', authenticate, evaluationController.getStudentEvaluations);

// Get evaluations for session
router.get('/session/:id',
  authenticate,
  authorize('tutor'),
  evaluationController.getSessionEvaluations
);

module.exports = router;

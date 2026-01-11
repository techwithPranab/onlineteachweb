const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const sessionController = require('../controllers/session.controller');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

// Create session
router.post('/',
  authenticate,
  authorize('tutor'),
  [
    body('courseId').notEmpty().withMessage('Course ID is required'),
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('scheduledAt').isISO8601().withMessage('Valid date is required'),
    body('duration').isInt({ min: 15 }).withMessage('Duration must be at least 15 minutes'),
    body('maxStudents').optional().isInt({ min: 1 }).withMessage('Max students must be positive'),
    validate
  ],
  sessionController.createSession
);

// Get sessions
router.get('/', authenticate, sessionController.getSessions);

// Get session by ID
router.get('/:id', authenticate, sessionController.getSessionById);

// Update session
router.put('/:id',
  authenticate,
  authorize('tutor'),
  sessionController.updateSession
);

// Delete session
router.delete('/:id',
  authenticate,
  authorize('tutor'),
  sessionController.deleteSession
);

module.exports = router;

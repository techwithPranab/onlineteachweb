const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const liveController = require('../controllers/live.controller');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

// Generate token
router.post('/token',
  authenticate,
  [
    body('sessionId').notEmpty().withMessage('Session ID is required'),
    validate
  ],
  liveController.generateToken
);

// Start session
router.post('/start',
  authenticate,
  authorize('tutor'),
  [
    body('sessionId').notEmpty().withMessage('Session ID is required'),
    validate
  ],
  liveController.startSession
);

// End session
router.post('/end',
  authenticate,
  authorize('tutor'),
  [
    body('sessionId').notEmpty().withMessage('Session ID is required'),
    validate
  ],
  liveController.endSession
);

module.exports = router;

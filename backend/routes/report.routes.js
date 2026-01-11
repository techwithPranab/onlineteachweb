const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { authenticate, authorize } = require('../middleware/auth');

// Get student report
router.get('/student/:id', authenticate, reportController.getStudentReport);

// Get tutor report
router.get('/tutor/:id',
  authenticate,
  authorize('tutor', 'admin'),
  reportController.getTutorReport
);

module.exports = router;

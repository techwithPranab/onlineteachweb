const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const questionExportController = require('../controllers/questionExport.controller');

/**
 * Question Import/Export Routes
 * Base path: /api/questions
 */

// Export routes (GET for download)
router.get(
  '/export/json',
  authenticate,
  authorize('tutor', 'admin'),
  questionExportController.exportQuestionsJSON
);

router.get(
  '/export/csv',
  authenticate,
  authorize('tutor', 'admin'),
  questionExportController.exportQuestionsCSV
);

// Import template
router.get(
  '/import/template',
  authenticate,
  authorize('tutor', 'admin'),
  questionExportController.getImportTemplate
);

// Validate import data
router.post(
  '/import/validate',
  authenticate,
  authorize('tutor', 'admin'),
  questionExportController.validateImportData
);

// Import questions to a course
router.post(
  '/import/:courseId',
  authenticate,
  authorize('tutor', 'admin'),
  questionExportController.importQuestionsJSON
);

module.exports = router;

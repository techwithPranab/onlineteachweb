const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const aiQuestionController = require('../controllers/aiQuestion.controller');
const {
  generateQuestionsValidation,
  getDraftsValidation,
  draftIdValidation,
  jobIdValidation,
  rejectDraftValidation,
  bulkApproveValidation,
  bulkRejectValidation,
  editDraftValidation
} = require('../middleware/aiQuestionValidation');
const rateLimit = require('express-rate-limit');

// Rate limiter for AI generation (expensive operation)
const generateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per 15 minutes
  message: {
    success: false,
    message: 'Too many generation requests. Please try again later.'
  }
});

/**
 * AI Question Generation Routes
 * All routes require authentication
 */

// Generate questions
router.post(
  '/questions/generate',
  authenticate,
  authorize('tutor', 'admin'),
  generateLimiter,
  generateQuestionsValidation,
  validate,
  aiQuestionController.generateQuestions
);

// Get drafts for review
router.get(
  '/questions/drafts',
  authenticate,
  authorize('tutor', 'admin'),
  getDraftsValidation,
  validate,
  aiQuestionController.getDrafts
);

// Get single draft
router.get(
  '/questions/drafts/:id',
  authenticate,
  authorize('tutor', 'admin'),
  draftIdValidation,
  validate,
  aiQuestionController.getDraftById
);

// Edit draft
router.put(
  '/questions/drafts/:id',
  authenticate,
  authorize('tutor', 'admin'),
  editDraftValidation,
  validate,
  aiQuestionController.editDraft
);

// Approve draft
router.post(
  '/questions/approve/:id',
  authenticate,
  authorize('tutor', 'admin'),
  draftIdValidation,
  validate,
  aiQuestionController.approveDraft
);

// Reject draft
router.post(
  '/questions/reject/:id',
  authenticate,
  authorize('tutor', 'admin'),
  rejectDraftValidation,
  validate,
  aiQuestionController.rejectDraft
);

// Bulk approve
router.post(
  '/questions/bulk-approve',
  authenticate,
  authorize('tutor', 'admin'),
  bulkApproveValidation,
  validate,
  aiQuestionController.bulkApprove
);

// Bulk reject
router.post(
  '/questions/bulk-reject',
  authenticate,
  authorize('tutor', 'admin'),
  bulkRejectValidation,
  validate,
  aiQuestionController.bulkReject
);

// Get statistics
router.get(
  '/questions/stats',
  authenticate,
  authorize('tutor', 'admin'),
  aiQuestionController.getStatistics
);

// Get drafts by job ID
router.get(
  '/questions/jobs/:jobId',
  authenticate,
  authorize('tutor', 'admin'),
  jobIdValidation,
  validate,
  aiQuestionController.getDraftsByJob
);

// Get AI provider status (admin only)
router.get(
  '/providers/status',
  authenticate,
  authorize('admin'),
  aiQuestionController.getProviderStatus
);

// Get available AI providers (for tutors and admins)
router.get(
  '/providers',
  authenticate,
  authorize('tutor', 'admin'),
  aiQuestionController.getAvailableProviders
);

// ============ Async Generation Routes ============

// Start async generation job (for large batches)
router.post(
  '/questions/generate-async',
  authenticate,
  authorize('tutor', 'admin'),
  generateLimiter,
  generateQuestionsValidation,
  validate,
  aiQuestionController.generateQuestionsAsync
);

// Get async job status
router.get(
  '/questions/jobs/:jobId/status',
  authenticate,
  authorize('tutor', 'admin'),
  aiQuestionController.getJobStatus
);

// Get async job results
router.get(
  '/questions/jobs/:jobId/results',
  authenticate,
  authorize('tutor', 'admin'),
  aiQuestionController.getJobResults
);

// Cancel async job
router.delete(
  '/questions/jobs/:jobId',
  authenticate,
  authorize('tutor', 'admin'),
  aiQuestionController.cancelJob
);

// Get queue stats (admin only)
router.get(
  '/questions/queue/stats',
  authenticate,
  authorize('admin'),
  aiQuestionController.getQueueStats
);

module.exports = router;

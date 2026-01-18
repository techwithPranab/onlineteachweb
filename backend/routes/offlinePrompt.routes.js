const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const offlinePromptController = require('../controllers/offlinePrompt.controller');

/**
 * Offline Prompt Routes
 * All routes require admin authentication
 */

// Generate new offline prompt
router.post(
  '/generate',
  authenticate,
  authorize('admin'),
  offlinePromptController.generateOfflinePrompt
);

// Get all prompts with pagination and filters
router.get(
  '/',
  authenticate,
  authorize('admin'),
  offlinePromptController.getAllPrompts
);

// Get statistics
router.get(
  '/statistics',
  authenticate,
  authorize('admin'),
  offlinePromptController.getStatistics
);

// Get filter values for dropdowns
router.get(
  '/filters/values',
  authenticate,
  authorize('admin'),
  offlinePromptController.getFilterValues
);

// Get single prompt by ID
router.get(
  '/:id',
  authenticate,
  authorize('admin'),
  offlinePromptController.getPromptById
);

// Download prompt JSON file
router.get(
  '/:id/download',
  authenticate,
  authorize('admin'),
  offlinePromptController.downloadPromptFile
);

// Delete prompt
router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  offlinePromptController.deletePrompt
);

module.exports = router;

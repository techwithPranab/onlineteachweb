const express = require('express');
const router = express.Router();
const {
  createAlgorithmQuiz,
  getActiveQuizzes,
  updateQuizStatus,
  deleteQuiz,
  analyzeQuizResults,
  getQuizHistory,
  getStudentPerformance
} = require('../controllers/algorithmQuiz.controller');
const { protect, authorize } = require('../middleware/auth');

/**
 * Algorithm-Based Quiz Routes
 * 
 * All routes require authentication
 * Students only
 */

// Create quiz with algorithm
router.post('/create', protect, authorize('student'), createAlgorithmQuiz);

// Get active quizzes
router.get('/active', protect, authorize('student'), getActiveQuizzes);

// Update quiz status
router.put('/:id/status', protect, authorize('student'), updateQuizStatus);

// Delete quiz
router.delete('/:id', protect, authorize('student'), deleteQuiz);

// Analyze quiz results
router.post('/:id/analyze', protect, authorize('student'), analyzeQuizResults);

// Get quiz history
router.get('/history', protect, authorize('student'), getQuizHistory);

// Get student performance
router.get('/performance', protect, authorize('student'), getStudentPerformance);

module.exports = router;

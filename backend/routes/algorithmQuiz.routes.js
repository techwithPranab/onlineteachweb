const express = require('express');
const router = express.Router();
const algorithmQuizController = require('../controllers/algorithmQuiz.controller');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * Algorithm-Based Quiz Routes
 *
 * All routes require authentication
 * Students only
 */

// Create quiz with algorithm
router.post('/create', authenticate, authorize('student'), algorithmQuizController.createAlgorithmQuiz);

// Get active quizzes
router.get('/active', authenticate, authorize('student'), algorithmQuizController.getActiveQuizzes);

// Update quiz status
router.put('/:id/status', authenticate, authorize('student'), algorithmQuizController.updateQuizStatus);

// Delete quiz
router.delete('/:id', authenticate, authorize('student'), algorithmQuizController.deleteQuiz);

// Analyze quiz results
router.post('/:id/analyze', authenticate, authorize('student'), algorithmQuizController.analyzeQuizResults);

// Get quiz history
router.get('/history', authenticate, authorize('student'), algorithmQuizController.getQuizHistory);

// Get student performance
router.get('/performance', authenticate, authorize('student'), algorithmQuizController.getStudentPerformance);

module.exports = router;

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const quizAssignmentController = require('../controllers/quizAssignment.controller');

/**
 * Quiz Assignment Routes
 * 
 * Handles quiz distribution/assignment by tutors and admins
 */

// @route   POST /api/quizzes/:id/assign
// @desc    Assign quiz to specific students
// @access  Private (Tutor, Admin)
router.post(
  '/:id/assign',
  authenticate,
  authorize('tutor', 'admin'),
  quizAssignmentController.assignQuizToStudents
);

// @route   GET /api/quizzes/:id/assignments
// @desc    Get all assignments for a quiz
// @access  Private (Tutor, Admin)
router.get(
  '/:id/assignments',
  authenticate,
  authorize('tutor', 'admin'),
  quizAssignmentController.getQuizAssignments
);

// @route   PUT /api/quizzes/:id/assignments/:assignmentId
// @desc    Update quiz assignment (add/remove students)
// @access  Private (Tutor, Admin)
router.put(
  '/:id/assignments/:assignmentId',
  authenticate,
  authorize('tutor', 'admin'),
  quizAssignmentController.updateQuizAssignment
);

// @route   DELETE /api/quizzes/:id/assignments/:assignmentId
// @desc    Delete quiz assignment
// @access  Private (Tutor, Admin)
router.delete(
  '/:id/assignments/:assignmentId',
  authenticate,
  authorize('tutor', 'admin'),
  quizAssignmentController.deleteQuizAssignment
);

// @route   GET /api/students/:studentId/assigned-quizzes
// @desc    Get all quizzes assigned to a student
// @access  Private (Student for own, Tutor/Admin for any)
router.get(
  '/students/:studentId/assigned-quizzes',
  authenticate,
  quizAssignmentController.getStudentAssignedQuizzes
);

module.exports = router;

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const courseController = require('../controllers/course.controller');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

// Create course - Admin only
router.post('/', 
  authenticate,
  authorize('admin'),
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('grade').isInt({ min: 1, max: 12 }).withMessage('Valid grade is required'),
    body('subject').trim().notEmpty().withMessage('Subject is required'),
    body('price').isFloat({ min: 0 }).withMessage('Valid price is required'),
    validate
  ],
  courseController.createCourse
);

// Get all courses - Public
router.get('/public', courseController.getPublicCourses);

// Get all courses
router.get('/', authenticate, courseController.getCourses);

// Get grades
router.get('/grades', authenticate, courseController.getGrades);

// Get subjects
router.get('/subjects', authenticate, courseController.getSubjects);

// Get subjects by grade
router.get('/grades/:grade/subjects', authenticate, courseController.getSubjectsByGrade);

// Get courses by grade and subject
router.get('/grades/:grade/subjects/:subject/courses', authenticate, courseController.getCoursesByGradeAndSubject);

// Get course by ID - Make it public for course details page
router.get('/:id', courseController.getCourseById);

// Submit review - Authenticated users
router.post('/:id/review',
  authenticate,
  [
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').optional().trim(),
    validate
  ],
  courseController.submitReview
);

// Get course students - Tutor/Admin only
router.get('/:id/students',
  authenticate,
  authorize('tutor', 'admin'),
  courseController.getCourseStudents
);

// Update course - Admin only
router.put('/:id',
  authenticate,
  authorize('admin'),
  courseController.updateCourse
);

// Delete course - Admin only
router.delete('/:id',
  authenticate,
  authorize('admin'),
  courseController.deleteCourse
);

module.exports = router;

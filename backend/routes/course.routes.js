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

// Get all courses
router.get('/', authenticate, courseController.getCourses);

// Get course by ID
router.get('/:id', authenticate, courseController.getCourseById);

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

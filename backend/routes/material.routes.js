const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const materialController = require('../controllers/material.controller');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

// Upload material
router.post('/',
  authenticate,
  authorize('tutor'),
  [
    body('courseId').notEmpty().withMessage('Course ID is required'),
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('type').isIn(['pdf', 'video', 'ppt', 'document', 'image', 'link']).withMessage('Invalid type'),
    body('fileUrl').notEmpty().withMessage('File URL is required'),
    validate
  ],
  materialController.uploadMaterial
);

// Get materials by course
router.get('/:courseId', authenticate, materialController.getMaterialsByCourse);

module.exports = router;

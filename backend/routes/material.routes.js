const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const multer = require('multer');
const path = require('path');
const materialController = require('../controllers/material.controller');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/materials/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|ppt|pptx|mp4|avi|mov|jpg|jpeg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Get all materials for tutor (or admin)
router.get('/',
  authenticate,
  authorize('tutor', 'admin'),
  materialController.getMaterialsByTutor
);

// Get recent materials for student
router.get('/student/recent',
  authenticate,
  authorize('student'),
  materialController.getRecentMaterialsForStudent
);

// Upload material (tutor or admin)
router.post('/',
  authenticate,
  authorize('tutor', 'admin'),
  upload.single('file'),
  [
    body('courseId').notEmpty().withMessage('Course ID is required'),
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('type').isIn(['pdf', 'video', 'ppt', 'document', 'image', 'link', 'article']).withMessage('Invalid type'),
    validate
  ],
  materialController.uploadMaterial
);

// Update material (tutor or admin)
router.put('/:id',
  authenticate,
  authorize('tutor', 'admin'),
  [
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
    body('type').optional().isIn(['pdf', 'video', 'ppt', 'document', 'image', 'link', 'article']).withMessage('Invalid type'),
    validate
  ],
  materialController.updateMaterial
);

// Delete material (tutor or admin)
router.delete('/:id',
  authenticate,
  authorize('tutor', 'admin'),
  materialController.deleteMaterial
);

// Get material previews by course (public)
router.get('/previews/:courseId', materialController.getMaterialPreviewsByCourse);

// Get materials by course
router.get('/:courseId', authenticate, materialController.getMaterialsByCourse);

module.exports = router;

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const adminController = require('../controllers/admin.controller');
const reportController = require('../controllers/report.controller');
const paymentController = require('../controllers/payment.controller');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const multer = require('multer');
const path = require('path');
const scanCourseController = require('../controllers/scanCourse.controller');

const scanStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/materials/'),
  filename: (req, file, cb) => cb(null, `course-scan-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`)
});
const scanUpload = multer({
  storage: scanStorage,
  limits: { fileSize: 50 * 1024 * 1024, files: 20 },
  fileFilter: (req, file, cb) => cb(file.mimetype === 'application/pdf' ? null : new Error('Only PDF scans are supported'), file.mimetype === 'application/pdf')
});

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

// User management
router.get('/users', adminController.getAllUsers);

router.put('/users/:id/status',
  [
    body('status').isIn(['active', 'inactive', 'suspended']).withMessage('Invalid status'),
    validate
  ],
  adminController.updateUserStatus
);

router.put('/users/:id',
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('phone').optional().trim(),
    body('bio').optional().trim(),
    validate
  ],
  adminController.updateUser
);

router.delete('/users/:id', adminController.deleteUser);

// Tutor management
router.get('/tutors/pending', adminController.getPendingTutors);

router.put('/tutors/:id/approve',
  [
    body('approved').isBoolean().withMessage('Approved must be boolean'),
    validate
  ],
  adminController.approveTutor
);

// Course management
router.get('/courses', adminController.getAllCoursesForAdmin);
router.get('/courses/stats', adminController.getCourseStats);
router.post('/courses/from-scans',
  scanUpload.array('files', 20),
  [
    body('grade').isInt({ min: 1, max: 12 }).withMessage('Grade must be between 1 and 12'),
    body('subject').trim().notEmpty().withMessage('Subject is required'),
    body('board').optional().isIn(['CBSE', 'ICSE', 'State Board', 'Other']),
    validate
  ],
  scanCourseController.createFromScans
);
router.get('/courses/from-scans/history', scanCourseController.getHistory);
router.get('/courses/from-scans/history/:id', scanCourseController.getHistoryItem);

// Material management
router.get('/materials', adminController.getAllMaterialsForAdmin);
router.get('/materials/:id', adminController.getMaterialForAdmin);

// Payment management
router.get('/payments', paymentController.getPayments);
router.get('/payments/stats', paymentController.getPaymentStats);
router.post('/payments/:id/refund', paymentController.processRefund);

// Session management
router.get('/sessions', paymentController.getAllSessions);
router.get('/sessions/stats', paymentController.getSessionStats);

// Subscription plan management
router.get('/subscription-plans', paymentController.getSubscriptionPlans);
router.post('/subscription-plans', paymentController.createSubscriptionPlan);
router.put('/subscription-plans/:id', paymentController.updateSubscriptionPlan);
router.delete('/subscription-plans/:id', paymentController.deleteSubscriptionPlan);
router.get('/subscriptions/stats', paymentController.getSubscriptionStats);

// Analytics
router.get('/analytics', reportController.getAdminAnalytics);

// Student performance
router.get('/students', adminController.getStudentsWithPerformance);
router.get('/students/:id/performance', adminController.getStudentPerformance);
router.get('/performance/analytics', adminController.getPerformanceAnalytics);
router.get('/performance/leaderboard', adminController.getPerformanceLeaderboard);
router.get('/performance/export', adminController.exportPerformanceData);

module.exports = router;

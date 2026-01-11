const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const adminController = require('../controllers/admin.controller');
const reportController = require('../controllers/report.controller');
const paymentController = require('../controllers/payment.controller');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

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

module.exports = router;

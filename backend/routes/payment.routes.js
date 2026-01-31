const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { authenticate, authorize } = require('../middleware/auth');

// Payment management routes (Admin only)
router.get('/', authenticate, authorize('admin'), paymentController.getPayments);
router.get('/stats', authenticate, authorize('admin'), paymentController.getPaymentStats);
router.post('/:id/refund', authenticate, authorize('admin'), paymentController.processRefund);

// User billing history
router.get('/billing-history', authenticate, paymentController.getUserBillingHistory);

module.exports = router;

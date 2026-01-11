const express = require('express');
const router = express.Router();
const {
  getPayments,
  getPaymentStats,
  processRefund
} = require('../controllers/payment.controller');
const { protect, authorize } = require('../middleware/auth');

// Payment management routes (Admin only)
router.get('/', protect, authorize('admin'), getPayments);
router.get('/stats', protect, authorize('admin'), getPaymentStats);
router.post('/:id/refund', protect, authorize('admin'), processRefund);

module.exports = router;

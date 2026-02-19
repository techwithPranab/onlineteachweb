const express = require('express');
const router = express.Router();
const razorpayController = require('../controllers/razorpay.controller');
const { authenticate, authorize } = require('../middleware/auth');

// Public routes
router.get('/config', razorpayController.getConfig);
router.post('/webhook', razorpayController.handleWebhook);

// Protected routes (Student only)
router.post('/create-order', authenticate, authorize('student'), razorpayController.createOrder);
router.post('/verify', authenticate, authorize('student'), razorpayController.verifyPayment);

module.exports = router;

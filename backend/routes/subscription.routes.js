const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const subscriptionController = require('../controllers/subscription.controller');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

// Create checkout
router.post('/checkout',
  authenticate,
  authorize('student'),
  [
    body('planId').notEmpty().withMessage('Plan ID is required'),
    body('paymentMethodId').notEmpty().withMessage('Payment method is required'),
    validate
  ],
  subscriptionController.createCheckout
);

// Get subscription status
router.get('/status', authenticate, subscriptionController.getSubscriptionStatus);

// Cancel subscription
router.post('/cancel',
  authenticate,
  authorize('student'),
  subscriptionController.cancelSubscription
);

module.exports = router;

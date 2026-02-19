const Razorpay = require('razorpay');
const crypto = require('crypto');
const { Subscription, SubscriptionPlan } = require('../models/Subscription.model');
const Payment = require('../models/Payment.model');
const User = require('../models/User.model');

// Initialize Razorpay instance
const razorpay = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
  ? new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    })
  : null;

/**
 * @desc    Create Razorpay order for subscription
 * @route   POST /api/payments/razorpay/create-order
 * @access  Private (Student)
 */
exports.createOrder = async (req, res, next) => {
  try {
    const { planId } = req.body;

    if (!razorpay) {
      return res.status(503).json({
        success: false,
        message: 'Razorpay is not configured on this server'
      });
    }

    // Get plan details
    const plan = await SubscriptionPlan.findById(planId);

    if (!plan || !plan.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Subscription plan not found'
      });
    }

    // Convert price to paise (Razorpay uses smallest currency unit)
    const amountInPaise = Math.round(plan.price * 100);

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: plan.currency === 'USD' ? 'INR' : plan.currency, // Convert to INR for Indian payments
      receipt: `rcpt_${Date.now()}`,
      notes: {
        planId: planId.toString(),
        userId: req.user._id.toString(),
        planName: plan.name,
        interval: plan.interval
      }
    });

    // Create pending payment record
    const payment = await Payment.create({
      user: req.user._id,
      amount: plan.price,
      currency: plan.currency === 'USD' ? 'INR' : plan.currency,
      status: 'pending',
      paymentMethod: 'razorpay',
      paymentGateway: 'razorpay',
      razorpayOrderId: order.id,
      description: `Subscription to ${plan.name} plan`
    });

    res.status(200).json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt
      },
      paymentId: payment._id,
      key: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    next(error);
  }
};

/**
 * @desc    Verify Razorpay payment signature
 * @route   POST /api/payments/razorpay/verify
 * @access  Private (Student)
 */
exports.verifyPayment = async (req, res, next) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planId,
      paymentId
    } = req.body;

    if (!razorpay) {
      return res.status(503).json({
        success: false,
        message: 'Razorpay is not configured on this server'
      });
    }

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      // Update payment as failed
      if (paymentId) {
        await Payment.findByIdAndUpdate(paymentId, {
          status: 'failed',
          failureReason: 'Invalid signature verification'
        });
      }

      return res.status(400).json({
        success: false,
        message: 'Payment verification failed'
      });
    }

    // Fetch payment details from Razorpay
    const razorpayPayment = await razorpay.payments.fetch(razorpay_payment_id);

    // Get plan details
    const plan = await SubscriptionPlan.findById(planId);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    // Cancel any existing active subscription
    const existingSub = await Subscription.findOne({
      user: req.user._id,
      status: { $in: ['active', 'trialing'] }
    });

    if (existingSub) {
      existingSub.status = 'cancelled';
      existingSub.cancelledAt = new Date();
      existingSub.cancelReason = 'Replaced by new subscription';
      existingSub.autoRenew = false;
      await existingSub.save();
    }

    // Calculate subscription dates
    const startDate = new Date();
    const endDate = new Date();
    if (plan.interval === 'month') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    // Create subscription
    const subscription = await Subscription.create({
      user: req.user._id,
      plan: planId,
      status: 'active',
      startDate,
      endDate,
      currentPeriodStart: startDate,
      currentPeriodEnd: endDate,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      autoRenew: false // Razorpay doesn't auto-renew by default
    });

    // Update payment record
    await Payment.findByIdAndUpdate(paymentId, {
      status: 'completed',
      subscription: subscription._id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      paidAt: new Date(),
      metadata: {
        razorpayOrderId: razorpay_order_id,
        method: razorpayPayment.method,
        email: razorpayPayment.email,
        contact: razorpayPayment.contact
      }
    });

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      subscription: await Subscription.findById(subscription._id).populate('plan')
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    
    // Update payment as failed if paymentId exists
    if (req.body.paymentId) {
      try {
        await Payment.findByIdAndUpdate(req.body.paymentId, {
          status: 'failed',
          failureReason: error.message || 'Payment verification error'
        });
      } catch (err) {
        console.error('Error updating payment status:', err);
      }
    }

    next(error);
  }
};

/**
 * @desc    Handle Razorpay webhook
 * @route   POST /api/payments/razorpay/webhook
 * @access  Public (Razorpay webhook)
 */
exports.handleWebhook = async (req, res) => {
  try {
    const webhookSignature = req.headers['x-razorpay-signature'];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('Razorpay webhook secret not configured');
      return res.status(500).json({ success: false });
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (webhookSignature !== expectedSignature) {
      console.error('Invalid webhook signature');
      return res.status(400).json({ success: false });
    }

    const event = req.body.event;
    const payload = req.body.payload;

    console.log(`Razorpay webhook received: ${event}`);

    // Handle different webhook events
    switch (event) {
      case 'payment.captured':
        await handlePaymentCaptured(payload);
        break;

      case 'payment.failed':
        await handlePaymentFailed(payload);
        break;

      case 'subscription.cancelled':
        await handleSubscriptionCancelled(payload);
        break;

      default:
        console.log(`Unhandled webhook event: ${event}`);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ success: false });
  }
};

/**
 * @desc    Get Razorpay configuration (public key)
 * @route   GET /api/payments/razorpay/config
 * @access  Public
 */
exports.getConfig = async (req, res) => {
  try {
    if (!razorpay) {
      return res.status(503).json({
        success: false,
        message: 'Razorpay is not configured',
        enabled: false
      });
    }

    res.status(200).json({
      success: true,
      enabled: true,
      key: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error('Error getting Razorpay config:', error);
    res.status(500).json({
      success: false,
      enabled: false
    });
  }
};

// Helper functions for webhook handlers
async function handlePaymentCaptured(payload) {
  try {
    const payment = payload.payment.entity;
    
    await Payment.findOneAndUpdate(
      { razorpayOrderId: payment.order_id },
      {
        status: 'completed',
        razorpayPaymentId: payment.id,
        paidAt: new Date(payment.created_at * 1000)
      }
    );

    console.log(`Payment captured: ${payment.id}`);
  } catch (error) {
    console.error('Error handling payment captured:', error);
  }
}

async function handlePaymentFailed(payload) {
  try {
    const payment = payload.payment.entity;
    
    await Payment.findOneAndUpdate(
      { razorpayOrderId: payment.order_id },
      {
        status: 'failed',
        failureReason: payment.error_description || 'Payment failed'
      }
    );

    console.log(`Payment failed: ${payment.id}`);
  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
}

async function handleSubscriptionCancelled(payload) {
  try {
    const subscription = payload.subscription.entity;
    
    await Subscription.findOneAndUpdate(
      { razorpaySubscriptionId: subscription.id },
      {
        status: 'cancelled',
        cancelledAt: new Date(),
        autoRenew: false
      }
    );

    console.log(`Subscription cancelled: ${subscription.id}`);
  } catch (error) {
    console.error('Error handling subscription cancelled:', error);
  }
}

const { Subscription, SubscriptionPlan } = require('../models/Subscription.model');
const Payment = require('../models/Payment.model');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// @desc    Create subscription checkout
// @route   POST /api/subscriptions/checkout
// @access  Private (Student)
exports.createCheckout = async (req, res, next) => {
  try {
    const { planId, paymentMethodId } = req.body;
    
    // Get plan
    const plan = await SubscriptionPlan.findById(planId);
    
    if (!plan || !plan.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Subscription plan not found'
      });
    }
    
    // Create or get Stripe customer
    let customerId = req.user.stripeCustomerId;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: req.user.email,
        name: req.user.name,
        payment_method: paymentMethodId,
        invoice_settings: {
          default_payment_method: paymentMethodId
        }
      });
      customerId = customer.id;
    }
    
    // Create subscription
    const stripeSubscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: plan.stripePriceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent']
    });
    
    // Calculate end date
    const endDate = new Date();
    if (plan.interval === 'month') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }
    
    // Create subscription record
    const subscription = await Subscription.create({
      user: req.user._id,
      plan: planId,
      status: 'active',
      startDate: new Date(),
      endDate,
      stripeSubscriptionId: stripeSubscription.id,
      stripeCustomerId: customerId,
      currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000)
    });
    
    res.status(201).json({
      success: true,
      subscription,
      clientSecret: stripeSubscription.latest_invoice.payment_intent.client_secret
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get subscription status
// @route   GET /api/subscriptions/status
// @access  Private
exports.getSubscriptionStatus = async (req, res, next) => {
  try {
    const subscription = await Subscription.findOne({
      user: req.user._id,
      status: { $in: ['active', 'trialing'] }
    }).populate('plan');
    
    res.json({
      success: true,
      subscription,
      plan: subscription?.plan
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel subscription
// @route   POST /api/subscriptions/cancel
// @access  Private (Student)
exports.cancelSubscription = async (req, res, next) => {
  try {
    const { reason } = req.body;
    
    const subscription = await Subscription.findOne({
      user: req.user._id,
      status: 'active'
    });
    
    if (!subscription) {
      return res.status(400).json({
        success: false,
        message: 'No active subscription found'
      });
    }
    
    // Cancel on Stripe
    if (subscription.stripeSubscriptionId) {
      await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
    }
    
    // Update subscription
    subscription.status = 'cancelled';
    subscription.cancelledAt = new Date();
    subscription.cancelReason = reason;
    subscription.autoRenew = false;
    await subscription.save();
    
    res.json({
      success: true,
      subscription
    });
  } catch (error) {
    next(error);
  }
};

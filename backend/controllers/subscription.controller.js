const { Subscription, SubscriptionPlan } = require('../models/Subscription.model');
const Payment = require('../models/Payment.model');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User.model');

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

    const stripeAvailable = !!process.env.STRIPE_SECRET_KEY && !!plan.stripePriceId;

    // Cancel existing active subscription (if any) to avoid duplicates
    const existing = await Subscription.findOne({ user: req.user._id, status: 'active' });
    if (existing) {
      if (existing.stripeSubscriptionId && stripeAvailable) {
        try {
          await stripe.subscriptions.cancel(existing.stripeSubscriptionId);
        } catch (err) {
          // log and continue
          console.error('Error cancelling existing stripe subscription:', err.message || err);
        }
      }

      existing.status = 'cancelled';
      existing.cancelledAt = new Date();
      existing.cancelReason = 'Replaced by new subscription';
      existing.autoRenew = false;
      await existing.save();
    }

    // If Stripe is configured and plan has a Stripe price id, do the normal Stripe flow
    if (stripeAvailable) {
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
        // Persist Stripe customer id on the user for future use
        try {
          await User.findByIdAndUpdate(req.user._id, { stripeCustomerId: customerId });
        } catch (err) {
          console.error('Failed to save stripe customer id on user:', err.message || err);
        }
      }

      // Create subscription on Stripe
      const stripeSubscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: plan.stripePriceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent']
      });

      // Calculate end date based on interval
      const endDate = new Date();
      if (plan.interval === 'month') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }

      // Create subscription record locally
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

      return res.status(201).json({
        success: true,
        subscription,
        clientSecret: stripeSubscription.latest_invoice.payment_intent.client_secret
      });
    }

    // Fallback: Stripe not available or plan doesn't have stripePriceId.
    // Create subscription locally (no payment taken). Useful for local/dev mode.
    const endDate = new Date();
    if (plan.interval === 'month') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    const subscription = await Subscription.create({
      user: req.user._id,
      plan: planId,
      status: 'active',
      startDate: new Date(),
      endDate,
      autoRenew: false
    });

    // Update user.activeSubscription so header/features reflect the new plan
    await User.findByIdAndUpdate(req.user._id, { activeSubscription: subscription._id });

    res.status(201).json({
      success: true,
      subscription,
      message: 'Subscription created (no Stripe integration available in this environment)'
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

    // Clear user.activeSubscription so header shows Free plan
    await User.findByIdAndUpdate(req.user._id, { activeSubscription: null });
    
    res.json({
      success: true,
      subscription
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Downgrade / switch to Free plan (no payment required)
// @route   POST /api/subscriptions/downgrade-to-free
// @access  Private (Student)
exports.downgradeToFree = async (req, res, next) => {
  try {
    // Find a free plan (by name or zero price) that is active
    const freePlan = await SubscriptionPlan.findOne({
      isActive: true,
      $or: [ { name: /free/i }, { price: 0 } ]
    }).sort({ priority: 1 });

    if (!freePlan) {
      return res.status(404).json({ success: false, message: 'Free plan not found' });
    }

    // Check if the user already has the free plan
    const existing = await Subscription.findOne({ user: req.user._id, status: 'active' }).populate('plan');
    if (existing && existing.plan && existing.plan._id.toString() === freePlan._id.toString()) {
      return res.json({ success: true, message: 'You are already on the Free plan', subscription: existing });
    }

    // Cancel the existing active subscription if any
    if (existing) {
      if (existing.stripeSubscriptionId && process.env.STRIPE_SECRET_KEY) {
        try {
          await stripe.subscriptions.cancel(existing.stripeSubscriptionId);
        } catch (err) {
          console.error('Error cancelling stripe subscription during downgrade:', err.message || err);
        }
      }

      existing.status = 'cancelled';
      existing.cancelledAt = new Date();
      existing.cancelReason = 'Downgrade to Free plan';
      existing.autoRenew = false;
      await existing.save();
    }

    // Create a new subscription for the free plan
    const endDate = new Date();
    if (freePlan.interval === 'month') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    const newSub = await Subscription.create({
      user: req.user._id,
      plan: freePlan._id,
      status: 'active',
      startDate: new Date(),
      endDate,
      autoRenew: false
    });

    // Update user.activeSubscription so header/features reflect the free plan
    await User.findByIdAndUpdate(req.user._id, { activeSubscription: newSub._id });

    res.json({ success: true, subscription: newSub });
  } catch (error) {
    next(error);
  }
};

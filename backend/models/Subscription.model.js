const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: String,
  price: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  interval: {
    type: String,
    enum: ['month', 'year'],
    default: 'month'
  },
  features: [{
    type: String
  }],
  maxCourses: {
    type: Number,
    default: -1 // -1 means unlimited
  },
  maxLiveSessions: {
    type: Number,
    default: -1
  },
  downloadMaterials: {
    type: Boolean,
    default: true
  },
  priority: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  stripeProductId: String,
  stripePriceId: String
}, {
  timestamps: true
});

const subscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  plan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubscriptionPlan',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'cancelled', 'expired', 'trialing', 'past_due'],
    default: 'active'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  autoRenew: {
    type: Boolean,
    default: true
  },
  stripeSubscriptionId: String,
  stripeCustomerId: String,
  cancelledAt: Date,
  cancelReason: String,
  trialEndsAt: Date,
  currentPeriodStart: Date,
  currentPeriodEnd: Date
}, {
  timestamps: true
});

// Index
subscriptionSchema.index({ user: 1, status: 1 });
subscriptionSchema.index({ endDate: 1 });

const SubscriptionPlan = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = { SubscriptionPlan, Subscription };

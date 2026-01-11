const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription'
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'bank_transfer', 'wallet'],
    default: 'card'
  },
  stripePaymentIntentId: String,
  stripeChargeId: String,
  invoiceUrl: String,
  receiptUrl: String,
  description: String,
  metadata: {
    type: Map,
    of: String
  },
  failureReason: String,
  refundedAmount: {
    type: Number,
    default: 0
  },
  refundedAt: Date,
  paidAt: Date
}, {
  timestamps: true
});

// Index
paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ status: 1 });

module.exports = mongoose.model('Payment', paymentSchema);

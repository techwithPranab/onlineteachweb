const mongoose = require('mongoose');

const featureUsageLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  feature: {
    type: String,
    required: true,
    trim: true
  },
  action: {
    type: String,
    enum: ['accessed', 'denied', 'limited', 'attempted'],
    required: true
  },
  subscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  }
}, {
  timestamps: false
});

// Indexes for efficient querying
featureUsageLogSchema.index({ user: 1, timestamp: -1 });
featureUsageLogSchema.index({ feature: 1, timestamp: -1 });
featureUsageLogSchema.index({ action: 1, timestamp: -1 });
featureUsageLogSchema.index({ subscription: 1 });

// TTL index - automatically delete logs older than 90 days
featureUsageLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 }); // 90 days

const FeatureUsageLog = mongoose.model('FeatureUsageLog', featureUsageLogSchema);

module.exports = FeatureUsageLog;

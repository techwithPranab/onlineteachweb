const mongoose = require('mongoose');

const featureDefinitionSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'courses',
      'live_sessions',
      'quiz',
      'interactive',
      'content',
      'support',
      'analytics',
      'communication'
    ]
  },
  type: {
    type: String,
    enum: ['boolean', 'numeric', 'enum'],
    default: 'boolean'
  },
  defaultValue: {
    type: mongoose.Schema.Types.Mixed,
    default: false
  },
  applicableRoles: [{
    type: String,
    enum: ['student', 'tutor', 'admin']
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  icon: {
    type: String,
    default: 'lock'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes
featureDefinitionSchema.index({ category: 1, displayOrder: 1 });
featureDefinitionSchema.index({ key: 1 });
featureDefinitionSchema.index({ isActive: 1 });

const FeatureDefinition = mongoose.model('FeatureDefinition', featureDefinitionSchema);

module.exports = FeatureDefinition;

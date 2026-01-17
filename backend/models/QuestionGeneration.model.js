const mongoose = require('mongoose');

const questionGenerationSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true
  },
  chapterName: {
    type: String,
    required: true,
    trim: true
  },
  topic: {
    type: String,
    required: true,
    trim: true
  },
  // AI Generation Details
  aiProvider: {
    type: String,
    enum: ['openai', 'anthropic', 'google', 'rule-based', 'other'],
    required: true
  },
  model: {
    type: String,
    required: true,
    trim: true // e.g., 'gpt-4', 'gpt-3.5-turbo', 'claude-3', etc.
  },
  prompt: {
    type: String,
    required: true,
    trim: true
  },
  finalPrompt: {
    type: String,
    trim: true
  },
  aiResponse: {
    type: String,
    required: false // Not required initially, will be added when AI responds
  },
  // Generation Parameters
  generationParams: {
    difficultyLevel: {
      type: String,
      enum: ['easy', 'medium', 'hard']
    },
    questionType: {
      type: String,
      enum: ['mcq-single', 'mcq-multiple', 'true-false', 'numerical', 'short-answer', 'long-answer', 'case-based']
    },
    count: {
      type: Number,
      min: 1
    },
    temperature: {
      type: Number,
      min: 0,
      max: 2
    },
    maxTokens: {
      type: Number
    }
  },
  // Generated Questions References
  generatedQuestions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  }],
  // Metadata
  status: {
    type: String,
    enum: ['pending', 'success', 'partial', 'failed'],
    default: 'pending'
  },
  errorMessage: {
    type: String,
    trim: true
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Allow system-generated questions without a specific user
  },
  tokensUsed: {
    prompt: { type: Number, default: 0 },
    completion: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  costEstimate: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
questionGenerationSchema.index({ courseId: 1, createdAt: -1 });
questionGenerationSchema.index({ generatedBy: 1, createdAt: -1 });
questionGenerationSchema.index({ chapterName: 1, topic: 1 });

module.exports = mongoose.model('QuestionGeneration', questionGenerationSchema);

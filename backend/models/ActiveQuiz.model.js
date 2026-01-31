const mongoose = require('mongoose');

const activeQuizSchema = new mongoose.Schema({
  // Unique identifier for the active quiz
  quizId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  // Session ID for tracking quiz attempts
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  // Student who created this active quiz
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Quiz metadata
  subject: {
    type: String,
    required: true,
    trim: true
  },

  courseName: {
    type: String,
    required: true,
    trim: true
  },

  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true
  },

  // Quiz configuration
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true
  },

  questionCount: {
    type: Number,
    required: true,
    min: 1,
    max: 100
  },

  duration: {
    type: Number, // in minutes
    required: true,
    min: 1,
    max: 300
  },

  // Quiz status
  status: {
    type: String,
    enum: ['active', 'in-progress', 'completed', 'abandoned'],
    default: 'active',
    index: true
  },

  // Selected questions for this quiz
  questions: [{
    id: {
      type: String,
      required: true
    },
    question: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['mcq-single', 'mcq-multiple', 'true-false', 'numerical', 'short-answer', 'long-answer', 'case-based'],
      default: 'mcq-single'
    },
    options: [{
      id: {
        type: String,
        required: true
      },
      text: {
        type: String,
        required: true
      }
    }],
    correctAnswer: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    expectedAnswer: {
      type: String
    },
    numericalAnswer: {
      type: Object
    },
    explanation: {
      type: String
    },
    topic: {
      type: String,
      required: true
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      required: true
    },
    marks: {
      type: Number,
      default: 1
    },
    timeLimit: {
      type: Number // in seconds, optional
    }
  }],

  // User answers with detailed tracking
  answers: [{
    questionId: {
      type: String,
      required: true
    },
    answer: {
      type: mongoose.Schema.Types.Mixed // Can be string, array, number, etc.
    },
    isCorrect: {
      type: Boolean
    },
    markedForReview: {
      type: Boolean,
      default: false
    },
    skipped: {
      type: Boolean,
      default: false
    },
    timeSpent: {
      type: Number, // Time spent on this question in seconds
      default: 0
    },
    attempts: {
      type: Number, // Number of times answer was changed
      default: 0
    },
    firstAnsweredAt: {
      type: Date
    },
    lastUpdatedAt: {
      type: Date
    },
    visitCount: {
      type: Number, // How many times user visited this question
      default: 0
    }
  }],

  // Quiz timing
  startedAt: {
    type: Date
  },

  completedAt: {
    type: Date
  },

  timeSpent: {
    type: Number // in seconds
  },

  // Performance tracking
  score: {
    type: Number,
    default: 0
  },

  totalMarks: {
    type: Number,
    default: 0
  },

  accuracy: {
    type: Number, // percentage
    min: 0,
    max: 100
  },

  // Algorithm metadata
  algorithmUsed: {
    type: String,
    default: 'algorithm'
  },

  performanceData: {
    type: mongoose.Schema.Types.Mixed, // Allow any structure for flexibility
    default: {}
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },

  lastUpdated: {
    type: Date,
    default: Date.now
  },

  // Soft delete
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
activeQuizSchema.index({ userId: 1, status: 1 });
activeQuizSchema.index({ userId: 1, createdAt: -1 });
activeQuizSchema.index({ status: 1, createdAt: -1 });
activeQuizSchema.index({ isDeleted: 1, createdAt: -1 });

// Virtual for time remaining (if in progress)
activeQuizSchema.virtual('timeRemaining').get(function() {
  if (this.status !== 'in-progress' || !this.startedAt) return null;

  const elapsed = Math.floor((Date.now() - this.startedAt) / 1000); // seconds
  const totalTime = this.duration * 60; // convert to seconds
  const remaining = totalTime - elapsed;

  return Math.max(0, remaining);
});

// Virtual for progress percentage
activeQuizSchema.virtual('progressPercentage').get(function() {
  if (!this.questions || this.questions.length === 0) return 0;

  const answeredCount = this.answers ? this.answers.filter(a => a.answer !== null && a.answer !== undefined && !a.skipped).length : 0;
  return Math.round((answeredCount / this.questions.length) * 100);
});

// Instance method to save individual answer
activeQuizSchema.methods.saveAnswer = function(questionId, answerData) {
  const { answer, markedForReview = false, timeSpent = 0 } = answerData;
  
  // Find existing answer
  const existingAnswerIndex = this.answers.findIndex(a => a.questionId === questionId);
  
  if (existingAnswerIndex >= 0) {
    // Update existing answer
    const existingAnswer = this.answers[existingAnswerIndex];
    existingAnswer.answer = answer;
    existingAnswer.markedForReview = markedForReview;
    existingAnswer.timeSpent = (existingAnswer.timeSpent || 0) + timeSpent;
    existingAnswer.attempts = (existingAnswer.attempts || 0) + 1;
    existingAnswer.lastUpdatedAt = new Date();
    existingAnswer.visitCount = (existingAnswer.visitCount || 0) + 1;
    
    if (!existingAnswer.firstAnsweredAt) {
      existingAnswer.firstAnsweredAt = new Date();
    }
    
    // Clear skipped status if answer is provided
    if (answer !== null && answer !== undefined) {
      existingAnswer.skipped = false;
    }
  } else {
    // Create new answer entry
    this.answers.push({
      questionId,
      answer,
      markedForReview,
      skipped: answer === null || answer === undefined,
      timeSpent,
      attempts: 1,
      firstAnsweredAt: new Date(),
      lastUpdatedAt: new Date(),
      visitCount: 1
    });
  }
  
  this.lastUpdated = new Date();
  return this.save();
};

// Instance method to mark question for review
activeQuizSchema.methods.toggleReviewMark = function(questionId) {
  const answer = this.answers.find(a => a.questionId === questionId);
  
  if (answer) {
    answer.markedForReview = !answer.markedForReview;
    answer.lastUpdatedAt = new Date();
  } else {
    // Create placeholder if doesn't exist
    this.answers.push({
      questionId,
      answer: null,
      markedForReview: true,
      skipped: false,
      timeSpent: 0,
      attempts: 0,
      visitCount: 1
    });
  }
  
  this.lastUpdated = new Date();
  return this.save();
};

// Instance method to skip question
activeQuizSchema.methods.skipQuestion = function(questionId, timeSpent = 0) {
  const answer = this.answers.find(a => a.questionId === questionId);
  
  if (answer) {
    answer.skipped = true;
    answer.timeSpent = (answer.timeSpent || 0) + timeSpent;
    answer.visitCount = (answer.visitCount || 0) + 1;
    answer.lastUpdatedAt = new Date();
  } else {
    this.answers.push({
      questionId,
      answer: null,
      markedForReview: false,
      skipped: true,
      timeSpent,
      attempts: 0,
      visitCount: 1
    });
  }
  
  this.lastUpdated = new Date();
  return this.save();
};

// Instance method to start quiz
activeQuizSchema.methods.startQuiz = function() {
  this.status = 'in-progress';
  this.startedAt = new Date();
  this.lastUpdated = new Date();
  return this.save();
};

// Instance method to complete quiz
activeQuizSchema.methods.completeQuiz = function(score, totalMarks, timeSpent) {
  this.status = 'completed';
  this.completedAt = new Date();
  this.score = score;
  this.totalMarks = totalMarks;
  this.timeSpent = timeSpent;
  this.accuracy = totalMarks > 0 ? (score / totalMarks) * 100 : 0;
  this.lastUpdated = new Date();
  return this.save();
};

// Instance method to abandon quiz
activeQuizSchema.methods.abandonQuiz = function() {
  this.status = 'abandoned';
  this.lastUpdated = new Date();
  return this.save();
};

// Static method to get active quizzes for a user
activeQuizSchema.statics.getActiveQuizzes = function(userId) {
  return this.find({
    userId,
    status: { $in: ['active', 'in-progress'] },
    isDeleted: false
  }).sort({ createdAt: -1 });
};

// Static method to get completed quizzes for a user
activeQuizSchema.statics.getCompletedQuizzes = function(userId, limit = 50) {
  return this.find({
    userId,
    status: 'completed',
    isDeleted: false
  })
  .sort({ completedAt: -1 })
  .limit(limit);
};

// Static method to check if user has quiz in progress
activeQuizSchema.statics.hasQuizInProgress = function(userId) {
  return this.findOne({
    userId,
    status: 'in-progress',
    isDeleted: false
  });
};

module.exports = mongoose.model('ActiveQuiz', activeQuizSchema);

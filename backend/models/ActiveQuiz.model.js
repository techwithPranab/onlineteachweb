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

  // Creator of this quiz (student/tutor/admin)
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Role of creator
  creatorRole: {
    type: String,
    enum: ['student', 'tutor', 'admin'],
    required: true
  },

  // Students to whom this quiz is distributed/available
  // For student-created: contains only their own userId
  // For tutor/admin-created: contains array of student userIds
  distributedStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  }],

  // Legacy field for backward compatibility (deprecated)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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

  // NOTE: Answers are NO LONGER stored in ActiveQuiz
  // All answers are now stored in QuizSession model
  // This field is removed to prevent data duplication

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
activeQuizSchema.index({ createdBy: 1, status: 1 });
activeQuizSchema.index({ createdBy: 1, createdAt: -1 });
activeQuizSchema.index({ distributedStudents: 1, status: 1 });
activeQuizSchema.index({ status: 1, createdAt: -1 });
activeQuizSchema.index({ isDeleted: 1, createdAt: -1 });

// Legacy indexes for backward compatibility
activeQuizSchema.index({ userId: 1, status: 1 });
activeQuizSchema.index({ userId: 1, createdAt: -1 });

// Virtual for progress percentage (now based on QuizSession)
activeQuizSchema.virtual('progressPercentage').get(function() {
  // This should be calculated from QuizSession, not from ActiveQuiz
  return 0;
});

// Instance method to start quiz (updates status only)
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

// Static method to get active quizzes for a student
// Now considers distributedStudents field
activeQuizSchema.statics.getActiveQuizzes = function(studentId) {
  return this.find({
    distributedStudents: studentId,
    status: { $in: ['active', 'in-progress'] },
    isDeleted: false
  }).sort({ createdAt: -1 });
};

// Legacy method for backward compatibility
activeQuizSchema.statics.getActiveQuizzesByUserId = function(userId) {
  return this.find({
    $or: [
      { distributedStudents: userId },
      { userId: userId } // Legacy field
    ],
    status: { $in: ['active', 'in-progress'] },
    isDeleted: false
  }).sort({ createdAt: -1 });
};

// Static method to get completed quizzes for a user
activeQuizSchema.statics.getCompletedQuizzes = function(studentId, limit = 50) {
  return this.find({
    $or: [
      { distributedStudents: studentId },
      { userId: studentId } // Legacy field
    ],
    status: 'completed',
    isDeleted: false
  })
  .sort({ completedAt: -1 })
  .limit(limit);
};

// Static method to check if user has quiz in progress
activeQuizSchema.statics.hasQuizInProgress = function(studentId) {
  return this.findOne({
    $or: [
      { distributedStudents: studentId },
      { userId: studentId } // Legacy field
    ],
    status: 'in-progress',
    isDeleted: false
  });
};

module.exports = mongoose.model('ActiveQuiz', activeQuizSchema);

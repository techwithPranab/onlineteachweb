const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Quiz title is required'],
    trim: true,
    minlength: 3,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true
  },
  difficultyLevel: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  duration: {
    type: Number, // in minutes
    required: true,
    min: 1,
    max: 300
  },
  totalMarks: {
    type: Number,
    required: true,
    min: 1
  },
  passingPercentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 40
  },
  attemptsAllowed: {
    type: Number,
    required: true,
    min: 1,
    max: 10,
    default: 1
  },
  // Dynamic question selection configuration
  questionConfig: {
    totalQuestions: {
      type: Number,
      required: true,
      min: 1,
      max: 100
    },
    // Topic weightage: { "LinearEquations": 40, "Polynomials": 60 }
    topicWeightage: {
      type: Map,
      of: Number,
      default: new Map()
    },
    // Question type distribution: { "mcq-single": 50, "numerical": 30, "short-answer": 20 }
    typeDistribution: {
      type: Map,
      of: Number,
      default: new Map()
    },
    // Difficulty distribution within the quiz difficulty level
    difficultyDistribution: {
      easy: { type: Number, default: 0 },
      medium: { type: Number, default: 0 },
      hard: { type: Number, default: 0 }
    }
  },
  settings: {
    shuffleQuestions: {
      type: Boolean,
      default: true
    },
    shuffleOptions: {
      type: Boolean,
      default: true
    },
    negativeMarking: {
      type: Boolean,
      default: false
    },
    showCorrectAnswers: {
      type: Boolean,
      default: true
    },
    showExplanations: {
      type: Boolean,
      default: true
    },
    allowReview: {
      type: Boolean,
      default: true
    },
    preventTabSwitch: {
      type: Boolean,
      default: false
    },
    // Resume settings
    allowResume: {
      type: Boolean,
      default: true
    },
    autoSaveInterval: {
      type: Number, // in seconds
      default: 30
    }
  },
  instructions: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ['draft', 'published', 'archived', 'scheduled'],
    default: 'draft'
  },
  // Scheduling
  scheduling: {
    isScheduled: {
      type: Boolean,
      default: false
    },
    startTime: {
      type: Date,
      default: null
    },
    endTime: {
      type: Date,
      default: null
    },
    visibleFrom: {
      type: Date,
      default: null
    },
    autoPublish: {
      type: Boolean,
      default: true
    },
    autoArchive: {
      type: Boolean,
      default: false
    }
  },
  // Algorithm version for tracking changes
  algorithmVersion: {
    type: String,
    default: 'v1.0'
  },
  // Statistics
  stats: {
    totalAttempts: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
    passRate: { type: Number, default: 0 },
    averageTimeSpent: { type: Number, default: 0 } // in minutes
  },
  publishedAt: Date,
  archivedAt: Date
}, {
  timestamps: true
});

// Indexes
quizSchema.index({ courseId: 1, status: 1 });
quizSchema.index({ createdBy: 1 });
quizSchema.index({ status: 1, difficultyLevel: 1 });

// Virtual for total topics
quizSchema.virtual('topicsCount').get(function() {
  return this.questionConfig.topicWeightage ? this.questionConfig.topicWeightage.size : 0;
});

// Method to check if quiz is available for attempt
quizSchema.methods.isAvailable = function() {
  const now = new Date();
  
  // Check basic status
  if (this.status !== 'published' && this.status !== 'scheduled') {
    return false;
  }
  
  // If scheduled, check time window
  if (this.scheduling?.isScheduled) {
    if (this.scheduling.startTime && now < this.scheduling.startTime) {
      return false;
    }
    if (this.scheduling.endTime && now > this.scheduling.endTime) {
      return false;
    }
  }
  
  return true;
};

// Method to check if quiz is visible to students
quizSchema.methods.isVisible = function() {
  const now = new Date();
  
  if (this.status === 'draft' || this.status === 'archived') {
    return false;
  }
  
  if (this.scheduling?.isScheduled && this.scheduling.visibleFrom) {
    return now >= this.scheduling.visibleFrom;
  }
  
  return this.status === 'published' || this.status === 'scheduled';
};

// Method to update stats
quizSchema.methods.updateStats = async function(score, timeSpent, passed) {
  const oldTotal = this.stats.totalAttempts;
  const newTotal = oldTotal + 1;
  
  // Running average calculation
  this.stats.averageScore = ((this.stats.averageScore * oldTotal) + score) / newTotal;
  this.stats.averageTimeSpent = ((this.stats.averageTimeSpent * oldTotal) + timeSpent) / newTotal;
  
  // Update pass rate
  const passCount = Math.round((this.stats.passRate / 100) * oldTotal) + (passed ? 1 : 0);
  this.stats.passRate = (passCount / newTotal) * 100;
  
  this.stats.totalAttempts = newTotal;
  
  await this.save();
};

// Static method to get available quizzes for a course
quizSchema.statics.getAvailableQuizzes = async function(courseId, studentId) {
  const QuizSession = require('./QuizSession.model');
  
  const quizzes = await this.find({
    courseId,
    status: 'published'
  }).populate('createdBy', 'name').lean();
  
  // Get attempt counts for each quiz
  const quizzesWithAttempts = await Promise.all(
    quizzes.map(async (quiz) => {
      const attemptCount = await QuizSession.countDocuments({
        quizId: quiz._id,
        studentId,
        status: { $in: ['completed', 'submitted'] }
      });
      
      return {
        ...quiz,
        attemptsTaken: attemptCount,
        attemptsRemaining: quiz.attemptsAllowed - attemptCount,
        canAttempt: attemptCount < quiz.attemptsAllowed
      };
    })
  );
  
  return quizzesWithAttempts;
};

module.exports = mongoose.model('Quiz', quizSchema);

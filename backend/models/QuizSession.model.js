const mongoose = require('mongoose');

// Schema for individual answers
const answerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  },
  questionSnapshot: {
    text: String,
    type: String,
    options: [{
      _id: mongoose.Schema.Types.ObjectId,
      text: String
    }],
    marks: Number,
    negativeMarks: Number
  },
  answer: {
    type: mongoose.Schema.Types.Mixed, // Can be string, array, number
    default: null
  },
  isCorrect: {
    type: Boolean,
    default: null
  },
  marksAwarded: {
    type: Number,
    default: 0
  },
  negativeMarksApplied: {
    type: Number,
    default: 0
  },
  timeSpent: {
    type: Number, // in seconds
    default: 0
  },
  // For manual evaluation
  manualFeedback: {
    type: String,
    trim: true
  },
  evaluatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  evaluatedAt: Date,
  // Flag to track if answer was visited
  isVisited: {
    type: Boolean,
    default: false
  },
  // Flag for marked for review
  isMarkedForReview: {
    type: Boolean,
    default: false
  }
}, { _id: true });

const quizSessionSchema = new mongoose.Schema({
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true,
    index: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true
  },
  attemptNumber: {
    type: Number,
    required: true,
    min: 1
  },
  // Snapshot of selected questions (persisted at start time)
  selectedQuestions: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true
    },
    originalOrder: Number,
    displayOrder: Number, // After shuffling
    // Snapshot of question data at time of quiz start
    snapshot: {
      text: String,
      type: String,
      caseStudy: String,
      options: [{
        _id: mongoose.Schema.Types.ObjectId,
        text: String,
        displayOrder: Number // After option shuffling
      }],
      marks: Number,
      negativeMarks: Number,
      topic: String,
      difficultyLevel: String
    }
  }],
  // Student answers
  answers: [answerSchema],
  // Current question index (for resume)
  currentQuestionIndex: {
    type: Number,
    default: 0
  },
  // Session timing
  startedAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  submittedAt: Date,
  expiresAt: {
    type: Date,
    required: true
  },
  // Total time allowed from quiz
  duration: {
    type: Number, // in minutes
    required: true
  },
  timeSpent: {
    type: Number, // in seconds
    default: 0
  },
  lastActiveAt: {
    type: Date,
    default: Date.now
  },
  // Session status
  status: {
    type: String,
    enum: ['in-progress', 'submitted', 'auto-submitted', 'expired', 'evaluating', 'completed'],
    default: 'in-progress'
  },
  // Scores
  autoScore: {
    type: Number,
    default: 0
  },
  manualScore: {
    type: Number,
    default: 0
  },
  totalScore: {
    type: Number,
    default: 0
  },
  totalMarks: {
    type: Number,
    required: true
  },
  percentage: {
    type: Number,
    default: 0
  },
  passed: {
    type: Boolean,
    default: false
  },
  passingPercentage: {
    type: Number,
    required: true
  },
  // Questions requiring manual evaluation
  pendingManualEvaluation: {
    type: Boolean,
    default: false
  },
  questionsForManualEvaluation: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  }],
  // Algorithm version used for question selection
  algorithmVersion: {
    type: String,
    required: true
  },
  // Selection criteria used
  selectionCriteria: {
    type: mongoose.Schema.Types.Mixed
  },
  // Tab switch/focus loss tracking
  tabSwitchCount: {
    type: Number,
    default: 0
  },
  focusLostEvents: [{
    timestamp: Date,
    duration: Number // in seconds
  }]
}, {
  timestamps: true
});

// Indexes
quizSessionSchema.index({ quizId: 1, studentId: 1 });
quizSessionSchema.index({ studentId: 1, status: 1 });
quizSessionSchema.index({ status: 1, expiresAt: 1 });

// Virtual for remaining time
quizSessionSchema.virtual('remainingTime').get(function() {
  if (this.status !== 'in-progress') return 0;
  const now = new Date();
  const remaining = Math.max(0, (this.expiresAt - now) / 1000); // in seconds
  return Math.floor(remaining);
});

// Method to check if session is expired
quizSessionSchema.methods.isExpired = function() {
  return new Date() > this.expiresAt;
};

// Method to save answer
quizSessionSchema.methods.saveAnswer = async function(questionId, answer, timeSpent) {
  const answerIndex = this.answers.findIndex(
    a => a.questionId.toString() === questionId.toString()
  );
  
  if (answerIndex >= 0) {
    this.answers[answerIndex].answer = answer;
    this.answers[answerIndex].timeSpent = (this.answers[answerIndex].timeSpent || 0) + timeSpent;
    this.answers[answerIndex].isVisited = true;
  } else {
    const question = this.selectedQuestions.find(
      q => q.questionId.toString() === questionId.toString()
    );
    
    if (question) {
      this.answers.push({
        questionId,
        questionSnapshot: question.snapshot,
        answer,
        timeSpent,
        isVisited: true
      });
    }
  }
  
  this.lastActiveAt = new Date();
  await this.save();
};

// Method to mark question for review
quizSessionSchema.methods.markForReview = async function(questionId, marked) {
  const answerIndex = this.answers.findIndex(
    a => a.questionId.toString() === questionId.toString()
  );
  
  if (answerIndex >= 0) {
    this.answers[answerIndex].isMarkedForReview = marked;
  }
  
  await this.save();
};

// Method to calculate auto score
quizSessionSchema.methods.calculateAutoScore = async function() {
  const Question = require('./Question.model');
  let autoScore = 0;
  let pendingManual = false;
  const manualEvalQuestions = [];
  
  for (const answer of this.answers) {
    const question = await Question.findById(answer.questionId);
    if (!question) continue;
    
    const isCorrect = question.validateAnswer(answer.answer);
    
    if (isCorrect === null) {
      // Requires manual evaluation
      pendingManual = true;
      manualEvalQuestions.push(answer.questionId);
      answer.isCorrect = null;
    } else if (isCorrect) {
      answer.isCorrect = true;
      answer.marksAwarded = question.marks;
      autoScore += question.marks;
      
      // Update question stats
      question.correctAttempts += 1;
      question.totalAttempts += 1;
      await question.save();
    } else {
      answer.isCorrect = false;
      answer.marksAwarded = 0;
      
      // Apply negative marking if enabled
      const quiz = await require('./Quiz.model').findById(this.quizId);
      if (quiz.settings.negativeMarking && question.negativeMarks > 0) {
        answer.negativeMarksApplied = question.negativeMarks;
        autoScore -= question.negativeMarks;
      }
      
      // Update question stats
      question.totalAttempts += 1;
      await question.save();
    }
  }
  
  this.autoScore = Math.max(0, autoScore);
  this.pendingManualEvaluation = pendingManual;
  this.questionsForManualEvaluation = manualEvalQuestions;
  
  if (!pendingManual) {
    this.totalScore = this.autoScore;
    this.percentage = (this.totalScore / this.totalMarks) * 100;
    this.passed = this.percentage >= this.passingPercentage;
    this.status = 'completed';
  } else {
    this.status = 'evaluating';
  }
  
  await this.save();
  return this;
};

// Static method to get active session
quizSessionSchema.statics.getActiveSession = async function(quizId, studentId) {
  return this.findOne({
    quizId,
    studentId,
    status: 'in-progress',
    expiresAt: { $gt: new Date() }
  });
};

// Static method to get attempt count
quizSessionSchema.statics.getAttemptCount = async function(quizId, studentId) {
  return this.countDocuments({
    quizId,
    studentId,
    status: { $in: ['completed', 'submitted', 'auto-submitted', 'evaluating'] }
  });
};

module.exports = mongoose.model('QuizSession', quizSessionSchema);

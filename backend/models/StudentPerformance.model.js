const mongoose = require('mongoose');

/**
 * Student Performance Model
 * 
 * Purpose: Track student's learning performance across topics, subjects, and quizzes
 * 
 * Features:
 * - Topic-wise mastery tracking
 * - Subject-wise performance metrics
 * - Time-based performance trends
 * - Weak area identification
 * - Adaptive learning recommendations
 */

const topicMasterySchema = new mongoose.Schema({
  topic: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  attempts: {
    type: Number,
    default: 0
  },
  successRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  totalTime: {
    type: Number,
    default: 0 // in seconds
  },
  avgTimeSpent: {
    type: Number,
    default: 0 // average time per question in seconds
  },
  lastAttempt: {
    type: Date
  },
  questionsAttempted: {
    type: Number,
    default: 0
  },
  questionsCorrect: {
    type: Number,
    default: 0
  },
  difficultyBreakdown: {
    easy: {
      attempted: { type: Number, default: 0 },
      correct: { type: Number, default: 0 }
    },
    medium: {
      attempted: { type: Number, default: 0 },
      correct: { type: Number, default: 0 }
    },
    hard: {
      attempted: { type: Number, default: 0 },
      correct: { type: Number, default: 0 }
    },
    olympiad: {
      attempted: { type: Number, default: 0 },
      correct: { type: Number, default: 0 }
    }
  }
}, { _id: false });

const subjectPerformanceSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: true
  },
  totalQuizzes: {
    type: Number,
    default: 0
  },
  totalQuestions: {
    type: Number,
    default: 0
  },
  correctAnswers: {
    type: Number,
    default: 0
  },
  averageScore: {
    type: Number,
    default: 0
  },
  averageAccuracy: {
    type: Number,
    default: 0
  },
  totalTimeSpent: {
    type: Number,
    default: 0 // in seconds
  },
  // Track correctly answered question IDs per subject for exclusion in future quizzes
  correctlyAnsweredQuestionIds: {
    type: [mongoose.Schema.Types.ObjectId],
    default: [],
    ref: 'Question'
  },
  lastActivity: {
    type: Date
  }
}, { _id: false });

const studentPerformanceSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  // Overall statistics
  totalQuizzesTaken: {
    type: Number,
    default: 0
  },
  totalQuestionsAttempted: {
    type: Number,
    default: 0
  },
  totalCorrectAnswers: {
    type: Number,
    default: 0
  },
  overallAccuracy: {
    type: Number,
    default: 0
  },
  averageScore: {
    type: Number,
    default: 0
  },
  totalTimeSpent: {
    type: Number,
    default: 0 // in seconds
  },
  
  // Topic mastery tracking
  topicMastery: {
    type: Map,
    of: topicMasterySchema,
    default: new Map()
  },
  
  // Subject performance
  subjectPerformance: {
    type: Map,
    of: subjectPerformanceSchema,
    default: new Map()
  },
  
  // Weak areas (topics with success rate < 50%)
  weakAreas: [{
    topic: String,
    subject: String,
    successRate: Number,
    lastAttempt: Date
  }],
  
  // Strong areas (topics with success rate > 80%)
  strongAreas: [{
    topic: String,
    subject: String,
    successRate: Number,
    lastAttempt: Date
  }],
  
  // Learning trends (last 30 days)
  trends: {
    accuracyTrend: {
      type: String,
      enum: ['improving', 'declining', 'stable'],
      default: 'stable'
    },
    activityLevel: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'low'
    },
    lastUpdated: Date
  },
  
  // Recommendations
  recommendations: [{
    type: {
      type: String,
      enum: ['topic_focus', 'difficulty_adjustment', 'time_management', 'practice_more']
    },
    message: String,
    priority: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium'
    },
    createdAt: Date
  }],
  
  // Last quiz information
  lastQuizInfo: {
    quizId: mongoose.Schema.Types.ObjectId,
    subject: String,
    score: Number,
    accuracy: Number,
    completedAt: Date
  },

  // ── XP & Gamification ─────────────────────────────────────────────────────
  totalXP: {
    type: Number,
    default: 0,
    min: 0
  },

  // ── Streak Tracking ────────────────────────────────────────────────────────
  currentStreak: {
    type: Number,
    default: 0,
    min: 0
  },
  longestStreak: {
    type: Number,
    default: 0,
    min: 0
  },
  lastActivityDate: {
    type: Date,
    default: null
  },
  // Last 90 days of activity (one Date per day, deduped)
  activityDates: [{
    type: Date
  }]
}, {
  timestamps: true
});

// Indexes
// Note: studentId already has unique index from schema definition above
studentPerformanceSchema.index({ 'lastQuizInfo.completedAt': -1 });

// Methods

/**
 * Update topic mastery after quiz completion
 */
studentPerformanceSchema.methods.updateTopicMastery = function(topicPerformanceArray) {
  topicPerformanceArray.forEach(update => {
    const key = `${update.subject}_${update.topic}`;
    const current = this.topicMastery.get(key) || {
      topic: update.topic,
      subject: update.subject,
      attempts: 0,
      successRate: 0,
      totalTime: 0,
      questionsAttempted: 0,
      questionsCorrect: 0,
      difficultyBreakdown: {
        easy: { attempted: 0, correct: 0 },
        medium: { attempted: 0, correct: 0 },
        hard: { attempted: 0, correct: 0 }
      }
    };
    
    // Update with exponential moving average for success rate (70% old, 30% new)
    const newSuccessRate = (current.successRate * 0.7) + ((update.successRate || update.accuracy || 0) * 0.3);
    
    this.topicMastery.set(key, {
      topic: update.topic,
      subject: update.subject,
      attempts: current.attempts + 1,
      successRate: newSuccessRate,
      totalTime: current.totalTime + (update.totalTime || 0),
      avgTimeSpent: (current.totalTime + (update.avgTimePerQuestion || 0)) / (current.attempts + 1),
      lastAttempt: new Date(),
      questionsAttempted: current.questionsAttempted + (update.questionsAttempted || update.total || 0),
      questionsCorrect: current.questionsCorrect + (update.questionsCorrect || update.correct || 0),
      difficultyBreakdown: current.difficultyBreakdown
    });
  });
  
  // Update weak and strong areas
  this.updateWeakAndStrongAreas();
};

/**
 * Update difficulty performance
 */
studentPerformanceSchema.methods.updateDifficultyPerformance = function(difficultyData) {
  // This method can be used to track overall difficulty performance trends
  // For now, we'll store it in the trends or recommendations
  // Could be expanded to track difficulty mastery over time
  
  Object.entries(difficultyData).forEach(([difficulty, perf]) => {
    const successRate = (perf.correct / perf.attempted) * 100;
    
    // Add recommendations based on difficulty performance
    if (successRate < 50) {
      this.recommendations.push({
        type: 'difficulty_adjustment',
        message: `Consider practicing more ${difficulty} level questions`,
        priority: 'medium',
        createdAt: new Date()
      });
    }
  });
};

/**
 * Update subject performance
 */
studentPerformanceSchema.methods.updateSubjectPerformance = function(subject, quizData) {
  const current = this.subjectPerformance.get(subject) || {
    subject,
    totalQuizzes: 0,
    totalQuestions: 0,
    correctAnswers: 0,
    averageScore: 0,
    averageAccuracy: 0,
    totalTimeSpent: 0
  };
  
  const newTotalQuizzes = current.totalQuizzes + 1;
  const newTotalQuestions = current.totalQuestions + (quizData.totalQuestions || 0);
  const newCorrectAnswers = current.correctAnswers + (quizData.correctAnswers || 0);
  
  this.subjectPerformance.set(subject, {
    subject,
    totalQuizzes: newTotalQuizzes,
    totalQuestions: newTotalQuestions,
    correctAnswers: newCorrectAnswers,
    averageScore: ((current.averageScore * current.totalQuizzes) + quizData.score) / newTotalQuizzes,
    averageAccuracy: (newCorrectAnswers / newTotalQuestions) * 100,
    totalTimeSpent: current.totalTimeSpent + (quizData.timeSpent || 0),
    lastActivity: new Date()
  });
};

/**
 * Update weak and strong areas based on topic mastery
 */
studentPerformanceSchema.methods.updateWeakAndStrongAreas = function() {
  const weak = [];
  const strong = [];
  
  for (const [key, data] of this.topicMastery) {
    if (data.attempts >= 2) { // Only consider topics with at least 2 attempts
      if (data.successRate < 50) {
        weak.push({
          topic: data.topic,
          subject: data.subject,
          successRate: data.successRate,
          lastAttempt: data.lastAttempt
        });
      } else if (data.successRate > 80) {
        strong.push({
          topic: data.topic,
          subject: data.subject,
          successRate: data.successRate,
          lastAttempt: data.lastAttempt
        });
      }
    }
  }
  
  this.weakAreas = weak.sort((a, b) => a.successRate - b.successRate).slice(0, 10);
  this.strongAreas = strong.sort((a, b) => b.successRate - a.successRate).slice(0, 10);
};

/**
 * Generate recommendations based on performance
 */
studentPerformanceSchema.methods.generateRecommendations = function() {
  const recommendations = [];
  
  // Weak topic recommendations
  if (this.weakAreas.length > 0) {
    const topWeakAreas = this.weakAreas.slice(0, 3);
    recommendations.push({
      type: 'topic_focus',
      message: `Focus on improving: ${topWeakAreas.map(w => w.topic).join(', ')}`,
      priority: 'high',
      createdAt: new Date()
    });
  }
  
  // Low activity recommendation
  const daysSinceLastQuiz = this.lastQuizInfo?.completedAt 
    ? Math.floor((Date.now() - this.lastQuizInfo.completedAt.getTime()) / (1000 * 60 * 60 * 24))
    : 999;
  
  if (daysSinceLastQuiz > 7) {
    recommendations.push({
      type: 'practice_more',
      message: 'Take a quiz to keep your learning momentum going!',
      priority: 'medium',
      createdAt: new Date()
    });
  }
  
  // Overall accuracy recommendation
  if (this.overallAccuracy < 60 && this.totalQuizzesTaken >= 3) {
    recommendations.push({
      type: 'difficulty_adjustment',
      message: 'Consider starting with easier questions to build confidence',
      priority: 'high',
      createdAt: new Date()
    });
  }
  
  this.recommendations = recommendations.slice(0, 5); // Keep top 5
};

/**
 * Update overall statistics
 */
studentPerformanceSchema.methods.updateOverallStats = function() {
  let totalQuestions = 0;
  let totalCorrect = 0;
  let totalTime = 0;
  
  for (const [subject, data] of this.subjectPerformance) {
    totalQuestions += data.totalQuestions;
    totalCorrect += data.correctAnswers;
    totalTime += data.totalTimeSpent;
  }
  
  this.totalQuestionsAttempted = totalQuestions;
  this.totalCorrectAnswers = totalCorrect;
  this.overallAccuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
  this.totalTimeSpent = totalTime;
};

// Static methods

/**
 * Get or create student performance record
 */
studentPerformanceSchema.statics.getOrCreate = async function(studentId) {
  let performance = await this.findOne({ studentId });
  
  if (!performance) {
    performance = await this.create({ studentId });
  }
  
  return performance;
};

/**
 * Update performance after quiz completion
 */
studentPerformanceSchema.statics.updateAfterQuiz = async function(studentId, quizResults) {
  const performance = await this.getOrCreate(studentId);
  
  // Update quiz count
  performance.totalQuizzesTaken += 1;
  
  // Update subject performance
  if (quizResults.subject) {
    performance.updateSubjectPerformance(quizResults.subject, {
      totalQuestions: quizResults.totalQuestions || 0,
      correctAnswers: quizResults.correctAnswers || 0,
      score: quizResults.score || 0,
      timeSpent: quizResults.timeSpent || 0
    });
  }
  
  // Update topic mastery
  if (quizResults.topicPerformance && Array.isArray(quizResults.topicPerformance)) {
    performance.updateTopicMastery(quizResults.topicPerformance);
  }
  
  // Update difficulty performance
  if (quizResults.difficultyPerformance) {
    performance.updateDifficultyPerformance(quizResults.difficultyPerformance);
  }
  
  // Update overall stats
  performance.updateOverallStats();
  
  // Update last quiz info
  performance.lastQuizInfo = {
    quizId: quizResults.quizId,
    subject: quizResults.subject,
    score: quizResults.score || 0,
    accuracy: quizResults.accuracy || 0,
    completedAt: new Date()
  };
  
  // Generate recommendations
  performance.generateRecommendations();
  
  await performance.save();
  
  return performance;
};

const StudentPerformance = mongoose.model('StudentPerformance', studentPerformanceSchema);

module.exports = StudentPerformance;

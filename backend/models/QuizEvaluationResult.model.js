const mongoose = require('mongoose');

const topicAnalysisSchema = new mongoose.Schema({
  topic: {
    type: String,
    required: true
  },
  totalQuestions: {
    type: Number,
    default: 0
  },
  correctAnswers: {
    type: Number,
    default: 0
  },
  wrongAnswers: {
    type: Number,
    default: 0
  },
  unattempted: {
    type: Number,
    default: 0
  },
  accuracy: {
    type: Number,
    default: 0
  },
  marksObtained: {
    type: Number,
    default: 0
  },
  totalMarks: {
    type: Number,
    default: 0
  },
  timeSpent: {
    type: Number, // in seconds
    default: 0
  },
  averageTimePerQuestion: {
    type: Number,
    default: 0
  },
  difficulty: {
    easy: {
      correct: { type: Number, default: 0 },
      total: { type: Number, default: 0 }
    },
    medium: {
      correct: { type: Number, default: 0 },
      total: { type: Number, default: 0 }
    },
    hard: {
      correct: { type: Number, default: 0 },
      total: { type: Number, default: 0 }
    }
  },
  isWeakArea: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const improvementSuggestionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['topic-revision', 'practice-more', 'time-management', 'difficulty-adjustment', 'concept-clarity', 'material-recommendation'],
    required: true
  },
  priority: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  },
  topic: String,
  message: {
    type: String,
    required: true
  },
  actionItems: [{
    type: String
  }],
  recommendedMaterials: [{
    materialId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Material'
    },
    title: String,
    type: String
  }],
  recommendedQuizLevel: {
    type: String,
    enum: ['easy', 'medium', 'hard']
  }
}, { _id: false });

const quizEvaluationResultSchema = new mongoose.Schema({
  quizSessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QuizSession',
    required: true,
    unique: true
  },
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
  // Scores
  autoScore: {
    type: Number,
    default: 0
  },
  manualScore: {
    type: Number,
    default: 0
  },
  finalScore: {
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
  passFail: {
    type: String,
    enum: ['pass', 'fail'],
    required: true
  },
  grade: {
    type: String,
    enum: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F']
  },
  // Detailed analysis
  overallAnalysis: {
    totalQuestions: { type: Number, default: 0 },
    attempted: { type: Number, default: 0 },
    correct: { type: Number, default: 0 },
    wrong: { type: Number, default: 0 },
    unattempted: { type: Number, default: 0 },
    accuracy: { type: Number, default: 0 },
    totalTimeSpent: { type: Number, default: 0 }, // in seconds
    averageTimePerQuestion: { type: Number, default: 0 }
  },
  // Topic-wise analysis
  topicAnalysis: [topicAnalysisSchema],
  // Difficulty-wise analysis
  difficultyAnalysis: {
    easy: {
      total: { type: Number, default: 0 },
      correct: { type: Number, default: 0 },
      accuracy: { type: Number, default: 0 }
    },
    medium: {
      total: { type: Number, default: 0 },
      correct: { type: Number, default: 0 },
      accuracy: { type: Number, default: 0 }
    },
    hard: {
      total: { type: Number, default: 0 },
      correct: { type: Number, default: 0 },
      accuracy: { type: Number, default: 0 }
    }
  },
  // Question type analysis
  questionTypeAnalysis: {
    type: Map,
    of: {
      total: { type: Number, default: 0 },
      correct: { type: Number, default: 0 },
      accuracy: { type: Number, default: 0 }
    }
  },
  // Time management analysis
  timeAnalysis: {
    totalTimeAllowed: { type: Number, default: 0 }, // in seconds
    totalTimeUsed: { type: Number, default: 0 },
    timeUtilization: { type: Number, default: 0 }, // percentage
    averageTimePerQuestion: { type: Number, default: 0 },
    fastestQuestion: {
      questionId: mongoose.Schema.Types.ObjectId,
      time: Number
    },
    slowestQuestion: {
      questionId: mongoose.Schema.Types.ObjectId,
      time: Number
    },
    timeManagementRating: {
      type: String,
      enum: ['excellent', 'good', 'average', 'poor'],
      default: 'average'
    }
  },
  // Weak areas
  weakAreas: [{
    topic: String,
    accuracy: Number,
    recommendation: String
  }],
  // Strong areas
  strongAreas: [{
    topic: String,
    accuracy: Number
  }],
  // Improvement suggestions
  improvementSuggestions: [improvementSuggestionSchema],
  // Comparison with previous attempts
  comparison: {
    previousAttempts: { type: Number, default: 0 },
    scoreImprovement: { type: Number, default: 0 },
    accuracyImprovement: { type: Number, default: 0 },
    trend: {
      type: String,
      enum: ['improving', 'declining', 'stable', 'first-attempt'],
      default: 'first-attempt'
    }
  },
  // Class/Course comparison (percentile)
  classComparison: {
    rank: Number,
    totalStudents: Number,
    percentile: Number,
    averageClassScore: Number
  },
  // Manual evaluation details
  manualEvaluations: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question'
    },
    evaluatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    marksAwarded: Number,
    feedback: String,
    evaluatedAt: Date
  }],
  evaluatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  evaluatedAt: Date,
  // Published status
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedAt: Date
}, {
  timestamps: true
});

// Indexes
quizEvaluationResultSchema.index({ studentId: 1, createdAt: -1 });
quizEvaluationResultSchema.index({ quizId: 1, studentId: 1 });
quizEvaluationResultSchema.index({ courseId: 1, isPublished: 1 });

// Method to calculate grade
quizEvaluationResultSchema.methods.calculateGrade = function() {
  const percentage = this.percentage;
  
  if (percentage >= 95) return 'A+';
  if (percentage >= 85) return 'A';
  if (percentage >= 75) return 'B+';
  if (percentage >= 65) return 'B';
  if (percentage >= 55) return 'C+';
  if (percentage >= 45) return 'C';
  if (percentage >= 35) return 'D';
  return 'F';
};

// Static method to generate evaluation result
quizEvaluationResultSchema.statics.generateFromSession = async function(quizSession) {
  const Quiz = require('./Quiz.model');
  const Question = require('./Question.model');
  
  const quiz = await Quiz.findById(quizSession.quizId);
  if (!quiz) throw new Error('Quiz not found');
  
  // Initialize analysis objects
  const topicMap = new Map();
  const difficultyAnalysis = {
    easy: { total: 0, correct: 0, accuracy: 0 },
    medium: { total: 0, correct: 0, accuracy: 0 },
    hard: { total: 0, correct: 0, accuracy: 0 }
  };
  const questionTypeAnalysis = new Map();
  
  let totalQuestions = quizSession.selectedQuestions.length;
  let attempted = 0;
  let correct = 0;
  let wrong = 0;
  let totalTimeSpent = 0;
  
  // Analyze each answer
  for (const answer of quizSession.answers) {
    const questionData = quizSession.selectedQuestions.find(
      q => q.questionId.toString() === answer.questionId.toString()
    );
    
    if (!questionData) continue;
    
    const { topic, difficultyLevel, type, marks } = questionData.snapshot;
    
    // Topic analysis
    if (!topicMap.has(topic)) {
      topicMap.set(topic, {
        topic,
        totalQuestions: 0,
        correctAnswers: 0,
        wrongAnswers: 0,
        unattempted: 0,
        marksObtained: 0,
        totalMarks: 0,
        timeSpent: 0,
        difficulty: {
          easy: { correct: 0, total: 0 },
          medium: { correct: 0, total: 0 },
          hard: { correct: 0, total: 0 }
        }
      });
    }
    
    const topicData = topicMap.get(topic);
    topicData.totalQuestions += 1;
    topicData.totalMarks += marks;
    topicData.timeSpent += answer.timeSpent || 0;
    
    if (difficultyLevel) {
      topicData.difficulty[difficultyLevel].total += 1;
      difficultyAnalysis[difficultyLevel].total += 1;
    }
    
    // Question type analysis
    if (!questionTypeAnalysis.has(type)) {
      questionTypeAnalysis.set(type, { total: 0, correct: 0, accuracy: 0 });
    }
    questionTypeAnalysis.get(type).total += 1;
    
    // Count answer status
    if (answer.answer !== null && answer.answer !== undefined) {
      attempted += 1;
      
      if (answer.isCorrect === true) {
        correct += 1;
        topicData.correctAnswers += 1;
        topicData.marksObtained += answer.marksAwarded;
        
        if (difficultyLevel) {
          topicData.difficulty[difficultyLevel].correct += 1;
          difficultyAnalysis[difficultyLevel].correct += 1;
        }
        
        questionTypeAnalysis.get(type).correct += 1;
      } else if (answer.isCorrect === false) {
        wrong += 1;
        topicData.wrongAnswers += 1;
      }
      // null means pending manual evaluation
    } else {
      topicData.unattempted += 1;
    }
    
    totalTimeSpent += answer.timeSpent || 0;
  }
  
  // Calculate unattempted
  const unattempted = totalQuestions - attempted;
  
  // Calculate accuracies
  const overallAccuracy = attempted > 0 ? (correct / attempted) * 100 : 0;
  
  // Process topic analysis
  const topicAnalysis = [];
  const weakAreas = [];
  const strongAreas = [];
  
  for (const [topic, data] of topicMap) {
    data.accuracy = data.totalQuestions > 0 
      ? (data.correctAnswers / data.totalQuestions) * 100 
      : 0;
    data.averageTimePerQuestion = data.totalQuestions > 0 
      ? data.timeSpent / data.totalQuestions 
      : 0;
    data.isWeakArea = data.accuracy < 50;
    
    topicAnalysis.push(data);
    
    if (data.accuracy < 50 && data.totalQuestions >= 2) {
      weakAreas.push({
        topic: data.topic,
        accuracy: data.accuracy,
        recommendation: `Focus on revising ${data.topic}. Practice more questions.`
      });
    } else if (data.accuracy >= 80) {
      strongAreas.push({
        topic: data.topic,
        accuracy: data.accuracy
      });
    }
  }
  
  // Calculate difficulty accuracies
  for (const level of ['easy', 'medium', 'hard']) {
    difficultyAnalysis[level].accuracy = difficultyAnalysis[level].total > 0
      ? (difficultyAnalysis[level].correct / difficultyAnalysis[level].total) * 100
      : 0;
  }
  
  // Calculate question type accuracies
  for (const [type, data] of questionTypeAnalysis) {
    data.accuracy = data.total > 0 ? (data.correct / data.total) * 100 : 0;
  }
  
  // Time analysis
  const totalTimeAllowed = quiz.duration * 60; // convert to seconds
  const timeUtilization = (totalTimeSpent / totalTimeAllowed) * 100;
  
  let timeManagementRating = 'average';
  if (timeUtilization >= 80 && timeUtilization <= 100 && overallAccuracy >= 70) {
    timeManagementRating = 'excellent';
  } else if (timeUtilization >= 60 && timeUtilization <= 100 && overallAccuracy >= 50) {
    timeManagementRating = 'good';
  } else if (timeUtilization < 50 || timeUtilization > 100) {
    timeManagementRating = 'poor';
  }
  
  // Generate improvement suggestions
  const improvementSuggestions = [];
  
  // Weak area suggestions
  for (const weak of weakAreas) {
    improvementSuggestions.push({
      type: 'topic-revision',
      priority: weak.accuracy < 30 ? 'high' : 'medium',
      topic: weak.topic,
      message: `Your accuracy in ${weak.topic} is ${weak.accuracy.toFixed(1)}%. This topic needs more attention.`,
      actionItems: [
        `Review the fundamentals of ${weak.topic}`,
        'Practice more questions on this topic',
        'Watch related video materials'
      ],
      recommendedQuizLevel: 'easy'
    });
  }
  
  // Time management suggestions
  if (timeManagementRating === 'poor') {
    improvementSuggestions.push({
      type: 'time-management',
      priority: 'high',
      message: 'Your time management needs improvement.',
      actionItems: [
        'Practice with timed quizzes',
        'Allocate time per question before starting',
        'Don\'t spend too much time on difficult questions'
      ]
    });
  }
  
  // Difficulty adjustment suggestions
  if (difficultyAnalysis.easy.accuracy < 70) {
    improvementSuggestions.push({
      type: 'difficulty-adjustment',
      priority: 'high',
      message: 'Focus on mastering easier concepts before moving to harder ones.',
      actionItems: [
        'Start with easy level quizzes',
        'Build strong foundation in basics'
      ],
      recommendedQuizLevel: 'easy'
    });
  } else if (difficultyAnalysis.medium.accuracy >= 80 && difficultyAnalysis.hard.accuracy < 50) {
    improvementSuggestions.push({
      type: 'difficulty-adjustment',
      priority: 'medium',
      message: 'You\'re ready to challenge yourself with harder questions.',
      actionItems: [
        'Attempt more hard level questions',
        'Focus on advanced concepts'
      ],
      recommendedQuizLevel: 'hard'
    });
  }
  
  // Get previous attempts for comparison
  const QuizSession = require('./QuizSession.model');
  const previousSessions = await QuizSession.find({
    quizId: quizSession.quizId,
    studentId: quizSession.studentId,
    _id: { $ne: quizSession._id },
    status: 'completed'
  }).sort({ createdAt: -1 }).limit(5);
  
  let trend = 'first-attempt';
  let scoreImprovement = 0;
  let accuracyImprovement = 0;
  
  if (previousSessions.length > 0) {
    const lastSession = previousSessions[0];
    scoreImprovement = quizSession.totalScore - lastSession.totalScore;
    
    // Calculate accuracy from previous
    const lastAccuracy = (lastSession.totalScore / lastSession.totalMarks) * 100;
    accuracyImprovement = quizSession.percentage - lastAccuracy;
    
    if (scoreImprovement > 0) {
      trend = 'improving';
    } else if (scoreImprovement < 0) {
      trend = 'declining';
    } else {
      trend = 'stable';
    }
  }
  
  // Create evaluation result
  const evaluationResult = new this({
    quizSessionId: quizSession._id,
    quizId: quizSession.quizId,
    studentId: quizSession.studentId,
    courseId: quizSession.courseId,
    autoScore: quizSession.autoScore,
    manualScore: quizSession.manualScore,
    finalScore: quizSession.totalScore,
    totalMarks: quizSession.totalMarks,
    percentage: quizSession.percentage,
    passFail: quizSession.passed ? 'pass' : 'fail',
    overallAnalysis: {
      totalQuestions,
      attempted,
      correct,
      wrong,
      unattempted,
      accuracy: overallAccuracy,
      totalTimeSpent,
      averageTimePerQuestion: totalQuestions > 0 ? totalTimeSpent / totalQuestions : 0
    },
    topicAnalysis,
    difficultyAnalysis,
    questionTypeAnalysis,
    timeAnalysis: {
      totalTimeAllowed,
      totalTimeUsed: totalTimeSpent,
      timeUtilization,
      averageTimePerQuestion: totalQuestions > 0 ? totalTimeSpent / totalQuestions : 0,
      timeManagementRating
    },
    weakAreas,
    strongAreas,
    improvementSuggestions,
    comparison: {
      previousAttempts: previousSessions.length,
      scoreImprovement,
      accuracyImprovement,
      trend
    }
  });
  
  evaluationResult.grade = evaluationResult.calculateGrade();
  
  return evaluationResult.save();
};

module.exports = mongoose.model('QuizEvaluationResult', quizEvaluationResultSchema);

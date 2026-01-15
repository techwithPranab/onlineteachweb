const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true
  },
  isCorrect: {
    type: Boolean,
    default: false
  },
  explanation: {
    type: String,
    trim: true
  }
}, { _id: true });

const questionSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true
  },
  topic: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  difficultyLevel: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['mcq-single', 'mcq-multiple', 'true-false', 'numerical', 'short-answer', 'long-answer', 'case-based'],
    required: true
  },
  text: {
    type: String,
    required: true,
    trim: true
  },
  // For case-based questions
  caseStudy: {
    type: String,
    trim: true
  },
  // For MCQ and True/False questions
  options: [optionSchema],
  // For numerical questions
  numericalAnswer: {
    value: {
      type: Number
    },
    tolerance: {
      type: Number,
      default: 0
    },
    unit: {
      type: String,
      trim: true
    }
  },
  // For short/long answer questions
  expectedAnswer: {
    type: String,
    trim: true
  },
  // Keywords for auto-evaluation of short answers
  keywords: [{
    type: String,
    trim: true
  }],
  // Explanation shown after answer
  explanation: {
    type: String,
    trim: true
  },
  marks: {
    type: Number,
    required: true,
    min: 0,
    default: 1
  },
  negativeMarks: {
    type: Number,
    min: 0,
    default: 0
  },
  // Time in seconds recommended for this question
  recommendedTime: {
    type: Number,
    min: 0
  },
  // Metadata
  tags: [{
    type: String,
    trim: true
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  usageCount: {
    type: Number,
    default: 0
  },
  correctAttempts: {
    type: Number,
    default: 0
  },
  totalAttempts: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Compound indexes for efficient querying
questionSchema.index({ courseId: 1, difficultyLevel: 1, topic: 1 });
questionSchema.index({ courseId: 1, isActive: 1 });
questionSchema.index({ courseId: 1, type: 1 });

// Virtual for success rate
questionSchema.virtual('successRate').get(function() {
  if (this.totalAttempts === 0) return 0;
  return (this.correctAttempts / this.totalAttempts) * 100;
});

// Method to validate answer
questionSchema.methods.validateAnswer = function(answer) {
  switch (this.type) {
    case 'mcq-single':
      const correctOption = this.options.find(opt => opt.isCorrect);
      return correctOption && correctOption._id.toString() === answer;
    
    case 'mcq-multiple':
      const correctOptions = this.options.filter(opt => opt.isCorrect).map(opt => opt._id.toString());
      const answerArray = Array.isArray(answer) ? answer : [answer];
      return correctOptions.length === answerArray.length && 
             correctOptions.every(opt => answerArray.includes(opt));
    
    case 'true-false':
      const tfCorrect = this.options.find(opt => opt.isCorrect);
      return tfCorrect && tfCorrect.text.toLowerCase() === answer.toLowerCase();
    
    case 'numerical':
      const numAnswer = parseFloat(answer);
      const { value, tolerance } = this.numericalAnswer;
      return !isNaN(numAnswer) && Math.abs(numAnswer - value) <= tolerance;
    
    case 'short-answer':
    case 'long-answer':
    case 'case-based':
      // These require manual evaluation
      return null;
    
    default:
      return null;
  }
};

// Static method to get questions for quiz
questionSchema.statics.getQuestionsForQuiz = async function(criteria) {
  const { courseId, difficultyLevel, topics, excludeQuestionIds, limit } = criteria;
  
  const query = {
    courseId,
    isActive: true
  };
  
  if (difficultyLevel) {
    query.difficultyLevel = difficultyLevel;
  }
  
  if (topics && topics.length > 0) {
    query.topic = { $in: topics };
  }
  
  if (excludeQuestionIds && excludeQuestionIds.length > 0) {
    query._id = { $nin: excludeQuestionIds };
  }
  
  return this.find(query)
    .limit(limit || 20)
    .select('-correctAnswer -expectedAnswer -keywords')
    .lean();
};

module.exports = mongoose.model('Question', questionSchema);

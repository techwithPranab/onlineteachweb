const mongoose = require('mongoose');

/**
 * AI Question Draft Model
 * Stores AI-generated questions pending human review
 * 
 * The questionPayload field contains the complete question structure that matches
 * the Question model. It includes all necessary fields for creating a final Question
 * document when the draft is approved.
 * 
 * Required questionPayload structure by question type:
 * 
 * ALL TYPES require:
 * - chapterId: ObjectId (chapter reference)
 * - chapterName: String
 * - topic: String
 * - difficultyLevel: 'easy'|'medium'|'hard'
 * - type: question type enum
 * - text: String (question text)
 * - correctAnswer: String (normalized answer)
 * - explanation: String
 * - marks: Number (default: 1)
 * - negativeMarks: Number (default: 0)
 * - recommendedTime: Number (seconds)
 * - tags: String[] (optional)
 * - _metadata: Object (AI generation info)
 * 
 * MCQ TYPES (mcq-single, mcq-multiple, true-false):
 * - options: Array<{text: String, isCorrect: Boolean, explanation: String}>
 * 
 * NUMERICAL:
 * - numericalAnswer: {value: Number, tolerance: Number, unit: String}
 * 
 * TEXT-BASED (short-answer, long-answer, case-based):
 * - expectedAnswer: String (model answer)
 * - keywords: String[] (for auto-evaluation)
 * - caseStudy: String (for case-based questions)
 */
const aiQuestionDraftSchema = new mongoose.Schema({
  // Complete question payload containing all question data including courseId, topic, difficultyLevel, type
  // Required fields in questionPayload:
  // - courseId: ObjectId (reference to course)
  // - courseTitle: String (course title)
  // - chapterId: ObjectId (reference to chapter)
  // - chapterName: String (chapter name)
  // - grade: String (grade level)
  // - subject: String (subject name)
  // - topic: String (topic name)
  // - difficultyLevel: String (easy|medium|hard)
  // - type: String (mcq-single|mcq-multiple|true-false|numerical|short-answer|long-answer|case-based)
  // - text: String (question text)
  // - correctAnswer: String (normalized correct answer)
  // - explanation: String (explanation of correct answer)
  // - marks: Number (default: 1)
  // - negativeMarks: Number (default: 0)
  // - recommendedTime: Number (time in seconds)
  // - tags: Array<String> (optional tags)
  // - _metadata: Object (AI generation metadata)
  //
  // Type-specific fields:
  // For MCQ questions (mcq-single, mcq-multiple, true-false):
  // - options: Array<{text: String, isCorrect: Boolean, explanation: String}>
  //
  // For numerical questions:
  // - numericalAnswer: {value: Number, tolerance: Number, unit: String}
  //
  // For text-based questions (short-answer, long-answer, case-based):
  // - expectedAnswer: String (model answer)
  // - keywords: Array<String> (keywords for auto-evaluation)
  // - caseStudy: String (for case-based questions)
  questionPayload: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
    validate: {
      validator: function(payload) {
        // Basic validation for required fields
        const requiredFields = ['courseId', 'courseTitle', 'chapterName', 'grade', 'subject', 'topic', 'difficultyLevel', 'type', 'text', 'correctAnswer', 'marks'];
        const missingFields = requiredFields.filter(field => !payload[field]);
        
        if (missingFields.length > 0) {
          this.invalidate('questionPayload', `Missing required fields: ${missingFields.join(', ')}`);
          return false;
        }
        
        // Validate difficulty level
        const validDifficulties = ['easy', 'medium', 'hard', 'olympiad'];
        if (!validDifficulties.includes(payload.difficultyLevel)) {
          this.invalidate('questionPayload', `Invalid difficulty level: ${payload.difficultyLevel}`);
          return false;
        }
        
        // Validate question type
        const validTypes = ['mcq-single', 'mcq-multiple', 'true-false', 'numerical', 'short-answer', 'long-answer', 'case-based'];
        if (!validTypes.includes(payload.type)) {
          this.invalidate('questionPayload', `Invalid question type: ${payload.type}`);
          return false;
        }
        
        // Type-specific validation
        switch (payload.type) {
          case 'mcq-single':
          case 'mcq-multiple':
          case 'true-false':
            if (!payload.options || !Array.isArray(payload.options) || payload.options.length < 2) {
              this.invalidate('questionPayload', 'MCQ questions must have at least 2 options');
              return false;
            }
            const correctOptions = payload.options.filter(opt => opt.isCorrect);
            if (payload.type === 'mcq-single' && correctOptions.length !== 1) {
              this.invalidate('questionPayload', 'MCQ-single questions must have exactly 1 correct option');
              return false;
            }
            if (payload.type === 'mcq-multiple' && correctOptions.length < 1) {
              this.invalidate('questionPayload', 'MCQ-multiple questions must have at least 1 correct option');
              return false;
            }
            break;
            
          case 'numerical':
            if (!payload.numericalAnswer || typeof payload.numericalAnswer.value !== 'number') {
              this.invalidate('questionPayload', 'Numerical questions must have a numericalAnswer with value');
              return false;
            }
            break;
            
          case 'short-answer':
          case 'long-answer':
            if (!payload.expectedAnswer && (!payload.keywords || payload.keywords.length === 0)) {
              this.invalidate('questionPayload', 'Text-based questions must have expectedAnswer or keywords');
              return false;
            }
            break;

          case 'case-based':
            if (!payload.caseStudy) {
              this.invalidate('questionPayload', 'Case-based questions must have a caseStudy');
              return false;
            }
            // Accept correctAnswer, expectedAnswer, or keywords as valid answer
            if (!payload.correctAnswer && !payload.expectedAnswer && (!payload.keywords || payload.keywords.length === 0)) {
              this.invalidate('questionPayload', 'Case-based questions must have correctAnswer, expectedAnswer, or keywords');
              return false;
            }
            break;
        }
        
        return true;
      },
      message: 'Invalid question payload structure'
    }
  },
  // Source of content used for generation
  sourceType: {
    type: String,
    enum: ['syllabus', 'material', 'external', 'ai_generated', 'mixed'],
    default: 'ai_generated'
  },
  // Source material references
  sourceMaterials: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Material'
  }],
  // AI model information
  modelUsed: {
    type: String,
    required: true
  },
  promptVersion: {
    type: String,
    default: '1.0.0'
  },
  // Quality metrics
  confidenceScore: {
    type: Number,
    min: 0,
    max: 1,
    default: 0.5
  },
  qualityScores: {
    clarity: { type: Number, min: 1, max: 5 },
    accuracy: { type: Number, min: 1, max: 5 },
    difficultyMatch: { type: Number, min: 1, max: 5 },
    completeness: { type: Number, min: 1, max: 5 },
    pedagogy: { type: Number, min: 1, max: 5 }
  },
  // Validation flags
  validationFlags: [{
    type: String,
    trim: true
  }],
  // Review workflow
  status: {
    type: String,
    enum: ['draft', 'approved', 'rejected', 'needs_edit'],
    default: 'draft',
    index: true
  },
  // Generation job tracking
  jobId: {
    type: String,
    index: true
  },
  // User who initiated generation
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Approval tracking
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  // Reference to final question if approved
  finalQuestionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  },
  // Rejection tracking
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectedAt: {
    type: Date
  },
  rejectionReason: {
    type: String,
    trim: true
  },
  // Edit history
  editHistory: [{
    editedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    editedAt: {
      type: Date,
      default: Date.now
    },
    previousPayload: {
      type: mongoose.Schema.Types.Mixed
    },
    changeDescription: {
      type: String
    }
  }],
  // Metadata from AI generation
  generationMetadata: {
    temperature: Number,
    tokensUsed: Number,
    generationTime: Number, // in ms
    retryCount: Number
  }
}, {
  timestamps: true
});

// Pre-save middleware to validate question payload
aiQuestionDraftSchema.pre('save', function(next) {
  if (this.isModified('questionPayload') || this.isNew) {
    const validation = this.validateQuestionPayload();
    if (!validation.isValid) {
      const error = new Error('Question payload validation failed: ' + validation.errors.join(', '));
      error.name = 'ValidationError';
      return next(error);
    }
  }
  next();
});

// Indexes
aiQuestionDraftSchema.index({ status: 1 });
aiQuestionDraftSchema.index({ createdAt: -1 });
aiQuestionDraftSchema.index({ jobId: 1 });
aiQuestionDraftSchema.index({ 'questionPayload.courseId': 1, status: 1 });
aiQuestionDraftSchema.index({ 'questionPayload.grade': 1, 'questionPayload.subject': 1 });
aiQuestionDraftSchema.index({ 'questionPayload.difficultyLevel': 1 });
aiQuestionDraftSchema.index({ 'questionPayload.type': 1 });

// Virtual for approval rate calculation (static method)
aiQuestionDraftSchema.statics.getApprovalRate = async function(courseId = null) {
  const match = courseId ? { 'questionPayload.courseId': new mongoose.Types.ObjectId(courseId) } : {};
  
  const result = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        approved: {
          $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
        },
        rejected: {
          $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] }
        }
      }
    }
  ]);
  
  if (result.length === 0) return { approvalRate: 0, total: 0 };
  
  const { total, approved, rejected } = result[0];
  const reviewed = approved + rejected;
  
  return {
    total,
    approved,
    rejected,
    pending: total - reviewed,
    approvalRate: reviewed > 0 ? (approved / reviewed) * 100 : 0
  };
};

// Method to validate question payload
aiQuestionDraftSchema.methods.validateQuestionPayload = function() {
  const payload = this.questionPayload;
  const errors = [];
  
  // Required fields validation
  const requiredFields = ['courseId', 'chapterName', 'grade', 'subject', 'topic', 'difficultyLevel', 'type', 'text', 'correctAnswer', 'marks'];
  requiredFields.forEach(field => {
    if (!payload[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  });
  
  // Difficulty level validation
  const validDifficulties = ['easy', 'medium', 'hard', 'olympiad'];
  if (payload.difficultyLevel && !validDifficulties.includes(payload.difficultyLevel)) {
    errors.push(`Invalid difficulty level: ${payload.difficultyLevel}. Must be one of: ${validDifficulties.join(', ')}`);
  }
  
  // Question type validation
  const validTypes = ['mcq-single', 'mcq-multiple', 'true-false', 'numerical', 'short-answer', 'long-answer', 'case-based'];
  if (payload.type && !validTypes.includes(payload.type)) {
    errors.push(`Invalid question type: ${payload.type}. Must be one of: ${validTypes.join(', ')}`);
  }
  
  // Type-specific validation
  if (payload.type) {
    switch (payload.type) {
      case 'mcq-single':
      case 'mcq-multiple':
      case 'true-false':
        if (!payload.options || !Array.isArray(payload.options)) {
          errors.push('MCQ questions must have an options array');
        } else if (payload.options.length < 2) {
          errors.push('MCQ questions must have at least 2 options');
        } else {
          const correctOptions = payload.options.filter(opt => opt.isCorrect);
          if (payload.type === 'mcq-single' && correctOptions.length !== 1) {
            errors.push('MCQ-single questions must have exactly 1 correct option');
          }
          if (payload.type === 'mcq-multiple' && correctOptions.length < 1) {
            errors.push('MCQ-multiple questions must have at least 1 correct option');
          }
        }
        break;
        
      case 'numerical':
        if (!payload.numericalAnswer || typeof payload.numericalAnswer.value !== 'number') {
          errors.push('Numerical questions must have a numericalAnswer object with a numeric value');
        }
        break;
        
      case 'short-answer':
      case 'long-answer':
        if (!payload.expectedAnswer && (!payload.keywords || !Array.isArray(payload.keywords) || payload.keywords.length === 0)) {
          errors.push('Text-based questions must have either expectedAnswer or keywords array');
        }
        break;

      case 'case-based':
        if (!payload.caseStudy) {
          errors.push('Case-based questions must have a caseStudy');
        }
        // Accept correctAnswer, expectedAnswer, or keywords as valid answer
        if (!payload.correctAnswer && !payload.expectedAnswer && (!payload.keywords || !Array.isArray(payload.keywords) || payload.keywords.length === 0)) {
          errors.push('Case-based questions must have correctAnswer, expectedAnswer, or keywords array');
        }
        break;
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Method to approve draft
aiQuestionDraftSchema.methods.approve = function(approvedBy, finalQuestionId = null) {
  this.status = 'approved';
  this.approvedBy = approvedBy;
  this.approvedAt = new Date();
  this.finalQuestionId = finalQuestionId;
  return this.save();
};

// Method to reject draft
aiQuestionDraftSchema.methods.reject = function(rejectedBy, reason) {
  this.status = 'rejected';
  this.rejectedBy = rejectedBy;
  this.rejectedAt = new Date();
  this.rejectionReason = reason;
  return this.save();
};

// Method to mark as needing edits
aiQuestionDraftSchema.methods.needsEdit = function(editedBy, changeDescription, previousPayload = null) {
  this.status = 'needs_edit';
  this.editHistory.push({
    editedBy,
    previousPayload: previousPayload || this.questionPayload,
    changeDescription
  });
  return this.save();
};

// Static method to get drafts by job
aiQuestionDraftSchema.statics.getByJob = function(jobId) {
  return this.find({ jobId })
    .populate({
      path: 'questionPayload.courseId',
      select: 'title subject grade'
    })
    .sort({ createdAt: 1 })
    .lean();
};

// Static method to get pending drafts for a course
aiQuestionDraftSchema.statics.getPendingForCourse = function(courseId, limit = 50) {
  return this.find({ 
    'questionPayload.courseId': courseId, 
    status: 'draft' 
  })
    .sort({ confidenceScore: -1, createdAt: 1 })
    .limit(limit)
    .lean();
};

// Method to get question summary
aiQuestionDraftSchema.methods.getQuestionSummary = function() {
  const payload = this.questionPayload;
  return {
    id: this._id,
    type: payload.type,
    difficultyLevel: payload.difficultyLevel,
    topic: payload.topic,
    grade: payload.grade,
    subject: payload.subject,
    text: payload.text?.substring(0, 100) + (payload.text?.length > 100 ? '...' : ''),
    hasOptions: payload.options ? payload.options.length : 0,
    status: this.status,
    confidenceScore: this.confidenceScore
  };
};

module.exports = mongoose.model('AIQuestionDraft', aiQuestionDraftSchema);

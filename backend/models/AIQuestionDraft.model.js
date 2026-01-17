const mongoose = require('mongoose');

/**
 * AI Question Draft Model
 * Stores AI-generated questions pending human review
 */
const aiQuestionDraftSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true
  },
  chapterName: {
    type: String,
    required: true,
    trim: true,
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
  // Complete question payload matching Question model structure
  questionPayload: {
    type: mongoose.Schema.Types.Mixed,
    required: true
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

// Indexes
aiQuestionDraftSchema.index({ courseId: 1, status: 1 });
aiQuestionDraftSchema.index({ createdAt: -1 });
aiQuestionDraftSchema.index({ jobId: 1 });
aiQuestionDraftSchema.index({ modelUsed: 1, status: 1 });

// Virtual for approval rate calculation (static method)
aiQuestionDraftSchema.statics.getApprovalRate = async function(courseId = null) {
  const match = courseId ? { courseId: new mongoose.Types.ObjectId(courseId) } : {};
  
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

// Method to record edit
aiQuestionDraftSchema.methods.recordEdit = async function(userId, newPayload, description) {
  this.editHistory.push({
    editedBy: userId,
    editedAt: new Date(),
    previousPayload: this.questionPayload,
    changeDescription: description
  });
  
  this.questionPayload = newPayload;
  this.status = 'draft'; // Reset to draft after edit
  
  return this.save();
};

// Static method to get drafts by job
aiQuestionDraftSchema.statics.getByJob = function(jobId) {
  return this.find({ jobId })
    .populate('courseId', 'title subject grade')
    .sort({ createdAt: 1 })
    .lean();
};

// Static method to get pending drafts for a course
aiQuestionDraftSchema.statics.getPendingForCourse = function(courseId, limit = 50) {
  return this.find({ courseId, status: 'draft' })
    .sort({ confidenceScore: -1, createdAt: 1 })
    .limit(limit)
    .lean();
};

module.exports = mongoose.model('AIQuestionDraft', aiQuestionDraftSchema);

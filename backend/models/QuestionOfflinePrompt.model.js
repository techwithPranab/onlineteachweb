const mongoose = require('mongoose');

/**
 * Question Offline Prompt Model
 * Stores prompts for offline question generation with JSON file output
 */
const questionOfflinePromptSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true
  },
  chapterId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false,
    index: true
  },
  courseName: {
    type: String,
    required: true,
    trim: true
  },
  grade: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  subject: {
    type: String,
    required: true,
    trim: true,
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
    enum: ['easy', 'medium', 'hard', 'olympiad'],
    required: true,
    index: true
  },
  questionType: {
    type: String,
    enum: ['mcq-single', 'mcq-multiple', 'true-false', 'numerical', 'short-answer', 'long-answer', 'case-based'],
    required: true
  },
  questionsCount: {
    type: Number,
    required: true,
    min: 1,
    max: 50,
    default: 5
  },
  // Generated prompt text
  promptText: {
    type: String,
    required: true
  },
  // JSON file information
  fileName: {
    type: String,
    required: false,
    unique: true
  },
  filePath: {
    type: String,
    required: false
  },
  // Output structure matching AIQuestionDraft format
  outputStructure: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  // Status tracking
  status: {
    type: String,
    enum: ['generated', 'downloaded', 'archived'],
    default: 'generated',
    index: true
  },
  // Metadata
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  generatedAt: {
    type: Date,
    default: Date.now
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  lastDownloadedAt: {
    type: Date
  },
  // Additional options used during generation
  generationOptions: {
    sources: [String],
    includeExplanations: { type: Boolean, default: true },
    includeHints: { type: Boolean, default: false }
  },
  // Notes or description
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
questionOfflinePromptSchema.index({ grade: 1, subject: 1 });
questionOfflinePromptSchema.index({ courseId: 1, chapterName: 1 });
questionOfflinePromptSchema.index({ generatedBy: 1, createdAt: -1 });
questionOfflinePromptSchema.index({ status: 1, createdAt: -1 });

// Virtual for formatted file name
questionOfflinePromptSchema.virtual('displayFileName').get(function() {
  return this.fileName.replace('.json', '');
});

// Method to increment download count
questionOfflinePromptSchema.methods.recordDownload = function() {
  this.downloadCount += 1;
  this.lastDownloadedAt = new Date();
  this.status = 'downloaded';
  return this.save();
};

// Static method to get prompts with pagination and filters
questionOfflinePromptSchema.statics.getPaginatedPrompts = async function(filters, page = 1, limit = 20) {
  const query = {};
  
  if (filters.courseId) query.courseId = filters.courseId;
  if (filters.grade) query.grade = filters.grade;
  if (filters.subject) query.subject = filters.subject;
  if (filters.chapterName) query.chapterName = filters.chapterName;
  if (filters.topic) query.topic = { $regex: filters.topic, $options: 'i' };
  if (filters.difficultyLevel) query.difficultyLevel = filters.difficultyLevel;
  if (filters.status) query.status = filters.status;
  if (filters.generatedBy) query.generatedBy = filters.generatedBy;

  const skip = (page - 1) * limit;

  const [prompts, total] = await Promise.all([
    this.find(query)
      .populate('courseId', 'title grade subject')
      .populate('generatedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    this.countDocuments(query)
  ]);

  return {
    prompts,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: limit
    }
  };
};

// Pre-save hook to ensure file name uniqueness
questionOfflinePromptSchema.pre('save', function(next) {
  if (this.isNew && !this.fileName) {
    const timestamp = Date.now();
    const sanitizedTopic = this.topic.replace(/[^a-zA-Z0-9]/g, '-');
    this.fileName = `${this.grade}${this.subject}-${this.chapterName}-${sanitizedTopic}-${timestamp}.json`;
  }
  next();
});

const QuestionOfflinePrompt = mongoose.model('QuestionOfflinePrompt', questionOfflinePromptSchema);

module.exports = QuestionOfflinePrompt;

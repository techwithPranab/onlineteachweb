const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  tutor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  exercisePatterns: [require('./ExercisePattern.schema')],
  title: {
    type: String,
    required: [true, 'Material title is required'],
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    maxlength: 1000
  },
  type: {
    type: String,
    enum: ['pdf', 'video', 'ppt', 'document', 'image', 'link', 'article'],
    required: true
  },
  // File URL (if uploaded) - optional for text/article materials
  fileUrl: {
    type: String
  },
  fileName: String,
  fileSize: Number, // in bytes
  mimeType: String,
  // Rich text content (markdown/html) for articles or inline materials
  content: {
    type: String,
    default: ''
  },
  // Preview content shown to non-enrolled users
  previewContent: {
    type: String,
    default: ''
  },
  // The format in which the content is stored - used by the renderer
  contentFormat: {
    type: String,
    enum: ['markdown', 'html', 'plaintext'],
    default: 'markdown'
  },
  // Original textbook scans used to create this material. These references are
  // retained so generated content remains auditable and can be regenerated.
  sourceFiles: [{
    fileUrl: String,
    cloudinaryPublicId: String,
    fileName: String,
    fileSize: Number,
    mimeType: String,
    pageOrder: Number
  }],
  sourceProvenance: {
    kind: { type: String, enum: ['manual', 'scan-ocr'], default: 'manual' },
    model: String,
    extractedAt: Date,
    contentHash: String
  },
  // Difficulty level for progression
  difficulty: {
    type: String,
    enum: ['basic', 'intermediate', 'advanced'],
    default: 'basic'
  },
  // Material category for organization
  category: {
    type: String,
    enum: ['lesson', 'worked-example', 'worksheet', 'practice-quiz', 'reference', 'interactive'],
    default: 'lesson'
  },
  isFree: {
    type: Boolean,
    default: false
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  viewCount: {
    type: Number,
    default: 0
  },
  order: {
    type: Number,
    default: 0
  },
  tags: [String],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index
materialSchema.index({ course: 1, order: 1 });
materialSchema.index({ tutor: 1 });

module.exports = mongoose.model('Material', materialSchema);

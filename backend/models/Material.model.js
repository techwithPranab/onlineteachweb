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
    enum: ['pdf', 'video', 'ppt', 'document', 'image', 'link'],
    required: true
  },
  fileUrl: {
    type: String,
    required: [true, 'File URL is required']
  },
  fileName: String,
  fileSize: Number, // in bytes
  mimeType: String,
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

const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Course title is required'],
    trim: true,
    minlength: 3,
    maxlength: 200
  },
  description: {
    type: String,
    required: [true, 'Course description is required'],
    minlength: 10,
    maxlength: 2000
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true // This will be the admin who created the course
  },
  grade: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  board: [{
    type: String,
    enum: ['CBSE', 'ICSE', 'State Board', 'Other'],
    default: ['CBSE']
  }],
  thumbnail: {
    type: String,
    default: ''
  },
  syllabus: [{
    type: String,
    trim: true
  }],
  chapters: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    topics: [{
      type: String,
      trim: true
    }],
    learningObjectives: [{
      type: String,
      trim: true
    }],
    estimatedHours: {
      type: Number,
      default: 0
    }
  }],
  topics: [{
    type: String,
    trim: true
  }],
  duration: {
    type: String, // Changed to string for flexibility like "12 months", "6 weeks"
    default: ''
  },
  estimatedHours: {
    type: Number,
    default: 0
  },
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  difficulty: {
    type: Number, // 1-5 scale
    min: 1,
    max: 5,
    default: 1
  },
  language: {
    type: String,
    default: 'English'
  },
  prerequisites: [{
    type: String,
    trim: true
  }],
  learningOutcomes: [{
    type: String,
    trim: true
  }],
  certificate: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  enrollmentCount: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  totalRatings: {
    type: Number,
    default: 0
  },
  reviews: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  maxStudents: {
    type: Number,
    default: 50
  },
  tags: [String],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for search
courseSchema.index({ title: 'text', description: 'text', subject: 'text' });
courseSchema.index({ grade: 1, subject: 1 });
courseSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Course', courseSchema);

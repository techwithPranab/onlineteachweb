const mongoose = require('mongoose');

const evaluationSchema = new mongoose.Schema({
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tutor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  grade: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  feedback: {
    type: String,
    required: true,
    maxlength: 2000
  },
  achievements: [{
    type: String,
    trim: true
  }],
  areasOfImprovement: [{
    type: String,
    trim: true
  }],
  attendanceScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 100
  },
  participationScore: {
    type: Number,
    min: 0,
    max: 100
  },
  assignmentScore: {
    type: Number,
    min: 0,
    max: 100
  },
  overallScore: {
    type: Number,
    min: 0,
    max: 100
  },
  recommendations: [{
    type: String,
    trim: true
  }],
  nextSteps: [{
    type: String,
    trim: true
  }],
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedAt: Date
}, {
  timestamps: true
});

// Calculate overall score before saving
evaluationSchema.pre('save', function(next) {
  if (this.participationScore && this.assignmentScore && this.attendanceScore) {
    this.overallScore = Math.round(
      (this.grade * 0.4) + 
      (this.participationScore * 0.2) + 
      (this.assignmentScore * 0.2) + 
      (this.attendanceScore * 0.2)
    );
  }
  next();
});

// Index
evaluationSchema.index({ student: 1, createdAt: -1 });
evaluationSchema.index({ session: 1 });
evaluationSchema.index({ tutor: 1 });

module.exports = mongoose.model('Evaluation', evaluationSchema);

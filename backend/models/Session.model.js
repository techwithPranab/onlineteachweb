const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
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
    required: [true, 'Session title is required'],
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    maxlength: 1000
  },
  scheduledAt: {
    type: Date,
    required: [true, 'Scheduled time is required']
  },
  duration: {
    type: Number, // in minutes
    required: true,
    min: 15,
    max: 480
  },
  status: {
    type: String,
    enum: ['pending_approval', 'scheduled', 'ongoing', 'completed', 'cancelled', 'rejected'],
    default: 'pending_approval'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  rejectionReason: {
    type: String,
    maxlength: 500
  },
  isPaid: {
    type: Boolean,
    default: true
  },
  maxStudents: {
    type: Number,
    default: 30,
    min: 1,
    max: 100
  },
  attendees: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: Date,
    leftAt: Date,
    attended: {
      type: Boolean,
      default: false
    }
  }],
  roomId: {
    type: String,
    unique: true,
    sparse: true
  },
  recordingUrl: {
    type: String
  },
  startedAt: Date,
  endedAt: Date,
  actualDuration: Number, // in minutes
  materials: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Material'
  }],
  chatLog: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    message: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  whiteboardData: {
    type: String // JSON string of whiteboard state
  },
  notes: {
    type: String,
    maxlength: 5000
  }
}, {
  timestamps: true
});

// Index
sessionSchema.index({ scheduledAt: 1, status: 1 });
sessionSchema.index({ tutor: 1, scheduledAt: 1 });
sessionSchema.index({ course: 1 });

module.exports = mongoose.model('Session', sessionSchema);

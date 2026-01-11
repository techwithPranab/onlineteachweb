const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'excused'],
    default: 'absent'
  },
  joinedAt: Date,
  leftAt: Date,
  duration: Number, // in minutes
  participationScore: {
    type: Number,
    min: 0,
    max: 100
  },
  notes: String
}, {
  timestamps: true
});

// Index
attendanceSchema.index({ student: 1, session: 1 }, { unique: true });
attendanceSchema.index({ session: 1 });
attendanceSchema.index({ student: 1, createdAt: -1 });

module.exports = mongoose.model('Attendance', attendanceSchema);

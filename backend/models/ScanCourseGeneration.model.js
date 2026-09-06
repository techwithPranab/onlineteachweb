const mongoose = require('mongoose');

const scanCourseGenerationSchema = new mongoose.Schema({
  status: { type: String, enum: ['pending', 'processing', 'success', 'failed'], default: 'pending', index: true },
  request: {
    grade: Number,
    subject: String,
    board: String,
    title: String,
    files: [{ fileName: String, fileUrl: String, mimeType: String, fileSize: Number, order: Number }]
  },
  exchanges: [{
    stage: String,
    requestPayload: mongoose.Schema.Types.Mixed,
    responsePayload: mongoose.Schema.Types.Mixed,
    responseId: String,
    model: String,
    usage: mongoose.Schema.Types.Mixed,
    createdAt: { type: Date, default: Date.now }
  }],
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  materials: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Material' }],
  error: { message: String, stack: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  completedAt: Date,
  durationMs: Number
}, { timestamps: true });

scanCourseGenerationSchema.index({ createdAt: -1 });
module.exports = mongoose.model('ScanCourseGeneration', scanCourseGenerationSchema);

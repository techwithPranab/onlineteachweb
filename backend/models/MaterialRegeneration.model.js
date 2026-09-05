const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  material: { type: mongoose.Schema.Types.ObjectId, ref: 'Material', required: true, index: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  status: { type: String, enum: ['processing', 'success', 'failed'], default: 'processing' },
  request: mongoose.Schema.Types.Mixed,
  response: mongoose.Schema.Types.Mixed,
  responseId: String,
  model: String,
  usage: mongoose.Schema.Types.Mixed,
  previousContentHash: String,
  generatedContentHash: String,
  error: { message: String, stack: String },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  completedAt: Date,
  durationMs: Number
}, { timestamps: true });

schema.index({ createdAt: -1 });
module.exports = mongoose.model('MaterialRegeneration', schema);

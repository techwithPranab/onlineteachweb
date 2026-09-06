const mongoose = require('mongoose');

module.exports = new mongoose.Schema({
  sourceFileIndex: { type: Number, min: 0 },
  sourceFileName: String,
  sourcePages: [Number],
  chapterName: String,
  topics: [String],
  label: String,
  questionType: { type: String, enum: ['mcq-single', 'mcq-multiple', 'true-false', 'numerical', 'short-answer', 'long-answer', 'case-based'] },
  instructions: String,
  example: String
}, { _id: false });

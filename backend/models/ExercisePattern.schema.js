const mongoose = require('mongoose');

module.exports = new mongoose.Schema({
  sourceFileIndex: { type: Number, min: 0 },
  sourceFileName: String,
  sourcePages: [Number],
  chapterName: String,
  topics: [String],
  label: String,
  questionType: { type: String, enum: ['mcq-single', 'mcq-multiple', 'true-false', 'numerical', 'short-answer', 'long-answer', 'case-based'] },
  description: String,
  skillTested: String,
  cognitiveLevel: { type: Number, min: 1, max: 5 },
  instructions: String,
  example: String
}, { _id: false });

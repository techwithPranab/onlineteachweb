const mongoose = require('mongoose')

const contactMessageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: 2
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  subject: {
    type: String,
    trim: true,
    default: ''
  },
  category: {
    type: String,
    enum: ['general', 'technical', 'billing', 'courses', 'tutor', 'partnership', 'other'],
    default: 'general'
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true
  },
  status: {
    type: String,
    enum: ['open', 'in-progress', 'closed'],
    default: 'open'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  response: {
    type: String
  }
}, {
  timestamps: true
})

module.exports = mongoose.model('ContactMessage', contactMessageSchema)

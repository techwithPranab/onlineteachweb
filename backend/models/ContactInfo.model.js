const mongoose = require('mongoose')

const contactInfoSchema = new mongoose.Schema({
  email: { type: String, trim: true, default: 'support@meritai.in' },
  phone: { type: String, trim: true, default: '+1 (555) 123-4567' },
  address: { type: String, trim: true, default: '123 Education Street, New York, NY 10001, USA' },
  businessHours: { type: String, trim: true, default: 'Mon-Fri, 9:00 AM - 6:00 PM EST' },
  responseTimes: {
    email: { type: String, default: '24 hours' },
    phone: { type: String, default: 'Immediate' },
    chat: { type: String, default: '5 minutes' }
  }
}, {
  timestamps: true
})

module.exports = mongoose.model('ContactInfo', contactInfoSchema)

const ContactMessage = require('../models/ContactMessage.model')
const ContactInfo = require('../models/ContactInfo.model')

// Create a new contact message (public)
exports.createMessage = async (req, res, next) => {
  try {
    const { name, email, subject, category, message } = req.body

    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: 'Missing required fields' })
    }

    const msg = await ContactMessage.create({ name, email, subject, category, message })

    // Optionally: trigger notification/email to admins here

    res.status(201).json({ success: true, data: msg, message: 'Message received' })
  } catch (error) {
    next(error)
  }
}

// Get contact messages (admin)
exports.getMessages = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1
    const limit = parseInt(req.query.limit, 10) || 20
    const skip = (page - 1) * limit

    const filter = {}
    if (req.query.status) filter.status = req.query.status
    if (req.query.category) filter.category = req.query.category

    const [messages, total] = await Promise.all([
      ContactMessage.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      ContactMessage.countDocuments(filter)
    ])

    res.json({ success: true, data: messages, total, page, limit })
  } catch (error) {
    next(error)
  }
}

// Get a single message (admin)
exports.getMessage = async (req, res, next) => {
  try {
    const message = await ContactMessage.findById(req.params.id)
    if (!message) return res.status(404).json({ success: false, message: 'Message not found' })
    res.json({ success: true, data: message })
  } catch (error) {
    next(error)
  }
}

// Update status or response (admin)
exports.updateStatus = async (req, res, next) => {
  try {
    const update = {}
    if (req.body.status) update.status = req.body.status
    if (req.body.response) update.response = req.body.response
    if (req.body.assignedTo) update.assignedTo = req.body.assignedTo

    const message = await ContactMessage.findByIdAndUpdate(req.params.id, update, { new: true })
    if (!message) return res.status(404).json({ success: false, message: 'Message not found' })
    res.json({ success: true, data: message })
  } catch (error) {
    next(error)
  }
}

// Delete message (admin)
exports.deleteMessage = async (req, res, next) => {
  try {
    await ContactMessage.findByIdAndDelete(req.params.id)
    res.json({ success: true, message: 'Message deleted' })
  } catch (error) {
    next(error)
  }
}

// Get contact info (public)
exports.getContactInfo = async (req, res, next) => {
  try {
    let info = await ContactInfo.findOne()
    if (!info) {
      // create a default document if missing
      info = await ContactInfo.create({})
    }
    res.json({ success: true, data: info })
  } catch (error) {
    next(error)
  }
}

// Update contact info (admin)
exports.updateContactInfo = async (req, res, next) => {
  try {
    let info = await ContactInfo.findOne()
    if (!info) info = await ContactInfo.create(req.body)
    else Object.assign(info, req.body)
    await info.save()
    res.json({ success: true, data: info })
  } catch (error) {
    next(error)
  }
}

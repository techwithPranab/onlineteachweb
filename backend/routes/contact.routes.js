const express = require('express')
const router = express.Router()
const contactController = require('../controllers/contact.controller')
const { authenticate, authorize } = require('../middleware/auth')

// Public: submit a contact message
router.post('/messages', contactController.createMessage)

// Public: get contact info
router.get('/info', contactController.getContactInfo)

// Admin: contact message management
router.get('/messages', authenticate, authorize('admin'), contactController.getMessages)
router.get('/messages/:id', authenticate, authorize('admin'), contactController.getMessage)
router.put('/messages/:id/status', authenticate, authorize('admin'), contactController.updateStatus)
router.delete('/messages/:id', authenticate, authorize('admin'), contactController.deleteMessage)

// Admin: update contact info
router.put('/info', authenticate, authorize('admin'), contactController.updateContactInfo)

module.exports = router

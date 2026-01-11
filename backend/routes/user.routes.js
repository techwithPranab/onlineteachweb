const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate } = require('../middleware/auth');

// Get current user profile
router.get('/me', authenticate, userController.getCurrentUser);

// Update current user profile
router.put('/me', authenticate, userController.updateProfile);

// Change password
router.put('/me/password', authenticate, userController.changePassword);

// Update notification preferences
router.put('/me/notifications', authenticate, userController.updateNotifications);

// Upload avatar
router.post('/me/avatar', authenticate, userController.uploadAvatar);

// Delete account
router.delete('/me', authenticate, userController.deleteAccount);

// Get user by ID
router.get('/:id', authenticate, userController.getUserById);

// Update user (admin/general)
router.put('/:id', authenticate, userController.updateUser);

module.exports = router;

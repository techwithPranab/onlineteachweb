const express = require('express');
const router = express.Router();
const achievementController = require('../controllers/achievement.controller');
const { authenticate } = require('../middleware/auth');

/**
 * @route   GET /api/achievements/badges/rules
 * @desc    Get all badge rules and descriptions
 * @access  Public
 */
router.get('/badges/rules', achievementController.getAllBadgeRules);

/**
 * @route   GET /api/achievements/my-achievements
 * @desc    Get current student's achievements
 * @access  Private (Student)
 */
router.get('/my-achievements', authenticate, achievementController.getStudentAchievements);

/**
 * @route   GET /api/achievements/stats
 * @desc    Get achievement statistics
 * @access  Private (Student)
 */
router.get('/stats', authenticate, achievementController.getAchievementStats);

/**
 * @route   GET /api/achievements/recent
 * @desc    Get recent achievements
 * @access  Private (Student)
 */
router.get('/recent', authenticate, achievementController.getRecentAchievements);

/**
 * @route   PUT /api/achievements/:achievementId/notified
 * @desc    Mark achievement as notified
 * @access  Private (Student)
 */
router.put('/:achievementId/notified', authenticate, achievementController.markAsNotified);

module.exports = router;

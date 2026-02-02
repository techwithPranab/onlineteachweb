const Achievement = require('../models/Achievement.model');
const achievementService = require('../services/achievement.service');
const logger = require('../utils/logger');

/**
 * Get all badges metadata (rules and descriptions)
 */
exports.getAllBadgeRules = async (req, res) => {
  try {
    const badgeTypes = [
      'first_quiz', 'quiz_master_10', 'quiz_master_25', 'quiz_master_50', 'quiz_master_100',
      'perfect_score', 'perfect_streak_3', 'perfect_streak_5', 'perfect_streak_10',
      'speed_demon', 'quick_thinker',
      'sharp_shooter_80', 'sharp_shooter_90', 'sharp_shooter_95',
      'topic_champion', 'subject_expert',
      'daily_learner_7', 'daily_learner_30', 'weekly_warrior',
      'easy_master', 'medium_conqueror', 'hard_hero', 'difficulty_champion',
      'rising_star', 'comeback_king', 'persistent_learner'
    ];
    
    const badgeRules = badgeTypes.map(type => {
      const metadata = Achievement.getBadgeMetadata(type);
      return {
        type,
        ...metadata
      };
    });
    
    // Group by category
    const categorized = {
      milestones: badgeRules.filter(b => b.type.startsWith('quiz_master') || b.type === 'first_quiz'),
      performance: badgeRules.filter(b => b.type.startsWith('perfect') || b.type.startsWith('sharp')),
      speed: badgeRules.filter(b => b.type.includes('speed') || b.type.includes('quick')),
      difficulty: badgeRules.filter(b => b.type.includes('master') || b.type.includes('conqueror') || b.type.includes('hero') || b.type.includes('champion')),
      consistency: badgeRules.filter(b => b.type.includes('daily') || b.type.includes('weekly')),
      mastery: badgeRules.filter(b => b.type.includes('topic') || b.type.includes('subject')),
      improvement: badgeRules.filter(b => b.type.includes('rising') || b.type.includes('comeback') || b.type.includes('persistent'))
    };
    
    res.json({
      success: true,
      badges: badgeRules,
      categorized
    });
  } catch (error) {
    logger.error('Error fetching badge rules:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch badge rules'
    });
  }
};

/**
 * Get student's achievements
 */
exports.getStudentAchievements = async (req, res) => {
  try {
    const studentId = req.user._id;
    
    const achievements = await achievementService.getStudentAchievements(studentId);
    const stats = await achievementService.getAchievementStats(studentId);
    
    res.json({
      success: true,
      achievements,
      stats
    });
  } catch (error) {
    logger.error('Error fetching achievements:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch achievements'
    });
  }
};

/**
 * Get achievement statistics
 */
exports.getAchievementStats = async (req, res) => {
  try {
    const studentId = req.user._id;
    const stats = await achievementService.getAchievementStats(studentId);
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    logger.error('Error fetching achievement stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch achievement stats'
    });
  }
};

/**
 * Get recent achievements
 */
exports.getRecentAchievements = async (req, res) => {
  try {
    const studentId = req.user._id;
    const limit = parseInt(req.query.limit) || 10;
    
    const achievements = await Achievement.find({ studentId })
      .sort({ earnedAt: -1 })
      .limit(limit)
      .lean();
    
    res.json({
      success: true,
      achievements
    });
  } catch (error) {
    logger.error('Error fetching recent achievements:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent achievements'
    });
  }
};

/**
 * Mark achievement as notified
 */
exports.markAsNotified = async (req, res) => {
  try {
    const { achievementId } = req.params;
    const studentId = req.user._id;
    
    const achievement = await Achievement.findOneAndUpdate(
      { _id: achievementId, studentId },
      { isNotified: true },
      { new: true }
    );
    
    if (!achievement) {
      return res.status(404).json({
        success: false,
        message: 'Achievement not found'
      });
    }
    
    res.json({
      success: true,
      achievement
    });
  } catch (error) {
    logger.error('Error marking achievement as notified:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update achievement'
    });
  }
};

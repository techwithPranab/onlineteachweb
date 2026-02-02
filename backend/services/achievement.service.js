const Achievement = require('../models/Achievement.model');
const QuizSession = require('../models/QuizSession.model');
const logger = require('../utils/logger');

/**
 * Achievement Service
 * Handles calculation and awarding of achievement badges
 */
class AchievementService {
  
  /**
   * Check and award achievements after quiz completion
   * @param {ObjectId} studentId - Student ID
   * @param {Object} quizSession - Completed quiz session
   */
  async checkAndAwardAchievements(studentId, quizSession) {
    try {
      logger.info(`[Achievement] Starting achievement check for student ${studentId}`);
      const newBadges = [];
      
      // Get all completed sessions for this student
      const completedSessions = await QuizSession.find({
        studentId,
        status: { $in: ['completed', 'submitted', 'auto-submitted'] }
      }).sort({ submittedAt: -1 }).lean();
      
      logger.info(`[Achievement] Found ${completedSessions.length} completed sessions for student ${studentId}`);
      
      // Check various achievement criteria
      await this._checkFirstQuiz(studentId, completedSessions, newBadges);
      await this._checkQuizMilestones(studentId, completedSessions, newBadges);
      await this._checkPerfectScore(studentId, quizSession, newBadges);
      await this._checkPerfectStreak(studentId, completedSessions, newBadges);
      await this._checkAccuracy(studentId, quizSession, newBadges);
      await this._checkSpeed(studentId, quizSession, newBadges);
      await this._checkDifficulty(studentId, completedSessions, newBadges);
      await this._checkConsistency(studentId, completedSessions, newBadges);
      await this._checkImprovement(studentId, completedSessions, newBadges);
      await this._checkTopicMastery(studentId, completedSessions, newBadges);
      
      logger.info(`[Achievement] Completed checks. Total new badges: ${newBadges.length}`);
      return newBadges;
    } catch (error) {
      logger.error('[Achievement] Error checking achievements:', error);
      return [];
    }
  }
  
  /**
   * Award a badge to student
   */
  async _awardBadge(studentId, badgeType, context = {}) {
    try {
      const metadata = Achievement.getBadgeMetadata(badgeType);
      if (!metadata) {
        logger.warn(`[Achievement] Unknown badge type: ${badgeType}`);
        return null;
      }
      
      logger.info(`[Achievement] Attempting to award badge: ${badgeType} to student ${studentId}`);
      
      // Check if badge already exists (for non-stackable badges)
      const stackableBadges = ['perfect_score', 'speed_demon', 'topic_champion'];
      if (!stackableBadges.includes(badgeType)) {
        const existing = await Achievement.findOne({ studentId, badgeType });
        if (existing) {
          logger.info(`[Achievement] Badge ${badgeType} already earned by student ${studentId}`);
          return null; // Already earned
        }
      }
      
      const badgeData = {
        studentId,
        badgeType,
        badgeName: metadata.name,
        badgeDescription: metadata.description,
        badgeIcon: metadata.icon,
        badgeColor: metadata.color,
        level: metadata.level,
        points: metadata.points,
        context
      };
      
      logger.info(`[Achievement] Creating badge with data:`, JSON.stringify(badgeData));
      
      const badge = await Achievement.create(badgeData);
      
      logger.info(`[Achievement] ✅ Badge awarded successfully: ${metadata.name} (ID: ${badge._id}) to student ${studentId}`);
      return badge;
    } catch (error) {
      logger.error(`[Achievement] ❌ Error awarding badge ${badgeType} to student ${studentId}:`, error);
      return null;
    }
  }
  
  /**
   * Check First Quiz achievement
   */
  async _checkFirstQuiz(studentId, sessions, newBadges) {
    logger.info(`[Achievement] Checking first quiz for student ${studentId}. Sessions count: ${sessions.length}`);
    if (sessions.length === 1) {
      const badge = await this._awardBadge(studentId, 'first_quiz', {
        sessionId: sessions[0]._id,
        metric: '1 quiz completed'
      });
      if (badge) {
        newBadges.push(badge);
        logger.info(`[Achievement] First quiz badge added to newBadges array`);
      }
    }
  }
  
  /**
   * Check Quiz Milestone achievements
   */
  async _checkQuizMilestones(studentId, sessions, newBadges) {
    const count = sessions.length;
    const milestones = [
      { count: 10, type: 'quiz_master_10' },
      { count: 25, type: 'quiz_master_25' },
      { count: 50, type: 'quiz_master_50' },
      { count: 100, type: 'quiz_master_100' }
    ];
    
    for (const milestone of milestones) {
      if (count === milestone.count) {
        const badge = await this._awardBadge(studentId, milestone.type, {
          metric: `${count} quizzes completed`
        });
        if (badge) newBadges.push(badge);
      }
    }
  }
  
  /**
   * Check Perfect Score achievement
   */
  async _checkPerfectScore(studentId, session, newBadges) {
    const percentage = session.totalMarks > 0 
      ? (session.totalScore / session.totalMarks) * 100 
      : 0;
    
    if (percentage === 100) {
      const badge = await this._awardBadge(studentId, 'perfect_score', {
        sessionId: session._id,
        quizId: session.quizId,
        score: percentage,
        metric: '100% score'
      });
      if (badge) newBadges.push(badge);
    }
  }
  
  /**
   * Check Perfect Streak achievements
   */
  async _checkPerfectStreak(studentId, sessions, newBadges) {
    // Get recent sessions in order
    const recentSessions = sessions.slice(0, 10);
    
    // Count consecutive perfect scores
    let streak = 0;
    for (const session of recentSessions) {
      const percentage = session.totalMarks > 0 
        ? (session.totalScore / session.totalMarks) * 100 
        : 0;
      
      if (percentage === 100) {
        streak++;
      } else {
        break;
      }
    }
    
    const streaks = [
      { count: 3, type: 'perfect_streak_3' },
      { count: 5, type: 'perfect_streak_5' },
      { count: 10, type: 'perfect_streak_10' }
    ];
    
    for (const s of streaks) {
      if (streak === s.count) {
        const badge = await this._awardBadge(studentId, s.type, {
          metric: `${streak} consecutive perfect scores`
        });
        if (badge) newBadges.push(badge);
      }
    }
  }
  
  /**
   * Check Accuracy achievements
   */
  async _checkAccuracy(studentId, session, newBadges) {
    const percentage = session.totalMarks > 0 
      ? (session.totalScore / session.totalMarks) * 100 
      : 0;
    
    const accuracyLevels = [
      { threshold: 95, type: 'sharp_shooter_95' },
      { threshold: 90, type: 'sharp_shooter_90' },
      { threshold: 80, type: 'sharp_shooter_80' }
    ];
    
    for (const level of accuracyLevels) {
      if (percentage >= level.threshold) {
        const badge = await this._awardBadge(studentId, level.type, {
          sessionId: session._id,
          score: percentage,
          metric: `${percentage.toFixed(1)}% accuracy`
        });
        if (badge) newBadges.push(badge);
        break; // Award only highest achieved
      }
    }
  }
  
  /**
   * Check Speed achievements
   */
  async _checkSpeed(studentId, session, newBadges) {
    const percentage = session.totalMarks > 0 
      ? (session.totalScore / session.totalMarks) * 100 
      : 0;
    
    const timeSpent = session.totalTimeSpent || 0; // in seconds
    const duration = session.duration * 60; // convert to seconds
    
    // Speed Demon: Complete in <50% time with >80% score
    if (timeSpent < duration * 0.5 && percentage > 80) {
      const badge = await this._awardBadge(studentId, 'speed_demon', {
        sessionId: session._id,
        score: percentage,
        metric: `Completed in ${Math.round(timeSpent / 60)} minutes`
      });
      if (badge) newBadges.push(badge);
    }
    
    // Quick Thinker: Average <30 seconds per question with >75% accuracy
    const totalQuestions = session.selectedQuestions?.length || 1;
    const avgTimePerQuestion = timeSpent / totalQuestions;
    if (avgTimePerQuestion < 30 && percentage > 75) {
      const badge = await this._awardBadge(studentId, 'quick_thinker', {
        sessionId: session._id,
        score: percentage,
        metric: `${avgTimePerQuestion.toFixed(1)} sec/question average`
      });
      if (badge) newBadges.push(badge);
    }
  }
  
  /**
   * Check Difficulty Level achievements
   */
  async _checkDifficulty(studentId, sessions, newBadges) {
    const difficultyStats = {
      easy: [],
      medium: [],
      hard: []
    };
    
    // Categorize sessions by difficulty
    for (const session of sessions) {
      const difficulty = session.selectionCriteria?.difficultyLevel;
      if (difficulty && difficultyStats[difficulty]) {
        const percentage = session.totalMarks > 0 
          ? (session.totalScore / session.totalMarks) * 100 
          : 0;
        difficultyStats[difficulty].push(percentage);
      }
    }
    
    // Check Easy Master (>85% avg in 10 easy quizzes)
    if (difficultyStats.easy.length >= 10) {
      const avg = difficultyStats.easy.slice(0, 10).reduce((a, b) => a + b, 0) / 10;
      if (avg > 85) {
        const badge = await this._awardBadge(studentId, 'easy_master', {
          metric: `${avg.toFixed(1)}% average in easy quizzes`
        });
        if (badge) newBadges.push(badge);
      }
    }
    
    // Check Medium Conqueror (>80% avg in 10 medium quizzes)
    if (difficultyStats.medium.length >= 10) {
      const avg = difficultyStats.medium.slice(0, 10).reduce((a, b) => a + b, 0) / 10;
      if (avg > 80) {
        const badge = await this._awardBadge(studentId, 'medium_conqueror', {
          metric: `${avg.toFixed(1)}% average in medium quizzes`
        });
        if (badge) newBadges.push(badge);
      }
    }
    
    // Check Hard Hero (>75% avg in 10 hard quizzes)
    if (difficultyStats.hard.length >= 10) {
      const avg = difficultyStats.hard.slice(0, 10).reduce((a, b) => a + b, 0) / 10;
      if (avg > 75) {
        const badge = await this._awardBadge(studentId, 'hard_hero', {
          metric: `${avg.toFixed(1)}% average in hard quizzes`
        });
        if (badge) newBadges.push(badge);
      }
    }
    
    // Check Difficulty Champion (earned all three)
    const earnedBadges = await Achievement.find({ 
      studentId, 
      badgeType: { $in: ['easy_master', 'medium_conqueror', 'hard_hero'] }
    });
    
    if (earnedBadges.length === 3) {
      const badge = await this._awardBadge(studentId, 'difficulty_champion', {
        metric: 'Mastered all difficulty levels'
      });
      if (badge) newBadges.push(badge);
    }
  }
  
  /**
   * Check Consistency achievements
   */
  async _checkConsistency(studentId, sessions, newBadges) {
    if (sessions.length < 7) return;
    
    // Group sessions by date
    const dateMap = new Map();
    for (const session of sessions) {
      const date = new Date(session.submittedAt).toDateString();
      if (!dateMap.has(date)) {
        dateMap.set(date, []);
      }
      dateMap.get(date).push(session);
    }
    
    const dates = Array.from(dateMap.keys()).sort().reverse();
    
    // Check for consecutive days
    let consecutiveDays = 0;
    let prevDate = null;
    
    for (const dateStr of dates) {
      const currentDate = new Date(dateStr);
      
      if (!prevDate) {
        consecutiveDays = 1;
      } else {
        const diffDays = Math.round((prevDate - currentDate) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          consecutiveDays++;
        } else {
          break;
        }
      }
      
      prevDate = currentDate;
    }
    
    // Award badges based on streak
    if (consecutiveDays >= 30) {
      const badge = await this._awardBadge(studentId, 'daily_learner_30', {
        metric: `${consecutiveDays} day streak`
      });
      if (badge) newBadges.push(badge);
    } else if (consecutiveDays >= 7) {
      const badge = await this._awardBadge(studentId, 'daily_learner_7', {
        metric: `${consecutiveDays} day streak`
      });
      if (badge) newBadges.push(badge);
    }
  }
  
  /**
   * Check Improvement achievements
   */
  async _checkImprovement(studentId, sessions, newBadges) {
    if (sessions.length < 2) return;
    
    const recent = sessions.slice(0, 5);
    
    // Rising Star: 20% improvement over 5 quizzes
    if (recent.length >= 5) {
      const firstAvg = recent.slice(3, 5).reduce((sum, s) => {
        return sum + (s.totalMarks > 0 ? (s.totalScore / s.totalMarks) * 100 : 0);
      }, 0) / 2;
      
      const lastAvg = recent.slice(0, 2).reduce((sum, s) => {
        return sum + (s.totalMarks > 0 ? (s.totalScore / s.totalMarks) * 100 : 0);
      }, 0) / 2;
      
      if (lastAvg - firstAvg >= 20) {
        const badge = await this._awardBadge(studentId, 'rising_star', {
          metric: `Improved by ${(lastAvg - firstAvg).toFixed(1)}%`
        });
        if (badge) newBadges.push(badge);
      }
    }
    
    // Comeback King: >90% after <50%
    const latest = sessions[0];
    const previous = sessions[1];
    
    const latestPct = latest.totalMarks > 0 ? (latest.totalScore / latest.totalMarks) * 100 : 0;
    const previousPct = previous.totalMarks > 0 ? (previous.totalScore / previous.totalMarks) * 100 : 0;
    
    if (latestPct > 90 && previousPct < 50) {
      const badge = await this._awardBadge(studentId, 'comeback_king', {
        sessionId: latest._id,
        score: latestPct,
        metric: `From ${previousPct.toFixed(1)}% to ${latestPct.toFixed(1)}%`
      });
      if (badge) newBadges.push(badge);
    }
  }
  
  /**
   * Check Topic Mastery
   */
  async _checkTopicMastery(studentId, sessions, newBadges) {
    // Group by topic (from courseId or other metadata)
    const topicMap = new Map();
    
    for (const session of sessions) {
      const topic = session.courseId?.toString() || 'general';
      if (!topicMap.has(topic)) {
        topicMap.set(topic, []);
      }
      
      const percentage = session.totalMarks > 0 
        ? (session.totalScore / session.totalMarks) * 100 
        : 0;
      
      topicMap.get(topic).push(percentage);
    }
    
    // Check each topic
    for (const [topic, scores] of topicMap.entries()) {
      if (scores.length >= 5) {
        const recent5 = scores.slice(0, 5);
        const avg = recent5.reduce((a, b) => a + b, 0) / 5;
        
        if (avg > 90) {
          const badge = await this._awardBadge(studentId, 'topic_champion', {
            courseId: topic !== 'general' ? topic : undefined,
            metric: `${avg.toFixed(1)}% average in topic`,
            additionalData: { topic }
          });
          if (badge) newBadges.push(badge);
        }
      }
    }
  }
  
  /**
   * Get all achievements for a student
   */
  async getStudentAchievements(studentId) {
    return await Achievement.find({ studentId })
      .sort({ earnedAt: -1 })
      .lean();
  }
  
  /**
   * Get achievement statistics
   */
  async getAchievementStats(studentId) {
    const badges = await Achievement.find({ studentId });
    
    const stats = {
      totalBadges: badges.length,
      totalPoints: badges.reduce((sum, b) => sum + b.points, 0),
      byLevel: {
        bronze: badges.filter(b => b.level === 'bronze').length,
        silver: badges.filter(b => b.level === 'silver').length,
        gold: badges.filter(b => b.level === 'gold').length,
        platinum: badges.filter(b => b.level === 'platinum').length,
        diamond: badges.filter(b => b.level === 'diamond').length
      },
      recentBadges: badges.slice(0, 5)
    };
    
    return stats;
  }
}

module.exports = new AchievementService();

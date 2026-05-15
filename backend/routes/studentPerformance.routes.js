const express = require('express');
const router = express.Router();
const StudentPerformance = require('../models/StudentPerformance.model');
const { authenticate } = require('../middleware/auth');

/**
 * StudentPerformance Routes
 * 
 * Purpose: Manage student learning performance and analytics
 * Features: Track topic mastery, identify weak/strong areas, view trends
 */

// @route   GET /api/student-performance
// @desc    Get student's performance data
// @access  Private (Student)
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;
    
    let performance = await StudentPerformance.findOne({ studentId: userId });
    
    if (!performance) {
      // Create default performance record
      performance = await StudentPerformance.create({
        studentId: userId,
        topicMastery: [],
        weakAreas: [],
        strongAreas: [],
        trends: { accuracy: [], speed: [], consistency: [] },
        lastUpdated: new Date()
      });
    }
    
    // Log for debugging
    console.log('Student Performance Retrieved:', {
      studentId: userId,
      hasData: !!performance,
      subjectPerformanceKeys: performance.subjectPerformance ? Object.keys(performance.subjectPerformance) : [],
      subjectCount: performance.subjectPerformance ? Object.keys(performance.subjectPerformance).length : 0
    });
    
    res.json({
      success: true,
      data: performance
    });
  } catch (error) {
    console.error('Error fetching student performance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch performance data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/student-performance/weak-areas
// @desc    Get student's weak areas for recommendations
// @access  Private (Student)
router.get('/weak-areas', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;
    const performance = await StudentPerformance.findOne({ studentId: userId });
    
    if (!performance) {
      return res.json({
        success: true,
        data: []
      });
    }
    
    res.json({
      success: true,
      data: performance.weakAreas
    });
  } catch (error) {
    console.error('Error fetching weak areas:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch weak areas',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/student-performance/strong-areas
// @desc    Get student's strong areas
// @access  Private (Student)
router.get('/strong-areas', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;
    const performance = await StudentPerformance.findOne({ studentId: userId });
    
    if (!performance) {
      return res.json({
        success: true,
        data: []
      });
    }
    
    res.json({
      success: true,
      data: performance.strongAreas
    });
  } catch (error) {
    console.error('Error fetching strong areas:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch strong areas',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/student-performance/trends
// @desc    Get student's performance trends
// @access  Private (Student)
router.get('/trends', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;
    const performance = await StudentPerformance.findOne({ studentId: userId });
    
    if (!performance) {
      return res.json({
        success: true,
        data: {
          accuracy: [],
          speed: [],
          consistency: []
        }
      });
    }
    
    res.json({
      success: true,
      data: performance.trends
    });
  } catch (error) {
    console.error('Error fetching trends:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trends',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/student-performance/topic/:subject/:topic
// @desc    Get performance for a specific topic
// @access  Private (Student)
router.get('/topic/:subject/:topic', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;
    const { subject, topic } = req.params;
    
    const performance = await StudentPerformance.findOne({ studentId: userId });
    
    if (!performance) {
      return res.json({
        success: true,
        data: null
      });
    }
    
    const topicData = performance.topicMastery.find(
      tm => tm.subject === subject && tm.topic === topic
    );
    
    res.json({
      success: true,
      data: topicData || null
    });
  } catch (error) {
    console.error('Error fetching topic performance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch topic performance',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   DELETE /api/student-performance/reset
// @desc    Reset student performance data (for testing)
// @access  Private (Student)
router.delete('/reset', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;
    
    await StudentPerformance.deleteOne({ studentId: userId });
    
    res.json({
      success: true,
      message: 'Performance data reset successfully'
    });
  } catch (error) {
    console.error('Error resetting performance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset performance data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Streak Endpoints
// ─────────────────────────────────────────────────────────────────────────────

// @route   GET /api/student-performance/streak
// @desc    Get student's current streak data
// @access  Private (Student)
router.get('/streak', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;
    let performance = await StudentPerformance.findOne(
      { studentId: userId },
      { currentStreak: 1, longestStreak: 1, lastActivityDate: 1, activityDates: 1 }
    );
    if (!performance) {
      performance = await StudentPerformance.create({ studentId: userId });
    }
    res.json({
      success: true,
      data: {
        currentStreak:  performance.currentStreak  || 0,
        longestStreak:  performance.longestStreak  || 0,
        lastActivityDate: performance.lastActivityDate || null,
        activityDates:  (performance.activityDates || []).map(d => d.toISOString().split('T')[0])
      }
    });
  } catch (error) {
    console.error('Error fetching streak:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch streak data' });
  }
});

// @route   POST /api/student-performance/streak/checkin
// @desc    Record a daily activity check-in and update streak
// @access  Private (Student)
router.post('/streak/checkin', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;

    let performance = await StudentPerformance.findOne({ studentId: userId });
    if (!performance) {
      performance = await StudentPerformance.create({ studentId: userId });
    }

    // Normalise dates to midnight UTC
    const nowDay  = new Date(); nowDay.setUTCHours(0,0,0,0);
    const yesterDay = new Date(nowDay); yesterDay.setUTCDate(yesterDay.getUTCDate() - 1);

    const lastDay = performance.lastActivityDate
      ? (() => { const d = new Date(performance.lastActivityDate); d.setUTCHours(0,0,0,0); return d; })()
      : null;

    // Already checked-in today → return without changes
    if (lastDay && lastDay.getTime() === nowDay.getTime()) {
      return res.json({
        success: true,
        data: {
          currentStreak:    performance.currentStreak  || 0,
          longestStreak:    performance.longestStreak  || 0,
          lastActivityDate: performance.lastActivityDate,
          activityDates:    (performance.activityDates || []).map(d => d.toISOString().split('T')[0]),
          alreadyCheckedIn: true
        }
      });
    }

    // Determine new streak
    if (lastDay && lastDay.getTime() === yesterDay.getTime()) {
      performance.currentStreak = (performance.currentStreak || 0) + 1; // consecutive ✅
    } else {
      performance.currentStreak = 1; // reset or first ever
    }
    if (performance.currentStreak > (performance.longestStreak || 0)) {
      performance.longestStreak = performance.currentStreak;
    }
    performance.lastActivityDate = nowDay;

    // Add today to activityDates, deduped, keep last 90 days
    const todayStr = nowDay.toISOString().split('T')[0];
    const existingDates = (performance.activityDates || []);
    const alreadyExists = existingDates.some(d => d.toISOString().split('T')[0] === todayStr);
    if (!alreadyExists) {
      const cutoff = new Date(nowDay); cutoff.setUTCDate(cutoff.getUTCDate() - 90);
      performance.activityDates = [...existingDates.filter(d => d >= cutoff), nowDay];
    }

    await performance.save();

    res.json({
      success: true,
      data: {
        currentStreak:    performance.currentStreak,
        longestStreak:    performance.longestStreak,
        lastActivityDate: performance.lastActivityDate,
        activityDates:    performance.activityDates.map(d => d.toISOString().split('T')[0]),
        alreadyCheckedIn: false
      }
    });
  } catch (error) {
    console.error('Error updating streak:', error);
    res.status(500).json({ success: false, message: 'Failed to update streak' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// XP & Gamification Endpoints
// ─────────────────────────────────────────────────────────────────────────────

// @route   GET /api/student-performance/xp
// @desc    Get student's stored XP total
// @access  Private (Student)
router.get('/xp', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;

    let performance = await StudentPerformance.findOne(
      { studentId: userId },
      { totalXP: 1 }          // only fetch the XP field
    );

    // Auto-create record if not yet present
    if (!performance) {
      performance = await StudentPerformance.create({
        studentId: userId,
        totalXP: 0
      });
    }

    res.json({
      success: true,
      data: { totalXP: performance.totalXP || 0 }
    });
  } catch (error) {
    console.error('Error fetching XP:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch XP data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PATCH /api/student-performance/xp
// @desc    Update (overwrite) student's XP total
// @body    { totalXP: Number }
// @access  Private (Student)
router.patch('/xp', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;
    const { totalXP } = req.body;

    if (typeof totalXP !== 'number' || totalXP < 0) {
      return res.status(400).json({
        success: false,
        message: 'totalXP must be a non-negative number'
      });
    }

    const performance = await StudentPerformance.findOneAndUpdate(
      { studentId: userId },
      { $set: { totalXP } },
      { new: true, upsert: true, select: 'totalXP' }
    );

    res.json({
      success: true,
      data: { totalXP: performance.totalXP }
    });
  } catch (error) {
    console.error('Error updating XP:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update XP data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/student-performance/xp/add
// @desc    Atomically increment XP by a delta (safer for concurrent requests)
// @body    { delta: Number }
// @access  Private (Student)
router.post('/xp/add', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;
    const { delta } = req.body;

    if (typeof delta !== 'number' || delta < 0) {
      return res.status(400).json({
        success: false,
        message: 'delta must be a non-negative number'
      });
    }

    const performance = await StudentPerformance.findOneAndUpdate(
      { studentId: userId },
      { $inc: { totalXP: delta } },
      { new: true, upsert: true, select: 'totalXP' }
    );

    res.json({
      success: true,
      data: { totalXP: performance.totalXP, earned: delta }
    });
  } catch (error) {
    console.error('Error incrementing XP:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add XP',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;

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

module.exports = router;

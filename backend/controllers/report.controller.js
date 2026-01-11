const Evaluation = require('../models/Evaluation.model');
const Attendance = require('../models/Attendance.model');
const Session = require('../models/Session.model');
const Course = require('../models/Course.model');
const Payment = require('../models/Payment.model');
const User = require('../models/User.model');

// @desc    Get student progress report
// @route   GET /api/reports/student/:id
// @access  Private
exports.getStudentReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Check authorization
    if (
      req.user.role === 'student' && 
      req.user._id.toString() !== req.params.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }
    
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);
    
    const query = { student: req.params.id };
    if (Object.keys(dateFilter).length > 0) {
      query.createdAt = dateFilter;
    }
    
    // Get evaluations
    const evaluations = await Evaluation.find(query)
      .populate('session', 'title')
      .populate('course', 'title subject');
    
    // Get attendance
    const attendance = await Attendance.find({
      student: req.params.id,
      ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
    });
    
    const totalSessions = attendance.length;
    const attended = attendance.filter(a => a.status === 'present').length;
    const attendanceRate = totalSessions > 0 
      ? Math.round((attended / totalSessions) * 100) 
      : 0;
    
    // Calculate average grade
    const avgGrade = evaluations.length > 0
      ? evaluations.reduce((sum, e) => sum + e.grade, 0) / evaluations.length
      : 0;
    
    // Calculate total hours learned (from attended sessions)
    const attendedSessionIds = attendance
      .filter(a => a.status === 'present')
      .map(a => a.session);
    
    const attendedSessions = await Session.find({
      _id: { $in: attendedSessionIds }
    });
    
    const totalHours = attendedSessions.reduce((sum, s) => sum + (s.duration || 60), 0) / 60;
    
    res.json({
      success: true,
      data: {
        attendanceRate,
        totalSessions,
        attendedSessions: attended,
        averageGrade: Math.round(avgGrade),
        totalHours: Math.round(totalHours),
        evaluations: evaluations.map(e => ({
          grade: e.grade,
          course: e.course?.title,
          subject: e.course?.subject,
          date: e.createdAt
        })),
        progress: []
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get tutor performance report
// @route   GET /api/reports/tutor/:id
// @access  Private (Tutor)
exports.getTutorReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (req.user._id.toString() !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }
    
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);
    
    const query = { tutor: req.params.id };
    if (Object.keys(dateFilter).length > 0) {
      query.createdAt = dateFilter;
    }
    
    // Get sessions
    const sessions = await Session.find(query);
    const completedSessions = sessions.filter(s => s.status === 'completed').length;
    
    // Get unique students
    const studentIds = new Set();
    sessions.forEach(s => {
      s.attendees.forEach(a => studentIds.add(a.student.toString()));
    });
    
    // Get tutor details for rating
    const tutor = await User.findById(req.params.id);
    
    res.json({
      success: true,
      report: {
        sessions: completedSessions,
        totalSessions: sessions.length,
        students: studentIds.size,
        rating: tutor.rating || 0,
        earnings: 0 // Calculate based on payments
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get admin analytics
// @route   GET /api/admin/analytics
// @access  Private (Admin)
exports.getAdminAnalytics = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);
    
    // Get counts
    const [users, sessions, payments] = await Promise.all([
      User.countDocuments(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}),
      Session.countDocuments(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}),
      Payment.find({
        status: 'completed',
        ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
      })
    ]);
    
    const revenue = payments.reduce((sum, p) => sum + p.amount, 0);
    
    res.json({
      success: true,
      analytics: {
        users,
        sessions,
        revenue,
        growth: []
      }
    });
  } catch (error) {
    next(error);
  }
};

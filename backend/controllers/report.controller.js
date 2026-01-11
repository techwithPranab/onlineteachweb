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
    const { period = 'month' } = req.query;

    // Calculate date range based on period
    const now = new Date();
    let startDate;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const dateFilter = { $gte: startDate, $lte: now };

    // Get basic counts
    const [totalUsers, activeCourses, pendingTutors, totalSessions] = await Promise.all([
      User.countDocuments(),
      Course.countDocuments({ status: 'published' }),
      User.countDocuments({ role: 'tutor', status: 'pending' }),
      Session.countDocuments()
    ]);

    // Get revenue data
    const payments = await Payment.find({
      status: 'completed',
      createdAt: dateFilter
    });

    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

    // Get revenue trend data (last 6 months)
    const revenueTrend = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

      const monthPayments = await Payment.find({
        status: 'completed',
        createdAt: { $gte: monthStart, $lte: monthEnd }
      });

      const monthRevenue = monthPayments.reduce((sum, p) => sum + p.amount, 0);

      revenueTrend.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
        revenue: monthRevenue
      });
    }

    // Get user growth data (last 6 months)
    const userGrowth = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

      const [students, tutors] = await Promise.all([
        User.countDocuments({
          role: 'student',
          createdAt: { $gte: monthStart, $lte: monthEnd }
        }),
        User.countDocuments({
          role: 'tutor',
          createdAt: { $gte: monthStart, $lte: monthEnd }
        })
      ]);

      userGrowth.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
        students,
        tutors
      });
    }

    // Get subscription distribution
    const subscriptions = await Payment.aggregate([
      {
        $match: {
          status: 'completed',
          type: 'subscription',
          createdAt: dateFilter
        }
      },
      {
        $group: {
          _id: '$planName',
          revenue: { $sum: '$amount' },
          users: { $addToSet: '$user' }
        }
      },
      {
        $project: {
          plan: '$_id',
          revenue: 1,
          users: { $size: '$users' }
        }
      }
    ]);

    // If no subscription data, provide default values
    const subscriptionData = subscriptions.length > 0 ? subscriptions.map(s => ({
      name: s.plan || 'Unknown',
      value: s.revenue,
      color: getPlanColor(s.plan)
    })) : [
      { name: 'Basic', value: 8400, color: '#6366f1' },
      { name: 'Standard', value: 20400, color: '#8b5cf6' },
      { name: 'Premium', value: 14800, color: '#ec4899' }
    ];

    // Get top performing courses
    const topCourses = await Payment.aggregate([
      {
        $match: {
          status: 'completed',
          type: 'course',
          createdAt: dateFilter
        }
      },
      {
        $group: {
          _id: '$course',
          revenue: { $sum: '$amount' },
          payments: { $push: '$$ROOT' }
        }
      },
      {
        $lookup: {
          from: 'courses',
          localField: '_id',
          foreignField: '_id',
          as: 'courseInfo'
        }
      },
      {
        $unwind: '$courseInfo'
      },
      {
        $project: {
          name: '$courseInfo.title',
          revenue: 1,
          students: { $size: '$payments' }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 }
    ]);

    // If no course data, provide sample data
    const topCoursesData = topCourses.length > 0 ? topCourses : [
      { name: 'Advanced Mathematics', revenue: 5240, students: 68 },
      { name: 'Physics Fundamentals', revenue: 4580, students: 62 },
      { name: 'Chemistry Grade 10', revenue: 3920, students: 56 },
      { name: 'English Literature', revenue: 3450, students: 51 },
      { name: 'Computer Science', revenue: 3100, students: 48 }
    ];

    // Calculate growth rates
    const monthlyStats = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

      const monthRevenue = await Payment.find({
        status: 'completed',
        createdAt: { $gte: monthStart, $lte: monthEnd }
      }).then(payments => payments.reduce((sum, p) => sum + p.amount, 0));

      const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - i - 1, 1);
      const prevMonthEnd = new Date(now.getFullYear(), now.getMonth() - i, 0, 23, 59, 59);

      const prevMonthRevenue = await Payment.find({
        status: 'completed',
        createdAt: { $gte: prevMonthStart, $lte: prevMonthEnd }
      }).then(payments => payments.reduce((sum, p) => sum + p.amount, 0));

      const growth = prevMonthRevenue > 0 ? ((monthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100 : 0;

      monthlyStats.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
        revenue: monthRevenue,
        growth: Math.round(growth)
      });
    }

    // Calculate ARPU (Average Revenue Per User)
    const activeUsers = await User.countDocuments({ status: 'active' });
    const arpu = activeUsers > 0 ? totalRevenue / activeUsers : 0;

    res.json({
      success: true,
      data: {
        // Dashboard stats
        totalUsers,
        activeCourses,
        totalRevenue,
        pendingTutors,
        totalSessions,

        // Chart data
        revenueTrend,
        userGrowth,
        subscriptionData,
        topCourses: topCoursesData,
        monthlyStats,

        // Additional metrics
        arpu: Math.round(arpu * 100) / 100,
        averageGrowth: monthlyStats.length > 0 ?
          Math.round(monthlyStats.reduce((sum, m) => sum + m.growth, 0) / monthlyStats.length) : 0,

        // Revenue breakdown
        subscriptionRevenue: subscriptionData.reduce((sum, s) => sum + s.value, 0),
        courseRevenue: totalRevenue - subscriptionData.reduce((sum, s) => sum + s.value, 0)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to get plan colors
function getPlanColor(planName) {
  const colors = {
    'Basic': '#6366f1',
    'Standard': '#8b5cf6',
    'Premium': '#ec4899',
    'Annual Premium': '#10b981'
  };
  return colors[planName] || '#6b7280';
}

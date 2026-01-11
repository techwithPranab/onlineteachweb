const Payment = require('../models/Payment.model');
const Session = require('../models/Session.model');
const { SubscriptionPlan, Subscription } = require('../models/Subscription.model');
const User = require('../models/User.model');

// ========================================
// PAYMENT MANAGEMENT
// ========================================

// @desc    Get all payments with filters
// @route   GET /api/admin/payments
// @access  Private (Admin)
exports.getPayments = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      dateRange = '30',
      search
    } = req.query;

    const query = {};
    
    // Status filter
    if (status) query.status = status;
    
    // Date range filter
    const days = parseInt(dateRange);
    if (days) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      query.createdAt = { $gte: startDate };
    }
    
    // Search filter (transaction ID or user email)
    if (search) {
      const users = await User.find({
        $or: [
          { email: new RegExp(search, 'i') },
          { name: new RegExp(search, 'i') }
        ]
      }).select('_id');
      
      query.$or = [
        { transactionId: new RegExp(search, 'i') },
        { user: { $in: users.map(u => u._id) } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [payments, total] = await Promise.all([
      Payment.find(query)
        .populate('user', 'name email avatar')
        .populate('subscription')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Payment.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: payments,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get payment statistics
// @route   GET /api/admin/payments/stats
// @access  Private (Admin)
exports.getPaymentStats = async (req, res, next) => {
  try {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const lastYear = new Date(now.getFullYear(), now.getMonth() - 12, now.getDate());

    // Total revenue
    const revenueResult = await Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;

    // Revenue last month
    const lastMonthRevenue = await Payment.aggregate([
      { 
        $match: { 
          status: 'completed',
          createdAt: { $gte: lastMonth }
        } 
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const lastMonthTotal = lastMonthRevenue[0]?.total || 0;

    // Previous month for comparison
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate());
    const prevMonthRevenue = await Payment.aggregate([
      { 
        $match: { 
          status: 'completed',
          createdAt: { $gte: twoMonthsAgo, $lt: lastMonth }
        } 
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const prevMonthTotal = prevMonthRevenue[0]?.total || 1;

    const revenueGrowth = ((lastMonthTotal - prevMonthTotal) / prevMonthTotal * 100).toFixed(1);

    // Total transactions
    const totalTransactions = await Payment.countDocuments({});
    const lastMonthTransactions = await Payment.countDocuments({ createdAt: { $gte: lastMonth } });
    const prevMonthTransactions = await Payment.countDocuments({ 
      createdAt: { $gte: twoMonthsAgo, $lt: lastMonth } 
    });
    const transactionGrowth = prevMonthTransactions > 0 
      ? ((lastMonthTransactions - prevMonthTransactions) / prevMonthTransactions * 100).toFixed(1)
      : 0;

    // Success rate
    const completedCount = await Payment.countDocuments({ status: 'completed' });
    const successRate = totalTransactions > 0 
      ? ((completedCount / totalTransactions) * 100).toFixed(1)
      : 0;

    // Pending refunds
    const pendingRefunds = await Payment.countDocuments({ 
      status: 'completed',
      refundRequested: true,
      refundProcessed: { $ne: true }
    });

    res.json({
      success: true,
      data: {
        totalRevenue,
        revenueGrowth: parseFloat(revenueGrowth),
        totalTransactions,
        transactionGrowth: parseFloat(transactionGrowth),
        successRate: parseFloat(successRate),
        successRateChange: 0,
        pendingRefunds
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Process refund
// @route   POST /api/admin/payments/:id/refund
// @access  Private (Admin)
exports.processRefund = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (payment.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Only completed payments can be refunded'
      });
    }

    if (payment.refundProcessed) {
      return res.status(400).json({
        success: false,
        message: 'Payment already refunded'
      });
    }

    // Process refund (integrate with Stripe later)
    payment.status = 'refunded';
    payment.refundProcessed = true;
    payment.refundedAt = new Date();
    payment.refundedBy = req.user._id;
    await payment.save();

    res.json({
      success: true,
      data: payment,
      message: 'Refund processed successfully'
    });
  } catch (error) {
    next(error);
  }
};

// ========================================
// SESSION MANAGEMENT
// ========================================

// @desc    Get all sessions with filters
// @route   GET /api/admin/sessions
// @access  Private (Admin)
exports.getAllSessions = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      grade,
      subject,
      dateRange = '30',
      search
    } = req.query;

    const query = {};
    
    if (status) query.status = status;
    if (grade) query.grade = parseInt(grade);
    
    // Date range
    const days = parseInt(dateRange);
    if (days) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      query.scheduledAt = { $gte: startDate };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [sessions, total] = await Promise.all([
      Session.find(query)
        .populate('tutor', 'name email avatar')
        .populate('course', 'title grade subject')
        .sort({ scheduledAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Session.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: sessions,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get session statistics
// @route   GET /api/admin/sessions/stats
// @access  Private (Admin)
exports.getSessionStats = async (req, res, next) => {
  try {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

    const totalSessions = await Session.countDocuments({});
    const liveSessions = await Session.countDocuments({ status: 'live' });
    
    const lastMonthSessions = await Session.countDocuments({ createdAt: { $gte: lastMonth } });
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate());
    const prevMonthSessions = await Session.countDocuments({ 
      createdAt: { $gte: prevMonthStart, $lt: lastMonth } 
    });
    
    const sessionGrowth = prevMonthSessions > 0
      ? ((lastMonthSessions - prevMonthSessions) / prevMonthSessions * 100).toFixed(1)
      : 0;

    // Average attendance
    const completedSessions = await Session.find({ status: 'completed' });
    let totalAttendanceRate = 0;
    completedSessions.forEach(session => {
      if (session.maxStudents > 0) {
        totalAttendanceRate += (session.attendanceCount || 0) / session.maxStudents;
      }
    });
    const avgAttendance = completedSessions.length > 0
      ? ((totalAttendanceRate / completedSessions.length) * 100).toFixed(1)
      : 0;

    // Average duration
    const avgDuration = completedSessions.length > 0
      ? (completedSessions.reduce((sum, s) => sum + (s.duration || 0), 0) / completedSessions.length).toFixed(0)
      : 0;

    res.json({
      success: true,
      data: {
        totalSessions,
        sessionGrowth: parseFloat(sessionGrowth),
        liveSessions,
        avgAttendance: parseFloat(avgAttendance),
        attendanceChange: 0,
        avgDuration: parseInt(avgDuration)
      }
    });
  } catch (error) {
    next(error);
  }
};

// ========================================
// SUBSCRIPTION PLAN MANAGEMENT
// ========================================

// @desc    Get all subscription plans
// @route   GET /api/admin/subscription-plans
// @access  Private (Admin)
exports.getSubscriptionPlans = async (req, res, next) => {
  try {
    const plans = await SubscriptionPlan.find({}).sort({ priority: 1 });

    res.json({
      success: true,
      data: plans
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create subscription plan
// @route   POST /api/admin/subscription-plans
// @access  Private (Admin)
exports.createSubscriptionPlan = async (req, res, next) => {
  try {
    const plan = await SubscriptionPlan.create(req.body);

    res.status(201).json({
      success: true,
      data: plan
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update subscription plan
// @route   PUT /api/admin/subscription-plans/:id
// @access  Private (Admin)
exports.updateSubscriptionPlan = async (req, res, next) => {
  try {
    const plan = await SubscriptionPlan.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Subscription plan not found'
      });
    }

    res.json({
      success: true,
      data: plan
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete subscription plan
// @route   DELETE /api/admin/subscription-plans/:id
// @access  Private (Admin)
exports.deleteSubscriptionPlan = async (req, res, next) => {
  try {
    const plan = await SubscriptionPlan.findById(req.params.id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Subscription plan not found'
      });
    }

    // Check if any active subscriptions use this plan
    const activeSubscriptions = await Subscription.countDocuments({
      plan: plan._id,
      status: 'active'
    });

    if (activeSubscriptions > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete plan. ${activeSubscriptions} active subscription(s) are using this plan.`
      });
    }

    await plan.deleteOne();

    res.json({
      success: true,
      message: 'Subscription plan deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get subscription statistics
// @route   GET /api/admin/subscriptions/stats
// @access  Private (Admin)
exports.getSubscriptionStats = async (req, res, next) => {
  try {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

    const totalSubscribers = await Subscription.countDocuments({ status: 'active' });
    
    const lastMonthSubs = await Subscription.countDocuments({ 
      status: 'active',
      createdAt: { $gte: lastMonth } 
    });
    
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate());
    const prevMonthSubs = await Subscription.countDocuments({ 
      status: 'active',
      createdAt: { $gte: prevMonthStart, $lt: lastMonth } 
    });
    
    const subscriberGrowth = prevMonthSubs > 0
      ? ((lastMonthSubs - prevMonthSubs) / prevMonthSubs * 100).toFixed(1)
      : 0;

    // Calculate monthly revenue from active subscriptions
    const activeSubscriptions = await Subscription.find({ status: 'active' })
      .populate('plan');
    
    let monthlyRevenue = 0;
    activeSubscriptions.forEach(sub => {
      if (sub.plan) {
        if (sub.plan.interval === 'month') {
          monthlyRevenue += sub.plan.price;
        } else if (sub.plan.interval === 'year') {
          monthlyRevenue += sub.plan.price / 12;
        }
      }
    });

    res.json({
      success: true,
      data: {
        totalSubscribers,
        subscriberGrowth: parseFloat(subscriberGrowth),
        monthlyRevenue: monthlyRevenue.toFixed(2),
        revenueGrowth: 0,
        averageRating: 4.5
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = exports;

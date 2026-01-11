const User = require('../models/User.model');
const Course = require('../models/Course.model');
const Notification = require('../models/Notification.model');
const { SubscriptionPlan } = require('../models/Subscription.model');

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin)
exports.getAllUsers = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      role,
      status,
      search
    } = req.query;
    
    const query = {};
    
    if (role) query.role = role;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') }
      ];
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password -refreshTokens')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(query)
    ]);
    
    res.json({
      success: true,
      users,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user status
// @route   PUT /api/admin/users/:id/status
// @access  Private (Admin)
exports.updateUserStatus = async (req, res, next) => {
  try {
    const { status, reason } = req.body;
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    user.status = status;
    await user.save();
    
    // Send notification to user
    await Notification.create({
      user: user._id,
      type: 'system',
      title: 'Account Status Updated',
      message: `Your account status has been changed to ${status}. ${reason ? `Reason: ${reason}` : ''}`,
      priority: status === 'active' ? 'medium' : 'high',
      data: {
        status,
        reason,
        updatedBy: req.user._id
      }
    });
    
    res.json({
      success: true,
      user: user.getPublicProfile()
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get pending tutors
// @route   GET /api/admin/tutors/pending
// @access  Private (Admin)
exports.getPendingTutors = async (req, res, next) => {
  try {
    const tutors = await User.find({
      role: 'tutor',
      status: 'pending'
    }).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      tutors
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve/Reject tutor
// @route   PUT /api/admin/tutors/:id/approve
// @access  Private (Admin)
exports.approveTutor = async (req, res, next) => {
  try {
    const { approved, reason } = req.body;
    
    const tutor = await User.findById(req.params.id);
    
    if (!tutor || tutor.role !== 'tutor') {
      return res.status(404).json({
        success: false,
        message: 'Tutor not found'
      });
    }
    
    tutor.status = approved ? 'active' : 'inactive';
    await tutor.save();
    
    // Send notification to tutor
    await Notification.create({
      user: tutor._id,
      type: approved ? 'tutor_approved' : 'tutor_rejected',
      title: approved ? 'Tutor Application Approved' : 'Tutor Application Status',
      message: approved 
        ? 'Congratulations! Your tutor application has been approved. You can now start creating sessions and teaching students.'
        : `Your tutor application has been ${reason ? 'rejected' : 'not approved at this time'}. ${reason || 'Please contact support for more information.'}`,
      priority: 'high',
      data: {
        approved,
        reason,
        approvedBy: req.user._id
      },
      actionUrl: approved ? '/tutor' : '/profile'
    });
    
    res.json({
      success: true,
      tutor: tutor.getPublicProfile()
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all courses for admin management
// @route   GET /api/admin/courses
// @access  Private (Admin)
exports.getAllCoursesForAdmin = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      grade,
      subject,
      search
    } = req.query;
    
    const query = {};
    
    if (status) query.status = status;
    if (grade) query.grade = parseInt(grade);
    if (subject) query.subject = new RegExp(subject, 'i');
    if (search) {
      query.$text = { $search: search };
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [courses, total] = await Promise.all([
      Course.find(query)
        .populate('createdBy', 'name avatar email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Course.countDocuments(query)
    ]);
    
    res.json({
      success: true,
      courses,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get course statistics for admin dashboard
// @route   GET /api/admin/courses/stats
// @access  Private (Admin)
exports.getCourseStats = async (req, res, next) => {
  try {
    const totalCourses = await Course.countDocuments({});
    const publishedCourses = await Course.countDocuments({ status: 'published' });
    const draftCourses = await Course.countDocuments({ status: 'draft' });
    const archivedCourses = await Course.countDocuments({ status: 'archived' });
    
    // Get courses by subject
    const coursesBySubject = await Course.aggregate([
      { $group: { _id: '$subject', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    // Get courses by grade
    const coursesByGrade = await Course.aggregate([
      { $group: { _id: '$grade', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    res.json({
      success: true,
      stats: {
        totalCourses,
        publishedCourses,
        draftCourses,
        archivedCourses,
        coursesBySubject,
        coursesByGrade
      }
    });
  } catch (error) {
    next(error);
  }
};

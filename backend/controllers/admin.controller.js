const User = require('../models/User.model');
const Course = require('../models/Course.model');
const Notification = require('../models/Notification.model');
const { SubscriptionPlan } = require('../models/Subscription.model');
const StudentPerformance = require('../models/StudentPerformance.model');
const QuizEvaluationResult = require('../models/QuizEvaluationResult.model');

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
      data: users,
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

// @desc    Update user details
// @route   PUT /api/admin/users/:id
// @access  Private (Admin)
exports.updateUser = async (req, res, next) => {
  try {
    const { name, email, phone, bio, subjects, experience } = req.body;
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Update allowed fields
    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (phone !== undefined) user.phone = phone;
    if (bio !== undefined) user.bio = bio;
    if (subjects !== undefined) user.subjects = subjects;
    if (experience !== undefined) user.experience = experience;
    
    await user.save();
    
    res.json({
      success: true,
      user: user.getPublicProfile()
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin)
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Prevent deleting admin users
    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete admin users'
      });
    }
    
    // Hard delete the user
    await User.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'User deleted successfully'
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
      // Use regex search for more flexible matching (same as getCourses)
      const regex = new RegExp(search, 'i');
      query.$or = [
        { title: regex },
        { description: regex },
        { subject: regex }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get courses with question counts using aggregation
    const coursesWithCounts = await Course.aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'questions',
          localField: '_id',
          foreignField: 'courseId',
          as: 'questions'
        }
      },
      {
        $addFields: {
          questionCount: { $size: '$questions' }
        }
      },
      {
        $lookup: {
          from: 'users',
          let: { createdBy: '$createdBy' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$_id', '$$createdBy'] },
                    { $ne: ['$$createdBy', null] },
                    { $ne: ['$$createdBy', 'ADMIN_USER_ID_PLACEHOLDER'] }
                  ]
                }
              }
            }
          ],
          as: 'createdBy'
        }
      },
      {
        $unwind: {
          path: '$createdBy',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          questions: 0, // Remove the questions array from the result
          'createdBy.password': 0, // Remove password from populated user
          'createdBy.__v': 0 // Remove version field
        }
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: parseInt(limit) }
    ]);

    // Get total count
    const total = await Course.countDocuments(query);

    res.json({
      success: true,
      courses: coursesWithCounts,
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

// @desc    Get list of students with performance summary (paginated with filters)
// @route   GET /api/admin/students
// @access  Private (Admin)
exports.getStudentsWithPerformance = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search,
      grade,
      subject,
      dateFrom,
      dateTo,
      minAccuracy,
      maxAccuracy,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const match = { role: 'student' };
    if (search) {
      match.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') }
      ];
    }
    
    if (grade) {
      match.grade = grade;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const pipeline = [
      { $match: match },
      {
        $lookup: {
          from: 'studentperformances',
          localField: '_id',
          foreignField: 'studentId',
          as: 'performance'
        }
      },
      { $unwind: { path: '$performance', preserveNullAndEmptyArrays: true } }
    ];

    // Apply performance filters
    const performanceMatch = {};
    
    if (subject) {
      performanceMatch[`performance.subjectPerformance.${subject}`] = { $exists: true };
    }
    
    if (dateFrom || dateTo) {
      performanceMatch['performance.updatedAt'] = {};
      if (dateFrom) {
        performanceMatch['performance.updatedAt'].$gte = new Date(dateFrom);
      }
      if (dateTo) {
        performanceMatch['performance.updatedAt'].$lte = new Date(dateTo);
      }
    }
    
    if (minAccuracy !== undefined || maxAccuracy !== undefined) {
      performanceMatch['performance.overallAccuracy'] = {};
      if (minAccuracy !== undefined) {
        performanceMatch['performance.overallAccuracy'].$gte = parseFloat(minAccuracy);
      }
      if (maxAccuracy !== undefined) {
        performanceMatch['performance.overallAccuracy'].$lte = parseFloat(maxAccuracy);
      }
    }

    if (Object.keys(performanceMatch).length > 0) {
      pipeline.push({ $match: performanceMatch });
    }

    // Add ranking field based on overall accuracy
    pipeline.push({
      $addFields: {
        rank: {
          $cond: {
            if: { $ifNull: ['$performance.overallAccuracy', false] },
            then: '$performance.overallAccuracy',
            else: 0
          }
        }
      }
    });

    pipeline.push({
      $project: {
        password: 0,
        refreshTokens: 0,
        'performance.topicMastery': 0,
        'performance.recommendations': 0,
        'performance.trends': 0
      }
    });

    // Sorting
    const sortField = sortBy === 'accuracy' ? 'performance.overallAccuracy' : 
                     sortBy === 'quizzes' ? 'performance.totalQuizzesTaken' :
                     sortBy === 'name' ? 'name' : 'createdAt';
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    
    pipeline.push({ $sort: { [sortField]: sortDirection } });
    
    // Get total count before pagination
    const countPipeline = [...pipeline];
    countPipeline.push({ $count: 'total' });
    const countResult = await User.aggregate(countPipeline);
    const total = countResult.length > 0 ? countResult[0].total : 0;

    // Apply pagination
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: parseInt(limit) });

    const studentsWithPerformance = await User.aggregate(pipeline);

    res.json({
      success: true,
      students: studentsWithPerformance,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get detailed performance for a student
// @route   GET /api/admin/students/:id/performance
// @access  Private (Admin)
exports.getStudentPerformance = async (req, res, next) => {
  try {
    const studentId = req.params.id;

    const student = await User.findById(studentId).select('-password -refreshTokens');
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const performance = await StudentPerformance.findOne({ studentId });

    // Fetch recent quiz evaluation results (limit 50) and populate quiz/course titles
    const recentQuizzes = await QuizEvaluationResult.find({ studentId })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('quizId', 'title')
      .populate('courseId', 'title')
      .lean();

    // Process subject performance data
    let bySubject = [];
    if (performance && performance.subjectPerformance) {
      // Handle both Map and plain object formats
      const subjectData = performance.subjectPerformance instanceof Map 
        ? Object.fromEntries(performance.subjectPerformance) 
        : performance.subjectPerformance;
      
      bySubject = Object.entries(subjectData).map(([subject, data]) => ({
        subject,
        quizzesTaken: data.totalQuizzes || 0,
        questionsAttempted: data.totalQuestions || 0,
        correctAnswers: data.correctAnswers || 0,
        accuracy: data.averageAccuracy || 0,
        averageScore: data.averageScore || 0
      }));
    }

    // Calculate improvement areas based on processed subject data
    const weakAreas = bySubject.filter(subject => (subject.accuracy || 0) < 70);
    const strongAreas = bySubject.filter(subject => (subject.accuracy || 0) >= 80);

    // Calculate performance metrics
    const totalQuizzes = performance?.totalQuizzesTaken || 0;
    const totalQuestions = performance?.totalQuestionsAttempted || 0;
    const overallAccuracy = performance?.overallAccuracy || 0;
    const averageScore = performance?.averageScore || 0;

    // Calculate real weekly data from quiz evaluation results
    const weeklyData = [];
    if (recentQuizzes && recentQuizzes.length > 0) {
      // Group quizzes by week
      const weekGroups = {};
      
      recentQuizzes.forEach(quiz => {
        const date = new Date(quiz.createdAt);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
        const weekKey = weekStart.toISOString().split('T')[0];
        
        if (!weekGroups[weekKey]) {
          weekGroups[weekKey] = {
            week: `Week of ${weekStart.toLocaleDateString()}`,
            quizzes: 0,
            totalAccuracy: 0,
            accuracyCount: 0
          };
        }
        
        weekGroups[weekKey].quizzes += 1;
        if (quiz.accuracy !== undefined) {
          weekGroups[weekKey].totalAccuracy += quiz.accuracy;
          weekGroups[weekKey].accuracyCount += 1;
        }
      });
      
      // Convert to array and calculate averages
      Object.values(weekGroups).forEach(week => {
        weeklyData.push({
          week: week.week,
          accuracy: week.accuracyCount > 0 ? Math.round(week.totalAccuracy / week.accuracyCount) : 0,
          quizzes: week.quizzes
        });
      });
      
      // Sort by week (most recent first)
      weeklyData.sort((a, b) => new Date(b.week.replace('Week of ', '')) - new Date(a.week.replace('Week of ', '')));
    }

    // If no real data, provide sample data
    if (weeklyData.length === 0) {
      weeklyData.push(
        { week: 'Week 1', accuracy: 75, quizzes: 3 },
        { week: 'Week 2', accuracy: 78, quizzes: 4 },
        { week: 'Week 3', accuracy: 72, quizzes: 2 },
        { week: 'Week 4', accuracy: 82, quizzes: 5 }
      );
    }

    res.json({
      success: true,
      student,
      performance: {
        ...performance?.toObject(),
        bySubject,
        weakAreas,
        strongAreas,
        metrics: {
          totalQuizzes,
          totalQuestions,
          overallAccuracy,
          averageScore,
          averageTimePerQuestion: totalQuestions > 0 && performance?.totalTimeSpent ? 
            Math.round((performance.totalTimeSpent / totalQuestions)) : 0,
          totalStudyTime: performance?.totalTimeSpent || 0
        },
        weeklyData
      },
      recentQuizzes
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get student performance analytics and statistics
// @route   GET /api/admin/performance/analytics
// @access  Private (Admin)
exports.getPerformanceAnalytics = async (req, res, next) => {
  try {
    const { grade, subject, dateFrom, dateTo } = req.query;

    // Build match criteria
    const userMatch = { role: 'student' };
    if (grade) userMatch.grade = grade;

    const performanceMatch = {};
    if (dateFrom || dateTo) {
      performanceMatch.updatedAt = {};
      if (dateFrom) performanceMatch.updatedAt.$gte = new Date(dateFrom);
      if (dateTo) performanceMatch.updatedAt.$lte = new Date(dateTo);
    }

    // Get overall statistics
    const overallStats = await StudentPerformance.aggregate([
      ...(Object.keys(performanceMatch).length > 0 ? [{ $match: performanceMatch }] : []),
      {
        $group: {
          _id: null,
          totalStudents: { $sum: 1 },
          avgAccuracy: { $avg: '$overallAccuracy' },
          avgScore: { $avg: '$averageScore' },
          totalQuizzes: { $sum: '$totalQuizzesTaken' },
          totalQuestions: { $sum: '$totalQuestionsAttempted' },
          totalCorrect: { $sum: '$totalCorrectAnswers' }
        }
      }
    ]);

    // Get subject-wise statistics
    const subjectStats = await StudentPerformance.aggregate([
      ...(Object.keys(performanceMatch).length > 0 ? [{ $match: performanceMatch }] : []),
      { $project: { subjectPerformance: { $objectToArray: '$subjectPerformance' } } },
      { $unwind: '$subjectPerformance' },
      {
        $group: {
          _id: '$subjectPerformance.k',
          avgAccuracy: { $avg: '$subjectPerformance.v.averageAccuracy' },
          avgScore: { $avg: '$subjectPerformance.v.averageScore' },
          totalQuizzes: { $sum: '$subjectPerformance.v.totalQuizzes' },
          totalQuestions: { $sum: '$subjectPerformance.v.totalQuestions' },
          studentCount: { $sum: 1 }
        }
      },
      { $sort: { totalQuizzes: -1 } }
    ]);

    // Get grade-wise distribution
    const gradeDistribution = await User.aggregate([
      { $match: userMatch },
      {
        $lookup: {
          from: 'studentperformances',
          localField: '_id',
          foreignField: 'studentId',
          as: 'performance'
        }
      },
      { $unwind: { path: '$performance', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$grade',
          studentCount: { $sum: 1 },
          avgAccuracy: { $avg: '$performance.overallAccuracy' },
          totalQuizzes: { $sum: '$performance.totalQuizzesTaken' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get accuracy distribution
    const accuracyDistribution = await StudentPerformance.aggregate([
      ...(Object.keys(performanceMatch).length > 0 ? [{ $match: performanceMatch }] : []),
      {
        $bucket: {
          groupBy: '$overallAccuracy',
          boundaries: [0, 20, 40, 60, 80, 100],
          default: 'Other',
          output: {
            count: { $sum: 1 },
            students: { $push: '$studentId' }
          }
        }
      }
    ]);

    // Get top performers (top 10)
    const topPerformers = await StudentPerformance.aggregate([
      ...(Object.keys(performanceMatch).length > 0 ? [{ $match: performanceMatch }] : []),
      { $sort: { overallAccuracy: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: 'studentId',
          foreignField: '_id',
          as: 'student'
        }
      },
      { $unwind: '$student' },
      {
        $project: {
          studentId: 1,
          studentName: '$student.name',
          studentEmail: '$student.email',
          grade: '$student.grade',
          overallAccuracy: 1,
          averageScore: 1,
          totalQuizzesTaken: 1
        }
      }
    ]);

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentActivity = await QuizEvaluationResult.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          quizCount: { $sum: 1 },
          avgScore: { $avg: '$score' },
          uniqueStudents: { $addToSet: '$studentId' }
        }
      },
      {
        $project: {
          date: '$_id',
          quizCount: 1,
          avgScore: 1,
          studentCount: { $size: '$uniqueStudents' }
        }
      },
      { $sort: { date: 1 } }
    ]);

    res.json({
      success: true,
      analytics: {
        overall: overallStats[0] || {},
        bySubject: subjectStats,
        byGrade: gradeDistribution,
        accuracyDistribution,
        topPerformers,
        recentActivity
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get student performance leaderboard
// @route   GET /api/admin/performance/leaderboard
// @access  Private (Admin)
exports.getPerformanceLeaderboard = async (req, res, next) => {
  try {
    const { grade, subject, limit = 50, metric = 'accuracy' } = req.query;

    const userMatch = { role: 'student' };
    if (grade) userMatch.grade = grade;

    let sortField = 'overallAccuracy';
    if (metric === 'quizzes') sortField = 'totalQuizzesTaken';
    if (metric === 'score') sortField = 'averageScore';

    const pipeline = [
      {
        $lookup: {
          from: 'users',
          localField: 'studentId',
          foreignField: '_id',
          as: 'student'
        }
      },
      { $unwind: '$student' },
      { $match: { 'student.role': 'student' } }
    ];

    if (grade) {
      pipeline.push({ $match: { 'student.grade': grade } });
    }

    if (subject) {
      pipeline.push({
        $match: { [`subjectPerformance.${subject}`]: { $exists: true } }
      });
      // If filtering by subject, sort by subject-specific accuracy
      pipeline.push({
        $addFields: {
          subjectAccuracy: `$subjectPerformance.${subject}.averageAccuracy`
        }
      });
      sortField = 'subjectAccuracy';
    }

    pipeline.push(
      { $sort: { [sortField]: -1 } },
      { $limit: parseInt(limit) },
      {
        $project: {
          rank: { $add: [{ $indexOfArray: [[], null] }, 1] },
          studentId: 1,
          studentName: '$student.name',
          studentEmail: '$student.email',
          grade: '$student.grade',
          overallAccuracy: 1,
          averageScore: 1,
          totalQuizzesTaken: 1,
          totalQuestionsAttempted: 1,
          totalCorrectAnswers: 1,
          subjectAccuracy: 1
        }
      }
    );

    const leaderboard = await StudentPerformance.aggregate(pipeline);

    // Add rank to each entry
    leaderboard.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    res.json({
      success: true,
      leaderboard,
      filters: { grade, subject, metric }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Export student performance data
// @route   GET /api/admin/performance/export
// @access  Private (Admin)
exports.exportPerformanceData = async (req, res, next) => {
  try {
    const { 
      grade, 
      subject, 
      dateFrom, 
      dateTo,
      format = 'json' 
    } = req.query;

    const userMatch = { role: 'student' };
    if (grade) userMatch.grade = grade;

    const performanceMatch = {};
    if (dateFrom || dateTo) {
      performanceMatch.updatedAt = {};
      if (dateFrom) performanceMatch.updatedAt.$gte = new Date(dateFrom);
      if (dateTo) performanceMatch.updatedAt.$lte = new Date(dateTo);
    }

    const pipeline = [
      ...(Object.keys(performanceMatch).length > 0 ? [{ $match: performanceMatch }] : []),
      {
        $lookup: {
          from: 'users',
          localField: 'studentId',
          foreignField: '_id',
          as: 'student'
        }
      },
      { $unwind: '$student' },
      { $match: userMatch }
    ];

    if (subject) {
      pipeline.push({
        $match: { [`subjectPerformance.${subject}`]: { $exists: true } }
      });
    }

    pipeline.push({
      $project: {
        studentName: '$student.name',
        studentEmail: '$student.email',
        grade: '$student.grade',
        totalQuizzesTaken: 1,
        totalQuestionsAttempted: 1,
        totalCorrectAnswers: 1,
        overallAccuracy: 1,
        averageScore: 1,
        totalTimeSpent: 1,
        subjectPerformance: 1,
        weakAreas: 1,
        strongAreas: 1,
        lastActivity: '$updatedAt'
      }
    });

    const performanceData = await StudentPerformance.aggregate(pipeline);

    if (format === 'csv') {
      // Convert to CSV format
      const csv = convertToCSV(performanceData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=student-performance-${Date.now()}.csv`);
      res.send(csv);
    } else {
      // Return as JSON
      res.json({
        success: true,
        data: performanceData,
        count: performanceData.length,
        exportedAt: new Date(),
        filters: { grade, subject, dateFrom, dateTo }
      });
    }
  } catch (error) {
    next(error);
  }
};

// Helper function to convert JSON to CSV
function convertToCSV(data) {
  if (data.length === 0) return '';

  const headers = [
    'Student Name',
    'Email',
    'Grade',
    'Quizzes Taken',
    'Questions Attempted',
    'Correct Answers',
    'Accuracy (%)',
    'Average Score',
    'Time Spent (min)',
    'Last Activity'
  ];

  const rows = data.map(student => [
    student.studentName || '',
    student.studentEmail || '',
    student.grade || '',
    student.totalQuizzesTaken || 0,
    student.totalQuestionsAttempted || 0,
    student.totalCorrectAnswers || 0,
    student.overallAccuracy?.toFixed(2) || 0,
    student.averageScore?.toFixed(2) || 0,
    student.totalTimeSpent ? (student.totalTimeSpent / 60).toFixed(2) : 0,
    student.lastActivity ? new Date(student.lastActivity).toISOString() : ''
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  return csvContent;
}


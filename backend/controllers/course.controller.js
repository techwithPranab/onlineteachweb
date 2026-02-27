const Course = require('../models/Course.model');
const User = require('../models/User.model');

// @desc    Create course
// @route   POST /api/courses
// @access  Private (Admin only)
exports.createCourse = async (req, res, next) => {
  try {
    // Only allow admins to create courses
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can create courses'
      });
    }

    const { title, description, grade, subject, price, thumbnail, syllabus, topics, duration, level, language, maxStudents, tags } = req.body;
    
    const course = await Course.create({
      title,
      description,
      grade,
      subject,
      price,
      thumbnail,
      syllabus,
      topics,
      duration,
      level,
      language,
      maxStudents,
      tags,
      createdBy: req.user._id
    });
    
    await course.populate('createdBy', 'name avatar');
    
    res.status(201).json({
      success: true,
      course
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all courses with filters
// @route   GET /api/courses
// @access  Private
exports.getCourses = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      grade,
      subject,
      status,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = { isActive: true };

    if (grade) query.grade = parseInt(grade);
    if (subject) query.subject = new RegExp(subject, 'i');
    if (status) query.status = status;
    if (search) {
      // use regex search for more flexible matching (fallback to text index if available)
      // this allows partial/substring matches which users expect from a search box
      const regex = new RegExp(search, 'i');
      query.$or = [
        { title: regex },
        { description: regex },
        { subject: regex }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

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
      { $sort: sort },
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

// @desc    Get public courses
// @route   GET /api/courses/public
// @access  Public
exports.getPublicCourses = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 50,
      grade,
      subject,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = { isActive: true, status: 'published' };

    if (grade) query.grade = parseInt(grade);
    if (subject) query.subject = new RegExp(subject, 'i');
    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { title: regex },
        { description: regex },
        { subject: regex }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    // Get courses with question counts
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
          from: 'quizsessions',
          let: { courseId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$courseId', '$$courseId'] },
                    { $in: ['$status', ['completed', 'submitted', 'auto-submitted']] }
                  ]
                }
              }
            },
            { $count: 'count' }
          ],
          as: 'quizSessionsData'
        }
      },
      {
        $addFields: {
          completedQuizCount: {
            $ifNull: [{ $arrayElemAt: ['$quizSessionsData.count', 0] }, 0]
          }
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
          quizSessionsData: 0, // Remove raw quiz sessions data
          'createdBy.password': 0, // Remove password from populated user
          'createdBy.__v': 0 // Remove version field
        }
      },
      { $sort: sort },
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

// @desc    Get course by ID
// @route   GET /api/courses/:id
// @access  Private
exports.getCourseById = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('createdBy', 'name avatar bio');
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    // Get materials and sessions
    const Material = require('../models/Material.model');
    const Session = require('../models/Session.model');
    const Question = require('../models/Question.model');
    const QuizSession = require('../models/QuizSession.model');

    const [sessions, questionCount, completedQuizCount] = await Promise.all([
      Session.find({ course: course._id }).sort('scheduledAt'),
      Question.countDocuments({ courseId: course._id }),
      QuizSession.countDocuments({
        courseId: course._id,
        status: { $in: ['completed', 'submitted', 'auto-submitted'] }
      })
    ]);

    res.json({
      success: true,
      course: {
        ...course.toObject(),
        questionCount,
        completedQuizCount,
        createdBy: course.createdBy || null // Handle missing createdBy
      },
      materials: [],
      sessions
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private (Admin only)
exports.updateCourse = async (req, res, next) => {
  try {
    // Only allow admins to update courses
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can update courses'
      });
    }

    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    const { title, description, grade, subject, board, duration, level, language, maxStudents, price, thumbnail, syllabus, topics, status, tags } = req.body;
    
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (grade !== undefined) updateData.grade = grade;
    if (subject !== undefined) updateData.subject = subject;
    if (board !== undefined) updateData.board = board;
    if (duration !== undefined) updateData.duration = duration;
    if (level !== undefined) updateData.level = level;
    if (language !== undefined) updateData.language = language;
    if (maxStudents !== undefined) updateData.maxStudents = maxStudents;
    if (price !== undefined) updateData.price = price;
    if (thumbnail !== undefined) updateData.thumbnail = thumbnail;
    if (syllabus !== undefined) updateData.syllabus = syllabus;
    if (topics !== undefined) updateData.topics = topics;
    if (status !== undefined) updateData.status = status;
    if (tags !== undefined) updateData.tags = tags;
    
    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name avatar');
    
    res.json({
      success: true,
      course: updatedCourse
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private (Admin only)
exports.deleteCourse = async (req, res, next) => {
  try {
    // Only allow admins to delete courses
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can delete courses'
      });
    }

    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    // Soft delete
    course.isActive = false;
    await course.save();
    
    res.json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit course review (DEPRECATED - Use /api/reviews endpoint)
// @route   POST /api/courses/:id/review
// @access  Private (Student only)
exports.submitReview = async (req, res, next) => {
  try {
    return res.status(410).json({
      success: false,
      message: 'This endpoint is deprecated. Please use POST /api/reviews to submit reviews.',
      newEndpoint: '/api/reviews'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get course students
// @route   GET /api/courses/:id/students
// @access  Private (Tutor/Admin only)
exports.getCourseStudents = async (req, res, next) => {
  try {
    const Subscription = require('../models/Subscription.model');
    
    const subscriptions = await Subscription.find({ 
      course: req.params.id,
      status: 'active'
    }).populate('student', 'name email avatar');
    
    const students = subscriptions.map(sub => sub.student);
    
    res.json({
      success: true,
      students
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get completed quiz count for a specific course (current student)
// @route   GET /api/courses/:id/quiz-count
// @access  Private
exports.getCourseQuizCount = async (req, res, next) => {
  try {
    const QuizSession = require('../models/QuizSession.model');
    const count = await QuizSession.countDocuments({
      courseId: req.params.id,
      studentId: req.user._id,
      status: { $in: ['completed', 'submitted', 'auto-submitted'] }
    });
    res.json({ success: true, count });
  } catch (error) {
    next(error);
  }
};

// @desc    Get unique grades
// @route   GET /api/courses/grades
// @access  Private
exports.getGrades = async (req, res, next) => {
  try {
    const grades = await Course.distinct('grade');
    res.json({
      success: true,
      grades: grades.sort((a, b) => a - b)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get unique subjects
// @route   GET /api/courses/subjects
// @access  Private
exports.getSubjects = async (req, res, next) => {
  try {
    const userGrade = req.user?.grade;

    // Build match query - only filter by grade if user has a grade set
    const matchQuery = { isActive: true };
    if (userGrade) {
      matchQuery.grade = userGrade;
    }

    // Get subjects with courses (filtered by user's grade if available)
    const subjectsWithCourses = await Course.aggregate([
      {
        $match: matchQuery
      },
      {
        $group: {
          _id: '$subject',
          courses: {
            $push: {
              _id: '$_id',
              title: '$title',
              grade: '$grade'
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          name: '$_id',
          courses: 1
        }
      },
      {
        $sort: { name: 1 }
      }
    ]);

    res.json({
      success: true,
      subjects: subjectsWithCourses
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get subjects by grade
// @route   GET /api/courses/grades/:grade/subjects
// @access  Private
exports.getSubjectsByGrade = async (req, res, next) => {
  try {
    const grade = parseInt(req.params.grade);
    const subjects = await Course.distinct('subject', { grade });
    res.json({
      success: true,
      subjects: subjects.sort()
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get courses by grade and subject
// @route   GET /api/courses/grades/:grade/subjects/:subject/courses
// @access  Private
exports.getCoursesByGradeAndSubject = async (req, res, next) => {
  try {
    const grade = parseInt(req.params.grade);
    const subject = req.params.subject;
    const courses = await Course.find({ grade, subject }, 'title _id grade subject');
    res.json({
      success: true,
      courses
    });
  } catch (error) {
    next(error);
  }
};

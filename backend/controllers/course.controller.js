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
      query.$text = { $search: search };
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
    
    const [courses, total] = await Promise.all([
      Course.find(query)
        .populate('createdBy', 'name avatar')
        .sort(sort)
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
      query.$text = { $search: search };
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
    
    const [courses, total] = await Promise.all([
      Course.find(query)
        .populate('createdBy', 'name avatar')
        .sort(sort)
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

// @desc    Get course by ID
// @route   GET /api/courses/:id
// @access  Private
exports.getCourseById = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('createdBy', 'name avatar bio')
      .populate('reviews.student', 'name avatar');
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    // Get materials and sessions
    const Material = require('../models/Material.model');
    const Session = require('../models/Session.model');
    
    const [materials, sessions] = await Promise.all([
      Material.find({ course: course._id, isActive: true }).sort('order'),
      Session.find({ course: course._id }).sort('scheduledAt')
    ]);
    
    res.json({
      success: true,
      course: {
        ...course.toObject(),
        createdBy: course.createdBy || null // Handle missing createdBy
      },
      materials,
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

// @desc    Submit course review
// @route   POST /api/courses/:id/review
// @access  Private (Student only)
exports.submitReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    // Check if user already reviewed
    const existingReview = course.reviews.find(
      r => r.student.toString() === req.user._id.toString()
    );
    
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this course'
      });
    }
    
    // Add review
    course.reviews.push({
      student: req.user._id,
      rating,
      comment,
      createdAt: new Date()
    });
    
    // Update course rating
    const totalRatings = course.reviews.reduce((sum, review) => sum + review.rating, 0);
    course.rating = totalRatings / course.reviews.length;
    course.reviewCount = course.reviews.length;
    course.totalRatings = totalRatings;
    
    await course.save();
    await course.populate('reviews.student', 'name avatar');
    
    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      course
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
    const subjects = await Course.distinct('subject');
    res.json({
      success: true,
      subjects: subjects.sort()
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

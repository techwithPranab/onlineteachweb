const Session = require('../models/Session.model');
const Course = require('../models/Course.model');
const Attendance = require('../models/Attendance.model');
const crypto = require('crypto');

// @desc    Create session
// @route   POST /api/sessions
// @access  Private (Tutor)
exports.createSession = async (req, res, next) => {
  try {
    // Only allow tutors to create sessions
    if (req.user.role !== 'tutor') {
      return res.status(403).json({
        success: false,
        message: 'Only tutors can create sessions'
      });
    }

    const { courseId, title, description, scheduledAt, duration, maxStudents, isPaid } = req.body;
    
    // Verify course exists
    const course = await Course.findById(courseId);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if course is published
    if (course.status !== 'published') {
      return res.status(400).json({
        success: false,
        message: 'Cannot create sessions for unpublished courses'
      });
    }
    
    const session = await Session.create({
      course: courseId,
      tutor: req.user._id,
      title,
      description,
      scheduledAt,
      duration,
      maxStudents,
      isPaid,
      roomId: crypto.randomUUID()
    });
    
    await session.populate('course', 'title');
    
    res.status(201).json({
      success: true,
      session
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get sessions with filters
// @route   GET /api/sessions
// @access  Private
exports.getSessions = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      courseId,
      tutorId,
      studentId,
      status,
      upcoming
    } = req.query;
    
    const query = {};
    
    if (courseId) query.course = courseId;
    if (tutorId) query.tutor = tutorId;
    if (status) query.status = status;
    
    if (upcoming === 'true') {
      query.scheduledAt = { $gte: new Date() };
      query.status = 'scheduled';
    }
    
    if (studentId) {
      query['attendees.student'] = studentId;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [sessions, total] = await Promise.all([
      Session.find(query)
        .populate('course', 'title thumbnail')
        .populate('tutor', 'name avatar')
        .sort({ scheduledAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Session.countDocuments(query)
    ]);
    
    res.json({
      success: true,
      sessions,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get session by ID
// @route   GET /api/sessions/:id
// @access  Private
exports.getSessionById = async (req, res, next) => {
  try {
    const session = await Session.findById(req.params.id)
      .populate('course', 'title thumbnail')
      .populate('tutor', 'name avatar bio')
      .populate('attendees.student', 'name avatar');
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }
    
    const Material = require('../models/Material.model');
    const materials = await Material.find({ 
      _id: { $in: session.materials } 
    });
    
    res.json({
      success: true,
      session,
      attendees: session.attendees,
      materials
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update session
// @route   PUT /api/sessions/:id
// @access  Private (Tutor)
exports.updateSession = async (req, res, next) => {
  try {
    const session = await Session.findById(req.params.id);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }
    
    // Check ownership
    if (session.tutor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this session'
      });
    }
    
    const { title, description, scheduledAt, duration, maxStudents } = req.body;
    
    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (scheduledAt) updateData.scheduledAt = scheduledAt;
    if (duration) updateData.duration = duration;
    if (maxStudents) updateData.maxStudents = maxStudents;
    
    const updatedSession = await Session.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('course', 'title');
    
    res.json({
      success: true,
      session: updatedSession
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete session
// @route   DELETE /api/sessions/:id
// @access  Private (Tutor)
exports.deleteSession = async (req, res, next) => {
  try {
    const session = await Session.findById(req.params.id);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }
    
    // Check ownership
    if (session.tutor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this session'
      });
    }
    
    // Can't delete ongoing or completed sessions
    if (session.status === 'ongoing' || session.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete ongoing or completed sessions'
      });
    }
    
    await session.deleteOne();
    
    res.json({
      success: true,
      message: 'Session deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

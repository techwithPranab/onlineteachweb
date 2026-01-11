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
    
    // Filter sessions based on user role
    if (req.user.role === 'student') {
      // Students can only see approved sessions
      query.status = { $in: ['scheduled', 'ongoing', 'completed'] };
    } else if (req.user.role === 'tutor') {
      // Tutors can see their own sessions regardless of approval status
      query.tutor = req.user._id;
    }
    // Admins can see all sessions
    
    if (upcoming === 'true') {
      query.scheduledAt = { $gte: new Date() };
      if (req.user.role === 'student') {
        query.status = 'scheduled';
      } else {
        query.status = { $in: ['pending_approval', 'scheduled'] };
      }
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

// @desc    Approve session
// @route   PUT /api/sessions/:id/approve
// @access  Private (Admin)
exports.approveSession = async (req, res, next) => {
  try {
    const session = await Session.findById(req.params.id).populate('course tutor');
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }
    
    if (session.status !== 'pending_approval') {
      return res.status(400).json({
        success: false,
        message: 'Session is not pending approval'
      });
    }
    
    session.status = 'scheduled';
    session.approvedBy = req.user._id;
    session.approvedAt = new Date();
    session.rejectionReason = undefined; // Clear any previous rejection reason
    
    await session.save();
    
    res.json({
      success: true,
      message: 'Session approved successfully',
      session
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject session
// @route   PUT /api/sessions/:id/reject
// @access  Private (Admin)
exports.rejectSession = async (req, res, next) => {
  try {
    const { reason } = req.body;
    
    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }
    
    const session = await Session.findById(req.params.id).populate('course tutor');
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }
    
    if (session.status !== 'pending_approval') {
      return res.status(400).json({
        success: false,
        message: 'Session is not pending approval'
      });
    }
    
    session.status = 'rejected';
    session.rejectionReason = reason.trim();
    
    await session.save();
    
    res.json({
      success: true,
      message: 'Session rejected successfully',
      session
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel session (Admin only)
// @route   PUT /api/sessions/:id/cancel
// @access  Private (Admin)
exports.cancelSession = async (req, res, next) => {
  try {
    const { reason } = req.body;
    
    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cancellation reason is required'
      });
    }
    
    const session = await Session.findById(req.params.id).populate('course tutor');
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }
    
    // Can't cancel completed or ongoing sessions
    if (session.status === 'completed' || session.status === 'ongoing') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel completed or ongoing sessions'
      });
    }
    
    session.status = 'cancelled';
    session.rejectionReason = reason.trim(); // Reuse the field for cancellation reason
    
    await session.save();
    
    res.json({
      success: true,
      message: 'Session cancelled successfully',
      session
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reassign session to different tutor (Admin only)
// @route   PUT /api/sessions/:id/reassign
// @access  Private (Admin)
exports.reassignSession = async (req, res, next) => {
  try {
    const { newTutorId } = req.body;
    
    if (!newTutorId) {
      return res.status(400).json({
        success: false,
        message: 'New tutor ID is required'
      });
    }
    
    const session = await Session.findById(req.params.id).populate('course tutor');
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }
    
    // Can't reassign completed or ongoing sessions
    if (session.status === 'completed' || session.status === 'ongoing') {
      return res.status(400).json({
        success: false,
        message: 'Cannot reassign completed or ongoing sessions'
      });
    }
    
    // Verify new tutor exists and is actually a tutor
    const newTutor = await require('../models/User.model').findById(newTutorId);
    if (!newTutor || newTutor.role !== 'tutor') {
      return res.status(400).json({
        success: false,
        message: 'Invalid tutor selected'
      });
    }
    
    session.tutor = newTutorId;
    
    await session.save();
    
    // Populate the updated session
    await session.populate('tutor', 'name email avatar');
    
    res.json({
      success: true,
      message: 'Session reassigned successfully',
      session
    });
  } catch (error) {
    next(error);
  }
};

exports.getPendingSessions = async (req, res, next) => {
  try {
    const { limit } = req.query;
    
    const query = { status: 'pending_approval' };
    
    let sessions;
    if (limit) {
      sessions = await Session.find(query)
        .populate('tutor', 'name email avatar')
        .populate('course', 'title subject grade')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit));
    } else {
      sessions = await Session.find(query)
        .populate('tutor', 'name email avatar')
        .populate('course', 'title subject grade')
        .sort({ createdAt: -1 });
    }
    
    res.json({
      success: true,
      data: sessions,
      count: sessions.length
    });
  } catch (error) {
    next(error);
  }
};

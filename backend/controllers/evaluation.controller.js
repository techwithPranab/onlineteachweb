const Evaluation = require('../models/Evaluation.model');
const Session = require('../models/Session.model');
const User = require('../models/User.model');

// @desc    Create evaluation
// @route   POST /api/evaluations
// @access  Private (Tutor)
exports.createEvaluation = async (req, res, next) => {
  try {
    const { sessionId, studentId, grade, feedback, achievements } = req.body;
    
    // Verify session
    const session = await Session.findById(sessionId);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }
    
    if (session.tutor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }
    
    // Verify student
    const student = await User.findById(studentId);
    
    if (!student || student.role !== 'student') {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    
    const evaluation = await Evaluation.create({
      session: sessionId,
      course: session.course,
      student: studentId,
      tutor: req.user._id,
      grade,
      feedback,
      achievements
    });
    
    await evaluation.populate([
      { path: 'student', select: 'name avatar' },
      { path: 'session', select: 'title' }
    ]);
    
    res.status(201).json({
      success: true,
      evaluation
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get evaluations for student
// @route   GET /api/evaluations/student/:id
// @access  Private
exports.getStudentEvaluations = async (req, res, next) => {
  try {
    const { sessionId, limit = 10 } = req.query;
    
    // Check authorization
    if (req.user.role === 'student' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }
    
    const query = { student: req.params.id };
    if (sessionId) query.session = sessionId;
    
    const evaluations = await Evaluation.find(query)
      .populate('session', 'title')
      .populate('tutor', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    res.json({
      success: true,
      evaluations
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get evaluations for session
// @route   GET /api/evaluations/session/:id
// @access  Private (Tutor)
exports.getSessionEvaluations = async (req, res, next) => {
  try {
    const session = await Session.findById(req.params.id);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }
    
    if (session.tutor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }
    
    const evaluations = await Evaluation.find({ session: req.params.id })
      .populate('student', 'name avatar grade');
    
    res.json({
      success: true,
      evaluations
    });
  } catch (error) {
    next(error);
  }
};

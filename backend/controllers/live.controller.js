const Session = require('../models/Session.model');
const jwt = require('jsonwebtoken');

// @desc    Generate live class token
// @route   POST /api/live/token
// @access  Private
exports.generateToken = async (req, res, next) => {
  try {
    const { sessionId } = req.body;
    
    const session = await Session.findById(sessionId);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }
    
    // Check if user is tutor or enrolled student
    const isTutor = session.tutor.toString() === req.user._id.toString();
    const isEnrolled = session.attendees.some(
      a => a.student.toString() === req.user._id.toString()
    );
    
    if (!isTutor && !isEnrolled) {
      return res.status(403).json({
        success: false,
        message: 'Not enrolled in this session'
      });
    }
    
    // Generate room token
    const token = jwt.sign(
      {
        sessionId: session._id,
        roomId: session.roomId,
        userId: req.user._id,
        role: isTutor ? 'host' : 'participant'
      },
      process.env.JWT_SECRET,
      { expiresIn: '6h' }
    );
    
    res.json({
      success: true,
      token,
      roomId: session.roomId
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Start live session
// @route   POST /api/live/start
// @access  Private (Tutor)
exports.startSession = async (req, res, next) => {
  try {
    const { sessionId } = req.body;
    
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
    
    session.status = 'ongoing';
    session.startedAt = new Date();
    await session.save();
    
    // Emit socket event
    const io = req.app.get('io');
    io.to(session.roomId).emit('session:started', { sessionId });
    
    res.json({
      success: true,
      session
    });
  } catch (error) {
    next(error);
  }
};

// @desc    End live session
// @route   POST /api/live/end
// @access  Private (Tutor)
exports.endSession = async (req, res, next) => {
  try {
    const { sessionId } = req.body;
    
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
    
    session.status = 'completed';
    session.endedAt = new Date();
    
    if (session.startedAt) {
      session.actualDuration = Math.round(
        (session.endedAt - session.startedAt) / (1000 * 60)
      );
    }
    
    await session.save();
    
    // Emit socket event
    const io = req.app.get('io');
    io.to(session.roomId).emit('session:ended', { sessionId });
    
    res.json({
      success: true,
      session,
      recordingUrl: session.recordingUrl
    });
  } catch (error) {
    next(error);
  }
};

const ActiveQuiz = require('../models/ActiveQuiz.model');
const Quiz = require('../models/Quiz.model');
const Question = require('../models/Question.model');
const User = require('../models/User.model');
const QuizSession = require('../models/QuizSession.model');
const logger = require('../utils/logger');

/**
 * Quiz Assignment/Distribution Controller
 * 
 * Handles distribution of quizzes to specific students by tutors/admins
 */

// @desc    Assign/Distribute quiz to students
// @route   POST /api/quizzes/:id/assign
// @access  Private (Tutor, Admin)
exports.assignQuizToStudents = async (req, res, next) => {
  try {
    const { id: quizId } = req.params;
    const { studentIds, dueDate } = req.body;
    
    // Validate input
    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least one student ID'
      });
    }
    
    // Get the quiz
    const quiz = await Quiz.findById(quizId).populate('courseId', 'title subject grade');
    
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }
    
    // Verify quiz is published
    if (quiz.status !== 'published') {
      return res.status(400).json({
        success: false,
        message: 'Quiz must be published before assignment'
      });
    }
    
    // Verify all student IDs are valid
    const students = await User.find({
      _id: { $in: studentIds },
      role: 'student'
    });
    
    if (students.length !== studentIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Some student IDs are invalid or not students'
      });
    }
    
    // Get selected questions for the quiz (preview)
    const allQuestions = await Question.find({
      courseId: quiz.courseId,
      isActive: true
    }).limit(quiz.questionConfig.totalQuestions);
    
    // Create ActiveQuiz record for the distribution
    const activeQuiz = await ActiveQuiz.create({
      quizId: quizId,
      sessionId: `assignment-${Date.now()}`, // Unique session ID for assignment
      userId: req.user._id, // Legacy field - creator
      createdBy: req.user._id,
      creatorRole: req.user.role,
      distributedStudents: studentIds,
      subject: quiz.courseId?.subject || 'General',
      courseName: quiz.courseId?.title || quiz.title,
      courseId: quiz.courseId,
      difficulty: quiz.difficultyLevel,
      questionCount: quiz.questionConfig.totalQuestions,
      duration: quiz.duration * 60, // Convert minutes to seconds
      status: 'active',
      questions: allQuestions.map(q => ({
        id: q._id.toString(),
        question: q.questionText,
        type: q.type || 'mcq-single',
        options: q.options || [],
        correctAnswer: q.correctAnswer,
        expectedAnswer: q.expectedAnswer,
        numericalAnswer: q.numericalAnswer,
        explanation: q.explanation,
        topic: q.topic,
        difficulty: q.difficulty,
        marks: q.marks || 1,
        timeLimit: q.timeLimit
      })),
      totalMarks: quiz.totalMarks,
      algorithmUsed: 'tutor-assigned',
      performanceData: {
        assignedBy: req.user._id,
        assignedAt: new Date(),
        dueDate: dueDate || null
      }
    });
    
    logger.info(`Quiz ${quizId} assigned to ${studentIds.length} students by ${req.user._id}`);
    
    res.status(201).json({
      success: true,
      message: `Quiz assigned to ${studentIds.length} student(s)`,
      assignment: {
        activeQuizId: activeQuiz._id,
        quizId: quiz._id,
        quizTitle: quiz.title,
        studentsAssigned: studentIds.length,
        dueDate: dueDate || null
      }
    });
  } catch (error) {
    logger.error(`Quiz assignment error: ${error.message}`);
    next(error);
  }
};

// @desc    Get assignments for a quiz (who it's assigned to)
// @route   GET /api/quizzes/:id/assignments
// @access  Private (Tutor, Admin)
exports.getQuizAssignments = async (req, res, next) => {
  try {
    const { id: quizId } = req.params;
    
    // Find all ActiveQuiz records for this quiz
    const assignments = await ActiveQuiz.find({
      quizId: quizId,
      isDeleted: false
    })
    .populate('distributedStudents', 'name email')
    .populate('createdBy', 'name role')
    .sort({ createdAt: -1 });
    
    // For each assignment, get completion status from QuizSession
    const assignmentsWithStatus = await Promise.all(
      assignments.map(async (assignment) => {
        const completionStatus = await Promise.all(
          assignment.distributedStudents.map(async (student) => {
            const session = await QuizSession.findOne({
              activeQuizId: assignment._id,
              studentId: student._id,
              status: { $in: ['completed', 'submitted', 'auto-submitted'] }
            });
            
            return {
              studentId: student._id,
              studentName: student.name,
              studentEmail: student.email,
              completed: !!session,
              completedAt: session?.submittedAt || null,
              score: session?.totalScore || null,
              percentage: session?.percentage || null
            };
          })
        );
        
        return {
          assignmentId: assignment._id,
          createdBy: assignment.createdBy,
          createdAt: assignment.createdAt,
          status: assignment.status,
          students: completionStatus,
          totalStudents: assignment.distributedStudents.length,
          completedCount: completionStatus.filter(s => s.completed).length
        };
      })
    );
    
    res.json({
      success: true,
      quizId,
      assignments: assignmentsWithStatus
    });
  } catch (error) {
    logger.error(`Get quiz assignments error: ${error.message}`);
    next(error);
  }
};

// @desc    Update quiz assignment (add/remove students)
// @route   PUT /api/quizzes/:id/assignments/:assignmentId
// @access  Private (Tutor, Admin)
exports.updateQuizAssignment = async (req, res, next) => {
  try {
    const { id: quizId, assignmentId } = req.params;
    const { addStudents, removeStudents } = req.body;
    
    const assignment = await ActiveQuiz.findOne({
      _id: assignmentId,
      quizId: quizId
    });
    
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }
    
    // Add new students
    if (addStudents && Array.isArray(addStudents) && addStudents.length > 0) {
      // Verify students exist and are valid
      const students = await User.find({
        _id: { $in: addStudents },
        role: 'student'
      });
      
      if (students.length !== addStudents.length) {
        return res.status(400).json({
          success: false,
          message: 'Some student IDs are invalid'
        });
      }
      
      // Add students that aren't already assigned
      const newStudents = addStudents.filter(
        sid => !assignment.distributedStudents.includes(sid)
      );
      
      assignment.distributedStudents.push(...newStudents);
    }
    
    // Remove students
    if (removeStudents && Array.isArray(removeStudents) && removeStudents.length > 0) {
      assignment.distributedStudents = assignment.distributedStudents.filter(
        sid => !removeStudents.includes(sid.toString())
      );
    }
    
    await assignment.save();
    
    logger.info(`Assignment ${assignmentId} updated by ${req.user._id}`);
    
    res.json({
      success: true,
      message: 'Assignment updated successfully',
      assignment: {
        id: assignment._id,
        totalStudents: assignment.distributedStudents.length
      }
    });
  } catch (error) {
    logger.error(`Update assignment error: ${error.message}`);
    next(error);
  }
};

// @desc    Delete quiz assignment
// @route   DELETE /api/quizzes/:id/assignments/:assignmentId
// @access  Private (Tutor, Admin)
exports.deleteQuizAssignment = async (req, res, next) => {
  try {
    const { id: quizId, assignmentId } = req.params;
    
    const assignment = await ActiveQuiz.findOne({
      _id: assignmentId,
      quizId: quizId
    });
    
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }
    
    // Check if any students have completed this quiz
    const completedSessions = await QuizSession.countDocuments({
      activeQuizId: assignment._id,
      status: { $in: ['completed', 'submitted', 'auto-submitted'] }
    });
    
    if (completedSessions > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete assignment. ${completedSessions} student(s) have already completed this quiz.`
      });
    }
    
    // Soft delete
    assignment.isDeleted = true;
    assignment.status = 'abandoned';
    await assignment.save();
    
    logger.info(`Assignment ${assignmentId} deleted by ${req.user._id}`);
    
    res.json({
      success: true,
      message: 'Assignment deleted successfully'
    });
  } catch (error) {
    logger.error(`Delete assignment error: ${error.message}`);
    next(error);
  }
};

// @desc    Get all quizzes assigned to a specific student
// @route   GET /api/students/:studentId/assigned-quizzes
// @access  Private (Student can see their own, Tutor/Admin can see any)
exports.getStudentAssignedQuizzes = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    
    // Verify permission
    if (req.user.role === 'student' && req.user._id.toString() !== studentId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    // Get active quizzes assigned to this student
    const assignedQuizzes = await ActiveQuiz.find({
      distributedStudents: studentId,
      status: { $in: ['active', 'in-progress'] },
      isDeleted: false
    })
    .populate('quizId')
    .populate('courseId', 'title subject grade')
    .populate('createdBy', 'name role')
    .sort({ createdAt: -1 });
    
    // Filter out completed quizzes
    const quizzesWithStatus = await Promise.all(
      assignedQuizzes.map(async (activeQuiz) => {
        const session = await QuizSession.findOne({
          activeQuizId: activeQuiz._id,
          studentId: studentId,
          status: { $in: ['completed', 'submitted', 'auto-submitted'] }
        });
        
        return {
          activeQuiz,
          completed: !!session
        };
      })
    );
    
    const pendingQuizzes = quizzesWithStatus
      .filter(item => !item.completed)
      .map(item => ({
        id: item.activeQuiz._id,
        quizId: item.activeQuiz.quizId,
        title: item.activeQuiz.quizId?.title || 'Quiz',
        subject: item.activeQuiz.subject,
        courseName: item.activeQuiz.courseName,
        difficulty: item.activeQuiz.difficulty,
        questionCount: item.activeQuiz.questionCount,
        duration: Math.floor(item.activeQuiz.duration / 60),
        totalMarks: item.activeQuiz.totalMarks,
        assignedBy: item.activeQuiz.createdBy,
        assignedAt: item.activeQuiz.createdAt,
        dueDate: item.activeQuiz.performanceData?.dueDate || null,
        status: item.activeQuiz.status
      }));
    
    res.json({
      success: true,
      studentId,
      quizzes: pendingQuizzes,
      total: pendingQuizzes.length
    });
  } catch (error) {
    logger.error(`Get student assigned quizzes error: ${error.message}`);
    next(error);
  }
};

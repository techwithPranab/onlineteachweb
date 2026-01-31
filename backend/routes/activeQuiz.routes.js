const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const ActiveQuiz = require('../models/ActiveQuiz.model');
const QuizSession = require('../models/QuizSession.model');
const { authenticate, authorize } = require('../middleware/auth');
const { body, param, validationResult } = require('express-validator');

// Validation middleware
const validateQuizCreation = [
  body('subject').isString().trim().notEmpty().withMessage('Subject is required'),
  body('courseName').isString().trim().notEmpty().withMessage('Course name is required'),
  body('courseId').isMongoId().withMessage('Valid course ID is required'),
  body('difficulty').isIn(['easy', 'medium', 'hard']).withMessage('Valid difficulty level required'),
  body('questionCount').isInt({ min: 1, max: 100 }).withMessage('Question count must be between 1-100'),
  body('duration').isInt({ min: 1, max: 300 }).withMessage('Duration must be between 1-300 minutes'),
  body('questions').isArray().withMessage('Questions array is required'),
  body('questions.*.id').isString().notEmpty().withMessage('Question ID is required'),
  body('questions.*.question').isString().notEmpty().withMessage('Question text is required'),
  body('questions.*.type').isIn(['mcq-single', 'mcq-multiple', 'true-false', 'numerical', 'short-answer', 'long-answer', 'case-based']).withMessage('Valid question type required'),
  body('questions.*.options').isArray().withMessage('Question options are required'),
  body('questions.*.correctAnswer').exists().withMessage('Correct answer is required'),
  body('questions.*.topic').isString().notEmpty().withMessage('Question topic is required'),
  body('questions.*.difficulty').isIn(['easy', 'medium', 'hard']).withMessage('Valid question difficulty required')
];

const validateQuizUpdate = [
  param('quizId').isString().notEmpty().withMessage('Valid quiz ID is required'),
  body('status').optional().isIn(['ACTIVE', 'IN_PROGRESS', 'completed', 'ABANDONED']).withMessage('Valid status required')
];

// Apply authentication to all routes
router.use(authenticate);

// @route   PUT /api/active-quizzes/:quizId/answer
// @desc    Save answer for a specific question
// @access  Private (Student)
router.put('/:quizId/answer', [
  param('quizId').isString().notEmpty().withMessage('Valid quiz ID is required'),
  body('questionId').isString().notEmpty().withMessage('Question ID is required'),
  body('answer').exists().withMessage('Answer is required'),
  body('markedForReview').optional().isBoolean(),
  body('timeSpent').optional().isNumeric()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { quizId } = req.params;
    const userId = req.user._id;
    const { questionId, answer, markedForReview = false, timeSpent = 0 } = req.body;

    const quiz = await ActiveQuiz.findOne({ quizId, userId, isDeleted: false });

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Active quiz not found'
      });
    }

    if (quiz.status === 'completed' || quiz.status === 'ABANDONED') {
      return res.status(400).json({
        success: false,
        message: `Cannot save answer for ${quiz.status.toLowerCase()} quiz`
      });
    }

    // Save the answer
    await quiz.saveAnswer(questionId, { answer, markedForReview, timeSpent });

    res.json({
      success: true,
      message: 'Answer saved successfully',
      data: {
        questionId,
        saved: true,
        progressPercentage: quiz.progressPercentage
      }
    });

  } catch (error) {
    console.error('Error saving answer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save answer',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT /api/active-quizzes/:quizId/review/:questionId
// @desc    Toggle review mark for a question
// @access  Private (Student)
router.put('/:quizId/review/:questionId', [
  param('quizId').isString().notEmpty().withMessage('Valid quiz ID is required'),
  param('questionId').isString().notEmpty().withMessage('Valid question ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { quizId, questionId } = req.params;
    const userId = req.user._id;

    const quiz = await ActiveQuiz.findOne({ quizId, userId, isDeleted: false });

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Active quiz not found'
      });
    }

    if (quiz.status === 'completed' || quiz.status === 'ABANDONED') {
      return res.status(400).json({
        success: false,
        message: `Cannot mark question for ${quiz.status.toLowerCase()} quiz`
      });
    }

    // Toggle review mark
    await quiz.toggleReviewMark(questionId);
    const answer = quiz.answers.find(a => a.questionId === questionId);

    res.json({
      success: true,
      message: answer?.markedForReview ? 'Question marked for review' : 'Review mark removed',
      data: {
        questionId,
        markedForReview: answer?.markedForReview || false
      }
    });

  } catch (error) {
    console.error('Error toggling review mark:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle review mark',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT /api/active-quizzes/:quizId/skip/:questionId
// @desc    Skip a question
// @access  Private (Student)
router.put('/:quizId/skip/:questionId', [
  param('quizId').isString().notEmpty().withMessage('Valid quiz ID is required'),
  param('questionId').isString().notEmpty().withMessage('Valid question ID is required'),
  body('timeSpent').optional().isNumeric()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { quizId, questionId } = req.params;
    const userId = req.user._id;
    const { timeSpent = 0 } = req.body;

    const quiz = await ActiveQuiz.findOne({ quizId, userId, isDeleted: false });

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Active quiz not found'
      });
    }

    if (quiz.status === 'completed' || quiz.status === 'ABANDONED') {
      return res.status(400).json({
        success: false,
        message: `Cannot skip question for ${quiz.status.toLowerCase()} quiz`
      });
    }

    // Skip the question
    await quiz.skipQuestion(questionId, timeSpent);

    res.json({
      success: true,
      message: 'Question skipped',
      data: {
        questionId,
        skipped: true
      }
    });

  } catch (error) {
    console.error('Error skipping question:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to skip question',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/active-quizzes
// @desc    Create a new active quiz
// @access  Private (Student)
router.post('/', validateQuizCreation, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.user._id;
    const {
      subject,
      courseName,
      courseId,
      difficulty,
      questionCount,
      duration,
      questions,
      algorithmUsed = 'algorithm'
    } = req.body;

    // Check if user already has a quiz in progress
    const existingInProgress = await ActiveQuiz.hasQuizInProgress(userId);
    if (existingInProgress) {
      return res.status(400).json({
        success: false,
        message: 'You already have a quiz in progress. Complete or abandon it before creating a new one.',
        quizInProgress: {
          quizId: existingInProgress.quizId,
          subject: existingInProgress.subject,
          courseName: existingInProgress.courseName
        }
      });
    }

    // Generate unique IDs
    const quizId = `quiz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create active quiz
    const activeQuiz = new ActiveQuiz({
      quizId,
      sessionId,
      userId,
      subject,
      courseName,
      courseId,
      difficulty,
      questionCount,
      duration,
      questions,
      algorithmUsed,
      totalMarks: questions.reduce((sum, q) => sum + (q.marks || 1), 0)
    });

    await activeQuiz.save();

    res.status(201).json({
      success: true,
      message: 'Active quiz created successfully',
      data: {
        quizId: activeQuiz.quizId,
        sessionId: activeQuiz.sessionId,
        subject: activeQuiz.subject,
        courseName: activeQuiz.courseName,
        difficulty: activeQuiz.difficulty,
        questionCount: activeQuiz.questionCount,
        duration: activeQuiz.duration,
        status: activeQuiz.status,
        createdAt: activeQuiz.createdAt
      }
    });

  } catch (error) {
    console.error('Error creating active quiz:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create active quiz',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/active-quizzes
// @desc    Get all active quizzes for the current user
// @access  Private (Student)
router.get('/', async (req, res) => {
  try {
    const userId = req.user._id;
    const { status, limit = 50 } = req.query;

    let query = { userId, isDeleted: false };

    // Filter by status if provided
    if (status) {
      if (Array.isArray(status)) {
        query.status = { $in: status };
      } else {
        query.status = status;
      }
    }

    const quizzes = await ActiveQuiz.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .select('-questions.correctAnswer -questions.explanation'); // Don't send answers in list view

    res.json({
      success: true,
      message: 'Active quizzes retrieved successfully',
      data: quizzes,
      count: quizzes.length
    });

  } catch (error) {
    console.error('Error fetching active quizzes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active quizzes',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/active-quizzes/:quizId
// @desc    Get a specific active quiz by quizId
// @access  Private (Student)
router.get('/:quizId', [
  param('quizId').isString().notEmpty().withMessage('Valid quiz ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { quizId } = req.params;
    const userId = req.user._id;

    const quiz = await ActiveQuiz.findOne({ quizId, userId, isDeleted: false });

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Active quiz not found'
      });
    }

    res.json({
      success: true,
      message: 'Active quiz retrieved successfully',
      data: quiz
    });

  } catch (error) {
    console.error('Error fetching active quiz:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active quiz',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT /api/active-quizzes/:quizId/start
// @desc    Start an active quiz (change status to IN_PROGRESS)
// @access  Private (Student)
router.put('/:quizId/start', [
  param('quizId').isString().notEmpty().withMessage('Valid quiz ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { quizId } = req.params;
    const userId = req.user._id;

    // Check if user already has a quiz in progress
    const existingInProgress = await ActiveQuiz.hasQuizInProgress(userId);
    if (existingInProgress && existingInProgress.quizId !== quizId) {
      return res.status(400).json({
        success: false,
        message: 'You already have another quiz in progress. Complete or abandon it first.',
        quizInProgress: {
          quizId: existingInProgress.quizId,
          subject: existingInProgress.subject,
          courseName: existingInProgress.courseName
        }
      });
    }

    const quiz = await ActiveQuiz.findOne({ quizId, userId, isDeleted: false });

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Active quiz not found'
      });
    }

    if (quiz.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        message: `Cannot start quiz with status: ${quiz.status}`
      });
    }

    // Start the quiz
    await quiz.startQuiz();

    res.json({
      success: true,
      message: 'Quiz started successfully',
      data: {
        quizId: quiz.quizId,
        sessionId: quiz.sessionId,
        status: quiz.status,
        startedAt: quiz.startedAt,
        timeRemaining: quiz.timeRemaining
      }
    });

  } catch (error) {
    console.error('Error starting quiz:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start quiz',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT /api/active-quizzes/:quizId/complete
// @desc    Complete an active quiz with results
// @access  Private (Student)
router.put('/:quizId/complete', [
  param('quizId').isString().notEmpty().withMessage('Valid quiz ID is required'),
  body('score').custom(value => typeof value === 'number' || !isNaN(Number(value))).withMessage('Score must be a number'),
  body('totalMarks').custom(value => typeof value === 'number' || !isNaN(Number(value))).withMessage('Total marks must be a number'),
  body('timeSpent').custom(value => typeof value === 'number' || !isNaN(Number(value))).withMessage('Time spent must be a number'),
  body('performanceData').optional().isObject().withMessage('Performance data must be an object')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { quizId } = req.params;
    const userId = req.user._id;
    const { score, totalMarks, timeSpent, performanceData } = req.body;

    const quiz = await ActiveQuiz.findOne({ quizId, userId, isDeleted: false });

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Active quiz not found'
      });
    }

    if (quiz.status !== 'IN_PROGRESS') {
      return res.status(400).json({
        success: false,
        message: `Cannot complete quiz with status: ${quiz.status}`
      });
    }

    // Update performance data if provided
    if (performanceData) {
      quiz.performanceData = { ...quiz.performanceData, ...performanceData };
    }

    // Complete the quiz
    await quiz.completeQuiz(score, totalMarks, timeSpent);

    // Create or update QuizSession for history tracking
    try {
      const quizSessionData = {
        studentId: userId,
        quizId: quiz._id, // Use ActiveQuiz._id instead of quiz.quizId
        courseId: quiz.courseId || null, // Allow null for algorithm quizzes
        attemptNumber: 1, // We can enhance this later to track multiple attempts
        status: 'completed', // Use lowercase to match enum
        score: Number(score) || 0,
        totalScore: Number(totalMarks) || 0,
        totalMarks: Number(totalMarks) || 0, // Add required field
        accuracy: quiz.accuracy || 0,
        timeTaken: Number(timeSpent) || 0,
        duration: quiz.duration, // Keep in minutes as expected by QuizSession model
        difficulty: quiz.difficulty,
        totalQuestions: quiz.questions?.length || 0,
        startedAt: quiz.createdAt || new Date(), // Add required field
        expiresAt: new Date(Date.now() + (quiz.duration * 60 * 1000)), // Add required field
        submittedAt: new Date(), // Add submittedAt
        passingPercentage: 60, // Default passing percentage
        algorithmVersion: 'algorithm-v1', // Add required field
        metadata: {
          subject: quiz.subject,
          courseName: quiz.courseName,
          questionCount: quiz.questionCount,
          isAlgorithmGenerated: true
        }
      };

      console.log('Creating QuizSession with data:', {
        studentId: userId,
        quizId: quiz._id,
        status: 'completed',
        score: Number(score) || 0,
        totalScore: Number(totalMarks) || 0,
        subject: quiz.subject,
        courseName: quiz.courseName
      })

      // Check if session already exists for this quiz
      let session = await QuizSession.findOne({ 
        quizId: quiz._id, 
        studentId: userId 
      });

      if (session) {
        // Update existing session
        Object.assign(session, quizSessionData);
        await session.save();
        console.log('Updated existing QuizSession:', session._id);
      } else {
        // Create new session
        try {
          session = await QuizSession.create(quizSessionData);
          console.log('Created new QuizSession:', session._id);
        } catch (createError) {
          console.error('Failed to create QuizSession:', createError);
          console.error('QuizSession data:', JSON.stringify(quizSessionData, null, 2));
          throw createError; // Re-throw to be caught by outer try-catch
        }
      }

      console.log('QuizSession created/updated for history:', session._id);
    } catch (sessionError) {
      // Log error but don't fail the quiz completion
      console.error('Error creating/updating QuizSession:', sessionError);
    }

    res.json({
      success: true,
      message: 'Quiz completed successfully',
      data: {
        quizId: quiz.quizId,
        score: quiz.score,
        totalMarks: quiz.totalMarks,
        accuracy: quiz.accuracy,
        timeSpent: quiz.timeSpent,
        completedAt: quiz.completedAt,
        status: quiz.status
      }
    });

  } catch (error) {
    console.error('Error completing quiz:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete quiz',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT /api/active-quizzes/:quizId/abandon
// @desc    Abandon an active quiz
// @access  Private (Student)
router.put('/:quizId/abandon', [
  param('quizId').isString().notEmpty().withMessage('Valid quiz ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { quizId } = req.params;
    const userId = req.user._id;

    const quiz = await ActiveQuiz.findOne({ quizId, userId, isDeleted: false });

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Active quiz not found'
      });
    }

    if (quiz.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot abandon a completed quiz'
      });
    }

    // Abandon the quiz
    await quiz.abandonQuiz();

    res.json({
      success: true,
      message: 'Quiz abandoned successfully',
      data: {
        quizId: quiz.quizId,
        status: quiz.status,
        lastUpdated: quiz.lastUpdated
      }
    });

  } catch (error) {
    console.error('Error abandoning quiz:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to abandon quiz',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   DELETE /api/active-quizzes/:quizId
// @desc    Soft delete an active quiz
// @access  Private (Student)
router.delete('/:quizId', [
  param('quizId').isString().notEmpty().withMessage('Valid quiz ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { quizId } = req.params;
    const userId = req.user._id;

    const quiz = await ActiveQuiz.findOneAndUpdate(
      { quizId, userId, isDeleted: false },
      {
        isDeleted: true,
        lastUpdated: new Date()
      },
      { new: true }
    );

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Active quiz not found'
      });
    }

    res.json({
      success: true,
      message: 'Quiz deleted successfully',
      data: {
        quizId: quiz.quizId,
        deleted: true
      }
    });

  } catch (error) {
    console.error('Error deleting quiz:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete quiz',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/active-quizzes/stats/summary
// @desc    Get quiz statistics for the current user
// @access  Private (Student)
router.get('/stats/summary', async (req, res) => {
  try {
    const userId = req.user._id;

    const stats = await ActiveQuiz.aggregate([
      { $match: { userId: mongoose.Types.ObjectId(userId), isDeleted: false } },
      {
        $group: {
          _id: null,
          totalQuizzes: { $sum: 1 },
          activeQuizzes: {
            $sum: { $cond: [{ $eq: ['$status', 'ACTIVE'] }, 1, 0] }
          },
          inProgressQuizzes: {
            $sum: { $cond: [{ $eq: ['$status', 'IN_PROGRESS'] }, 1, 0] }
          },
          completedQuizzes: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          averageScore: { $avg: '$score' },
          averageAccuracy: { $avg: '$accuracy' },
          totalTimeSpent: { $sum: '$timeSpent' }
        }
      }
    ]);

    const summary = stats[0] || {
      totalQuizzes: 0,
      activeQuizzes: 0,
      inProgressQuizzes: 0,
      completedQuizzes: 0,
      averageScore: 0,
      averageAccuracy: 0,
      totalTimeSpent: 0
    };

    res.json({
      success: true,
      message: 'Quiz statistics retrieved successfully',
      data: summary
    });

  } catch (error) {
    console.error('Error fetching quiz statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quiz statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;

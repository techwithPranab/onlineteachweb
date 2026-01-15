const Quiz = require('../models/Quiz.model');
const Question = require('../models/Question.model');
const QuizSession = require('../models/QuizSession.model');
const QuizEvaluationResult = require('../models/QuizEvaluationResult.model');
const User = require('../models/User.model');
const QuestionSelectionFactory = require('../algorithms/QuestionSelectionFactory');
const logger = require('../utils/logger');

// =====================
// QUIZ MANAGEMENT (Tutor/Admin)
// =====================

// @desc    Create a new quiz
// @route   POST /api/quizzes
// @access  Private (Tutor, Admin)
exports.createQuiz = async (req, res, next) => {
  try {
    const {
      title,
      description,
      courseId,
      difficultyLevel,
      duration,
      totalMarks,
      passingPercentage,
      attemptsAllowed,
      questionConfig,
      settings,
      instructions
    } = req.body;
    
    // Validate question availability
    const questionCount = await Question.countDocuments({
      courseId,
      isActive: true
    });
    
    if (questionCount < questionConfig.totalQuestions) {
      return res.status(400).json({
        success: false,
        message: `Not enough questions available. Required: ${questionConfig.totalQuestions}, Available: ${questionCount}`
      });
    }
    
    // Get current algorithm version
    const strategy = QuestionSelectionFactory.getStrategy();
    
    const quiz = await Quiz.create({
      title,
      description,
      courseId,
      difficultyLevel,
      duration,
      totalMarks,
      passingPercentage: passingPercentage || 40,
      attemptsAllowed: attemptsAllowed || 1,
      questionConfig: {
        ...questionConfig,
        topicWeightage: questionConfig.topicWeightage 
          ? new Map(Object.entries(questionConfig.topicWeightage))
          : new Map(),
        typeDistribution: questionConfig.typeDistribution
          ? new Map(Object.entries(questionConfig.typeDistribution))
          : new Map()
      },
      settings: settings || {},
      instructions: instructions || [],
      createdBy: req.user._id,
      algorithmVersion: strategy.getVersion()
    });
    
    logger.info(`Quiz created: ${quiz._id} by user ${req.user._id}`);
    
    res.status(201).json({
      success: true,
      quiz
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all quizzes (for tutor/admin)
// @route   GET /api/quizzes
// @access  Private (Tutor, Admin)
exports.getQuizzes = async (req, res, next) => {
  try {
    const {
      courseId,
      status,
      difficultyLevel,
      page = 1,
      limit = 10
    } = req.query;
    
    const query = {};
    
    if (courseId) query.courseId = courseId;
    if (status) query.status = status;
    if (difficultyLevel) query.difficultyLevel = difficultyLevel;
    
    // Tutors can only see their own quizzes
    if (req.user.role === 'tutor') {
      query.createdBy = req.user._id;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [quizzes, total] = await Promise.all([
      Quiz.find(query)
        .populate('courseId', 'title grade subject')
        .populate('createdBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Quiz.countDocuments(query)
    ]);
    
    res.json({
      success: true,
      quizzes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get quiz by ID
// @route   GET /api/quizzes/:id
// @access  Private
exports.getQuizById = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate('courseId', 'title grade subject')
      .populate('createdBy', 'name');
    
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }
    
    res.json({
      success: true,
      quiz
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update quiz
// @route   PUT /api/quizzes/:id
// @access  Private (Tutor, Admin)
exports.updateQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }
    
    // Check access
    if (req.user.role === 'tutor' && 
        quiz.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    // Can't update published quiz
    if (quiz.status === 'published' && req.body.status !== 'archived') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update a published quiz. Archive it first.'
      });
    }
    
    const allowedUpdates = [
      'title', 'description', 'difficultyLevel', 'duration',
      'totalMarks', 'passingPercentage', 'attemptsAllowed',
      'questionConfig', 'settings', 'instructions', 'status'
    ];
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'questionConfig') {
          const config = req.body.questionConfig;
          quiz.questionConfig = {
            ...config,
            topicWeightage: config.topicWeightage 
              ? new Map(Object.entries(config.topicWeightage))
              : quiz.questionConfig.topicWeightage,
            typeDistribution: config.typeDistribution
              ? new Map(Object.entries(config.typeDistribution))
              : quiz.questionConfig.typeDistribution
          };
        } else {
          quiz[field] = req.body[field];
        }
      }
    });
    
    // Handle status changes
    if (req.body.status === 'published' && quiz.status !== 'published') {
      quiz.publishedAt = new Date();
    }
    if (req.body.status === 'archived') {
      quiz.archivedAt = new Date();
    }
    
    await quiz.save();
    
    logger.info(`Quiz updated: ${quiz._id} by user ${req.user._id}`);
    
    res.json({
      success: true,
      quiz
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete quiz
// @route   DELETE /api/quizzes/:id
// @access  Private (Admin)
exports.deleteQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }
    
    // Check if there are any attempts
    const attemptCount = await QuizSession.countDocuments({ quizId: quiz._id });
    
    if (attemptCount > 0) {
      // Soft delete - archive instead
      quiz.status = 'archived';
      quiz.archivedAt = new Date();
      await quiz.save();
      
      return res.json({
        success: true,
        message: 'Quiz archived (has existing attempts)'
      });
    }
    
    await quiz.deleteOne();
    
    logger.info(`Quiz deleted: ${req.params.id} by user ${req.user._id}`);
    
    res.json({
      success: true,
      message: 'Quiz deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Publish quiz
// @route   POST /api/quizzes/:id/publish
// @access  Private (Tutor, Admin)
exports.publishQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }
    
    if (quiz.status === 'published') {
      return res.status(400).json({
        success: false,
        message: 'Quiz is already published'
      });
    }
    
    // Validate question availability before publishing
    const questionCount = await Question.countDocuments({
      courseId: quiz.courseId,
      isActive: true
    });
    
    if (questionCount < quiz.questionConfig.totalQuestions) {
      return res.status(400).json({
        success: false,
        message: `Not enough questions available. Required: ${quiz.questionConfig.totalQuestions}, Available: ${questionCount}`
      });
    }
    
    quiz.status = 'published';
    quiz.publishedAt = new Date();
    await quiz.save();
    
    logger.info(`Quiz published: ${quiz._id} by user ${req.user._id}`);
    
    res.json({
      success: true,
      message: 'Quiz published successfully',
      quiz
    });
  } catch (error) {
    next(error);
  }
};

// =====================
// STUDENT QUIZ OPERATIONS
// =====================

// @desc    Get available quizzes for a course (Student)
// @route   GET /api/quizzes/course/:courseId/available
// @access  Private (Student)
exports.getAvailableQuizzes = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user._id;
    
    // Check if student is enrolled in the course
    const user = await User.findById(studentId);
    if (!user.enrolledCourses.includes(courseId)) {
      return res.status(403).json({
        success: false,
        message: 'You are not enrolled in this course'
      });
    }
    
    const quizzes = await Quiz.getAvailableQuizzes(courseId, studentId);
    
    res.json({
      success: true,
      quizzes
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Start a quiz
// @route   POST /api/quizzes/:id/start
// @access  Private (Student)
exports.startQuiz = async (req, res, next) => {
  try {
    const { id: quizId } = req.params;
    const studentId = req.user._id;
    const { strategyName } = req.body; // Optional: specify selection strategy
    
    // Get the quiz
    const quiz = await Quiz.findById(quizId);
    
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }
    
    // Validate quiz is published
    if (quiz.status !== 'published') {
      return res.status(400).json({
        success: false,
        message: 'Quiz is not available'
      });
    }
    
    // Check enrollment
    const user = await User.findById(studentId);
    if (!user.enrolledCourses.includes(quiz.courseId.toString())) {
      return res.status(403).json({
        success: false,
        message: 'You are not enrolled in this course'
      });
    }
    
    // Check for existing active session
    const activeSession = await QuizSession.getActiveSession(quizId, studentId);
    if (activeSession) {
      // Return existing session
      return res.json({
        success: true,
        message: 'Resuming existing session',
        session: {
          _id: activeSession._id,
          quizId: activeSession.quizId,
          questions: activeSession.selectedQuestions.map(q => ({
            questionId: q.questionId,
            displayOrder: q.displayOrder,
            ...q.snapshot
          })),
          answers: activeSession.answers,
          currentQuestionIndex: activeSession.currentQuestionIndex,
          startedAt: activeSession.startedAt,
          expiresAt: activeSession.expiresAt,
          remainingTime: activeSession.remainingTime,
          status: activeSession.status
        }
      });
    }
    
    // Check attempts remaining
    const attemptCount = await QuizSession.getAttemptCount(quizId, studentId);
    if (attemptCount >= quiz.attemptsAllowed) {
      return res.status(400).json({
        success: false,
        message: 'No attempts remaining'
      });
    }
    
    // Get questions from previous attempts to exclude
    const previousSessions = await QuizSession.find({
      quizId,
      studentId,
      status: { $in: ['completed', 'submitted', 'auto-submitted'] }
    }).select('selectedQuestions');
    
    const excludeQuestionIds = previousSessions.flatMap(
      session => session.selectedQuestions.map(q => q.questionId)
    );
    
    // Select questions using the algorithm
    const strategy = QuestionSelectionFactory.getStrategy(strategyName || 'default');
    
    const selectedQuestions = await strategy.select({
      courseId: quiz.courseId,
      difficultyLevel: quiz.difficultyLevel,
      questionConfig: {
        totalQuestions: quiz.questionConfig.totalQuestions,
        topicWeightage: quiz.questionConfig.topicWeightage,
        typeDistribution: quiz.questionConfig.typeDistribution,
        difficultyDistribution: quiz.questionConfig.difficultyDistribution
      },
      excludeQuestionIds,
      settings: quiz.settings,
      studentId
    });
    
    if (selectedQuestions.length < quiz.questionConfig.totalQuestions) {
      logger.warn(`Quiz ${quizId}: Only ${selectedQuestions.length} questions selected out of ${quiz.questionConfig.totalQuestions} requested`);
    }
    
    // Create quiz session
    const startedAt = new Date();
    const expiresAt = new Date(startedAt.getTime() + quiz.duration * 60 * 1000);
    
    const session = await QuizSession.create({
      quizId,
      studentId,
      courseId: quiz.courseId,
      attemptNumber: attemptCount + 1,
      selectedQuestions,
      answers: [],
      startedAt,
      expiresAt,
      duration: quiz.duration,
      totalMarks: quiz.totalMarks,
      passingPercentage: quiz.passingPercentage,
      algorithmVersion: strategy.getVersion(),
      selectionCriteria: {
        difficultyLevel: quiz.difficultyLevel,
        totalQuestions: quiz.questionConfig.totalQuestions,
        excludedCount: excludeQuestionIds.length
      }
    });
    
    // Update question usage counts
    const questionIds = selectedQuestions.map(q => q.questionId);
    await Question.updateMany(
      { _id: { $in: questionIds } },
      { $inc: { usageCount: 1 } }
    );
    
    logger.info(`Quiz session started: ${session._id} for quiz ${quizId} by student ${studentId}`);
    
    res.status(201).json({
      success: true,
      message: 'Quiz started',
      session: {
        _id: session._id,
        quizId: session.quizId,
        questions: selectedQuestions.map(q => ({
          questionId: q.questionId,
          displayOrder: q.displayOrder,
          ...q.snapshot
        })),
        answers: [],
        currentQuestionIndex: 0,
        startedAt: session.startedAt,
        expiresAt: session.expiresAt,
        remainingTime: session.remainingTime,
        duration: session.duration,
        totalMarks: session.totalMarks,
        status: session.status
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Save answer
// @route   POST /api/quizzes/sessions/:sessionId/answer
// @access  Private (Student)
exports.saveAnswer = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { questionId, answer, timeSpent } = req.body;
    const studentId = req.user._id;
    
    const session = await QuizSession.findById(sessionId);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }
    
    // Validate ownership
    if (session.studentId.toString() !== studentId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    // Check if session is still active
    if (session.status !== 'in-progress') {
      return res.status(400).json({
        success: false,
        message: 'Session is no longer active'
      });
    }
    
    // Check if session is expired
    if (session.isExpired()) {
      session.status = 'expired';
      await session.save();
      return res.status(400).json({
        success: false,
        message: 'Session has expired'
      });
    }
    
    // Save the answer
    await session.saveAnswer(questionId, answer, timeSpent || 0);
    
    res.json({
      success: true,
      message: 'Answer saved',
      remainingTime: session.remainingTime
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark question for review
// @route   POST /api/quizzes/sessions/:sessionId/mark-review
// @access  Private (Student)
exports.markForReview = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { questionId, marked } = req.body;
    const studentId = req.user._id;
    
    const session = await QuizSession.findById(sessionId);
    
    if (!session || session.studentId.toString() !== studentId.toString()) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }
    
    if (session.status !== 'in-progress') {
      return res.status(400).json({
        success: false,
        message: 'Session is not active'
      });
    }
    
    await session.markForReview(questionId, marked);
    
    res.json({
      success: true,
      message: marked ? 'Question marked for review' : 'Mark removed'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit quiz
// @route   POST /api/quizzes/:id/submit
// @access  Private (Student)
exports.submitQuiz = async (req, res, next) => {
  try {
    const { id: quizId } = req.params;
    const { sessionId, answers } = req.body;
    const studentId = req.user._id;
    
    const session = await QuizSession.findById(sessionId);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }
    
    // Validate
    if (session.studentId.toString() !== studentId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    if (session.quizId.toString() !== quizId) {
      return res.status(400).json({
        success: false,
        message: 'Session does not match quiz'
      });
    }
    
    if (!['in-progress', 'expired'].includes(session.status)) {
      return res.status(400).json({
        success: false,
        message: 'Quiz already submitted'
      });
    }
    
    // Save any final answers
    if (answers && Array.isArray(answers)) {
      for (const ans of answers) {
        await session.saveAnswer(ans.questionId, ans.answer, ans.timeSpent || 0);
      }
    }
    
    // Mark as submitted
    session.submittedAt = new Date();
    session.timeSpent = Math.floor((session.submittedAt - session.startedAt) / 1000);
    session.status = session.isExpired() ? 'auto-submitted' : 'submitted';
    
    await session.save();
    
    // Calculate auto score
    await session.calculateAutoScore();
    
    // Generate evaluation result
    const evaluationResult = await QuizEvaluationResult.generateFromSession(session);
    
    // Update quiz stats
    const quiz = await Quiz.findById(quizId);
    await quiz.updateStats(session.totalScore, session.timeSpent / 60, session.passed);
    
    logger.info(`Quiz submitted: Session ${sessionId} for quiz ${quizId} by student ${studentId}`);
    
    res.json({
      success: true,
      message: 'Quiz submitted successfully',
      result: {
        sessionId: session._id,
        score: session.totalScore,
        totalMarks: session.totalMarks,
        percentage: session.percentage,
        passed: session.passed,
        pendingManualEvaluation: session.pendingManualEvaluation,
        evaluationId: evaluationResult._id
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get quiz result
// @route   GET /api/quizzes/:id/result
// @access  Private (Student)
exports.getQuizResult = async (req, res, next) => {
  try {
    const { id: quizId } = req.params;
    const { sessionId } = req.query;
    const studentId = req.user._id;
    
    let session;
    
    if (sessionId) {
      session = await QuizSession.findById(sessionId);
    } else {
      // Get the latest completed session
      session = await QuizSession.findOne({
        quizId,
        studentId,
        status: { $in: ['completed', 'submitted', 'auto-submitted', 'evaluating'] }
      }).sort({ submittedAt: -1 });
    }
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'No result found'
      });
    }
    
    if (session.studentId.toString() !== studentId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    // Get evaluation result
    const evaluationResult = await QuizEvaluationResult.findOne({
      quizSessionId: session._id
    });
    
    // Get quiz settings for showing answers
    const quiz = await Quiz.findById(quizId);
    
    let detailedAnswers = null;
    if (quiz.settings.showCorrectAnswers && session.status === 'completed') {
      // Include correct answers
      const Question = require('../models/Question.model');
      detailedAnswers = await Promise.all(
        session.answers.map(async (ans) => {
          const question = await Question.findById(ans.questionId);
          return {
            questionId: ans.questionId,
            questionText: ans.questionSnapshot?.text,
            type: ans.questionSnapshot?.type,
            yourAnswer: ans.answer,
            isCorrect: ans.isCorrect,
            marksAwarded: ans.marksAwarded,
            correctAnswer: question ? {
              options: question.options?.filter(o => o.isCorrect),
              numericalAnswer: question.numericalAnswer,
              expectedAnswer: question.expectedAnswer
            } : null,
            explanation: quiz.settings.showExplanations ? question?.explanation : null,
            feedback: ans.manualFeedback
          };
        })
      );
    }
    
    res.json({
      success: true,
      result: {
        session: {
          _id: session._id,
          attemptNumber: session.attemptNumber,
          startedAt: session.startedAt,
          submittedAt: session.submittedAt,
          timeSpent: session.timeSpent,
          status: session.status,
          score: session.totalScore,
          totalMarks: session.totalMarks,
          percentage: session.percentage,
          passed: session.passed,
          pendingManualEvaluation: session.pendingManualEvaluation
        },
        evaluation: evaluationResult,
        detailedAnswers,
        quiz: {
          title: quiz.title,
          passingPercentage: quiz.passingPercentage
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get quiz attempts (Tutor/Admin)
// @route   GET /api/quizzes/:id/attempts
// @access  Private (Tutor, Admin)
exports.getQuizAttempts = async (req, res, next) => {
  try {
    const { id: quizId } = req.params;
    const { page = 1, limit = 20, status } = req.query;
    
    const query = { quizId };
    if (status) query.status = status;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [attempts, total] = await Promise.all([
      QuizSession.find(query)
        .populate('studentId', 'name email')
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      QuizSession.countDocuments(query)
    ]);
    
    res.json({
      success: true,
      attempts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get session details for evaluation
// @route   GET /api/quizzes/sessions/:sessionId
// @access  Private (Tutor, Admin)
exports.getSessionDetails = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    
    const session = await QuizSession.findById(sessionId)
      .populate('studentId', 'name email')
      .populate('quizId', 'title settings');
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }
    
    // Get full question details for answers needing manual evaluation
    const Question = require('../models/Question.model');
    const detailedAnswers = await Promise.all(
      session.answers.map(async (ans) => {
        const question = await Question.findById(ans.questionId);
        return {
          ...ans.toObject(),
          fullQuestion: question
        };
      })
    );
    
    res.json({
      success: true,
      session: {
        ...session.toObject(),
        answers: detailedAnswers
      }
    });
  } catch (error) {
    next(error);
  }
};

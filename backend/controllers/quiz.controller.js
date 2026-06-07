const Quiz = require('../models/Quiz.model');
const Question = require('../models/Question.model');
const QuizSession = require('../models/QuizSession.model');
const QuizEvaluationResult = require('../models/QuizEvaluationResult.model');
const User = require('../models/User.model');
const ActiveQuiz = require('../models/ActiveQuiz.model');
const QuestionSelectionFactory = require('../algorithms/QuestionSelectionFactory');
const achievementService = require('../services/achievement.service');
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
      instructions,
      questionSelectionStrategy = 'adaptive'  // Add strategy parameter, default to adaptive
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
    
    // Validate strategy name
    if (!['default', 'adaptive'].includes(questionSelectionStrategy)) {
      return res.status(400).json({
        success: false,
        message: `Invalid strategy: ${questionSelectionStrategy}. Must be 'default' or 'adaptive'`
      });
    }
    
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
      algorithmVersion: strategy.getVersion(),
      questionSelectionStrategy  // Save the selected strategy
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
    
    // All courses are now available to all students - no enrollment check needed
    
    const quizzes = await Quiz.getAvailableQuizzes(courseId, studentId);
    
    res.json({
      success: true,
      quizzes
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all available quizzes for students
// @route   GET /api/quizzes/available
// @access  Private (Student)
exports.getAllAvailableQuizzes = async (req, res, next) => {
  try {
    const studentId = req.user._id;
    const { subject, courseId, difficultyLevel } = req.query;

    // Build filter object
    const filter = {
      status: 'published'
    };

    if (subject) {
      filter['course.subject'] = subject;
    }

    if (courseId) {
      filter.courseId = courseId;
    }

    if (difficultyLevel) {
      filter.difficultyLevel = difficultyLevel;
    }

    const QuizSession = require('../models/QuizSession.model');

    const quizzes = await Quiz.find(filter)
      .populate('courseId', 'title subject grade')
      .populate('createdBy', 'name')
      .lean();

    // Get attempt counts for each quiz
    const quizzesWithAttempts = await Promise.all(
      quizzes.map(async (quiz) => {
        const attemptCount = await QuizSession.countDocuments({
          quizId: quiz._id,
          studentId,
          status: { $in: ['completed', 'submitted'] }
        });

        return {
          ...quiz,
          course: quiz.courseId, // Rename for frontend compatibility
          attemptsTaken: attemptCount,
          attemptsRemaining: quiz.attemptsAllowed - attemptCount,
          canAttempt: attemptCount < quiz.attemptsAllowed
        };
      })
    );

    res.json({
      success: true,
      quizzes: quizzesWithAttempts
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
    
    // All courses are now available to all students - no enrollment check needed
    
    // Check if student has access to this quiz via ActiveQuiz (if assigned by tutor/admin)
    let activeQuizAssignment = null;
    const assignedActiveQuiz = await ActiveQuiz.findOne({
      quizId: quizId,
      distributedStudents: studentId,
      isDeleted: false,
      status: { $in: ['active', 'in-progress'] }
    });
    
    if (assignedActiveQuiz) {
      // Check if already completed this assignment
      const completedSession = await QuizSession.findOne({
        activeQuizId: assignedActiveQuiz._id,
        studentId: studentId,
        status: { $in: ['completed', 'submitted', 'auto-submitted'] }
      });
      
      if (completedSession) {
        return res.status(400).json({
          success: false,
          message: 'You have already completed this assigned quiz'
        });
      }
      
      activeQuizAssignment = assignedActiveQuiz;
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
            question: q.question,
            type: q.type,
            options: q.options,
            marks: q.marks,
            topic: q.topic,
            subject: q.subject,
            difficulty: q.difficulty
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
    
    // Get questions from previous attempts to exclude (including in-progress)
    // This prevents same questions appearing in same difficulty level
    const previousSessions = await QuizSession.find({
      quizId,
      studentId,
      status: { $in: ['in-progress', 'completed', 'submitted', 'auto-submitted'] }
    }).select('selectedQuestions');
    
    // Create a Set to ensure unique question IDs from previous sessions
    const excludeQuestionIds = [...new Set(
      previousSessions.flatMap(
        session => session.selectedQuestions.map(q => q.questionId.toString())
      )
    )];
    
    logger.info(`[QuizStart] Student ${studentId} starting quiz ${quizId}`);
    logger.info(`[QuizStart] Found ${previousSessions.length} previous sessions with ${excludeQuestionIds.length} unique questions to exclude`);
    logger.info(`[QuizStart] Excluded question IDs from prev sessions: ${excludeQuestionIds.slice(0, 10).join(', ')}${excludeQuestionIds.length > 10 ? '...' : ''}`);
    
    console.log('[TRACE] === ABOUT TO GET STUDENT PERFORMANCE ===');
    
    // Get student performance for adaptive selection and correctly answered questions
    const StudentPerformance = require('../models/StudentPerformance.model');
    const studentPerformance = await StudentPerformance.findOne({
      studentId
    });
    
    console.log('[TRACE] StudentPerformance found:', !!studentPerformance);
    
    // Extract topic accuracy for adaptive selection
    const topicAccuracy = {};
    let correctlyAnsweredQuestionIds = [];
    
    if (studentPerformance && studentPerformance.topicMastery) {
      studentPerformance.topicMastery.forEach(topicData => {
        topicAccuracy[topicData.topic] = topicData.successRate || 0;
      });
      
      // Extract correctly answered question IDs from subject performance for this quiz's subject
      if (studentPerformance.subjectPerformance && quiz.subject) {
        const subjectKey = quiz.subject;
        const subjectData = studentPerformance.subjectPerformance.get(subjectKey);
        if (subjectData && subjectData.correctlyAnsweredQuestionIds && Array.isArray(subjectData.correctlyAnsweredQuestionIds)) {
          correctlyAnsweredQuestionIds = subjectData.correctlyAnsweredQuestionIds.map(id => id.toString());
          logger.info(`[QuizStart] Found ${correctlyAnsweredQuestionIds.length} correctly answered questions in subject ${subjectKey} to exclude`);
        }
      }
    }
    
    console.log('[TRACE] === ABOUT TO COMBINE EXCLUDE IDS ===');
    console.log('[TRACE] excludeQuestionIds count:', excludeQuestionIds.length);
    console.log('[TRACE] correctlyAnsweredQuestionIds count:', correctlyAnsweredQuestionIds.length);
    
    // Combine all IDs to exclude: previous attempts + correctly answered questions
    const allExcludeIds = [...new Set([...excludeQuestionIds, ...correctlyAnsweredQuestionIds])];
    
    logger.info(`[QuizStart] Total questions to exclude: ${allExcludeIds.length} (${excludeQuestionIds.length} from prev attempts + ${correctlyAnsweredQuestionIds.length} correctly answered)`);
    logger.info(`[QuizStart] Student performance found for ${Object.keys(topicAccuracy).length} topics`);
    console.log('[TRACE] About to determine strategy name...');
    
    // Use the quiz's configured strategy (default to 'adaptive' if not set)
    const strategyName = quiz.questionSelectionStrategy || 'adaptive';
    console.log('[TRACE] strategyName:', strategyName);
    console.log('[TRACE] quiz.questionSelectionStrategy:', quiz.questionSelectionStrategy);
    
    logger.info(`[QuizStart] ===== STRATEGY DETERMINATION =====`);
    logger.info(`[QuizStart] quiz.questionSelectionStrategy value: ${quiz.questionSelectionStrategy}`);
    logger.info(`[QuizStart] Using question selection strategy: ${strategyName}`);
    console.log('[TRACE] Strategy logging complete');
    
    const strategy = QuestionSelectionFactory.getStrategy(strategyName);
    console.log('[TRACE] Got strategy instance:', strategy?.constructor?.name);
    
    const selectedQuestions = await strategy.select({
      courseId: quiz.courseId,
      difficultyLevel: quiz.difficultyLevel,
      questionConfig: {
        totalQuestions: quiz.questionConfig.totalQuestions,
        topicWeightage: quiz.questionConfig.topicWeightage,
        typeDistribution: quiz.questionConfig.typeDistribution,
        difficultyDistribution: quiz.questionConfig.difficultyDistribution
      },
      excludeQuestionIds: allExcludeIds,
      settings: quiz.settings,
      studentId,
      studentPerformance: {
        topicAccuracy
      }
    });
    
    if (selectedQuestions.length < quiz.questionConfig.totalQuestions) {
      logger.warn(`Quiz ${quizId}: Only ${selectedQuestions.length} questions selected out of ${quiz.questionConfig.totalQuestions} requested`);
    }
    
    // Create quiz session
    const startedAt = new Date();
    const expiresAt = new Date(startedAt.getTime() + quiz.duration * 60 * 1000);
    
    // Process questions with complete details instead of stringified snapshots
    const rawProcessed = selectedQuestions.map(q => ({
      questionId: q.questionId,
      originalOrder: q.originalOrder,
      displayOrder: q.displayOrder,
      question: q.snapshot.question || q.snapshot.text || '',
      type: q.snapshot.type || 'mcq-single',
      options: (q.snapshot.options || []).map(opt => ({
        _id: opt._id || opt.id,
        id: opt.id,
        text: opt.text || ''
      })),
      correctAnswer: q.snapshot.correctAnswer,
      expectedAnswer: q.snapshot.expectedAnswer,
      // Handle numericalAnswer - it might be an object or a number
      numericalAnswer: q.snapshot.numericalAnswer,
      marks: q.snapshot.marks || 1,
      negativeMarks: q.snapshot.negativeMarks || 0,
      topic: q.snapshot.topic || 'General',
      subject: q.snapshot.subject || 'General',
      difficulty: q.snapshot.difficulty || q.snapshot.difficultyLevel || 'medium',
      explanation: q.snapshot.explanation || '',
      metadata: q.snapshot.metadata || {}
    }));

    // Final safety dedup — ensures no duplicate questionId reaches the session
    // even if a strategy bug somehow slips through.
    const seenQIds = new Set();
    const processedQuestions = rawProcessed.filter(q => {
      const idStr = q.questionId.toString();
      if (seenQIds.has(idStr)) {
        logger.warn(`[QuizStart] Duplicate questionId removed before session creation: ${idStr}`);
        return false;
      }
      seenQIds.add(idStr);
      return true;
    });
    
    const session = await QuizSession.create({
      activeQuizId: activeQuizAssignment?._id || null, // Link to ActiveQuiz if assigned
      quizId,
      studentId,
      courseId: quiz.courseId,
      attemptNumber: attemptCount + 1,
      selectedQuestions: processedQuestions,
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
        excludedFromPrevAttempts: excludeQuestionIds.length,
        excludedCorrectlyAnswered: correctlyAnsweredQuestionIds.length,
        totalExcludedCount: allExcludeIds.length
      }
    });
    
    // Update ActiveQuiz status to in-progress if this is an assigned quiz
    if (activeQuizAssignment) {
      activeQuizAssignment.status = 'in-progress';
      activeQuizAssignment.startedAt = new Date();
      await activeQuizAssignment.save();
      logger.info(`Updated ActiveQuiz ${activeQuizAssignment._id} status to in-progress`);
    }
    
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
          question: q.question,
          type: q.type,
          options: q.options,
          marks: q.marks,
          topic: q.topic,
          subject: q.subject,
          difficulty: q.difficulty
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
    
    // Fetch quiz details early (needed for subject information)
    let quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
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
    
    // Calculate auto score (this sets isCorrect on each answer)
    await session.calculateAutoScore();
    
    // Save session again after calculateAutoScore to persist isCorrect values
    await session.save();
    
    // Track correctly answered questions in StudentPerformance
    try {
      const StudentPerformance = require('../models/StudentPerformance.model');
      
      // Log answer details for debugging
      logger.info(`[SubmitQuiz] Total answers: ${session.answers.length}`);
      session.answers.forEach((ans, idx) => {
        logger.info(`[SubmitQuiz] Answer ${idx}: questionId=${ans.questionId}, isCorrect=${ans.isCorrect}, answer=${JSON.stringify(ans.answer)}`);
      });
      
      const correctlyAnsweredIds = session.answers
        .filter(ans => ans.isCorrect === true)
        .map(ans => ans.questionId);
      
      logger.info(`[SubmitQuiz] Filtered ${correctlyAnsweredIds.length} correctly answered questions from ${session.answers.length} total answers`);
      
      if (correctlyAnsweredIds.length > 0) {
        logger.info(`[SubmitQuiz] Found ${correctlyAnsweredIds.length} correctly answered questions for student ${studentId}`);
        
        let studentPerf = await StudentPerformance.findOne({ studentId });
        
        if (!studentPerf) {
          studentPerf = new StudentPerformance({ studentId });
        }
        
        // Get the quiz's subject
        const quizSubject = quiz.subject || 'General';
        
        // Get or create subject performance
        if (!studentPerf.subjectPerformance.has(quizSubject)) {
          studentPerf.subjectPerformance.set(quizSubject, {
            subject: quizSubject,
            totalQuizzes: 0,
            totalQuestions: 0,
            correctAnswers: 0,
            averageScore: 0,
            averageAccuracy: 0,
            totalTimeSpent: 0,
            correctlyAnsweredQuestionIds: [],
            lastActivity: new Date()
          });
        }
        
        const subjectPerf = studentPerf.subjectPerformance.get(quizSubject);
        
        // Add correctly answered question IDs (avoid duplicates)
        const existingIds = new Set(
          subjectPerf.correctlyAnsweredQuestionIds.map(id => id.toString())
        );
        
        for (const qId of correctlyAnsweredIds) {
          if (!existingIds.has(qId.toString())) {
            subjectPerf.correctlyAnsweredQuestionIds.push(qId);
            existingIds.add(qId.toString());
          }
        }
        
        subjectPerf.lastActivity = new Date();
        
        logger.info(`[SubmitQuiz] Subject ${quizSubject} now has ${subjectPerf.correctlyAnsweredQuestionIds.length} total correctly answered questions tracked`);
        
        await studentPerf.save();
        logger.info(`[SubmitQuiz] Updated StudentPerformance with correctly answered questions for student ${studentId}`);
      }
    } catch (error) {
      logger.error(`Error tracking correctly answered questions: ${error.message}`);
      // Don't fail submission if tracking fails
    }
    
    // Generate evaluation result
    const evaluationResult = await QuizEvaluationResult.generateFromSession(session);
    
    // Update quiz stats (quiz already fetched earlier)
    await quiz.updateStats(session.totalScore, session.timeSpent / 60, session.passed);
    
    // Check and award achievements
    let newBadges = [];
    try {
      logger.info(`Checking achievements for student ${studentId} after quiz ${quizId}`);
      newBadges = await achievementService.checkAndAwardAchievements(studentId, session);
      logger.info(`Awarded ${newBadges.length} new badges for student ${studentId}`);
    } catch (error) {
      logger.error('Error checking achievements:', error);
      // Don't fail the submission if achievement check fails
    }
    
    // Update ActiveQuiz status to completed if this was an assigned quiz
    if (session.activeQuizId) {
      try {
        const activeQuiz = await ActiveQuiz.findById(session.activeQuizId);
        if (activeQuiz) {
          activeQuiz.status = 'completed';
          activeQuiz.completedAt = new Date();
          activeQuiz.score = session.totalScore;
          activeQuiz.totalMarks = session.totalMarks;
          activeQuiz.timeSpent = session.timeSpent;
          await activeQuiz.save();
          logger.info(`Marked ActiveQuiz ${session.activeQuizId} as completed for student ${studentId}`);
        }
      } catch (error) {
        logger.error(`Error updating ActiveQuiz status: ${error.message}`);
        // Don't fail the submission if ActiveQuiz update fails
      }
    }
    
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
      },
      newBadges: newBadges.map(badge => ({
        badgeType: badge.badgeType,
        badgeName: badge.badgeName,
        badgeDescription: badge.badgeDescription,
        badgeIcon: badge.badgeIcon,
        badgeColor: badge.badgeColor,
        points: badge.points,
        level: badge.level
      }))
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

/**
 * Select questions using the configured strategy
 * 
 * @route POST /api/quizzes/:id/select-questions
 * @param req - Express request with:
 *   - params.id: Quiz ID
 *   - body.questionCount: Number of questions to select
 *   - body.difficulty: Question difficulty level
 *   - body.questionSelectionStrategy: Strategy name (adaptive, default)
 * @param res - Express response
 * @param next - Express next middleware
 */
exports.selectQuestions = async (req, res, next) => {
  try {
    const { id: quizId } = req.params;
    const studentId = req.user._id;
    const { 
      questionCount, 
      difficulty, 
      questionSelectionStrategy = 'adaptive'
    } = req.body;

    console.log('[selectQuestions] API endpoint called');
    console.log('[selectQuestions] quizId:', quizId);
    console.log('[selectQuestions] studentId:', studentId);
    console.log('[selectQuestions] Request body:', { questionCount, difficulty, questionSelectionStrategy });

    logger.info(`[QuestionSelection] Student ${studentId} requesting ${questionCount} questions with strategy: ${questionSelectionStrategy}`);

    // Fetch quiz
    const quiz = await Quiz.findById(quizId).populate('courseId');
    
    console.log('[selectQuestions] Quiz found:', !!quiz);
    
    if (!quiz) {
      console.log('[selectQuestions] Quiz not found for ID:', quizId);
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    // Fetch all questions for the course
    const Question = require('../models/Question.model');
    const allQuestions = await Question.find({
      courseId: quiz.courseId._id,
      isDeleted: false
    });

    console.log(`[QuestionSelection] Found ${allQuestions.length} questions for course`);

    if (allQuestions.length < questionCount) {
      return res.status(400).json({
        success: false,
        message: `Not enough questions available. Required: ${questionCount}, Available: ${allQuestions.length}`
      });
    }

    // Get student performance for adaptive selection
    const StudentPerformance = require('../models/StudentPerformance.model');
    const studentPerformance = await StudentPerformance.findOne({ studentId });

    logger.info(`[QuestionSelection] Student performance found: ${!!studentPerformance}`);

    // Get question selection strategy
    const QuestionSelectionFactory = require('../algorithms/QuestionSelectionFactory');
    const strategy = QuestionSelectionFactory.getStrategy(questionSelectionStrategy);

    console.log(`[QuestionSelection] Using strategy: ${strategy.constructor.name}`);

    // Prepare selection criteria
    const criteria = {
      courseId: quiz.courseId._id,
      difficultyLevel: difficulty,
      questionConfig: {
        totalQuestions: questionCount,
        topicWeightage: quiz.questionConfig?.topicWeightage || {},
        typeDistribution: quiz.questionConfig?.typeDistribution || {}
      },
      studentId,
      studentPerformance,
      existingTopicAccuracy: {},
      allQuestions
    };

    // Select questions using strategy
    console.log(`[QuestionSelection] Calling strategy.select() with criteria:`, {
      courseId: criteria.courseId,
      difficulty: criteria.difficultyLevel,
      totalQuestions: criteria.questionConfig.totalQuestions
    });

    const selectedQuestions = await strategy.select(criteria);

    console.log(`[QuestionSelection] Strategy selected ${selectedQuestions.length} questions`);

    if (selectedQuestions.length < questionCount) {
      logger.warn(`[QuestionSelection] Strategy could only select ${selectedQuestions.length}/${questionCount} questions`);
    }

    logger.info(`[QuestionSelection] Successfully selected ${selectedQuestions.length} questions using ${questionSelectionStrategy} strategy`);

    res.json({
      success: true,
      message: 'Questions selected successfully',
      data: selectedQuestions
    });

  } catch (error) {
    console.error('[selectQuestions] Exception caught:', error.message);
    console.error('[selectQuestions] Stack trace:', error.stack);
    logger.error(`[QuestionSelection] Error selecting questions: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to select questions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

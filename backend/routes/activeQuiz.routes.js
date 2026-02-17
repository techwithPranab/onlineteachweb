const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const ActiveQuiz = require('../models/ActiveQuiz.model');
const QuizSession = require('../models/QuizSession.model');
const StudentPerformance = require('../models/StudentPerformance.model');
const { authenticate, authorize } = require('../middleware/auth');
const { body, param, validationResult } = require('express-validator');
const { evaluateAnswer, calculateMarksAwarded } = require('../utils/answerEvaluation');

// Validation middleware
const validateQuizCreation = [
  body('subject').isString().trim().notEmpty().withMessage('Subject is required'),
  body('courseName').isString().trim().notEmpty().withMessage('Course name is required'),
  body('courseId').isMongoId().withMessage('Valid course ID is required'),
  body('difficulty').isIn(['easy', 'medium', 'hard']).withMessage('Valid difficulty level required'),
  body('questionCount').isInt({ min: 1, max: 100 }).withMessage('Question count must be between 1-100'),
  body('duration').isInt({ min: 1, max: 300 }).withMessage('Duration must be between 1-300 minutes'),
  body('questions').optional().isArray().withMessage('Questions array must be an array'),
  body('questions.*.id').optional().isString().notEmpty().withMessage('Question ID is required'),
  body('questions.*.question').optional().isString().notEmpty().withMessage('Question text is required'),
  body('questions.*.type').optional().isIn(['mcq-single', 'mcq-multiple', 'true-false', 'numerical', 'short-answer', 'long-answer', 'case-based']).withMessage('Valid question type required'),
  body('questions.*.options').optional().isArray().withMessage('Question options are required'),
  body('questions.*.correctAnswer').optional().exists().withMessage('Correct answer is required'),
  body('questions.*.topic').optional().isString().notEmpty().withMessage('Question topic is required'),
  body('questions.*.difficulty').optional().isIn(['easy', 'medium', 'hard']).withMessage('Valid question difficulty required'),
  body('questionSelectionStrategy').optional().isIn(['adaptive', 'default']).withMessage('Valid strategy required')
];

const validateQuizUpdate = [
  param('quizId').isString().notEmpty().withMessage('Valid quiz ID is required'),
  body('status').optional().isIn(['active', 'in-progress', 'completed', 'abandoned']).withMessage('Valid status required')
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

    if (quiz.status === 'completed' || quiz.status === 'abandoned') {
      return res.status(400).json({
        success: false,
        message: `Cannot save answer for ${quiz.status.toLowerCase()} quiz`
      });
    }

    // Find the QuizSession for this ActiveQuiz
    let session = await QuizSession.findOne({ 
      activeQuizId: quiz._id,
      studentId: userId 
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Quiz session not found. Please restart the quiz.'
      });
    }

    // Find the question in the session
    const question = quiz.questions.find(q => q.id === questionId || q._id?.toString() === questionId);
    
    if (!question) {
      console.error('Question not found:', { questionId, availableQuestions: quiz.questions.map(q => ({ id: q.id, _id: q._id })) });
      return res.status(404).json({
        success: false,
        message: 'Question not found in this quiz'
      });
    }

    console.log('Saving answer for question:', {
      questionId,
      answer,
      questionFound: !!question,
      questionType: question.type,
      questionCorrectAnswer: question.correctAnswer,
      questionOptions: question.options?.map(o => ({ id: o._id || o.id, text: o.text })),
      currentAnswersCount: session.answers.length
    });

    // Evaluate the answer
    const isCorrect = evaluateAnswer(question, answer);
    const marksAwarded = calculateMarksAwarded(question, answer, isCorrect);

    console.log('Answer evaluation result:', {
      questionId,
      questionType: question.type,
      userAnswer: answer,
      correctAnswer: question.correctAnswer,
      isCorrect,
      marksAwarded,
      evaluationInput: {
        questionType: question.type,
        correctAnswer: question.correctAnswer,
        userAnswer: answer,
        options: question.options?.map(o => ({ id: o._id || o.id, text: o.text }))
      }
    });

    // Create question snapshot
    const questionSnapshot = JSON.stringify({
      text: question.question || question.text || '',
      type: question.type || 'mcq-single',
      options: (question.options || []).map(opt => ({
        _id: opt._id || opt.id,
        text: opt.text
      })),
      correctAnswer: question.correctAnswer,
      expectedAnswer: question.expectedAnswer,
      numericalAnswer: question.numericalAnswer,
      marks: question.marks || 1,
      negativeMarks: question.negativeMarks || 0,
      topic: question.topic || '',
      difficultyLevel: question.difficulty || 'medium',
      explanation: question.explanation || ''
    });

    // Update or add answer in QuizSession
    // Make sure to compare questionId as strings
    const questionIdStr = questionId.toString();
    const existingAnswerIndex = session.answers.findIndex(a => 
      a.questionId?.toString() === questionIdStr
    );
    
    console.log('Existing answer check:', { 
      questionId: questionIdStr, 
      existingAnswerIndex, 
      totalAnswers: session.answers.length,
      allQuestionIds: session.answers.map(a => a.questionId?.toString())
    });
    
    const answerData = {
      questionId: questionIdStr,
      questionSnapshot: questionSnapshot,
      answer: answer,
      isCorrect: isCorrect,
      marksAwarded: marksAwarded,
      timeSpent: timeSpent,
      isVisited: true,
      isMarkedForReview: markedForReview
    };

    if (existingAnswerIndex >= 0) {
      // Update existing answer - preserve previous time spent and add new time
      const previousTimeSpent = session.answers[existingAnswerIndex].timeSpent || 0;
      answerData.timeSpent = previousTimeSpent + timeSpent;
      
      console.log('Updating existing answer:', {
        questionId: questionIdStr,
        previousTimeSpent,
        newTimeSpent: timeSpent,
        totalTimeSpent: answerData.timeSpent,
        previousIsCorrect: session.answers[existingAnswerIndex].isCorrect,
        newIsCorrect: isCorrect,
        previousAnswer: session.answers[existingAnswerIndex].answer,
        newAnswer: answer
      });
      
      session.answers[existingAnswerIndex] = answerData;
      console.log('Updated existing answer at index:', existingAnswerIndex);
    } else {
      // Add new answer
      console.log('Adding new answer:', {
        questionId: questionIdStr,
        timeSpent,
        isCorrect,
        answer
      });
      session.answers.push(answerData);
      console.log('Added new answer, total answers now:', session.answers.length);
    }

    // Update session score and accuracy
    const totalCorrect = session.answers.filter(a => a.isCorrect).length;
    const totalAnswered = session.answers.length;
    session.score = session.answers.reduce((sum, a) => sum + (a.marksAwarded || 0), 0);
    session.accuracy = totalAnswered > 0 ? (totalCorrect / totalAnswered) * 100 : 0;
    session.percentage = session.accuracy;
    
    // Update total time spent across all questions
    session.totalTimeSpent = session.answers.reduce((sum, a) => sum + (a.timeSpent || 0), 0);

    // Mark answers array as modified for Mongoose
    session.markModified('answers');
    await session.save();

    console.log('Answer saved, session updated:', {
      totalAnswers: session.answers.length,
      score: session.score,
      accuracy: session.accuracy,
      totalTimeSpent: session.totalTimeSpent,
      individualTimes: session.answers.map(a => ({ q: a.questionId?.toString().slice(-4), t: a.timeSpent })),
      savedAnswerDetails: session.answers.find(a => a.questionId?.toString() === questionIdStr)
    });

    // Calculate progress percentage
    const progressPercentage = (totalAnswered / quiz.questions.length) * 100;

    res.json({
      success: true,
      message: 'Answer saved successfully',
      data: {
        questionId,
        saved: true,
        isCorrect: isCorrect,
        marksAwarded: marksAwarded,
        progressPercentage: Math.round(progressPercentage)
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

    if (quiz.status === 'completed' || quiz.status === 'abandoned') {
      return res.status(400).json({
        success: false,
        message: `Cannot mark question for ${quiz.status.toLowerCase()} quiz`
      });
    }

    // Find the QuizSession for this ActiveQuiz
    let session = await QuizSession.findOne({ 
      activeQuizId: quiz._id,
      studentId: userId 
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Quiz session not found. Please restart the quiz.'
      });
    }

    // Find the answer and toggle review mark
    const answerIndex = session.answers.findIndex(a => a.questionId === questionId);
    
    if (answerIndex >= 0) {
      session.answers[answerIndex].isMarkedForReview = !session.answers[answerIndex].isMarkedForReview;
      await session.save();
      
      res.json({
        success: true,
        message: session.answers[answerIndex].isMarkedForReview ? 'Question marked for review' : 'Review mark removed',
        data: {
          questionId,
          markedForReview: session.answers[answerIndex].isMarkedForReview
        }
      });
    } else {
      return res.status(404).json({
        success: false,
        message: 'Answer not found. Please answer the question first.'
      });
    }

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

    if (quiz.status === 'completed' || quiz.status === 'abandoned') {
      return res.status(400).json({
        success: false,
        message: `Cannot skip question for ${quiz.status.toLowerCase()} quiz`
      });
    }

    // Find the QuizSession for this ActiveQuiz
    let session = await QuizSession.findOne({ 
      activeQuizId: quiz._id,
      studentId: userId 
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Quiz session not found. Please restart the quiz.'
      });
    }

    // Mark question as visited but not answered
    const answerIndex = session.answers.findIndex(a => a.questionId === questionId);
    
    if (answerIndex >= 0) {
      // Update time spent
      session.answers[answerIndex].timeSpent += timeSpent;
      session.answers[answerIndex].isVisited = true;
    } else {
      // Add as skipped (visited but no answer)
      session.answers.push({
        questionId: questionId,
        questionSnapshot: '', // Will be filled when answered
        answer: null,
        isCorrect: false,
        marksAwarded: 0,
        timeSpent: timeSpent,
        isVisited: true,
        isMarkedForReview: false
      });
    }

    await session.save();

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
    console.log('[ActiveQuiz] POST request received');
    console.log('[ActiveQuiz] Request body:', JSON.stringify(req.body, null, 2));
    
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('[ActiveQuiz] Validation errors:', errors.array());
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
      algorithmUsed = 'algorithm',
      questionSelectionStrategy = 'adaptive'
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

    // If questions are not provided, select them using the strategy
    let selectedQuestions = questions;
    if (!questions || questions.length === 0) {
      console.log('[ActiveQuiz] No questions provided, selecting using strategy:', questionSelectionStrategy);
      
      // Get question selection strategy
      const QuestionSelectionFactory = require('../algorithms/QuestionSelectionFactory');
      const strategy = QuestionSelectionFactory.getStrategy(questionSelectionStrategy);
      
      // Get all questions for the course
      const Question = require('../models/Question.model');
      const allQuestions = await Question.find({
        courseId,
        isActive: true
      });

      console.log(`[ActiveQuiz] Found ${allQuestions.length} questions for course ${courseId}`);
      console.log(`[ActiveQuiz] Sample questions:`, allQuestions.slice(0, 2).map(q => ({ id: q._id, topic: q.topic, difficulty: q.difficultyLevel })));

      if (allQuestions.length < questionCount) {
        return res.status(400).json({
          success: false,
          message: `Not enough questions available. Required: ${questionCount}, Available: ${allQuestions.length}`
        });
      }

      // Get student performance for adaptive selection
      const StudentPerformance = require('../models/StudentPerformance.model');
      const studentPerformance = await StudentPerformance.findOne({ studentId: userId });

      console.log('[ActiveQuiz] Student performance found:', !!studentPerformance);

      // Prepare selection criteria
      const criteria = {
        courseId,
        difficultyLevel: difficulty,
        questionConfig: {
          totalQuestions: questionCount,
          topicWeightage: {},
          typeDistribution: {}
        },
        studentId: userId,
        studentPerformance,
        allQuestions
      };

      // Select questions using strategy
      const strategySelectedQuestions = await strategy.select(criteria);

      console.log(`[ActiveQuiz] Strategy selected ${strategySelectedQuestions.length} questions`);

      // Transform strategy output to expected format
      selectedQuestions = strategySelectedQuestions.map(q => ({
        id: (q.questionId || q._id).toString(),
        question: q.snapshot?.question || q.snapshot?.text || q.text || '',
        type: q.snapshot?.type || q.type || 'mcq-single',
        options: (q.snapshot?.options || q.options || []).map(opt => ({
          id: (opt._id || opt.id).toString(),
          text: opt.text || ''
        })),
        correctAnswer: q.snapshot?.correctAnswer || q.correctAnswer,
        expectedAnswer: q.snapshot?.expectedAnswer || q.expectedAnswer,
        numericalAnswer: q.snapshot?.numericalAnswer || q.numericalAnswer,
        marks: q.snapshot?.marks || q.marks || 1,
        negativeMarks: q.snapshot?.negativeMarks || q.negativeMarks || 0,
        topic: q.snapshot?.topic || q.topic || 'General',
        difficulty: q.snapshot?.difficulty || q.snapshot?.difficultyLevel || q.difficulty || difficulty,
        explanation: q.snapshot?.explanation || q.explanation || ''
      }));

      if (selectedQuestions.length < questionCount) {
        return res.status(400).json({
          success: false,
          message: `Could only select ${selectedQuestions.length} questions. Required: ${questionCount}`
        });
      }
    }

    // Generate unique IDs
    const quizId = `quiz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create active quiz
    const activeQuiz = new ActiveQuiz({
      quizId,
      sessionId,
      createdBy: userId,
      creatorRole: req.user.role,
      distributedStudents: [userId], // For student-created quizzes, include themselves
      userId, // Keep for backward compatibility
      subject,
      courseName,
      courseId,
      difficulty,
      questionCount,
      duration,
      questions: selectedQuestions,
      algorithmUsed,
      questionSelectionStrategy,
      totalMarks: selectedQuestions.reduce((sum, q) => sum + (q.marks || 1), 0)
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
    console.error('Error stack:', error.stack);
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

    // Calculate remaining time based on quiz duration and time elapsed
    let remainingTime = quiz.duration * 60; // Default to full duration in seconds
    if (quiz.startedAt) {
      const elapsedSeconds = Math.floor((Date.now() - quiz.startedAt.getTime()) / 1000);
      const totalSeconds = quiz.duration * 60;
      remainingTime = Math.max(0, totalSeconds - elapsedSeconds);
    }

    // Find QuizSession to get saved answers if resuming
    const session = await QuizSession.findOne({ 
      activeQuizId: quiz._id,
      studentId: userId 
    });

    res.json({
      success: true,
      message: 'Active quiz retrieved successfully',
      data: {
        ...quiz.toObject(),
        remainingTime,
        answers: session?.answers || [],
        sessionId: session?._id
      }
    });

    console.log('📤 GET /:quizId response data:', {
      quizId: quiz.quizId,
      questionCount: quiz.questions?.length,
      sampleQuestion: quiz.questions?.[0] ? {
        id: quiz.questions[0].id,
        question: quiz.questions[0].question?.substring(0, 50),
        options: quiz.questions[0].options?.map(o => ({
          _id: o._id,
          text: o.text?.substring(0, 30)
        }))
      } : null
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
// @desc    Start an active quiz (change status to in-progress)
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

    console.log('🔄 Starting quiz:', { quizId, userId });

    // Check if user already has a quiz in progress
    const existingInProgress = await ActiveQuiz.hasQuizInProgress(userId);
    console.log('📊 Existing quiz in progress check:', existingInProgress);
    if (existingInProgress && existingInProgress.quizId !== quizId) {
      console.log('❌ User has another quiz in progress');
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

    console.log('🔍 Looking for active quiz...');
    const quiz = await ActiveQuiz.findOne({ quizId, userId, isDeleted: false });
    console.log('📋 Found quiz:', quiz ? { id: quiz._id, status: quiz.status } : 'NOT FOUND');

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Active quiz not found'
      });
    }

    if (quiz.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: `Cannot start quiz with status: ${quiz.status}`
      });
    }

    // Start the quiz
    await quiz.startQuiz();

    // Create QuizSession for tracking this attempt
    try {
      const questionsData = quiz.questions.map((q, index) => {
        return {
          questionId: q.id || q._id || null,
          originalOrder: index,
          displayOrder: index,
          // Store complete question details instead of snapshot
          question: q.question || q.text || '',
          type: q.type || 'mcq-single',
          options: (q.options || []).map(opt => ({
            _id: opt._id || opt.id,
            id: opt.id,
            text: opt.text || ''
          })),
          correctAnswer: q.correctAnswer,
          expectedAnswer: q.expectedAnswer,
          // Handle numericalAnswer - it might be an object or a number
          numericalAnswer: typeof q.numericalAnswer === 'object' && q.numericalAnswer !== null 
            ? q.numericalAnswer 
            : q.numericalAnswer,
          marks: q.marks || 1,
          negativeMarks: q.negativeMarks || 0,
          topic: q.topic || q.subject || 'General',
          subject: q.subject || q.topic || 'General',
          difficulty: q.difficulty || q.difficultyLevel || 'medium',
          explanation: q.explanation || '',
          metadata: {
            source: 'ActiveQuiz',
            capturedAt: new Date().toISOString()
          }
        };
      });

      const quizSessionData = {
        studentId: userId,
        quizId: quiz._id,
        activeQuizId: quiz._id, // Link to ActiveQuiz
        courseId: quiz.courseId || null,
        attemptNumber: 1,
        status: 'in-progress',
        score: 0,
        totalScore: quiz.totalMarks || 0,
        totalMarks: quiz.totalMarks || 0,
        percentage: 0,
        accuracy: 0,
        timeTaken: 0,
        timeSpent: 0,
        totalTimeSpent: 0, // Initialize total time spent across all questions
        duration: quiz.duration,
        difficulty: quiz.difficulty,
        totalQuestions: quiz.questions?.length || 0,
        startedAt: new Date(),
        expiresAt: new Date(Date.now() + (quiz.duration * 60 * 1000)),
        passingPercentage: 60,
        passed: false,
        algorithmVersion: quiz.algorithmUsed || 'algorithm-v1',
        selectedQuestions: questionsData,
        answers: [], // Empty initially, will be populated as student answers
        metadata: {
          subject: quiz.subject,
          courseName: quiz.courseName,
          questionCount: quiz.questionCount,
          isAlgorithmGenerated: true
        }
      };

      // Check if session already exists
      let session = await QuizSession.findOne({ 
        activeQuizId: quiz._id,
        studentId: userId 
      });

      if (session) {
        // Update existing session
        Object.assign(session, quizSessionData);
        await session.save();
        console.log('Updated existing QuizSession on start:', session._id);
      } else {
        // Create new session
        session = await QuizSession.create(quizSessionData);
        console.log('Created new QuizSession on start:', session._id);
      }
    } catch (sessionError) {
      console.error('Error creating QuizSession on start:', sessionError);
      // Don't fail the quiz start if session creation fails
    }

    // Calculate remaining time
    const remainingTime = quiz.duration * 60; // Full duration in seconds for new start

    res.json({
      success: true,
      message: 'Quiz started successfully',
      data: {
        quizId: quiz.quizId,
        sessionId: quiz.sessionId,
        status: quiz.status,
        startedAt: quiz.startedAt,
        remainingTime: remainingTime
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

    if (quiz.status !== 'in-progress') {
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

    // Update the existing QuizSession
    try {
      // Find the existing session created when quiz started
      let session = await QuizSession.findOne({ 
        activeQuizId: quiz._id,
        studentId: userId 
      });

      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Quiz session not found. Cannot complete quiz.'
        });
      }

      // Update session with completion data
      session.status = 'completed';
      session.score = Number(score) || session.score || 0;
      session.totalScore = Number(totalMarks) || session.totalScore || 0;
      session.totalMarks = Number(totalMarks) || session.totalMarks || 0;
      session.timeSpent = Number(timeSpent) || session.timeSpent || 0;
      session.timeTaken = Number(timeSpent) || session.timeTaken || 0;
      session.submittedAt = new Date();
      session.completedAt = new Date();
      
      // Calculate final accuracy and percentage
      const totalCorrect = session.answers.filter(a => a.isCorrect).length;
      const totalAnswered = session.answers.length;
      session.accuracy = totalAnswered > 0 ? (totalCorrect / totalAnswered) * 100 : 0;
      session.percentage = session.accuracy;
      session.passed = session.percentage >= (session.passingPercentage || 60);
      
      // Calculate total time spent across all questions
      session.totalTimeSpent = session.answers.reduce((sum, a) => sum + (a.timeSpent || 0), 0);

      // Update metadata with performance data if provided
      if (performanceData) {
        session.metadata = {
          ...session.metadata,
          performanceData: {
            accuracy: session.accuracy,
            totalQuestions: quiz.questionCount || 0,
            correct: totalCorrect,
            wrong: totalAnswered - totalCorrect,
            unattempted: (quiz.questionCount || 0) - totalAnswered,
            performanceByTopic: performanceData?.topicAnalysis || 
                               performanceData?.performanceByTopic || [],
            performanceByDifficulty: performanceData?.difficultyAnalysis || 
                                    performanceData?.performanceByDifficulty || {},
            weakTopics: performanceData?.weakTopics || 
                       performanceData?.improvementAreas?.weakAreas?.map(a => a.area) || [],
            recommendations: performanceData?.recommendations || 
                           performanceData?.nextActions?.map(a => a.description) || []
          }
        };

        // Save analysis to dedicated analysis field
        let performanceByTopic = performanceData?.performanceByTopic || performanceData?.topicAnalysis || null;
        let performanceByDifficulty = performanceData?.performanceByDifficulty || performanceData?.difficultyAnalysis || null;
        let weakTopics = performanceData?.weakTopics || performanceData?.improvementAreas?.weakAreas?.map(a => a.area) || [];
        
        // If performanceData is missing or empty, calculate from session.answers and questions
        if (!performanceByTopic || (Array.isArray(performanceByTopic) && performanceByTopic.length === 0) || (typeof performanceByTopic === 'object' && Object.keys(performanceByTopic).length === 0)) {
          console.log('📊 Calculating performance from session answers...');
          const topicStats = {};
          const difficultyStats = {};
          
          // Analyze each answer
          session.answers.forEach((answer) => {
            // Find the corresponding question
            const question = session.selectedQuestions.find(q => 
              q.questionId?.toString() === answer.questionId?.toString()
            );
            
            if (question) {
              const topic = question.topic || 'General';
              const difficulty = question.difficultyLevel || question.difficulty || 'medium';
              
              // Topic statistics
              if (!topicStats[topic]) {
                topicStats[topic] = { correct: 0, total: 0 };
              }
              topicStats[topic].total++;
              if (answer.isCorrect) {
                topicStats[topic].correct++;
              }
              
              // Difficulty statistics
              if (!difficultyStats[difficulty]) {
                difficultyStats[difficulty] = { correct: 0, total: 0 };
              }
              difficultyStats[difficulty].total++;
              if (answer.isCorrect) {
                difficultyStats[difficulty].correct++;
              }
            }
          });
          
          // Convert to array format
          performanceByTopic = Object.entries(topicStats).map(([topic, stats]) => ({
            topic,
            accuracy: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0,
            correct: stats.correct,
            total: stats.total
          }));
          
          performanceByDifficulty = Object.entries(difficultyStats).map(([difficulty, stats]) => ({
            difficulty,
            accuracy: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0,
            correct: stats.correct,
            total: stats.total
          }));
          
          // Calculate weak topics (< 70% accuracy)
          weakTopics = performanceByTopic
            .filter(t => t.accuracy < 70)
            .map(t => t.topic);
          
          console.log('📊 Calculated performance:', {
            topicCount: performanceByTopic.length,
            difficultyCount: performanceByDifficulty.length,
            weakTopicsCount: weakTopics.length
          });
        }
        
        // Calculate strong topics (accuracy >= 80%)
        const strongTopics = Array.isArray(performanceByTopic)
          ? performanceByTopic.filter(t => t.accuracy >= 80).map(t => t.topic)
          : Object.entries(performanceByTopic || {})
              .filter(([_, data]) => ((data.correct || 0) / (data.total || 1)) >= 0.8)
              .map(([topic, _]) => topic);

        session.analysis = {
          score: Number(score) || 0,
          totalScore: Number(totalMarks) || 0,
          accuracy: session.accuracy || 0,
          timeTaken: Number(timeSpent) || 0,
          totalTime: session.duration || 0,
          timeUtilization: session.duration > 0 ? ((Number(timeSpent) || 0) / session.duration) * 100 : 0,
          performanceByTopic: Array.isArray(performanceByTopic) 
            ? performanceByTopic 
            : Object.entries(performanceByTopic).map(([topic, data]) => ({
                topic,
                accuracy: ((data.correct || 0) / (data.total || 1)) * 100,
                correct: data.correct || 0,
                total: data.total || 0
              })),
          performanceByDifficulty: Array.isArray(performanceByDifficulty)
            ? performanceByDifficulty
            : Object.entries(performanceByDifficulty).map(([difficulty, data]) => ({
                difficulty,
                accuracy: ((data.correct || 0) / (data.total || 1)) * 100,
                correct: data.correct || 0,
                total: data.total || 0
              })),
          weakTopics,
          strongTopics
        };

        // Save recommendations to dedicated recommendations field
        const recommendations = performanceData?.recommendations || performanceData?.nextActions || [];
        session.recommendations = Array.isArray(recommendations)
          ? recommendations.map(rec => {
              if (typeof rec === 'string') {
                return {
                  recommendationType: 'general',
                  message: rec,
                  priority: 'medium'
                };
              }
              return {
                recommendationType: rec.type || rec.recommendationType || 'general',
                message: rec.message || rec.description || rec.toString(),
                priority: rec.priority || 'medium'
              };
            })
          : [];

        // Add weak topic recommendations if not provided
        if (weakTopics.length > 0 && session.recommendations.length === 0) {
          session.recommendations.push({
            recommendationType: 'topic_focus',
            message: `Focus on improving: ${weakTopics.join(', ')}`,
            priority: 'high'
          });
        }

        // Save improvementAreas if provided
        if (performanceData?.improvementAreas) {
          session.improvementAreas = {
            weakAreas: performanceData.improvementAreas.weakAreas || [],
            strongAreas: performanceData.improvementAreas.strongAreas || [],
            recommendations: performanceData.improvementAreas.recommendations || []
          };
        }

        console.log('💾 Saving analysis and recommendations to session:', {
          sessionId: session._id,
          hasAnalysis: !!session.analysis,
          hasRecommendations: !!session.recommendations,
          hasImprovementAreas: !!session.improvementAreas,
          recommendationCount: session.recommendations.length,
          weakTopicsCount: weakTopics.length,
          strongTopicsCount: strongTopics.length,
          improvementWeakAreasCount: session.improvementAreas?.weakAreas?.length || 0,
          improvementStrongAreasCount: session.improvementAreas?.strongAreas?.length || 0
        });
      }

      await session.save();
      console.log('✅ Session saved successfully with analysis and recommendations');
      console.log('Updated QuizSession on completion:', session._id);
    } catch (sessionError) {
      console.error('Error updating QuizSession on completion:', sessionError);
      return res.status(500).json({
        success: false,
        message: 'Failed to update quiz session'
      });
    }

    // ✅ PHASE 2: Update StudentPerformance
    try {
      console.log('Updating StudentPerformance for user:', userId);
      
      // Prepare topic performance data
      const topicPerformance = [];
      
      // Extract topic performance from performanceData or calculate from questions
      if (performanceData && performanceData.performanceByTopic) {
        Object.entries(performanceData.performanceByTopic).forEach(([topic, data]) => {
          const questionsAttempted = data.total || 0;
          const questionsCorrect = data.correct || 0;
          const accuracy = questionsAttempted > 0 ? (questionsCorrect / questionsAttempted) * 100 : 0;
          
          topicPerformance.push({
            subject: quiz.subject || performanceData.subject || 'General',
            topic: topic,
            questionsAttempted: questionsAttempted,
            questionsCorrect: questionsCorrect,
            accuracy: accuracy,
            successRate: accuracy, // Same as accuracy for now
            total: questionsAttempted,
            correct: questionsCorrect
          });
        });
      } else {
        // Fallback: Calculate from questions if performanceData not provided
        const topicStats = {};
        
        quiz.questions.forEach((q, index) => {
          const topic = q.topic || 'General';
          
          if (!topicStats[topic]) {
            topicStats[topic] = { total: 0, correct: 0 };
          }
          
          topicStats[topic].total++;
          
          // Check if answer is correct
          const answer = quiz.answers && quiz.answers[index];
          if (answer && answer.isCorrect) {
            topicStats[topic].correct++;
          }
        });
        
        Object.entries(topicStats).forEach(([topic, stats]) => {
          const accuracy = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
          
          topicPerformance.push({
            subject: quiz.subject || 'General',
            topic: topic,
            questionsAttempted: stats.total,
            questionsCorrect: stats.correct,
            accuracy: accuracy,
            successRate: accuracy, // Same as accuracy for now
            total: stats.total,
            correct: stats.correct
          });
        });
      }
      
      // Call StudentPerformance.updateAfterQuiz
      const quizResultsData = {
        quizId: quiz._id,
        subject: quiz.subject || 'General',
        totalQuestions: quiz.questions?.length || 0,
        correctAnswers: Math.round((quiz.accuracy || 0) * (quiz.questions?.length || 0) / 100),
        score: quiz.score || 0,
        accuracy: quiz.accuracy || 0,
        timeSpent: quiz.timeSpent || 0,
        topicPerformance: topicPerformance
      };
      
      console.log('StudentPerformance update data:', JSON.stringify(quizResultsData, null, 2));
      
      await StudentPerformance.updateAfterQuiz(userId, quizResultsData);
      
      console.log('StudentPerformance updated successfully for', topicPerformance.length, 'topics');
    } catch (performanceError) {
      // Log error but don't fail the quiz completion
      console.error('Error updating StudentPerformance:', performanceError);
      console.error('Performance error stack:', performanceError.stack);
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
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          inProgressQuizzes: {
            $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] }
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

// @route   GET /api/active-quizzes/:quizId/result
// @desc    Get quiz result for a completed ActiveQuiz
// @access  Private (Student)
router.get('/:quizId/result', async (req, res) => {
  try {
    const { quizId } = req.params;
    const userId = req.user._id;

    console.log('🔍 Fetching ActiveQuiz result:', { quizId, userId: userId.toString() });

    // Find the ActiveQuiz
    const activeQuiz = await ActiveQuiz.findOne({ 
      quizId, 
      userId, 
      isDeleted: false 
    });

    if (!activeQuiz) {
      console.log('❌ ActiveQuiz not found');
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    // Find the QuizSession for this ActiveQuiz
    const session = await QuizSession.findOne({ 
      activeQuizId: activeQuiz._id,
      studentId: userId 
    }).sort({ createdAt: -1 }); // Get the latest session

    if (!session) {
      console.log('❌ QuizSession not found for ActiveQuiz');
      return res.status(404).json({
        success: false,
        message: 'Quiz session not found'
      });
    }

    console.log('✅ Found QuizSession:', {
      sessionId: session._id,
      status: session.status,
      score: session.totalScore,
      totalMarks: session.totalMarks,
      hasAnalysis: !!session.analysis,
      hasRecommendations: !!session.recommendations,
      hasImprovementAreas: !!session.improvementAreas
    });

    // Transform the result to match the expected format
    const result = {
      quiz: {
        _id: activeQuiz.quizId,
        title: `${activeQuiz.subject} - ${activeQuiz.courseName}`,
        subject: activeQuiz.subject,
        difficulty: activeQuiz.difficulty,
        passingPercentage: 60,
        duration: activeQuiz.duration
      },
      session: {
        _id: session._id,
        attemptNumber: 1,
        startedAt: session.startedAt,
        submittedAt: session.submittedAt || session.completedAt,
        timeSpent: session.timeSpent,
        status: session.status,
        score: session.totalScore,
        totalMarks: session.totalMarks,
        percentage: session.percentage,
        passed: session.passed || (session.percentage >= 60),
        pendingManualEvaluation: false,
        
        // Include the saved analysis data
        analysis: session.analysis || null,
        recommendations: session.recommendations || [],
        improvementAreas: session.improvementAreas || null,
        
        // Include answers for detailed view
        answers: session.answers || [],
        selectedQuestions: session.selectedQuestions || []
      }
    };

    console.log('📊 Returning result with analysis:', {
      hasAnalysis: !!result.session.analysis,
      hasRecommendations: result.session.recommendations?.length || 0,
      hasImprovementAreas: !!result.session.improvementAreas,
      answersCount: result.session.answers?.length || 0
    });

    res.json({
      success: true,
      result
    });

  } catch (error) {
    console.error('❌ Error fetching ActiveQuiz result:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quiz result',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;

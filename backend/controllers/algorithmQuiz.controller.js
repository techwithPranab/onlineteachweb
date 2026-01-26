const Quiz = require('../models/Quiz.model');
const QuizSession = require('../models/QuizSession.model');
const Question = require('../models/Question.model');
const User = require('../models/User.model');
const logger = require('../utils/logger');

/**
 * Algorithm-Based Quiz Controller
 * 
 * Handles quiz operations for the AI-ready quiz system
 */

// @desc    Create quiz with algorithm-based question selection
// @route   POST /api/algorithm-quiz/create
// @access  Private (Student)
exports.createAlgorithmQuiz = async (req, res, next) => {
  try {
    const {
      subject,
      courseId,
      difficulty,
      questionCount,
      duration
    } = req.body;
    
    const userId = req.user._id;
    
    // Validate input
    if (!courseId || !difficulty || !questionCount || !duration) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    // Get student's past performance (would come from database)
    const pastPerformance = await getUserPerformance(userId);
    
    // Select questions using algorithm (would use real algorithm)
    const questions = await selectQuestionsForQuiz({
      courseId,
      difficulty,
      questionCount,
      pastPerformance
    });
    
    if (questions.length < questionCount) {
      return res.status(400).json({
        success: false,
        message: `Not enough questions available. Required: ${questionCount}, Available: ${questions.length}`
      });
    }
    
    // Create quiz session
    const session = await QuizSession.create({
      studentId: userId,
      quizId: null, // Dynamic quiz, no fixed quiz
      courseId,
      questions: questions.map(q => ({
        questionId: q._id,
        question: q.questionText,
        options: q.options,
        correctAnswer: q.correctAnswer,
        topic: q.topic,
        difficulty: q.difficulty,
        marks: q.marks || 1
      })),
      totalQuestions: questionCount,
      difficulty,
      duration: duration * 60, // convert to seconds
      remainingTime: duration * 60,
      status: 'ACTIVE',
      metadata: {
        subject,
        generatedBy: 'algorithm',
        algorithmVersion: '1.0'
      }
    });
    
    logger.info(`Algorithm quiz created: ${session._id} for user ${userId}`);
    
    res.status(201).json({
      success: true,
      quiz: {
        id: session._id,
        sessionId: session._id,
        subject,
        courseId,
        difficulty,
        questionCount,
        duration,
        questions: questions.map(q => ({
          id: q._id,
          questionText: q.questionText,
          options: q.options,
          topic: q.topic,
          difficulty: q.difficulty,
          marks: q.marks || 1
        })),
        status: 'ACTIVE',
        createdAt: session.createdAt
      }
    });
  } catch (error) {
    logger.error(`Create algorithm quiz error: ${error.message}`);
    next(error);
  }
};

// @desc    Get active quizzes for student
// @route   GET /api/algorithm-quiz/active
// @access  Private (Student)
exports.getActiveQuizzes = async (req, res, next) => {
  try {
    const userId = req.user._id;
    
    // Get all active and in-progress quiz sessions
    const sessions = await QuizSession.find({
      studentId: userId,
      status: { $in: ['ACTIVE', 'IN_PROGRESS'] }
    })
    .populate('courseId', 'title subject grade')
    .sort({ createdAt: -1 });
    
    const activeQuizzes = sessions.map(session => ({
      id: session._id,
      sessionId: session._id,
      subject: session.metadata?.subject || session.courseId?.subject,
      courseName: session.courseId?.title,
      courseId: session.courseId?._id,
      difficulty: session.difficulty,
      questionCount: session.totalQuestions,
      duration: Math.floor(session.duration / 60),
      status: session.status,
      createdAt: session.createdAt,
      lastUpdated: session.updatedAt
    }));
    
    res.json({
      success: true,
      quizzes: activeQuizzes
    });
  } catch (error) {
    logger.error(`Get active quizzes error: ${error.message}`);
    next(error);
  }
};

// @desc    Update quiz status
// @route   PUT /api/algorithm-quiz/:id/status
// @access  Private (Student)
exports.updateQuizStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user._id;
    
    if (!['ACTIVE', 'IN_PROGRESS', 'COMPLETED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }
    
    const session = await QuizSession.findOne({
      _id: id,
      studentId: userId
    });
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Quiz session not found'
      });
    }
    
    // Prevent multiple in-progress quizzes
    if (status === 'IN_PROGRESS') {
      await QuizSession.updateMany(
        {
          studentId: userId,
          status: 'IN_PROGRESS',
          _id: { $ne: id }
        },
        { status: 'ACTIVE' }
      );
    }
    
    session.status = status;
    session.lastUpdated = new Date();
    if (status === 'IN_PROGRESS' && !session.startedAt) {
      session.startedAt = new Date();
    }
    await session.save();
    
    res.json({
      success: true,
      quiz: {
        id: session._id,
        status: session.status
      }
    });
  } catch (error) {
    logger.error(`Update quiz status error: ${error.message}`);
    next(error);
  }
};

// @desc    Delete quiz
// @route   DELETE /api/algorithm-quiz/:id
// @access  Private (Student)
exports.deleteQuiz = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    const session = await QuizSession.findOne({
      _id: id,
      studentId: userId
    });
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Quiz session not found'
      });
    }
    
    // Only allow deletion of ACTIVE quizzes
    if (session.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        message: 'Can only delete quizzes that have not been started'
      });
    }
    
    await session.deleteOne();
    
    res.json({
      success: true,
      message: 'Quiz deleted successfully'
    });
  } catch (error) {
    logger.error(`Delete quiz error: ${error.message}`);
    next(error);
  }
};

// @desc    Analyze quiz results
// @route   POST /api/algorithm-quiz/:id/analyze
// @access  Private (Student)
exports.analyzeQuizResults = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { answers, timeTaken } = req.body;
    const userId = req.user._id;
    
    const session = await QuizSession.findOne({
      _id: id,
      studentId: userId
    });
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Quiz session not found'
      });
    }
    
    // Calculate results
    let correctAnswers = 0;
    let totalScore = 0;
    const performanceByTopic = {};
    const performanceByDifficulty = {};
    
    session.questions.forEach((question, index) => {
      const answer = answers.find(a => a.questionId === question.questionId.toString());
      const isCorrect = answer && answer.answer === question.correctAnswer;
      
      if (isCorrect) {
        correctAnswers++;
        totalScore += question.marks;
      }
      
      // Track by topic
      if (!performanceByTopic[question.topic]) {
        performanceByTopic[question.topic] = { correct: 0, total: 0 };
      }
      performanceByTopic[question.topic].total++;
      if (isCorrect) performanceByTopic[question.topic].correct++;
      
      // Track by difficulty
      if (!performanceByDifficulty[question.difficulty]) {
        performanceByDifficulty[question.difficulty] = { correct: 0, total: 0 };
      }
      performanceByDifficulty[question.difficulty].total++;
      if (isCorrect) performanceByDifficulty[question.difficulty].correct++;
    });
    
    const totalQuestions = session.totalQuestions;
    const totalPossibleScore = session.questions.reduce((sum, q) => sum + q.marks, 0);
    const accuracy = (correctAnswers / totalQuestions) * 100;
    const timeUtilization = (timeTaken / session.duration) * 100;
    
    // Identify weak topics
    const weakTopics = Object.entries(performanceByTopic)
      .filter(([_, perf]) => (perf.correct / perf.total) < 0.6)
      .map(([topic, _]) => topic);
    
    // Update session
    session.status = 'COMPLETED';
    session.completedAt = new Date();
    session.answers = answers;
    session.score = totalScore;
    session.accuracy = accuracy;
    session.timeTaken = timeTaken;
    await session.save();
    
    // Update student performance (would use algorithm)
    await updateStudentPerformanceDB(userId, {
      courseId: session.courseId,
      accuracy,
      score: totalScore,
      performanceByTopic,
      weakTopics
    });
    
    const analysis = {
      score: totalScore,
      totalScore: totalPossibleScore,
      accuracy: accuracy.toFixed(1),
      timeTaken,
      totalTime: session.duration,
      timeUtilization: timeUtilization.toFixed(1),
      performanceByTopic: Object.entries(performanceByTopic).map(([topic, perf]) => ({
        topic,
        accuracy: ((perf.correct / perf.total) * 100).toFixed(1),
        correct: perf.correct,
        total: perf.total
      })),
      performanceByDifficulty: Object.entries(performanceByDifficulty).map(([difficulty, perf]) => ({
        difficulty,
        accuracy: ((perf.correct / perf.total) * 100).toFixed(1),
        correct: perf.correct,
        total: perf.total
      })),
      weakTopics,
      recommendations: generateRecommendations(weakTopics, performanceByDifficulty)
    };
    
    res.json({
      success: true,
      analysis
    });
  } catch (error) {
    logger.error(`Analyze quiz results error: ${error.message}`);
    next(error);
  }
};

// @desc    Get quiz history
// @route   GET /api/algorithm-quiz/history
// @access  Private (Student)
exports.getQuizHistory = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { subject, dateRange, limit = 50 } = req.query;
    
    const query = {
      studentId: userId,
      status: 'COMPLETED'
    };
    
    if (subject) {
      query['metadata.subject'] = subject;
    }
    
    if (dateRange) {
      const now = new Date();
      let startDate;
      
      switch(dateRange) {
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case 'year':
          startDate = new Date(now.setFullYear(now.getFullYear() - 1));
          break;
      }
      
      if (startDate) {
        query.completedAt = { $gte: startDate };
      }
    }
    
    const sessions = await QuizSession.find(query)
      .populate('courseId', 'title subject grade')
      .sort({ completedAt: -1 })
      .limit(parseInt(limit));
    
    const history = sessions.map(session => ({
      id: session._id,
      quizId: session._id,
      subject: session.metadata?.subject || session.courseId?.subject,
      courseName: session.courseId?.title,
      courseId: session.courseId?._id,
      difficulty: session.difficulty,
      questionCount: session.totalQuestions,
      duration: Math.floor(session.duration / 60),
      score: session.score,
      totalScore: session.questions.reduce((sum, q) => sum + q.marks, 0),
      accuracy: session.accuracy,
      timeTaken: session.timeTaken,
      timeUtilization: ((session.timeTaken / session.duration) * 100).toFixed(1),
      completedAt: session.completedAt,
      status: 'COMPLETED'
    }));
    
    res.json({
      success: true,
      history
    });
  } catch (error) {
    logger.error(`Get quiz history error: ${error.message}`);
    next(error);
  }
};

// @desc    Get student performance data
// @route   GET /api/algorithm-quiz/performance
// @access  Private (Student)
exports.getStudentPerformance = async (req, res, next) => {
  try {
    const userId = req.user._id;
    
    // Get all completed quizzes
    const sessions = await QuizSession.find({
      studentId: userId,
      status: 'COMPLETED'
    }).sort({ completedAt: -1 });
    
    if (sessions.length === 0) {
      return res.json({
        success: true,
        performance: {
          topicMastery: {},
          weakTopics: [],
          totalQuizzesTaken: 0,
          averageScore: 0,
          averageAccuracy: 0
        }
      });
    }
    
    // Aggregate topic mastery
    const topicMastery = {};
    let totalScore = 0;
    let totalAccuracy = 0;
    
    sessions.forEach(session => {
      totalScore += session.score || 0;
      totalAccuracy += session.accuracy || 0;
      
      session.questions.forEach(question => {
        const topic = question.topic;
        if (!topicMastery[topic]) {
          topicMastery[topic] = { correct: 0, total: 0 };
        }
        topicMastery[topic].total++;
        
        const answer = session.answers?.find(a => a.questionId === question.questionId.toString());
        if (answer && answer.answer === question.correctAnswer) {
          topicMastery[topic].correct++;
        }
      });
    });
    
    // Calculate mastery percentages
    const topicMasteryPercentages = {};
    Object.entries(topicMastery).forEach(([topic, data]) => {
      topicMasteryPercentages[topic] = ((data.correct / data.total) * 100).toFixed(1);
    });
    
    // Identify weak topics
    const weakTopics = Object.entries(topicMasteryPercentages)
      .filter(([_, mastery]) => parseFloat(mastery) < 60)
      .map(([topic, _]) => topic);
    
    res.json({
      success: true,
      performance: {
        topicMastery: topicMasteryPercentages,
        weakTopics,
        totalQuizzesTaken: sessions.length,
        averageScore: (totalScore / sessions.length).toFixed(1),
        averageAccuracy: (totalAccuracy / sessions.length).toFixed(1),
        lastUpdated: new Date()
      }
    });
  } catch (error) {
    logger.error(`Get student performance error: ${error.message}`);
    next(error);
  }
};

// =====================
// HELPER FUNCTIONS
// =====================

async function getUserPerformance(userId) {
  const sessions = await QuizSession.find({
    studentId: userId,
    status: 'COMPLETED'
  }).limit(10).sort({ completedAt: -1 });
  
  // Aggregate performance data
  const topicMastery = {};
  const recentQuestions = [];
  
  sessions.forEach(session => {
    session.questions.forEach(question => {
      if (!topicMastery[question.topic]) {
        topicMastery[question.topic] = { correct: 0, total: 0 };
      }
      topicMastery[question.topic].total++;
      
      const answer = session.answers?.find(a => a.questionId === question.questionId.toString());
      if (answer && answer.answer === question.correctAnswer) {
        topicMastery[question.topic].correct++;
      }
      
      recentQuestions.push({
        id: question.questionId,
        topic: question.topic,
        difficulty: question.difficulty
      });
    });
  });
  
  return {
    topicMastery,
    recentQuestions,
    totalQuizzes: sessions.length
  };
}

async function selectQuestionsForQuiz({ courseId, difficulty, questionCount, pastPerformance }) {
  // This would use the actual algorithm
  // For now, simple selection based on difficulty
  const questions = await Question.find({
    courseId,
    difficulty,
    isActive: true
  }).limit(questionCount);
  
  return questions;
}

async function updateStudentPerformanceDB(userId, performanceData) {
  // Update user's performance metrics
  // This would store in a separate Performance collection
  logger.info(`Updated performance for user ${userId}`);
}

function generateRecommendations(weakTopics, performanceByDifficulty) {
  const recommendations = [];
  
  if (weakTopics.length > 0) {
    recommendations.push({
      type: 'topic_focus',
      message: `Focus on improving: ${weakTopics.join(', ')}`
    });
  }
  
  Object.entries(performanceByDifficulty).forEach(([difficulty, perf]) => {
    const accuracy = (perf.correct / perf.total) * 100;
    if (accuracy < 50) {
      recommendations.push({
        type: 'difficulty_adjustment',
        message: `Consider practicing more ${difficulty} questions`
      });
    }
  });
  
  return recommendations;
}

module.exports = exports;

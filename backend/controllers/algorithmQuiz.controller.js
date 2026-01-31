const Quiz = require('../models/Quiz.model');
const QuizSession = require('../models/QuizSession.model');
const Question = require('../models/Question.model');
const User = require('../models/User.model');
const StudentPerformance = require('../models/StudentPerformance.model');
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
      status: 'active',
      metadata: {
        subject,
        generatedBy: 'algorithm',
        algorithmVersion: '1.0'
      }
    });
    
    // Also create an ActiveQuiz record for consistency with the completion API
    const ActiveQuiz = require('../models/ActiveQuiz.model');
    const activeQuiz = await ActiveQuiz.create({
      quizId: session._id.toString(), // Use session ID as quizId
      sessionId: session._id.toString(),
      userId,
      subject,
      courseName: 'Algorithm Generated Quiz', // Will be populated from course
      courseId,
      difficulty,
      questionCount,
      duration: duration * 60,
      status: 'active',
      questions: questions.map(q => ({
        questionId: q._id,
        questionText: q.questionText,
        options: q.options,
        correctAnswer: q.correctAnswer,
        expectedAnswer: q.expectedAnswer,
        numericalAnswer: q.numericalAnswer,
        topic: q.topic,
        difficulty: q.difficulty,
        marks: q.marks || 1,
        type: q.type || 'mcq-single'
      })),
      totalMarks: questions.reduce((sum, q) => sum + (q.marks || 1), 0),
      algorithmUsed: 'algorithm',
      performanceData: {}
    });
    
    logger.info(`Algorithm quiz created: ${session._id} for user ${userId}`);
    
    res.status(201).json({
      success: true,
      quiz: {
        id: session._id,
        quizId: activeQuiz.quizId, // Include the ActiveQuiz quizId for completion
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
        status: 'active',
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
      status: { $in: ['active', 'in-progress'] }
    })
    .populate('courseId', 'title subject grade')
    .sort({ createdAt: -1 });
    
    const activeQuizzes = sessions.map(session => ({
      id: session._id,
      quizId: session._id.toString(), // ActiveQuiz uses session._id as quizId
      sessionId: session._id,
      subject: (typeof session.metadata?.subject === 'object' ? session.metadata?.subject?.name : session.metadata?.subject) || session.courseId?.subject,
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
    
    if (!['active', 'in-progress', 'completed'].includes(status)) {
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
    if (status === 'in-progress') {
      await QuizSession.updateMany(
        {
          studentId: userId,
          status: 'in-progress',
          _id: { $ne: id }
        },
        { status: 'active' }
      );
    }
    
    session.status = status;
    session.lastUpdated = new Date();
    if (status === 'in-progress' && !session.startedAt) {
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
    
    // Only allow deletion of active quizzes
    if (session.status !== 'active') {
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
    session.status = 'completed';
    session.submittedAt = new Date();
    session.answers = answers;
    session.score = totalScore;
    session.accuracy = accuracy;
    session.timeSpent = timeTaken;
    
    // Save performance data to session metadata
    if (!session.metadata) session.metadata = {};
    session.metadata.performanceData = {
      performanceByTopic,
      performanceByDifficulty,
      weakTopics
    };
    
    console.log('💾 Saving performance data to session metadata:', {
      sessionId: session._id,
      hasPerformanceData: !!session.metadata.performanceData,
      topicCount: Object.keys(performanceByTopic).length,
      difficultyCount: Object.keys(performanceByDifficulty).length,
      weakTopicsCount: weakTopics.length,
      sampleTopic: Object.keys(performanceByTopic)[0],
      sampleDifficulty: Object.keys(performanceByDifficulty)[0]
    });
    
    await session.save();
    
    // Update ActiveQuiz status to completed
    try {
      const ActiveQuiz = require('../models/ActiveQuiz.model');
      await ActiveQuiz.findOneAndUpdate(
        { quizId: id }, // Find by quizId (which is session._id)
        { status: 'completed' },
        { new: true }
      );
      logger.info(`Marked ActiveQuiz ${id} as completed`);
    } catch (error) {
      logger.error(`Error updating ActiveQuiz status: ${error.message}`);
    }
    
    // Update student performance (would use algorithm)
    await updateStudentPerformanceDB(userId, {
      quizId: id,
      subject: session.metadata?.subject || 'General',
      courseId: session.courseId,
      score: totalScore,
      totalQuestions,
      correct: correctAnswers,
      accuracy,
      timeSpent: timeTaken,
      performanceByTopic,
      performanceByDifficulty,
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
      status: 'completed' // Use lowercase to match enum
    };
    
    console.log('Quiz history query:', query);
    console.log('Quiz dateRange:', dateRange);
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
        query.submittedAt = { $gte: startDate };
      }
    }
    console.log('Quiz history query:', query);
    console.log('Quiz dateRange:', dateRange);
    const sessions = await QuizSession.find(query)
      .populate('courseId', 'title subject grade')
      .sort({ submittedAt: -1 })
      .limit(parseInt(limit));
    
    console.log('Found quiz sessions:', sessions.length);
    
    const history = sessions.map(session => ({
      id: session._id,
      quizId: session._id,
      subject: (typeof session.metadata?.subject === 'object' ? session.metadata?.subject?.name : session.metadata?.subject) || session.courseId?.subject,
      courseName: session.courseId?.title || session.metadata?.courseName,
      courseId: session.courseId?._id,
      difficulty: session.difficulty,
      questionCount: session.totalQuestions,
      duration: session.duration,
      score: session.totalScore,
      totalScore: session.totalMarks, // Use stored totalMarks
      accuracy: session.percentage || session.accuracy,
      timeTaken: session.timeSpent || session.timeTaken,
      timeUtilization: parseFloat(((session.timeSpent / (session.duration * 60)) * 100).toFixed(1)),
      completedAt: session.submittedAt, // Use submittedAt instead of completedAt
      status: 'completed',
      
      // ✅ Parse snapshots before returning
      questions: session.selectedQuestions?.map(q => {
        let parsedSnapshot = {};
        try {
          parsedSnapshot = JSON.parse(q.snapshot);
        } catch (e) {
          console.error('Failed to parse question snapshot:', e);
        }
        
        return {
          questionId: q.questionId,
          snapshot: parsedSnapshot,  // Return as parsed object
          // Spread for direct access
          text: parsedSnapshot.text,
          type: parsedSnapshot.type,
          options: parsedSnapshot.options,
          correctAnswer: parsedSnapshot.correctAnswer,
          expectedAnswer: parsedSnapshot.expectedAnswer,
          numericalAnswer: parsedSnapshot.numericalAnswer,
          marks: parsedSnapshot.marks,
          negativeMarks: parsedSnapshot.negativeMarks,
          topic: parsedSnapshot.topic,
          difficultyLevel: parsedSnapshot.difficultyLevel,
          difficulty: parsedSnapshot.difficultyLevel,
          explanation: parsedSnapshot.explanation
        };
      }) || [],
      
      // ✅ Parse answer snapshots
      answers: session.answers?.map(a => {
        let parsedQuestionSnapshot = {};
        try {
          if (a.questionSnapshot) {
            parsedQuestionSnapshot = JSON.parse(a.questionSnapshot);
          }
        } catch (e) {
          console.error('Failed to parse answer snapshot:', e);
        }
        
        return {
          questionId: a.questionId,
          answer: a.answer,
          isCorrect: a.isCorrect,
          marksAwarded: a.marksAwarded,
          timeSpent: a.timeSpent,
          isVisited: a.isVisited,
          isMarkedForReview: a.isMarkedForReview,
          questionSnapshot: parsedQuestionSnapshot  // Return as parsed object
        };
      }) || [],
      
      // Include performance data
      performanceByTopic: session.metadata?.performanceData?.performanceByTopic || [],
      performanceByDifficulty: session.metadata?.performanceData?.performanceByDifficulty || {},
      weakTopics: session.metadata?.performanceData?.weakTopics || [],
      recommendations: session.metadata?.performanceData?.recommendations || []
    }));
    
    console.log('Returning quiz history:', history.length, 'records');
    
    res.json({
      success: true,
      data: history  // Return history as data property
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
      status: 'completed' // Use lowercase to match enum
    }).sort({ submittedAt: -1 });
    
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
      
      // Skip if session doesn't have questions array
      if (!session.questions || !Array.isArray(session.questions)) {
        return;
      }
      
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

// @desc    Migrate localStorage data to backend
// @route   POST /api/algorithm-quiz/migrate-local-data
// @access  Private (Student)
exports.migrateLocalData = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { performance, history } = req.body;
    
    console.log(`[Migration] Starting migration for user ${userId}`);
    
    let migratedPerformance = false;
    let migratedHistory = false;
    
    // Migrate performance data
    if (performance) {
      try {
        // Check if performance already exists
        let studentPerformance = await StudentPerformance.findOne({ studentId: userId });
        
        if (!studentPerformance) {
          studentPerformance = new StudentPerformance({
            studentId: userId,
            topicMastery: performance.topicMastery || {},
            weakTopics: performance.weakTopics || [],
            totalQuizzesTaken: performance.totalQuizzesTaken || 0,
            averageScore: performance.averageScore || 0,
            averageAccuracy: performance.averageAccuracy || 0,
            lastUpdated: new Date()
          });
        } else {
          // Update existing performance
          studentPerformance.topicMastery = { ...studentPerformance.topicMastery, ...performance.topicMastery };
          studentPerformance.weakTopics = performance.weakTopics || studentPerformance.weakTopics;
          studentPerformance.totalQuizzesTaken = performance.totalQuizzesTaken || studentPerformance.totalQuizzesTaken;
          studentPerformance.averageScore = performance.averageScore || studentPerformance.averageScore;
          studentPerformance.averageAccuracy = performance.averageAccuracy || studentPerformance.averageAccuracy;
          studentPerformance.lastUpdated = new Date();
        }
        
        await studentPerformance.save();
        migratedPerformance = true;
        console.log(`[Migration] Performance data migrated for user ${userId}`);
      } catch (perfError) {
        console.error(`[Migration] Failed to migrate performance for user ${userId}:`, perfError);
      }
    }
    
    // Migrate quiz history
    if (history && Array.isArray(history)) {
      try {
        let migratedCount = 0;
        
        for (const quiz of history) {
          // Check if quiz session already exists
          const existingSession = await QuizSession.findOne({
            studentId: userId,
            'metadata.subject': quiz.subject,
            submittedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Within last 24 hours
          });
          
          if (!existingSession) {
            // Create new session from history data
            const sessionData = {
              studentId: userId,
              quizId: quiz.quizId || `migrated_${Date.now()}_${Math.random()}`,
              courseId: null, // Will be set if available
              attemptNumber: 1,
              status: 'completed',
              score: quiz.score || 0,
              totalScore: quiz.totalScore || 0,
              totalMarks: quiz.totalScore || 0,
              accuracy: quiz.accuracy || 0,
              timeTaken: quiz.timeTaken || 0,
              duration: quiz.duration || 30,
              startedAt: new Date(quiz.completedAt || Date.now()),
              expiresAt: new Date(Date.now() + (quiz.duration || 30) * 60 * 1000),
              submittedAt: new Date(quiz.completedAt || Date.now()),
              passingPercentage: 60,
              algorithmVersion: 'migrated',
              metadata: {
                subject: quiz.subject,
                courseName: quiz.courseName,
                questionCount: quiz.questionCount,
                isAlgorithmGenerated: true,
                migratedFromLocalStorage: true
              }
            };
            
            await QuizSession.create(sessionData);
            migratedCount++;
          }
        }
        
        if (migratedCount > 0) {
          migratedHistory = true;
          console.log(`[Migration] Migrated ${migratedCount} quiz sessions for user ${userId}`);
        }
      } catch (histError) {
        console.error(`[Migration] Failed to migrate history for user ${userId}:`, histError);
      }
    }
    
    res.json({
      success: true,
      message: 'Migration completed',
      migrated: {
        performance: migratedPerformance,
        history: migratedHistory
      }
    });
    
  } catch (error) {
    logger.error(`Migrate local data error: ${error.message}`);
    next(error);
  }
};

// =====================
// HELPER FUNCTIONS
// =====================

async function getUserPerformance(userId) {
  try {
    // Get student performance from database
    const performance = await StudentPerformance.findOne({ studentId: userId });
    
    if (!performance) {
      return {
        topicMastery: {},
        recentQuestions: [],
        totalQuizzes: 0
      };
    }
    
    // Convert Map to object for topicMastery
    const topicMastery = {};
    for (const [key, value] of performance.topicMastery) {
      topicMastery[value.topic] = {
        correct: value.questionsCorrect,
        total: value.questionsAttempted,
        successRate: value.successRate
      };
    }
    
    return {
      topicMastery,
      weakAreas: performance.weakAreas,
      recentQuestions: [], // We can populate this from recent quiz sessions if needed
      totalQuizzes: performance.totalQuizzesTaken
    };
  } catch (error) {
    logger.error(`Error fetching user performance: ${error.message}`);
    return {
      topicMastery: {},
      recentQuestions: [],
      totalQuizzes: 0
    };
  }
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
  try {
    // Prepare topic performance array
    const topicPerformance = [];
    
    if (performanceData.performanceByTopic) {
      Object.entries(performanceData.performanceByTopic).forEach(([topic, perf]) => {
        topicPerformance.push({
          topic,
          subject: performanceData.subject || 'General',
          total: perf.total,
          correct: perf.correct,
          successRate: (perf.correct / perf.total) * 100,
          questionsAttempted: perf.total,
          questionsCorrect: perf.correct
        });
      });
    }
    
    // Prepare difficulty performance data
    const difficultyPerformance = {};
    if (performanceData.performanceByDifficulty) {
      Object.entries(performanceData.performanceByDifficulty).forEach(([difficulty, perf]) => {
        difficultyPerformance[difficulty] = {
          attempted: perf.total,
          correct: perf.correct,
          successRate: (perf.correct / perf.total) * 100
        };
      });
    }
    
    // Update student performance in database
    await StudentPerformance.updateAfterQuiz(userId, {
      quizId: performanceData.quizId,
      subject: performanceData.subject || 'General',
      score: performanceData.score,
      totalQuestions: performanceData.totalQuestions,
      correctAnswers: performanceData.correct,
      accuracy: performanceData.accuracy,
      timeSpent: performanceData.timeSpent,
      topicPerformance,
      difficultyPerformance
    });
    
    logger.info(`Updated performance for user ${userId}`);
  } catch (error) {
    logger.error(`Error updating student performance: ${error.message}`);
  }
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

module.exports = {
  createAlgorithmQuiz: exports.createAlgorithmQuiz,
  getActiveQuizzes: exports.getActiveQuizzes,
  updateQuizStatus: exports.updateQuizStatus,
  deleteQuiz: exports.deleteQuiz,
  analyzeQuizResults: exports.analyzeQuizResults,
  getQuizHistory: exports.getQuizHistory,
  getStudentPerformance: exports.getStudentPerformance,
  migrateLocalData: exports.migrateLocalData
};

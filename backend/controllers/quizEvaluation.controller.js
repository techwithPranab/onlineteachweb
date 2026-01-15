const QuizSession = require('../models/QuizSession.model');
const QuizEvaluationResult = require('../models/QuizEvaluationResult.model');
const Quiz = require('../models/Quiz.model');
const logger = require('../utils/logger');

// @desc    Get sessions pending manual evaluation
// @route   GET /api/evaluations/pending
// @access  Private (Tutor, Admin)
exports.getPendingEvaluations = async (req, res, next) => {
  try {
    const { courseId, quizId, page = 1, limit = 20 } = req.query;
    
    const query = {
      pendingManualEvaluation: true,
      status: 'evaluating'
    };
    
    if (courseId) query.courseId = courseId;
    if (quizId) query.quizId = quizId;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [sessions, total] = await Promise.all([
      QuizSession.find(query)
        .populate('quizId', 'title')
        .populate('studentId', 'name email')
        .populate('courseId', 'title')
        .sort({ submittedAt: 1 }) // Oldest first
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      QuizSession.countDocuments(query)
    ]);
    
    // Add count of questions needing evaluation
    const sessionsWithCount = sessions.map(session => ({
      ...session,
      questionsToEvaluate: session.questionsForManualEvaluation?.length || 0
    }));
    
    res.json({
      success: true,
      sessions: sessionsWithCount,
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

// @desc    Get session for manual evaluation
// @route   GET /api/evaluations/session/:sessionId
// @access  Private (Tutor, Admin)
exports.getSessionForEvaluation = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    
    const session = await QuizSession.findById(sessionId)
      .populate('quizId', 'title totalMarks passingPercentage settings')
      .populate('studentId', 'name email')
      .populate('courseId', 'title');
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }
    
    // Get questions needing manual evaluation
    const Question = require('../models/Question.model');
    const questionsForEvaluation = await Promise.all(
      session.questionsForManualEvaluation.map(async (qId) => {
        const question = await Question.findById(qId);
        const answer = session.answers.find(
          a => a.questionId.toString() === qId.toString()
        );
        
        return {
          questionId: qId,
          question: {
            text: question?.text,
            type: question?.type,
            caseStudy: question?.caseStudy,
            expectedAnswer: question?.expectedAnswer,
            keywords: question?.keywords,
            marks: question?.marks,
            topic: question?.topic
          },
          studentAnswer: answer?.answer,
          currentMarks: answer?.marksAwarded || 0,
          currentFeedback: answer?.manualFeedback || '',
          isEvaluated: answer?.evaluatedBy ? true : false
        };
      })
    );
    
    res.json({
      success: true,
      session: {
        _id: session._id,
        quiz: session.quizId,
        student: session.studentId,
        course: session.courseId,
        submittedAt: session.submittedAt,
        autoScore: session.autoScore,
        totalMarks: session.totalMarks
      },
      questionsForEvaluation
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit manual evaluation for a question
// @route   POST /api/evaluations/manual
// @access  Private (Tutor, Admin)
exports.submitManualEvaluation = async (req, res, next) => {
  try {
    const { sessionId, questionId, marksAwarded, feedback } = req.body;
    
    const session = await QuizSession.findById(sessionId);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }
    
    // Find the answer
    const answerIndex = session.answers.findIndex(
      a => a.questionId.toString() === questionId
    );
    
    if (answerIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Answer not found'
      });
    }
    
    // Validate marks
    const Question = require('../models/Question.model');
    const question = await Question.findById(questionId);
    
    if (marksAwarded > question.marks) {
      return res.status(400).json({
        success: false,
        message: `Marks cannot exceed ${question.marks}`
      });
    }
    
    if (marksAwarded < 0) {
      return res.status(400).json({
        success: false,
        message: 'Marks cannot be negative'
      });
    }
    
    // Update the answer
    session.answers[answerIndex].marksAwarded = marksAwarded;
    session.answers[answerIndex].manualFeedback = feedback;
    session.answers[answerIndex].evaluatedBy = req.user._id;
    session.answers[answerIndex].evaluatedAt = new Date();
    session.answers[answerIndex].isCorrect = marksAwarded > 0;
    
    // Remove from pending list
    session.questionsForManualEvaluation = session.questionsForManualEvaluation.filter(
      q => q.toString() !== questionId
    );
    
    // Recalculate manual score
    session.manualScore = session.answers
      .filter(a => a.evaluatedBy)
      .reduce((sum, a) => sum + (a.marksAwarded || 0), 0);
    
    // Check if all manual evaluations are complete
    if (session.questionsForManualEvaluation.length === 0) {
      session.pendingManualEvaluation = false;
      session.totalScore = session.autoScore + session.manualScore;
      session.percentage = (session.totalScore / session.totalMarks) * 100;
      session.passed = session.percentage >= session.passingPercentage;
      session.status = 'completed';
      
      // Update evaluation result
      const evaluationResult = await QuizEvaluationResult.findOne({
        quizSessionId: session._id
      });
      
      if (evaluationResult) {
        evaluationResult.manualScore = session.manualScore;
        evaluationResult.finalScore = session.totalScore;
        evaluationResult.percentage = session.percentage;
        evaluationResult.passFail = session.passed ? 'pass' : 'fail';
        evaluationResult.grade = evaluationResult.calculateGrade();
        evaluationResult.evaluatedBy = req.user._id;
        evaluationResult.evaluatedAt = new Date();
        
        // Add manual evaluation record
        evaluationResult.manualEvaluations.push({
          questionId,
          evaluatorId: req.user._id,
          marksAwarded,
          feedback,
          evaluatedAt: new Date()
        });
        
        await evaluationResult.save();
      }
      
      // Update quiz stats
      const quiz = await Quiz.findById(session.quizId);
      await quiz.updateStats(session.totalScore, session.timeSpent / 60, session.passed);
    }
    
    await session.save();
    
    logger.info(`Manual evaluation submitted: Question ${questionId} in session ${sessionId} by ${req.user._id}`);
    
    res.json({
      success: true,
      message: 'Evaluation submitted',
      remainingQuestions: session.questionsForManualEvaluation.length,
      isComplete: session.questionsForManualEvaluation.length === 0,
      currentScore: session.autoScore + session.manualScore
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit bulk manual evaluation
// @route   POST /api/evaluations/manual/bulk
// @access  Private (Tutor, Admin)
exports.submitBulkManualEvaluation = async (req, res, next) => {
  try {
    const { sessionId, evaluations } = req.body;
    
    if (!Array.isArray(evaluations) || evaluations.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Evaluations array is required'
      });
    }
    
    const session = await QuizSession.findById(sessionId);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }
    
    const Question = require('../models/Question.model');
    const errors = [];
    
    for (const evaluation of evaluations) {
      const { questionId, marksAwarded, feedback } = evaluation;
      
      const answerIndex = session.answers.findIndex(
        a => a.questionId.toString() === questionId
      );
      
      if (answerIndex === -1) {
        errors.push({ questionId, error: 'Answer not found' });
        continue;
      }
      
      const question = await Question.findById(questionId);
      
      if (marksAwarded > question.marks || marksAwarded < 0) {
        errors.push({ questionId, error: 'Invalid marks' });
        continue;
      }
      
      session.answers[answerIndex].marksAwarded = marksAwarded;
      session.answers[answerIndex].manualFeedback = feedback;
      session.answers[answerIndex].evaluatedBy = req.user._id;
      session.answers[answerIndex].evaluatedAt = new Date();
      session.answers[answerIndex].isCorrect = marksAwarded > 0;
      
      session.questionsForManualEvaluation = session.questionsForManualEvaluation.filter(
        q => q.toString() !== questionId
      );
    }
    
    // Recalculate scores
    session.manualScore = session.answers
      .filter(a => a.evaluatedBy)
      .reduce((sum, a) => sum + (a.marksAwarded || 0), 0);
    
    if (session.questionsForManualEvaluation.length === 0) {
      session.pendingManualEvaluation = false;
      session.totalScore = session.autoScore + session.manualScore;
      session.percentage = (session.totalScore / session.totalMarks) * 100;
      session.passed = session.percentage >= session.passingPercentage;
      session.status = 'completed';
      
      // Update evaluation result
      const evaluationResult = await QuizEvaluationResult.findOne({
        quizSessionId: session._id
      });
      
      if (evaluationResult) {
        evaluationResult.manualScore = session.manualScore;
        evaluationResult.finalScore = session.totalScore;
        evaluationResult.percentage = session.percentage;
        evaluationResult.passFail = session.passed ? 'pass' : 'fail';
        evaluationResult.grade = evaluationResult.calculateGrade();
        evaluationResult.evaluatedBy = req.user._id;
        evaluationResult.evaluatedAt = new Date();
        
        for (const evaluation of evaluations) {
          if (!errors.find(e => e.questionId === evaluation.questionId)) {
            evaluationResult.manualEvaluations.push({
              questionId: evaluation.questionId,
              evaluatorId: req.user._id,
              marksAwarded: evaluation.marksAwarded,
              feedback: evaluation.feedback,
              evaluatedAt: new Date()
            });
          }
        }
        
        await evaluationResult.save();
      }
      
      const quiz = await Quiz.findById(session.quizId);
      await quiz.updateStats(session.totalScore, session.timeSpent / 60, session.passed);
    }
    
    await session.save();
    
    logger.info(`Bulk manual evaluation: ${evaluations.length} questions in session ${sessionId} by ${req.user._id}`);
    
    res.json({
      success: true,
      message: 'Evaluations submitted',
      evaluated: evaluations.length - errors.length,
      errors,
      remainingQuestions: session.questionsForManualEvaluation.length,
      isComplete: session.questionsForManualEvaluation.length === 0,
      finalScore: session.totalScore
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Override auto-evaluated score
// @route   POST /api/evaluations/override
// @access  Private (Tutor, Admin)
exports.overrideScore = async (req, res, next) => {
  try {
    const { sessionId, questionId, newMarks, reason } = req.body;
    
    const session = await QuizSession.findById(sessionId);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }
    
    const answerIndex = session.answers.findIndex(
      a => a.questionId.toString() === questionId
    );
    
    if (answerIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Answer not found'
      });
    }
    
    const Question = require('../models/Question.model');
    const question = await Question.findById(questionId);
    
    if (newMarks > question.marks || newMarks < 0) {
      return res.status(400).json({
        success: false,
        message: `Marks must be between 0 and ${question.marks}`
      });
    }
    
    const oldMarks = session.answers[answerIndex].marksAwarded;
    
    session.answers[answerIndex].marksAwarded = newMarks;
    session.answers[answerIndex].manualFeedback = 
      (session.answers[answerIndex].manualFeedback || '') + 
      ` [Override by ${req.user.name}: ${reason}]`;
    session.answers[answerIndex].evaluatedBy = req.user._id;
    session.answers[answerIndex].evaluatedAt = new Date();
    
    // Recalculate total score
    const marksDifference = newMarks - oldMarks;
    session.totalScore = Math.max(0, session.totalScore + marksDifference);
    session.percentage = (session.totalScore / session.totalMarks) * 100;
    session.passed = session.percentage >= session.passingPercentage;
    
    await session.save();
    
    // Update evaluation result
    const evaluationResult = await QuizEvaluationResult.findOne({
      quizSessionId: session._id
    });
    
    if (evaluationResult) {
      evaluationResult.finalScore = session.totalScore;
      evaluationResult.percentage = session.percentage;
      evaluationResult.passFail = session.passed ? 'pass' : 'fail';
      evaluationResult.grade = evaluationResult.calculateGrade();
      await evaluationResult.save();
    }
    
    logger.info(`Score override: Question ${questionId}, ${oldMarks} -> ${newMarks} in session ${sessionId} by ${req.user._id}`);
    
    res.json({
      success: true,
      message: 'Score overridden successfully',
      newTotalScore: session.totalScore,
      newPercentage: session.percentage,
      passed: session.passed
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get student performance analytics
// @route   GET /api/evaluations/analytics/student/:studentId
// @access  Private (Tutor, Admin, or same student)
exports.getStudentAnalytics = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { courseId } = req.query;
    
    // Check access
    if (req.user.role === 'student' && req.user._id.toString() !== studentId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    const query = { studentId };
    if (courseId) query.courseId = courseId;
    
    const evaluations = await QuizEvaluationResult.find(query)
      .populate('quizId', 'title difficultyLevel')
      .populate('courseId', 'title')
      .sort({ createdAt: -1 })
      .lean();
    
    if (evaluations.length === 0) {
      return res.json({
        success: true,
        analytics: {
          totalAttempts: 0,
          averageScore: 0,
          passRate: 0,
          topicPerformance: {},
          difficultyPerformance: {},
          trend: []
        }
      });
    }
    
    // Aggregate analytics
    const totalAttempts = evaluations.length;
    const averageScore = evaluations.reduce((sum, e) => sum + e.percentage, 0) / totalAttempts;
    const passRate = (evaluations.filter(e => e.passFail === 'pass').length / totalAttempts) * 100;
    
    // Topic performance aggregation
    const topicPerformance = {};
    evaluations.forEach(evaluation => {
      evaluation.topicAnalysis?.forEach(topic => {
        if (!topicPerformance[topic.topic]) {
          topicPerformance[topic.topic] = {
            totalQuestions: 0,
            correct: 0,
            attempts: 0
          };
        }
        topicPerformance[topic.topic].totalQuestions += topic.totalQuestions;
        topicPerformance[topic.topic].correct += topic.correctAnswers;
        topicPerformance[topic.topic].attempts += 1;
      });
    });
    
    // Calculate topic accuracy
    for (const topic in topicPerformance) {
      topicPerformance[topic].accuracy = 
        (topicPerformance[topic].correct / topicPerformance[topic].totalQuestions) * 100;
    }
    
    // Difficulty performance
    const difficultyPerformance = {
      easy: { total: 0, correct: 0, accuracy: 0 },
      medium: { total: 0, correct: 0, accuracy: 0 },
      hard: { total: 0, correct: 0, accuracy: 0 }
    };
    
    evaluations.forEach(evaluation => {
      const da = evaluation.difficultyAnalysis;
      if (da) {
        ['easy', 'medium', 'hard'].forEach(level => {
          difficultyPerformance[level].total += da[level]?.total || 0;
          difficultyPerformance[level].correct += da[level]?.correct || 0;
        });
      }
    });
    
    ['easy', 'medium', 'hard'].forEach(level => {
      if (difficultyPerformance[level].total > 0) {
        difficultyPerformance[level].accuracy = 
          (difficultyPerformance[level].correct / difficultyPerformance[level].total) * 100;
      }
    });
    
    // Performance trend
    const trend = evaluations
      .slice(0, 10)
      .reverse()
      .map(e => ({
        date: e.createdAt,
        quizTitle: e.quizId?.title,
        score: e.percentage,
        passed: e.passFail === 'pass'
      }));
    
    // Overall weak areas
    const weakAreas = Object.entries(topicPerformance)
      .filter(([_, data]) => data.accuracy < 50)
      .sort((a, b) => a[1].accuracy - b[1].accuracy)
      .slice(0, 5)
      .map(([topic, data]) => ({
        topic,
        accuracy: data.accuracy,
        attempts: data.attempts
      }));
    
    res.json({
      success: true,
      analytics: {
        totalAttempts,
        averageScore: Math.round(averageScore * 100) / 100,
        passRate: Math.round(passRate * 100) / 100,
        topicPerformance,
        difficultyPerformance,
        trend,
        weakAreas,
        recentEvaluations: evaluations.slice(0, 5)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get quiz analytics
// @route   GET /api/evaluations/analytics/quiz/:quizId
// @access  Private (Tutor, Admin)
exports.getQuizAnalytics = async (req, res, next) => {
  try {
    const { quizId } = req.params;
    
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }
    
    const evaluations = await QuizEvaluationResult.find({ quizId })
      .populate('studentId', 'name')
      .lean();
    
    if (evaluations.length === 0) {
      return res.json({
        success: true,
        analytics: {
          totalAttempts: 0,
          averageScore: 0,
          passRate: 0,
          scoreDistribution: {},
          topicDifficulty: {},
          topPerformers: []
        }
      });
    }
    
    const totalAttempts = evaluations.length;
    const averageScore = evaluations.reduce((sum, e) => sum + e.percentage, 0) / totalAttempts;
    const passRate = (evaluations.filter(e => e.passFail === 'pass').length / totalAttempts) * 100;
    
    // Score distribution
    const scoreDistribution = {
      '0-20': 0,
      '21-40': 0,
      '41-60': 0,
      '61-80': 0,
      '81-100': 0
    };
    
    evaluations.forEach(e => {
      if (e.percentage <= 20) scoreDistribution['0-20']++;
      else if (e.percentage <= 40) scoreDistribution['21-40']++;
      else if (e.percentage <= 60) scoreDistribution['41-60']++;
      else if (e.percentage <= 80) scoreDistribution['61-80']++;
      else scoreDistribution['81-100']++;
    });
    
    // Topic difficulty (based on class performance)
    const topicDifficulty = {};
    evaluations.forEach(e => {
      e.topicAnalysis?.forEach(topic => {
        if (!topicDifficulty[topic.topic]) {
          topicDifficulty[topic.topic] = { totalAccuracy: 0, count: 0 };
        }
        topicDifficulty[topic.topic].totalAccuracy += topic.accuracy;
        topicDifficulty[topic.topic].count += 1;
      });
    });
    
    for (const topic in topicDifficulty) {
      topicDifficulty[topic].averageAccuracy = 
        topicDifficulty[topic].totalAccuracy / topicDifficulty[topic].count;
      topicDifficulty[topic].difficulty = 
        topicDifficulty[topic].averageAccuracy < 40 ? 'hard' :
        topicDifficulty[topic].averageAccuracy < 70 ? 'medium' : 'easy';
    }
    
    // Top performers
    const topPerformers = evaluations
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 5)
      .map(e => ({
        studentName: e.studentId?.name,
        score: e.percentage,
        grade: e.grade,
        timeTaken: e.overallAnalysis?.totalTimeSpent
      }));
    
    res.json({
      success: true,
      analytics: {
        quizTitle: quiz.title,
        totalAttempts,
        averageScore: Math.round(averageScore * 100) / 100,
        passRate: Math.round(passRate * 100) / 100,
        scoreDistribution,
        topicDifficulty,
        topPerformers,
        quizStats: quiz.stats
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Publish evaluation result
// @route   POST /api/evaluations/:evaluationId/publish
// @access  Private (Tutor, Admin)
exports.publishEvaluation = async (req, res, next) => {
  try {
    const { evaluationId } = req.params;
    
    const evaluation = await QuizEvaluationResult.findById(evaluationId);
    
    if (!evaluation) {
      return res.status(404).json({
        success: false,
        message: 'Evaluation not found'
      });
    }
    
    evaluation.isPublished = true;
    evaluation.publishedAt = new Date();
    await evaluation.save();
    
    logger.info(`Evaluation published: ${evaluationId} by ${req.user._id}`);
    
    res.json({
      success: true,
      message: 'Evaluation published successfully'
    });
  } catch (error) {
    next(error);
  }
};

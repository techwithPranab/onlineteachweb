const Question = require('../models/Question.model');
const Quiz = require('../models/Quiz.model');
const logger = require('../utils/logger');

// @desc    Create a new question
// @route   POST /api/questions
// @access  Private (Tutor, Admin)
exports.createQuestion = async (req, res, next) => {
  try {
    const {
      courseId,
      chapterName,
      topic,
      difficultyLevel,
      type,
      text,
      caseStudy,
      options,
      numericalAnswer,
      expectedAnswer,
      keywords,
      explanation,
      marks,
      negativeMarks,
      recommendedTime,
      tags
    } = req.body;
    
    const question = await Question.create({
      courseId,
      chapterName,
      topic,
      difficultyLevel,
      type,
      text,
      caseStudy,
      options,
      numericalAnswer,
      expectedAnswer,
      keywords,
      explanation,
      marks: marks || 1,
      negativeMarks: negativeMarks || 0,
      recommendedTime,
      tags,
      createdBy: req.user._id
    });
    
    logger.info(`Question created: ${question._id} by user ${req.user._id}`);
    
    res.status(201).json({
      success: true,
      question
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create multiple questions (bulk)
// @route   POST /api/questions/bulk
// @access  Private (Tutor, Admin)
exports.createBulkQuestions = async (req, res, next) => {
  try {
    const { questions } = req.body;
    
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Questions array is required'
      });
    }
    
    const questionsWithCreator = questions.map(q => ({
      ...q,
      createdBy: req.user._id
    }));
    
    const createdQuestions = await Question.insertMany(questionsWithCreator);
    
    logger.info(`${createdQuestions.length} questions created in bulk by user ${req.user._id}`);
    
    res.status(201).json({
      success: true,
      count: createdQuestions.length,
      questions: createdQuestions
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get questions for a course
// @route   GET /api/questions
// @access  Private (Tutor, Admin)
exports.getQuestions = async (req, res, next) => {
  try {
    const {
      courseId,
      topic,
      difficultyLevel,
      type,
      isActive,
      page = 1,
      limit = 20,
      search
    } = req.query;
    
    const query = {};
    
    if (courseId) query.courseId = courseId;
    if (topic) query.topic = topic;
    if (difficultyLevel) query.difficultyLevel = difficultyLevel;
    if (type) query.type = type;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    else query.isActive = true; // Default to active questions only
    
    if (search) {
      query.$or = [
        { text: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    // Only show questions created by the user if they're a tutor, or AI-generated questions
    if (req.user.role === 'tutor') {
      query.$or = [
        { createdBy: req.user._id },
        { createdBy: { $type: 'string' } } // AI-generated questions have string createdBy
      ];
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [questions, total] = await Promise.all([
      Question.find(query)
        .populate('courseId', 'title')
        .populate('createdBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Question.countDocuments(query)
    ]);
    
    res.json({
      success: true,
      questions,
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

// @desc    Get a single question
// @route   GET /api/questions/:id
// @access  Private (Tutor, Admin)
exports.getQuestionById = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.id)
      .populate('courseId', 'title')
      .populate('createdBy', 'name');
    
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }
    
    // Check access for tutors
    if (req.user.role === 'tutor' && 
        question.createdBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    res.json({
      success: true,
      question
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a question
// @route   PUT /api/questions/:id
// @access  Private (Tutor, Admin)
exports.updateQuestion = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.id);
    
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }
    
    // Check access for tutors
    if (req.user.role === 'tutor' && 
        question.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    // Check if question is used in any active quiz session
    const QuizSession = require('../models/QuizSession.model');
    const activeSession = await QuizSession.findOne({
      'selectedQuestions.questionId': question._id,
      status: 'in-progress'
    });
    
    if (activeSession) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update question while it is being used in an active quiz session'
      });
    }
    
    const allowedUpdates = [
      'topic', 'difficultyLevel', 'type', 'text', 'caseStudy',
      'options', 'numericalAnswer', 'expectedAnswer', 'keywords',
      'explanation', 'marks', 'negativeMarks', 'recommendedTime',
      'tags', 'isActive'
    ];
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        question[field] = req.body[field];
      }
    });
    
    await question.save();
    
    logger.info(`Question updated: ${question._id} by user ${req.user._id}`);
    
    res.json({
      success: true,
      question
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a question
// @route   DELETE /api/questions/:id
// @access  Private (Tutor, Admin)
exports.deleteQuestion = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.id);
    
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }
    
    // Check access for tutors
    if (req.user.role === 'tutor' && 
        question.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    // Soft delete - mark as inactive
    question.isActive = false;
    await question.save();
    
    logger.info(`Question deactivated: ${question._id} by user ${req.user._id}`);
    
    res.json({
      success: true,
      message: 'Question deactivated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get topics for a course
// @route   GET /api/questions/topics/:courseId
// @access  Private (Tutor, Admin)
exports.getTopicsForCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    
    const topics = await Question.aggregate([
      { $match: { courseId: require('mongoose').Types.ObjectId(courseId), isActive: true } },
      { $group: { _id: '$topic', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    res.json({
      success: true,
      topics: topics.map(t => ({ topic: t._id, questionCount: t.count }))
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get question statistics for a course
// @route   GET /api/questions/stats/:courseId
// @access  Private (Tutor, Admin)
exports.getQuestionStats = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const mongoose = require('mongoose');
    
    const stats = await Question.aggregate([
      { $match: { courseId: mongoose.Types.ObjectId(courseId), isActive: true } },
      {
        $group: {
          _id: null,
          totalQuestions: { $sum: 1 },
          byDifficulty: {
            $push: '$difficultyLevel'
          },
          byType: {
            $push: '$type'
          },
          avgMarks: { $avg: '$marks' }
        }
      }
    ]);
    
    if (stats.length === 0) {
      return res.json({
        success: true,
        stats: {
          totalQuestions: 0,
          byDifficulty: { easy: 0, medium: 0, hard: 0 },
          byType: {},
          avgMarks: 0
        }
      });
    }
    
    const difficultyCount = stats[0].byDifficulty.reduce((acc, d) => {
      acc[d] = (acc[d] || 0) + 1;
      return acc;
    }, {});
    
    const typeCount = stats[0].byType.reduce((acc, t) => {
      acc[t] = (acc[t] || 0) + 1;
      return acc;
    }, {});
    
    res.json({
      success: true,
      stats: {
        totalQuestions: stats[0].totalQuestions,
        byDifficulty: difficultyCount,
        byType: typeCount,
        avgMarks: Math.round(stats[0].avgMarks * 100) / 100
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get course chapters and topics
// @route   GET /api/questions/course/:courseId/structure
// @access  Private (Tutor, Admin)
exports.getCourseStructure = async (req, res, next) => {
  try {
    const Course = require('../models/Course.model');
    const { courseId } = req.params;
    
    const course = await Course.findById(courseId).select('chapters title');
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    res.json({
      success: true,
      courseTitle: course.title,
      chapters: course.chapters
    });
  } catch (error) {
    next(error);
  }
};

const Question = require('../models/Question.model');
const Course = require('../models/Course.model');
const mongoose = require('mongoose');

/**
 * Export questions to JSON format
 */
exports.exportQuestionsJSON = async (req, res) => {
  try {
    const { courseId, topic, difficulty, questionTypes, limit } = req.query;
    
    // Build query
    const query = {};
    
    if (courseId) {
      query.course = mongoose.Types.ObjectId(courseId);
    }
    
    if (topic) {
      query.topic = { $regex: topic, $options: 'i' };
    }
    
    if (difficulty) {
      query.difficulty = difficulty;
    }
    
    if (questionTypes) {
      const types = questionTypes.split(',');
      query.questionType = { $in: types };
    }
    
    // Fetch questions
    let questionsQuery = Question.find(query)
      .populate('course', 'title code grade')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    
    if (limit) {
      questionsQuery = questionsQuery.limit(parseInt(limit));
    }
    
    const questions = await questionsQuery.lean();
    
    // Transform for export (remove internal fields)
    const exportData = questions.map(q => ({
      questionText: q.questionText,
      questionType: q.questionType,
      difficulty: q.difficulty,
      topic: q.topic,
      subTopic: q.subTopic,
      options: q.options,
      correctAnswer: q.correctAnswer,
      correctAnswerIndex: q.correctAnswerIndex,
      solutionSteps: q.solutionSteps,
      explanation: q.explanation,
      hints: q.hints,
      points: q.points,
      tags: q.tags,
      metadata: {
        courseName: q.course?.title,
        courseCode: q.course?.code,
        grade: q.course?.grade,
        createdBy: q.createdBy?.name,
        createdAt: q.createdAt
      }
    }));
    
    // Set response headers for download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=questions_export_${Date.now()}.json`);
    
    res.json({
      success: true,
      exportedAt: new Date().toISOString(),
      totalQuestions: exportData.length,
      questions: exportData
    });
    
  } catch (error) {
    console.error('Export questions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export questions',
      error: error.message
    });
  }
};

/**
 * Export questions to CSV format
 */
exports.exportQuestionsCSV = async (req, res) => {
  try {
    const { courseId, topic, difficulty, questionTypes, limit } = req.query;
    
    // Build query
    const query = {};
    
    if (courseId) {
      query.course = mongoose.Types.ObjectId(courseId);
    }
    
    if (topic) {
      query.topic = { $regex: topic, $options: 'i' };
    }
    
    if (difficulty) {
      query.difficulty = difficulty;
    }
    
    if (questionTypes) {
      const types = questionTypes.split(',');
      query.questionType = { $in: types };
    }
    
    // Fetch questions
    let questionsQuery = Question.find(query)
      .populate('course', 'title code grade')
      .sort({ createdAt: -1 });
    
    if (limit) {
      questionsQuery = questionsQuery.limit(parseInt(limit));
    }
    
    const questions = await questionsQuery.lean();
    
    // Build CSV
    const headers = [
      'Question Text',
      'Question Type',
      'Difficulty',
      'Topic',
      'Sub Topic',
      'Options (pipe separated)',
      'Correct Answer',
      'Correct Answer Index',
      'Explanation',
      'Points',
      'Tags (comma separated)',
      'Course Name',
      'Grade'
    ];
    
    const escapeCSV = (value) => {
      if (value === null || value === undefined) return '';
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };
    
    const rows = questions.map(q => [
      escapeCSV(q.questionText),
      escapeCSV(q.questionType),
      escapeCSV(q.difficulty),
      escapeCSV(q.topic),
      escapeCSV(q.subTopic),
      escapeCSV(q.options?.map(o => o.text).join('|')),
      escapeCSV(q.correctAnswer),
      escapeCSV(q.correctAnswerIndex),
      escapeCSV(q.explanation),
      escapeCSV(q.points),
      escapeCSV(q.tags?.join(',')),
      escapeCSV(q.course?.title),
      escapeCSV(q.course?.grade)
    ].join(','));
    
    const csv = [headers.join(','), ...rows].join('\n');
    
    // Set response headers for download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=questions_export_${Date.now()}.csv`);
    
    res.send(csv);
    
  } catch (error) {
    console.error('Export questions CSV error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export questions to CSV',
      error: error.message
    });
  }
};

/**
 * Import questions from JSON
 */
exports.importQuestionsJSON = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { questions, skipDuplicates = true } = req.body;
    
    if (!questions || !Array.isArray(questions)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid import data. Expected questions array.'
      });
    }
    
    // Verify course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    const results = {
      imported: 0,
      skipped: 0,
      errors: []
    };
    
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      
      try {
        // Validate required fields
        if (!q.questionText || !q.questionType) {
          results.errors.push({
            index: i,
            message: 'Missing required fields: questionText or questionType'
          });
          continue;
        }
        
        // Check for duplicates
        if (skipDuplicates) {
          const existing = await Question.findOne({
            course: courseId,
            questionText: q.questionText.trim()
          });
          
          if (existing) {
            results.skipped++;
            continue;
          }
        }
        
        // Create question
        const newQuestion = new Question({
          questionText: q.questionText,
          questionType: q.questionType || 'mcq',
          difficulty: q.difficulty || 'medium',
          topic: q.topic || 'General',
          subTopic: q.subTopic,
          options: q.options || [],
          correctAnswer: q.correctAnswer,
          correctAnswerIndex: q.correctAnswerIndex,
          solutionSteps: q.solutionSteps,
          explanation: q.explanation,
          hints: q.hints || [],
          points: q.points || 1,
          tags: q.tags || [],
          course: courseId,
          createdBy: req.user._id
        });
        
        await newQuestion.save();
        results.imported++;
        
      } catch (err) {
        results.errors.push({
          index: i,
          message: err.message
        });
      }
    }
    
    res.json({
      success: true,
      message: `Import completed. ${results.imported} imported, ${results.skipped} skipped.`,
      results
    });
    
  } catch (error) {
    console.error('Import questions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to import questions',
      error: error.message
    });
  }
};

/**
 * Get import template
 */
exports.getImportTemplate = async (req, res) => {
  const template = {
    description: 'Question Import Template',
    instructions: [
      'Each question object should have the required fields: questionText, questionType',
      'questionType can be: mcq, true_false, fill_blank, numerical, text',
      'difficulty can be: easy, medium, hard',
      'For MCQ questions, provide options array with objects containing text and isCorrect fields',
      'correctAnswerIndex is 0-based index for MCQ correct answer'
    ],
    sampleQuestions: [
      {
        questionText: 'What is 2 + 2?',
        questionType: 'mcq',
        difficulty: 'easy',
        topic: 'Basic Arithmetic',
        subTopic: 'Addition',
        options: [
          { text: '3', isCorrect: false },
          { text: '4', isCorrect: true },
          { text: '5', isCorrect: false },
          { text: '6', isCorrect: false }
        ],
        correctAnswer: '4',
        correctAnswerIndex: 1,
        explanation: '2 + 2 equals 4',
        points: 1,
        tags: ['arithmetic', 'addition']
      },
      {
        questionText: 'The Earth is flat.',
        questionType: 'true_false',
        difficulty: 'easy',
        topic: 'General Science',
        correctAnswer: 'false',
        explanation: 'The Earth is approximately spherical.',
        points: 1
      },
      {
        questionText: 'Calculate the square root of 144.',
        questionType: 'numerical',
        difficulty: 'medium',
        topic: 'Algebra',
        correctAnswer: '12',
        solutionSteps: [
          'Find the number that when multiplied by itself gives 144',
          '12 × 12 = 144',
          'Therefore, √144 = 12'
        ],
        points: 2
      }
    ]
  };
  
  res.json(template);
};

/**
 * Validate import data before importing
 */
exports.validateImportData = async (req, res) => {
  try {
    const { questions } = req.body;
    
    if (!questions || !Array.isArray(questions)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid data. Expected questions array.'
      });
    }
    
    const validationResults = {
      valid: 0,
      invalid: 0,
      errors: []
    };
    
    const validTypes = ['mcq', 'true_false', 'fill_blank', 'numerical', 'text'];
    const validDifficulties = ['easy', 'medium', 'hard'];
    
    questions.forEach((q, index) => {
      const errors = [];
      
      if (!q.questionText || typeof q.questionText !== 'string') {
        errors.push('Missing or invalid questionText');
      }
      
      if (!q.questionType || !validTypes.includes(q.questionType)) {
        errors.push(`Invalid questionType. Must be one of: ${validTypes.join(', ')}`);
      }
      
      if (q.difficulty && !validDifficulties.includes(q.difficulty)) {
        errors.push(`Invalid difficulty. Must be one of: ${validDifficulties.join(', ')}`);
      }
      
      if (q.questionType === 'mcq') {
        if (!q.options || !Array.isArray(q.options) || q.options.length < 2) {
          errors.push('MCQ questions must have at least 2 options');
        }
      }
      
      if (errors.length > 0) {
        validationResults.invalid++;
        validationResults.errors.push({
          index,
          questionPreview: q.questionText?.substring(0, 50) + '...',
          errors
        });
      } else {
        validationResults.valid++;
      }
    });
    
    res.json({
      success: true,
      totalQuestions: questions.length,
      validationResults
    });
    
  } catch (error) {
    console.error('Validate import error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate import data',
      error: error.message
    });
  }
};

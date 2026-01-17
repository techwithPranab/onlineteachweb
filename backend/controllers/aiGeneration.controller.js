const QuestionGeneration = require('../models/QuestionGeneration.model');
const Question = require('../models/Question.model');
const Course = require('../models/Course.model');
const logger = require('../utils/logger');
const { generateQuestionsWithAI } = require('../services/aiQuestionGenerator');

// @desc    Generate questions using AI
// @route   POST /api/questions/generate
// @access  Private (Tutor, Admin)
exports.generateQuestionsWithAI = async (req, res, next) => {
  try {
    const {
      courseId,
      chapterName,
      topic,
      difficultyLevel,
      questionType,
      count = 5,
      aiProvider = 'openai',
      model = 'gpt-4'
    } = req.body;
    
    // Validate course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    // Validate chapterName is provided
    if (!chapterName) {
      return res.status(400).json({
        success: false,
        message: 'Chapter name is required'
      });
    }
    
    // Build context for AI prompt
    const context = {
      courseTitle: course.title,
      subject: course.subject,
      grade: course.grade,
      chapterName: chapterName,
      topic: topic,
      difficultyLevel: difficultyLevel,
      questionType: questionType,
      count: count
    };
    
    // Generate the prompt
    const prompt = buildPrompt(context);
    logger.info(`Generated prompt for AI generation. Length: ${prompt.length} characters`);
    logger.debug(`Full prompt: ${prompt}`);
    // Create initial generation record before AI call
    const generationRecord = await QuestionGeneration.create({
      courseId,
      chapterName,
      topic,
      aiProvider,
      model,
      prompt,
      generationParams: {
        difficultyLevel,
        questionType,
        count
      },
      status: 'pending', // Initial status
      generatedBy: req.user._id
    });
    
    logger.info(`Generating ${count} ${difficultyLevel} ${questionType} questions for topic: ${topic}. Generation ID: ${generationRecord._id}`);
    
    // Call AI service
    const aiResult = await generateQuestionsWithAI({
      prompt,
      provider: aiProvider,
      model,
      count,
      courseId,
      chapterName,
      topic,
      difficultyLevel,
      questionType
    });
    
    if (!aiResult.success) {
      // Update the record with failure details
      await QuestionGeneration.findByIdAndUpdate(generationRecord._id, {
        aiResponse: aiResult.error || 'AI generation failed',
        status: 'failed',
        errorMessage: aiResult.error
      });
      
      return res.status(500).json({
        success: false,
        message: 'Failed to generate questions',
        error: aiResult.error,
        generationId: generationRecord._id
      });
    }
    
    // Parse and create questions
    const generatedQuestions = [];
    const questionIds = [];
    
    for (const q of aiResult.questions) {
      try {
        const question = await Question.create({
          courseId,
          chapterId,
          chapterName,
          topic,
          difficultyLevel,
          type: questionType,
          text: q.text,
          caseStudy: q.caseStudy,
          options: q.options,
          numericalAnswer: q.numericalAnswer,
          expectedAnswer: q.expectedAnswer,
          keywords: q.keywords,
          explanation: q.explanation,
          marks: q.marks || 1,
          negativeMarks: q.negativeMarks || 0,
          recommendedTime: q.recommendedTime || 60,
          tags: q.tags || [],
          createdBy: req.user._id
        });
        
        generatedQuestions.push(question);
        questionIds.push(question._id);
      } catch (error) {
        logger.error(`Failed to create question: ${error.message}`);
      }
    }
    
    // Update the generation record with success details
    await QuestionGeneration.findByIdAndUpdate(generationRecord._id, {
      finalPrompt: aiResult.finalPrompt,
      aiResponse: JSON.stringify(aiResult.raw),
      generationParams: {
        difficultyLevel,
        questionType,
        count,
        temperature: aiResult.temperature,
        maxTokens: aiResult.maxTokens
      },
      generatedQuestions: questionIds,
      status: generatedQuestions.length === count ? 'success' : 'partial',
      tokensUsed: aiResult.tokensUsed || {},
      costEstimate: aiResult.costEstimate || 0
    });
    
    logger.info(`Successfully generated ${generatedQuestions.length} questions. Generation ID: ${generationRecord._id}`);
    
    res.status(201).json({
      success: true,
      count: generatedQuestions.length,
      questions: generatedQuestions,
      generationId: generationRecord._id,
      tokensUsed: aiResult.tokensUsed,
      costEstimate: aiResult.costEstimate
    });
  } catch (error) {
    logger.error(`Question generation error: ${error.message}`);
    next(error);
  }
};

// @desc    Get question generation history
// @route   GET /api/questions/generate/history
// @access  Private (Tutor, Admin)
exports.getGenerationHistory = async (req, res, next) => {
  try {
    const { courseId, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (courseId) {
      query.courseId = courseId;
    }
    
    // Only show own history unless admin
    if (req.user.role !== 'admin') {
      query.generatedBy = req.user._id;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [generations, total] = await Promise.all([
      QuestionGeneration.find(query)
        .populate('courseId', 'title subject grade')
        .populate('generatedBy', 'name email')
        .populate('generatedQuestions', 'text type difficultyLevel')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      QuestionGeneration.countDocuments(query)
    ]);
    
    res.json({
      success: true,
      generations,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get generation details by ID
// @route   GET /api/questions/generate/:id
// @access  Private (Tutor, Admin)
exports.getGenerationById = async (req, res, next) => {
  try {
    const generation = await QuestionGeneration.findById(req.params.id)
      .populate('courseId', 'title subject grade')
      .populate('generatedBy', 'name email')
      .populate('generatedQuestions');
    
    if (!generation) {
      return res.status(404).json({
        success: false,
        message: 'Generation record not found'
      });
    }
    
    // Check access
    if (req.user.role !== 'admin' && generation.generatedBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    res.json({
      success: true,
      generation
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to build AI prompt
function buildPrompt(context) {
  const { courseTitle, subject, grade, chapterName, topic, difficultyLevel, questionType, count } = context;
  
  let prompt = `You are an expert educator creating assessment questions for students.

Course Details:
- Title: ${courseTitle}
- Subject: ${subject}
- Grade: ${grade}
- Chapter: ${chapterName}
- Topic: ${topic}

Task: Generate ${count} ${difficultyLevel} level ${questionType} questions based on the topic "${topic}".

Requirements:
- Questions should be appropriate for Grade ${grade} students
- Difficulty level: ${difficultyLevel}
- Question type: ${questionType}
- Questions should test understanding of "${topic}" from chapter "${chapterName}"
- Include clear, concise question text
- Provide detailed explanations for correct answers
`;

  if (questionType === 'mcq-single' || questionType === 'mcq-multiple') {
    prompt += `
For MCQ questions, provide:
- 4 options per question
- Clear indication of correct answer(s)
- Brief explanation for why each option is correct or incorrect
- Mark the correct option(s) with isCorrect: true
`;
  } else if (questionType === 'true-false') {
    prompt += `
For True/False questions, provide:
- Clear statement
- Correct answer (True or False)
- Explanation of why the statement is true or false
`;
  } else if (questionType === 'numerical') {
    prompt += `
For numerical questions, provide:
- Clear problem statement
- Expected numerical answer
- Unit of measurement (if applicable)
- Acceptable tolerance range
- Step-by-step solution
`;
  } else if (questionType === 'short-answer' || questionType === 'long-answer') {
    prompt += `
For answer-type questions, provide:
- Clear question
- Expected answer/model answer
- Key points that should be included
- Keywords for evaluation
`;
  } else if (questionType === 'case-based') {
    prompt += `
For case-based questions, provide:
- Relevant case study scenario
- Multiple related questions based on the case
- Options and correct answers for each question
`;
  }

  prompt += `

Return the questions in JSON format as an array with the following structure:
[
  {
    "text": "Question text here",
    "options": [
      {"text": "Option A", "isCorrect": false, "explanation": "Why this is wrong"},
      {"text": "Option B", "isCorrect": true, "explanation": "Why this is correct"},
      {"text": "Option C", "isCorrect": false, "explanation": "Why this is wrong"},
      {"text": "Option D", "isCorrect": false, "explanation": "Why this is wrong"}
    ],
    "explanation": "Detailed explanation of the correct answer",
    "marks": 1,
    "recommendedTime": 60,
    "keywords": ["keyword1", "keyword2"],
    "tags": ["${topic}", "${chapterName}"]
  }
]

Only return valid JSON, no additional text.`;

  return prompt;
}

module.exports = {
  generateQuestionsWithAI: exports.generateQuestionsWithAI,
  getGenerationHistory: exports.getGenerationHistory,
  getGenerationById: exports.getGenerationById
};

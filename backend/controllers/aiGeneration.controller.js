const { loadExercisePatterns, selectExercisePatterns } = require('../services/exercisePattern.service');
const { validateCourseDifficulties } = require('../utils/courseDifficulty');
const QuestionGeneration = require('../models/QuestionGeneration.model');
const Question = require('../models/Question.model');
const Course = require('../models/Course.model');
const logger = require('../utils/logger');
const aiQuestionGenerator = require('../services/aiQuestionGenerator');

// @desc    Generate questions using AI
// @route   POST /api/questions/generate
// @access  Private (Tutor, Admin)
exports.generateQuestionsWithAI = async (req, res, next) => {
  try {
    const {
      courseId,
      chapterId,
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
    
    const difficultyError = validateCourseDifficulties(course, [difficultyLevel]);
    if (difficultyError) return res.status(400).json({ success: false, message: difficultyError });

    // Validate chapterName is provided
    if (!chapterName) {
      return res.status(400).json({
        success: false,
        message: 'Chapter name is required'
      });
    }
    
    const exercisePatterns = selectExercisePatterns(await loadExercisePatterns(course), { chapterName, topic, questionType });
    // Build context for AI prompt
    const context = {
      exercisePatterns,
      sourceContent: (course.syllabus || []).join('\n'),
      learningObjectives: (course.chapters || []).find(chapter => chapter.name === chapterName)?.learningObjectives || [],
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
      sourceSnapshot: { exercisePatterns },
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
    const aiResult = await aiQuestionGenerator.generateQuestionsWithAI({
      prompt,
      provider: aiProvider,
      model,
      count,
      courseId,
      chapterName,
      topic,
      difficultyLevel,
      questionType,
      context
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
  const { generateQuestionPrompt } = require('../ai/prompts/questionPrompts');
  const { systemPrompt, userPrompt } = generateQuestionPrompt({
    topic: context.topic, content: context.sourceContent,
    difficultyLevel: context.difficultyLevel, questionType: context.questionType,
    count: context.count, context
  });
  return `${systemPrompt}\n\n${userPrompt}`;
}

module.exports = {
  generateQuestionsWithAI: exports.generateQuestionsWithAI,
  getGenerationHistory: exports.getGenerationHistory,
  getGenerationById: exports.getGenerationById
};

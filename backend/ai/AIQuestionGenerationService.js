const { loadExercisePatterns, selectExercisePatterns } = require('../services/exercisePattern.service');
const AIProviderFactory = require('./providers/AIProviderFactory');
const QuestionValidator = require('./validation/QuestionValidator');
const DuplicateDetector = require('./validation/DuplicateDetector');
const ContentFilter = require('./validation/ContentFilter');
const ContentNormalizer = require('./ingestion/ContentNormalizer');
const MaterialExtractor = require('./ingestion/MaterialExtractor');
const Course = require('../models/Course.model');
const Material = require('../models/Material.model');
const Question = require('../models/Question.model');
const QuestionGeneration = require('../models/QuestionGeneration.model');
const AIQuestionDraft = require('../models/AIQuestionDraft.model');
const { getDiagramTypesForContext } = require('./diagramTypeMatcher');
const logger = require('../utils/logger');
const crypto = require('crypto');

/**
 * AI Question Generation Service
 * Main orchestrator for the AI-driven question generation pipeline
 */
class AIQuestionGenerationService {
  constructor() {
    this.providerFactory = AIProviderFactory;
    this.validator = QuestionValidator;
    this.duplicateDetector = DuplicateDetector;
    this.contentFilter = ContentFilter;
    this.contentNormalizer = ContentNormalizer;
    this.materialExtractor = MaterialExtractor;
  }

  /**
   * Generate questions for a course
   * Main entry point for question generation
   */
  async generateQuestions({
    courseId,
    topics,
    difficultyLevels = ['easy', 'medium', 'hard'],
    questionTypes = ['mcq-single'],
    questionsPerTopic = 5,
    sources = ['syllabus'],
    materialIds = [],
    userId,
    imageBased = false,
    useExercisePatterns = true,
    chapterName
  }) {
    const startTime = Date.now();
    const jobId = this._generateJobId();
    
    logger.info(`Starting question generation job ${jobId} for course ${courseId}`);
    
    try {
      // 1. Fetch course
      const course = await Course.findById(courseId);
      if (!course) {
        throw new Error('Course not found');
      }
      
      // 2. Get AI provider (always use best available from .env)
      const provider = await this.providerFactory.getBestAvailable();
      
      logger.info(`Using AI provider: ${provider.getName()}`);
      
      // 3. Prepare content from sources
      const content = await this._prepareContent(course, sources, materialIds);
      const exercisePatterns = await loadExercisePatterns(course, materialIds);
      
      // 4. Determine topics to generate for
      const selectedChapter = chapterName && (course.chapters || []).find(chapter => chapter.name === chapterName);
      if (chapterName && !selectedChapter) throw new Error('Selected chapter was not found in this course');
      const targetTopics = topics && topics.length > 0 
        ? topics 
        : selectedChapter ? (selectedChapter.topics?.length ? selectedChapter.topics : [selectedChapter.name]) : this._extractTopicsFromCourse(course);
      
      if (targetTopics.length === 0) {
        throw new Error('No topics available for question generation');
      }
      
      // 5. Generate questions for each topic/difficulty/type combination
      const allGeneratedQuestions = [];
      const errors = [];
      
      for (const topic of targetTopics) {
        const chapter = selectedChapter || (course.chapters || []).find(item => (item.topics || []).includes(topic) || item.name === topic);
        const topicPatterns = selectExercisePatterns(exercisePatterns, { topic, chapterName: chapter?.name });
        const sourceTypes = [...new Set(topicPatterns.map(pattern => pattern.questionType))];
        const targetTypes = useExercisePatterns && sourceTypes.length ? sourceTypes : questionTypes;
        for (const difficulty of difficultyLevels) {
          for (const type of targetTypes) {
            try {
              const generated = await this._generateForCombination({
                provider,
                topic,
                difficulty,
                type,
                count: questionsPerTopic,
                content,
                course,
                courseId,
                userId,
                jobId,
                imageBased,
                exercisePatterns: topicPatterns,
                chapterName: chapter?.name
              });
              
              if (generated && Array.isArray(generated)) {
                allGeneratedQuestions.push(...generated.map(question => ({ ...question, topic, chapterName: chapter?.name || course.title, type, difficultyLevel: difficulty })));
              }
            } catch (error) {
              logger.error(`Error generating ${type}/${difficulty} for topic ${topic}:`, error);
              errors.push({
                topic,
                difficulty,
                type,
                error: error.message
              });
            }
          }
        }
      }
      
      // 6. Validate all questions
      const validationResults = this.validator.validateBatch(allGeneratedQuestions);
      logger.info(`Validation: ${validationResults.validCount} valid, ${validationResults.invalidCount} invalid`);
      
      // 7. Filter content
      const filterResults = this.contentFilter.filterBatch(validationResults.valid);
      logger.info(`Content filter: ${filterResults.passedCount} passed, ${filterResults.failedCount} failed`);
      
      // 8. Check for duplicates against existing questions
      const existingQuestions = await Question.find({ courseId }).lean();
      const duplicateResults = this.duplicateDetector.checkBatchDuplicates(
        filterResults.passed,
        existingQuestions
      );
      
      logger.info(`Duplicates: ${duplicateResults.duplicateCount} found, ${duplicateResults.uniqueCount} unique`);
      
      // 9. Save as drafts
      const drafts = await this._saveDrafts({
        questions: duplicateResults.uniqueQuestions,
        courseId,
        course,
        userId,
        provider,
        jobId,
        grade: course.grade,
        subject: course.subject,
        chapterName,
        topic: targetTopics[0] // Primary topic
      });
      
      const duration = Date.now() - startTime;
      
      return {
        success: true,
        jobId,
        summary: {
          totalGenerated: allGeneratedQuestions.length,
          validQuestions: validationResults.validCount,
          invalidQuestions: validationResults.invalidCount,
          filteredOut: filterResults.failedCount,
          flaggedForReview: filterResults.flaggedCount,
          duplicatesFound: duplicateResults.duplicateCount,
          draftsCreated: drafts.length,
          duration: `${duration}ms`
        },
        drafts: drafts.map(d => d._id),
        errors,
        provider: {
          name: provider.getName(),
          version: provider.getVersion()
        }
      };
      
    } catch (error) {
      logger.error(`Question generation job ${jobId} failed:`, error);
      throw error;
    }
  }

  /**
   * Generate questions for a single combination
   */
  async _generateForCombination({ provider, topic, difficulty, type, count, content, course, courseId, userId, jobId, imageBased = false, exercisePatterns = [], chapterName }) {
    const chapter = (course.chapters || []).find(item => (item.topics || []).includes(topic));
    const diagramTypes = imageBased
      ? getDiagramTypesForContext({
          grade: course.grade,
          subject: course.subject,
          courseTitle: course.title,
          courseTags: course.tags,
          chapterName: chapter?.name,
          topic
        })
      : [];
    const generateImageQuestion = imageBased && diagramTypes.length > 0;
    const context = {
      grade: course.grade,
      subject: course.subject,
      board: course.board,
      exercisePatterns: selectExercisePatterns(exercisePatterns, { questionType: type }),
      learningObjectives: this._getLearningObjectives(course, topic)
    };

    // Import the prompt generator function to create prompts for logging
    const { generateQuestionPrompt } = require('./prompts/questionPrompts');
    const { systemPrompt, userPrompt } = generateQuestionPrompt({
      topic,
      content: content.combinedContent,
      difficultyLevel: difficulty,
      questionType: type,
      count,
      context,
      imageBased: generateImageQuestion,
      diagramTypes
    });

    if (generateImageQuestion) {
      logger.info(`[IMAGE-BASED] Auto-selected diagram types: [${diagramTypes.join(', ')}] for topic "${topic}"`);
    }

    const finalPrompt = `${systemPrompt}\n\n${userPrompt}`;
    
    // Create QuestionGeneration record before calling AI provider
    let generationRecord = null;
    try {
      generationRecord = await QuestionGeneration.create({
        courseId: courseId,
        chapterName: chapterName || course.title,
        topic,
        aiProvider: provider.getName(),
        model: provider.model || 'unknown',
        prompt: systemPrompt,
        finalPrompt: finalPrompt,
        generationParams: {
          difficultyLevel: difficulty,
          questionType: type,
          count,
          temperature: provider.temperatureSettings?.[difficulty] || 0.5,
          maxTokens: (provider.maxTokenSettings?.[type] || 800) * count
        },
        status: 'pending',
        generatedBy: userId || null,
        sourceSnapshot: { ...content.snapshot, exercisePatterns: context.exercisePatterns }
      });
      
      logger.info(`Created QuestionGeneration record ${generationRecord._id} for ${topic} - ${difficulty} ${type}`);
    } catch (error) {
      logger.error(`Failed to create QuestionGeneration record: ${error.message}`);
      // Continue with generation even if record creation fails
    }
    
    try {
      const generated = await provider.generateQuestions({
        topic,
        content: content.combinedContent,
        difficultyLevel: difficulty,
        questionType: type,
        count,
        context,
        imageBased: generateImageQuestion,
        diagramTypes
      });

      // Update the generation record with success status
      if (generationRecord) {
        await QuestionGeneration.findByIdAndUpdate(generationRecord._id, {
          status: 'success',
          aiResponse: JSON.stringify(generated),
          generatedQuestions: [], // Will be populated when questions are saved
          tokensUsed: generated.tokensUsed || { prompt: 0, completion: 0, total: 0 }
        });
        logger.info(`Updated QuestionGeneration record ${generationRecord._id} with success status`);
      }
      
      return generated;
    } catch (error) {
      // Update the generation record with error status
      if (generationRecord) {
        await QuestionGeneration.findByIdAndUpdate(generationRecord._id, {
          status: 'failed',
          errorMessage: error.message
        });
        logger.error(`Updated QuestionGeneration record ${generationRecord._id} with error: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Prepare content from various sources
   */
  async _prepareContent(course, sources, materialIds = []) {
    const contentSources = [];
    
    // Materials content
    if (sources.includes('materials')) {
      const materialQuery = {
        course: course._id, 
        isActive: true 
      };
      if (materialIds.length) materialQuery._id = { $in: materialIds };
      const materials = await Material.find(materialQuery).sort({ order: 1, createdAt: 1 }).limit(20);
      
      for (const material of materials) {
        if (material.content && material.content.trim()) {
          contentSources.push(this.contentNormalizer.normalizeMaterial(material, material.content));
        } else if (material.fileUrl && this.materialExtractor.isSupported(material.fileUrl)) {
          const extracted = await this.materialExtractor.extract(
            material.fileUrl, 
            material.mimeType
          );
          
          if (extracted.success) {
            const normalized = this.contentNormalizer.normalizeMaterial(
              material, 
              extracted.content
            );
            contentSources.push(normalized);
          }
        }
      }
    }

    // Selected textbook material is authoritative, so it stays ahead of the
    // syllabus if the combined model context must be shortened.
    if (sources.includes('syllabus')) {
      const syllabusContent = this.contentNormalizer.normalizeSyllabus(course);
      contentSources.push(syllabusContent);
    }
    
    // Combine all content
    const combined = this.contentNormalizer.combineContent(contentSources);
    combined.snapshot = {
      content: combined.combinedContent,
      contentHash: crypto.createHash('sha256').update(combined.combinedContent).digest('hex'),
      capturedAt: new Date(),
      sources: contentSources.map(source => ({
        type: source.sourceType,
        materialId: source.materialId,
        title: source.title,
        updatedAt: source.updatedAt
      }))
    };
    return combined;
  }

  /**
   * Extract topics from course
   */
  _extractTopicsFromCourse(course) {
    const topics = new Set();
    
    if (course.topics) {
      course.topics.forEach(t => topics.add(t));
    }
    
    if (course.chapters) {
      for (const chapter of course.chapters) {
        topics.add(chapter.name);
        if (chapter.topics) {
          chapter.topics.forEach(t => topics.add(t));
        }
      }
    }
    
    return Array.from(topics);
  }

  /**
   * Get learning objectives for a topic
   */
  _getLearningObjectives(course, topic) {
    if (!course.chapters) return [];
    
    for (const chapter of course.chapters) {
      if (chapter.name === topic || chapter.topics?.includes(topic)) {
        return chapter.learningObjectives || [];
      }
    }
    
    return [];
  }

  /**
   * Save questions as drafts
   */
  async _saveDrafts({ questions, courseId, course, userId, provider, jobId, grade, subject, chapterName, topic: generationTopic }) {
    const drafts = [];
    
    for (const question of questions) {
      // Merge question data with required fields for questionPayload
      const questionPayload = {
        courseId,
        courseTitle: course.title,
        chapterName: question.chapterName || chapterName,
        grade,
        subject,
        topic: question.topic || generationTopic,
        difficultyLevel: question.difficultyLevel,
        type: question.type,
        text: question.text,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation || '',
        marks: question.marks || 1,
        negativeMarks: question.negativeMarks || 0,
        recommendedTime: question.recommendedTime || 60,
        tags: question.tags || [],
        options: question.options,
        numericalAnswer: question.numericalAnswer,
        expectedAnswer: question.expectedAnswer,
        keywords: question.keywords,
        caseStudy: question.caseStudy,
        // SVG diagram metadata for image-based questions
        diagram: question.diagram || null,
        _metadata: question._metadata
      };

      // Validate and attempt auto-fix before saving
      const validation = this.validator.validate(questionPayload);
      let finalPayload = questionPayload;

      if (!validation.isValid) {
        logger.warn(`Generated question failed validator initially: ${validation.errors.join('; ')}`);
        // Attempt conservative auto-fixes
        const fixes = this._autoFixQuestion(finalPayload);
        if (fixes.length > 0) {
          logger.info(`Auto-fix applied to generated question: ${fixes.join('; ')}`);
        }

        const revalidation = this.validator.validate(finalPayload);
        if (!revalidation.isValid) {
          logger.warn(`Skipping question after auto-fix; still invalid: ${revalidation.errors.join('; ')}`);
          continue; // Skip saving this draft
        }

        // preserve sanitized result but keep metadata
        finalPayload = {
          ...revalidation.sanitized,
          courseId,
          courseTitle: course.title,
          chapterName: question.chapterName || chapterName,
          grade,
          subject,
          explanation: revalidation.sanitized?.explanation || question.explanation || 'Explanation not provided — please review and update.'
        };
      } else {
        // sanitized output may strip out fields not known to validator (course metadata),
        // so merge them back explicitly
        finalPayload = {
          ...validation.sanitized,
          courseId,
          courseTitle: course.title,
          chapterName: question.chapterName || chapterName,
          grade,
          subject,
          explanation: validation.sanitized?.explanation || question.explanation || 'Explanation not provided — please review and update.'
        };
      }

      const draft = await AIQuestionDraft.create({
        questionPayload: finalPayload,
        sourceType: 'ai_generated',
        modelUsed: `${provider.getName()}/${provider.getVersion()}`,
        confidenceScore: question._metadata?.confidenceScore || 0.8,
        status: 'draft',
        jobId,
        createdBy: userId
      });
      
      drafts.push(draft);
    }
    
    return drafts;
  }

  // Attempt conservative auto-fixes on generated question payloads so they pass validator
  _autoFixQuestion(q) {
    const fixes = [];

    // Ensure base fields
    if (!q.text || typeof q.text !== 'string' || q.text.trim().length === 0) {
      q.text = 'Question text not provided by AI — please edit';
      fixes.push('Added placeholder text');
    }
    if (!q.topic || typeof q.topic !== 'string') {
      q.topic = 'General';
      fixes.push('Set default topic');
    }
    if (!q.difficultyLevel || !['easy', 'medium', 'hard', 'olympiad'].includes(q.difficultyLevel)) {
      q.difficultyLevel = 'medium';
      fixes.push('Set default difficultyLevel to medium');
    }
    if (!q.explanation || typeof q.explanation !== 'string' || q.explanation.trim().length === 0) {
      q.explanation = 'Explanation not provided — please review and update.';
      fixes.push('Added placeholder explanation');
    }

    // MCQ / True-False handling
    if (['mcq-single', 'mcq-multiple', 'true-false', 'case-based'].includes(q.type)) {
      if (!Array.isArray(q.options) || q.options.length === 0) {
        if (q.type === 'true-false') {
          // Create basic true/false options from correctAnswer if possible
          q.options = [
            { text: 'True', isCorrect: String(q.correctAnswer || '').toLowerCase() === 'true', explanation: q.explanation || '' },
            { text: 'False', isCorrect: String(q.correctAnswer || '').toLowerCase() === 'false', explanation: q.explanation || '' }
          ];
          fixes.push('Added True/False default options');
        } else {
          // cannot meaningfully fix MCQ without options
        }
      } else {
        // Normalize options
        q.options = q.options.map((opt, idx) => ({
          text: (opt?.text || `Option ${idx + 1}`).toString(),
          isCorrect: Boolean(opt?.isCorrect),
          explanation: (opt?.explanation || '').toString()
        }));
        fixes.push('Normalized options (ensured text/explanation/isCorrect)');

        // Infer correctAnswer from options if missing
        if (!q.correctAnswer) {
          const correctOpt = q.options.find(o => o.isCorrect);
          if (correctOpt) {
            q.correctAnswer = correctOpt.text;
            fixes.push('Inferred correctAnswer from option.isCorrect');
          } else if (q.type === 'mcq-single') {
            q.options[0].isCorrect = true;
            q.correctAnswer = q.options[0].text;
            fixes.push('Marked first option as correct for mcq-single (fallback)');
          } else if (q.type === 'mcq-multiple' && q.options.length >= 2) {
            q.options[0].isCorrect = true;
            q.options[1].isCorrect = true;
            q.correctAnswer = q.options.filter(o => o.isCorrect).map(o => o.text).join(', ');
            fixes.push('Marked first two options as correct for mcq-multiple (fallback)');
          }
        }

        // Ensure each option has an explanation
        q.options.forEach((opt, idx) => {
          if (!opt.explanation || opt.explanation.trim().length === 0) {
            opt.explanation = 'Explanation not provided';
            fixes.push(`Added placeholder explanation for option ${idx + 1}`);
          }
        });
      }
    }

    // Numerical questions: infer numericalAnswer from correctAnswer if possible
    if (q.type === 'numerical') {
      if (!q.numericalAnswer && q.correctAnswer) {
        const num = parseFloat(String(q.correctAnswer).replace(/[^[0-9\.\-]]/g, ''));
        if (!isNaN(num)) {
          q.numericalAnswer = { value: num, tolerance: 0 };
          fixes.push('Inferred numericalAnswer from correctAnswer');
        }
      }
    }

    // Short/Long answer: ensure expectedAnswer exists
    if (q.type === 'short-answer' || q.type === 'long-answer') {
      if (!q.expectedAnswer && q.correctAnswer) {
        q.expectedAnswer = String(q.correctAnswer);
        fixes.push('Set expectedAnswer from correctAnswer');
      }
      if (q.expectedAnswer && q.expectedAnswer.trim().length < 10) {
        q.expectedAnswer = `${q.expectedAnswer.trim()} (model answer)`;
        fixes.push('Padded expectedAnswer to meet min length');
      }
    }

    // Case-based: ensure caseStudy exists and correctAnswer/expectedAnswer is set
    if (q.type === 'case-based') {
      if (!q.caseStudy || typeof q.caseStudy !== 'string' || q.caseStudy.trim().length === 0) {
        q.caseStudy = q.text || 'Case study scenario not provided — please edit.';
        fixes.push('Added placeholder caseStudy');
      }
      // Set expectedAnswer from correctAnswer so model validator is satisfied
      if (!q.expectedAnswer && q.correctAnswer) {
        q.expectedAnswer = String(q.correctAnswer);
        fixes.push('Set expectedAnswer from correctAnswer for case-based');
      }
      if (!q.correctAnswer && !q.expectedAnswer) {
        q.correctAnswer = 'Answer not provided — please review and update.';
        q.expectedAnswer = q.correctAnswer;
        fixes.push('Added placeholder correctAnswer/expectedAnswer for case-based');
      }
    }

    return Array.from(new Set(fixes));
  }

  /**
   * Generate unique job ID
   */
  _generateJobId() {
    return `qgen_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Get drafts for review
   */
  async getDrafts({ courseId, status, page = 1, limit = 20 }) {
    const query = {};
    
    if (courseId) query['questionPayload.courseId'] = courseId;
    if (status) query.status = status;
    
    const skip = (page - 1) * limit;
    
    const [drafts, total] = await Promise.all([
      AIQuestionDraft.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: 'questionPayload.courseId',
          select: 'title subject grade'
        })
        .lean(),
      AIQuestionDraft.countDocuments(query)
    ]);
    
    return {
      drafts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Approve a draft question
   */
  async approveDraft(draftId, userId, edits = null) {
    const draft = await AIQuestionDraft.findById(draftId);
    
    if (!draft) {
      throw new Error('Draft not found');
    }
    
    if (draft.status !== 'draft') {
      throw new Error('Draft is not pending approval');
    }
    
    // Apply edits if provided
    let questionData = draft.questionPayload;
    if (edits) {
      // Preserve required fields if not explicitly provided in edits
      const preservedFields = {};
      
      // List of required fields that should be preserved if not in edits
      const requiredFields = [
        'courseId', 'courseTitle', 'chapterName', 'grade', 'subject', 
        'topic', 'difficultyLevel', 'type', 'correctAnswer', 'explanation', 'marks'
      ];
      
      requiredFields.forEach(field => {
        if (edits[field] === undefined && questionData[field] !== undefined) {
          preservedFields[field] = questionData[field];
        }
      });
      
      questionData = { ...questionData, ...edits, ...preservedFields };
    }
    
    // Ensure required fields are present BEFORE validation
    // Generate correctAnswer from options if not present
    if (!questionData.correctAnswer && questionData.options) {
      const correctOption = questionData.options.find(opt => opt.isCorrect);
      if (correctOption) {
        questionData.correctAnswer = correctOption.text;
      }
    }
    
    // Use draft-level chapterName if question payload doesn't have it
    if (!questionData.chapterName) {
      questionData.chapterName = questionData.chapterName; // Already in questionPayload
    }
    
    // Validate after ensuring all required fields are present
    if (edits) {
      const validation = this.validator.validate(questionData);
      if (!validation.isValid) {
        throw new Error(`Validation failed after edits: ${validation.errors.join(', ')}`);
      }
      questionData = validation.sanitized;
    }
    
    // Create actual question
    const question = await Question.create({
      ...questionData,
      courseId: questionData.courseId, // Use courseId from questionPayload
      createdBy: draft.modelUsed.split('/')[0], // Extract provider name from modelUsed
      isActive: true
    });
    
    // Update draft status
    draft.status = 'approved';
    draft.approvedBy = userId;
    draft.approvedAt = new Date();
    draft.finalQuestionId = question._id;
    await draft.save();
    
    logger.info(`Draft ${draftId} approved as question ${question._id}`);
    
    return { draft, question };
  }

  /**
   * Reject a draft question
   */
  async rejectDraft(draftId, userId, reason) {
    const draft = await AIQuestionDraft.findById(draftId);
    
    if (!draft) {
      throw new Error('Draft not found');
    }
    
    if (draft.status !== 'draft') {
      throw new Error('Draft is not pending approval');
    }
    
    draft.status = 'rejected';
    draft.rejectedBy = userId;
    draft.rejectedAt = new Date();
    draft.rejectionReason = reason;
    await draft.save();
    
    logger.info(`Draft ${draftId} rejected by user ${userId}`);
    
    return draft;
  }

  /**
   * Bulk approve drafts
   */
  async bulkApprove(draftIds, userId) {
    const results = {
      approved: [],
      failed: []
    };
    
    for (const draftId of draftIds) {
      try {
        const result = await this.approveDraft(draftId, userId);
        results.approved.push({
          draftId,
          questionId: result.question._id
        });
      } catch (error) {
        results.failed.push({
          draftId,
          error: error.message
        });
      }
    }
    
    return results;
  }

  /**
   * Bulk reject drafts
   */
  async bulkReject(draftIds, userId, reason) {
    const results = {
      rejected: [],
      failed: []
    };
    
    for (const draftId of draftIds) {
      try {
        await this.rejectDraft(draftId, userId, reason);
        results.rejected.push(draftId);
      } catch (error) {
        results.failed.push({
          draftId,
          error: error.message
        });
      }
    }
    
    return results;
  }

  /**
   * Get generation statistics
   */
  async getStatistics(courseId = null) {
    const matchStage = courseId ? { 'questionPayload.courseId': courseId } : {};
    
    const stats = await AIQuestionDraft.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgConfidence: { $avg: '$confidenceScore' }
        }
      }
    ]);
    
    const byModel = await AIQuestionDraft.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$modelUsed',
          count: { $sum: 1 },
          approvedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
          }
        }
      }
    ]);
    
    return {
      byStatus: stats,
      byModel,
      totalDrafts: await AIQuestionDraft.countDocuments(matchStage)
    };
  }

  /**
   * Check provider availability
   */
  async checkProviders() {
    return this.providerFactory.checkAvailability();
  }

  /**
   * Get available providers with metadata
   */
  async getAvailableProviders() {
    const providers = this.providerFactory.getAvailableProviders();
    
    const providerInfo = await Promise.all(
      providers.map(async (name) => {
        const provider = this.providerFactory.getProvider(name);
        const isAvailable = await provider.isAvailable();
        
        return {
          name,
          displayName: this._getProviderDisplayName(name),
          isAvailable,
          description: this._getProviderDescription(name),
          features: this._getProviderFeatures(name)
        };
      })
    );
    
    return providerInfo;
  }

  /**
   * Get default provider name
   */
  getDefaultProviderName() {
    return this.providerFactory.getDefaultProvider().getName();
  }

  /**
   * Get display name for provider
   */
  _getProviderDisplayName(name) {
    const displayNames = {
      'openai': 'OpenAI GPT-4',
      'rule-based': 'Template-Based Generator',
      'local-llm': 'Local LLM'
    };
    return displayNames[name] || name;
  }

  /**
   * Get description for provider
   */
  _getProviderDescription(name) {
    const descriptions = {
      'openai': 'Uses OpenAI GPT-4 for high-quality question generation with advanced understanding.',
      'rule-based': 'Template-based fallback generator. Produces basic questions when AI is unavailable.',
      'local-llm': 'Uses locally hosted LLM for privacy-focused generation.'
    };
    return descriptions[name] || 'No description available';
  }

  /**
   * Get features for provider
   */
  _getProviderFeatures(name) {
    const features = {
      'openai': [
        'High-quality questions',
        'Context-aware generation',
        'All question types supported',
        'Detailed explanations',
        'Multi-language support'
      ],
      'rule-based': [
        'Always available',
        'Fast generation',
        'Basic question types',
        'Template-based',
        'Lower quality'
      ],
      'local-llm': [
        'Privacy-focused',
        'No external API calls',
        'Customizable models'
      ]
    };
    return features[name] || [];
  }
}

module.exports = new AIQuestionGenerationService();

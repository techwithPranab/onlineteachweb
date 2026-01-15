const AIProviderFactory = require('./providers/AIProviderFactory');
const QuestionValidator = require('./validation/QuestionValidator');
const DuplicateDetector = require('./validation/DuplicateDetector');
const ContentFilter = require('./validation/ContentFilter');
const ContentNormalizer = require('./ingestion/ContentNormalizer');
const MaterialExtractor = require('./ingestion/MaterialExtractor');
const Course = require('../models/Course.model');
const Material = require('../models/Material.model');
const Question = require('../models/Question.model');
const AIQuestionDraft = require('../models/AIQuestionDraft.model');
const logger = require('../utils/logger');

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
    userId,
    providerName = null
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
      
      // 2. Get AI provider
      const provider = providerName 
        ? this.providerFactory.get(providerName)
        : await this.providerFactory.getBestAvailable();
      
      logger.info(`Using AI provider: ${provider.getName()}`);
      
      // 3. Prepare content from sources
      const content = await this._prepareContent(course, sources);
      
      // 4. Determine topics to generate for
      const targetTopics = topics && topics.length > 0 
        ? topics 
        : this._extractTopicsFromCourse(course);
      
      if (targetTopics.length === 0) {
        throw new Error('No topics available for question generation');
      }
      
      // 5. Generate questions for each topic/difficulty/type combination
      const allGeneratedQuestions = [];
      const errors = [];
      
      for (const topic of targetTopics) {
        for (const difficulty of difficultyLevels) {
          for (const type of questionTypes) {
            try {
              const generated = await this._generateForCombination({
                provider,
                topic,
                difficulty,
                type,
                count: questionsPerTopic,
                content,
                course
              });
              
              allGeneratedQuestions.push(...generated);
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
        userId,
        provider,
        jobId
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
  async _generateForCombination({ provider, topic, difficulty, type, count, content, course }) {
    const context = {
      grade: course.grade,
      subject: course.subject,
      board: course.board,
      learningObjectives: this._getLearningObjectives(course, topic)
    };
    
    const generated = await provider.generateQuestions({
      topic,
      content: content.combinedContent,
      difficultyLevel: difficulty,
      questionType: type,
      count,
      context
    });
    
    return generated;
  }

  /**
   * Prepare content from various sources
   */
  async _prepareContent(course, sources) {
    const contentSources = [];
    
    // Syllabus content
    if (sources.includes('syllabus')) {
      const syllabusContent = this.contentNormalizer.normalizeSyllabus(course);
      contentSources.push(syllabusContent);
    }
    
    // Materials content
    if (sources.includes('materials')) {
      const materials = await Material.find({ 
        course: course._id, 
        isActive: true 
      }).limit(10);
      
      for (const material of materials) {
        if (material.fileUrl && this.materialExtractor.isSupported(material.fileUrl)) {
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
    
    // Combine all content
    return this.contentNormalizer.combineContent(contentSources);
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
  async _saveDrafts({ questions, courseId, userId, provider, jobId }) {
    const drafts = [];
    
    for (const question of questions) {
      const draft = await AIQuestionDraft.create({
        courseId,
        topic: question.topic,
        difficultyLevel: question.difficultyLevel,
        type: question.type,
        questionPayload: question,
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
    
    if (courseId) query.courseId = courseId;
    if (status) query.status = status;
    
    const skip = (page - 1) * limit;
    
    const [drafts, total] = await Promise.all([
      AIQuestionDraft.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('courseId', 'title subject grade')
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
      questionData = { ...questionData, ...edits };
      
      // Re-validate after edits
      const validation = this.validator.validate(questionData);
      if (!validation.isValid) {
        throw new Error(`Validation failed after edits: ${validation.errors.join(', ')}`);
      }
      questionData = validation.sanitized;
    }
    
    // Create actual question
    const question = await Question.create({
      ...questionData,
      courseId: draft.courseId,
      createdBy: userId,
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
    const matchStage = courseId ? { courseId } : {};
    
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

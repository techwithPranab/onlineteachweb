const AIQuestionGenerationService = require('../ai/AIQuestionGenerationService');
const AIQuestionDraft = require('../models/AIQuestionDraft.model');
const Course = require('../models/Course.model');
const logger = require('../utils/logger');

/**
 * @desc    Generate questions using AI
 * @route   POST /api/ai/questions/generate
 * @access  Private (Tutor, Admin)
 */
exports.generateQuestions = async (req, res, next) => {
  try {
    const {
      courseId,
      topics,
      difficultyLevels,
      questionTypes,
      questionsPerTopic,
      sources,
      providerName
    } = req.body;

    // Validate courseId
    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'courseId is required'
      });
    }

    // Check if course exists and user has access
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check user permissions (admin or course tutor)
    if (req.user.role !== 'admin' && 
        course.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to generate questions for this course'
      });
    }

    // Generate questions
    const result = await AIQuestionGenerationService.generateQuestions({
      courseId,
      topics: topics || [],
      difficultyLevels: difficultyLevels || ['easy', 'medium', 'hard'],
      questionTypes: questionTypes || ['mcq-single'],
      questionsPerTopic: questionsPerTopic || 5,
      sources: sources || ['syllabus'],
      userId: req.user._id,
      providerName
    });

    logger.info(`Question generation completed: ${result.summary.draftsCreated} drafts created for course ${courseId}`);

    res.status(201).json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error('Question generation error:', error);
    next(error);
  }
};

/**
 * @desc    Get draft questions for review
 * @route   GET /api/ai/questions/drafts
 * @access  Private (Tutor, Admin)
 */
exports.getDrafts = async (req, res, next) => {
  try {
    const { courseId, status, page, limit } = req.query;

    // If not admin, filter by courses user has access to
    let query = {};
    if (req.user.role !== 'admin') {
      const userCourses = await Course.find({ createdBy: req.user._id }).select('_id');
      const courseIds = userCourses.map(c => c._id);
      query.courseId = { $in: courseIds };
    }

    if (courseId) query.courseId = courseId;
    if (status) query.status = status;

    const result = await AIQuestionGenerationService.getDrafts({
      ...query,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20
    });

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single draft by ID
 * @route   GET /api/ai/questions/drafts/:id
 * @access  Private (Tutor, Admin)
 */
exports.getDraftById = async (req, res, next) => {
  try {
    const draft = await AIQuestionDraft.findById(req.params.id)
      .populate('courseId', 'title subject grade')
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email')
      .populate('rejectedBy', 'name email');

    if (!draft) {
      return res.status(404).json({
        success: false,
        message: 'Draft not found'
      });
    }

    // Check access
    if (req.user.role !== 'admin') {
      const course = await Course.findById(draft.courseId);
      if (course.createdBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view this draft'
        });
      }
    }

    res.json({
      success: true,
      draft
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Approve a draft question
 * @route   POST /api/ai/questions/approve/:id
 * @access  Private (Tutor, Admin)
 */
exports.approveDraft = async (req, res, next) => {
  try {
    const { edits } = req.body;

    const draft = await AIQuestionDraft.findById(req.params.id);
    if (!draft) {
      return res.status(404).json({
        success: false,
        message: 'Draft not found'
      });
    }

    // Check access
    if (req.user.role !== 'admin') {
      const course = await Course.findById(draft.courseId);
      if (course.createdBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to approve this draft'
        });
      }
    }

    const result = await AIQuestionGenerationService.approveDraft(
      req.params.id,
      req.user._id,
      edits
    );

    logger.info(`Draft ${req.params.id} approved by user ${req.user._id}`);

    res.json({
      success: true,
      message: 'Draft approved and question created',
      draft: result.draft,
      question: result.question
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reject a draft question
 * @route   POST /api/ai/questions/reject/:id
 * @access  Private (Tutor, Admin)
 */
exports.rejectDraft = async (req, res, next) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const draft = await AIQuestionDraft.findById(req.params.id);
    if (!draft) {
      return res.status(404).json({
        success: false,
        message: 'Draft not found'
      });
    }

    // Check access
    if (req.user.role !== 'admin') {
      const course = await Course.findById(draft.courseId);
      if (course.createdBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to reject this draft'
        });
      }
    }

    const result = await AIQuestionGenerationService.rejectDraft(
      req.params.id,
      req.user._id,
      reason
    );

    logger.info(`Draft ${req.params.id} rejected by user ${req.user._id}`);

    res.json({
      success: true,
      message: 'Draft rejected',
      draft: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Bulk approve drafts
 * @route   POST /api/ai/questions/bulk-approve
 * @access  Private (Tutor, Admin)
 */
exports.bulkApprove = async (req, res, next) => {
  try {
    const { draftIds } = req.body;

    if (!Array.isArray(draftIds) || draftIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'draftIds array is required'
      });
    }

    const result = await AIQuestionGenerationService.bulkApprove(draftIds, req.user._id);

    logger.info(`Bulk approval: ${result.approved.length} approved, ${result.failed.length} failed`);

    res.json({
      success: true,
      message: `${result.approved.length} drafts approved`,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Bulk reject drafts
 * @route   POST /api/ai/questions/bulk-reject
 * @access  Private (Tutor, Admin)
 */
exports.bulkReject = async (req, res, next) => {
  try {
    const { draftIds, reason } = req.body;

    if (!Array.isArray(draftIds) || draftIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'draftIds array is required'
      });
    }

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const result = await AIQuestionGenerationService.bulkReject(draftIds, req.user._id, reason);

    logger.info(`Bulk rejection: ${result.rejected.length} rejected, ${result.failed.length} failed`);

    res.json({
      success: true,
      message: `${result.rejected.length} drafts rejected`,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Edit a draft question
 * @route   PUT /api/ai/questions/drafts/:id
 * @access  Private (Tutor, Admin)
 */
exports.editDraft = async (req, res, next) => {
  try {
    const { questionPayload, changeDescription } = req.body;

    const draft = await AIQuestionDraft.findById(req.params.id);
    if (!draft) {
      return res.status(404).json({
        success: false,
        message: 'Draft not found'
      });
    }

    // Check access
    if (req.user.role !== 'admin') {
      const course = await Course.findById(draft.courseId);
      if (course.createdBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to edit this draft'
        });
      }
    }

    await draft.recordEdit(req.user._id, questionPayload, changeDescription || 'Manual edit');

    res.json({
      success: true,
      message: 'Draft updated',
      draft
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get generation statistics
 * @route   GET /api/ai/questions/stats
 * @access  Private (Tutor, Admin)
 */
exports.getStatistics = async (req, res, next) => {
  try {
    const { courseId } = req.query;

    const stats = await AIQuestionGenerationService.getStatistics(courseId);
    const approvalRate = await AIQuestionDraft.getApprovalRate(courseId);

    res.json({
      success: true,
      stats: {
        ...stats,
        approvalRate
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Check AI provider availability
 * @route   GET /api/ai/providers/status
 * @access  Private (Admin)
 */
exports.getProviderStatus = async (req, res, next) => {
  try {
    const availability = await AIQuestionGenerationService.checkProviders();

    res.json({
      success: true,
      providers: availability
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get drafts by job ID
 * @route   GET /api/ai/questions/jobs/:jobId
 * @access  Private (Tutor, Admin)
 */
exports.getDraftsByJob = async (req, res, next) => {
  try {
    const drafts = await AIQuestionDraft.getByJob(req.params.jobId);

    res.json({
      success: true,
      count: drafts.length,
      drafts
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get available AI providers for question generation
 * @route   GET /api/ai/providers
 * @access  Private (Tutor, Admin)
 */
exports.getAvailableProviders = async (req, res, next) => {
  try {
    const providers = await AIQuestionGenerationService.getAvailableProviders();

    res.json({
      success: true,
      providers: providers.map(p => ({
        name: p.name,
        displayName: p.displayName,
        isAvailable: p.isAvailable,
        description: p.description,
        features: p.features
      })),
      defaultProvider: AIQuestionGenerationService.getDefaultProviderName()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Start async generation job (for large batches)
 * @route   POST /api/ai/questions/generate-async
 * @access  Private (Tutor, Admin)
 */
exports.generateQuestionsAsync = async (req, res, next) => {
  try {
    const {
      courseId,
      topics,
      difficultyLevels,
      questionTypes,
      questionsPerTopic,
      providerName
    } = req.body;

    // Validate courseId
    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'courseId is required'
      });
    }

    // Check if course exists and user has access
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check user permissions
    if (req.user.role !== 'admin' && 
        course.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to generate questions for this course'
      });
    }

    // Add job to queue
    const aiGenerationQueue = require('../services/aiGenerationQueue.service');
    
    const jobId = aiGenerationQueue.addJob({
      courseId,
      topics: topics || [],
      difficulty: difficultyLevels || ['easy', 'medium', 'hard'],
      count: (topics?.length || 1) * (questionsPerTopic || 5),
      provider: providerName,
      userId: req.user._id
    });

    logger.info(`Async generation job started: ${jobId} for course ${courseId}`);

    res.status(202).json({
      success: true,
      message: 'Generation job started',
      jobId,
      checkStatusUrl: `/api/ai/questions/jobs/${jobId}`
    });
  } catch (error) {
    logger.error('Async generation error:', error);
    next(error);
  }
};

/**
 * @desc    Get async job status
 * @route   GET /api/ai/questions/jobs/:jobId
 * @access  Private (Tutor, Admin)
 */
exports.getJobStatus = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const aiGenerationQueue = require('../services/aiGenerationQueue.service');
    
    const status = aiGenerationQueue.getJobStatus(jobId);

    if (!status.found) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    res.json({
      success: true,
      job: status
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get async job results
 * @route   GET /api/ai/questions/jobs/:jobId/results
 * @access  Private (Tutor, Admin)
 */
exports.getJobResults = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const aiGenerationQueue = require('../services/aiGenerationQueue.service');
    
    const results = aiGenerationQueue.getJobResults(jobId);

    if (!results) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    res.json({
      success: true,
      ...results
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cancel an async generation job
 * @route   DELETE /api/ai/questions/jobs/:jobId
 * @access  Private (Tutor, Admin)
 */
exports.cancelJob = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const aiGenerationQueue = require('../services/aiGenerationQueue.service');
    
    const cancelled = aiGenerationQueue.cancelJob(jobId);

    if (!cancelled) {
      return res.status(404).json({
        success: false,
        message: 'Job not found or already processing'
      });
    }

    res.json({
      success: true,
      message: 'Job cancelled'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get queue stats
 * @route   GET /api/ai/questions/queue/stats
 * @access  Private (Admin)
 */
exports.getQueueStats = async (req, res, next) => {
  try {
    const aiGenerationQueue = require('../services/aiGenerationQueue.service');
    const stats = aiGenerationQueue.getStats();

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    next(error);
  }
};
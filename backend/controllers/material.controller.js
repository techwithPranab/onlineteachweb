const Material = require('../models/Material.model');
const Course = require('../models/Course.model');
const User = require('../models/User.model');
const featureAccessService = require('../services/featureAccess.service');

// @desc    Get all materials for tutor
// @route   GET /api/materials
// @access  Private (Tutor or Admin)
exports.getMaterialsByTutor = async (req, res, next) => {
  try {
    const { courseId, type } = req.query;
    
    const query = { 
      isActive: true
    };

    if (req.user.role !== 'admin') {
      query.tutor = req.user._id;
    }
    
    if (courseId) query.course = courseId;
    if (type) query.type = type;
    
    const materials = await Material.find(query)
      .populate('course', 'title grade')
      .sort('-createdAt');
    
    res.json({
      success: true,
      data: materials
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload material
// @route   POST /api/materials
// @access  Private (Tutor or Admin)
exports.uploadMaterial = async (req, res, next) => {
  try {
    const { courseId, title, description, type, accessLevel, content, contentFormat, previewContent, difficulty, category } = req.body;
    
    // Allow articles/content without a file
    const hasFile = !!req.file;
    const hasContent = typeof content === 'string' && content.trim().length > 0;

    if (!hasFile && !hasContent && type !== 'link') {
      return res.status(400).json({
        success: false,
        message: 'Either a file upload or content is required for this material type'
      });
    }
    
    // Verify course
    const course = await Course.findById(courseId);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    // Note: Course model doesn't currently have an assigned "tutor" field.
    // Allow both tutors and admins to upload materials. Ownership checks are
    // enforced during update/delete for tutors.

    // Create file URL if uploaded
    let fileUrl;
    let fileName;
    let fileSize;
    let mimeType;

    if (hasFile) {
      fileUrl = `/uploads/materials/${req.file.filename}`;
      fileName = req.file.originalname;
      fileSize = req.file.size;
      mimeType = req.file.mimetype;
    }

    // Parse tags if provided (can be JSON string or comma-separated string)
    let tags = undefined;
    if (req.body.tags) {
      try {
        if (typeof req.body.tags === 'string') {
          // Try JSON parse
          try {
            tags = JSON.parse(req.body.tags);
          } catch (e) {
            // Fallback to comma-separated
            tags = req.body.tags.split(',').map(t => t.trim()).filter(Boolean);
          }
        } else if (Array.isArray(req.body.tags)) {
          tags = req.body.tags;
        }
      } catch (err) {
        tags = undefined;
      }
    }

    const material = await Material.create({
      course: courseId,
      tutor: req.user._id,
      title,
      description,
      type,
      fileUrl,
      fileName,
      fileSize,
      mimeType,
      content: hasContent ? content : undefined,
      contentFormat: contentFormat || (hasContent ? 'markdown' : undefined),
      previewContent: previewContent || undefined,
      difficulty: difficulty || 'basic',
      category: category || 'lesson',
      isFree: accessLevel === 'free',
      tags
    });
    
    res.status(201).json({
      success: true,
      material
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update material
// @route   PUT /api/materials/:id
// @access  Private (Tutor or Admin)
exports.updateMaterial = async (req, res, next) => {
  try {
    const { title, description, type, fileUrl, isFree, isActive, order, content, contentFormat, previewContent, difficulty, category } = req.body;
    
    const material = await Material.findById(req.params.id);
    
    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material not found'
      });
    }
    
    // Tutors can only modify their own materials; admins can modify any
    if (req.user.role === 'tutor' && material.tutor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const updatePayload = {};
    if (title !== undefined) updatePayload.title = title;
    if (description !== undefined) updatePayload.description = description;
    if (type !== undefined) updatePayload.type = type;
    if (fileUrl !== undefined) updatePayload.fileUrl = fileUrl;
    if (isFree !== undefined) updatePayload.isFree = isFree;
    if (isActive !== undefined) updatePayload.isActive = isActive;
    if (order !== undefined) updatePayload.order = order;
    if (content !== undefined) updatePayload.content = content;
    if (contentFormat !== undefined) updatePayload.contentFormat = contentFormat;
    if (previewContent !== undefined) updatePayload.previewContent = previewContent;
    if (difficulty !== undefined) updatePayload.difficulty = difficulty;
    if (category !== undefined) updatePayload.category = category;
    if (req.body.tags !== undefined) {
      // normalize tags
      if (typeof req.body.tags === 'string') {
        try {
          updatePayload.tags = JSON.parse(req.body.tags);
        } catch (e) {
          updatePayload.tags = req.body.tags.split(',').map(t => t.trim()).filter(Boolean);
        }
      } else {
        updatePayload.tags = req.body.tags;
      }
    }

    const updatedMaterial = await Material.findByIdAndUpdate(
      req.params.id,
      updatePayload,
      { new: true, runValidators: true }
    );
    
    res.json({
      success: true,
      material: updatedMaterial
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete material
// @route   DELETE /api/materials/:id
// @access  Private (Tutor or Admin)
exports.deleteMaterial = async (req, res, next) => {
  try {
    const material = await Material.findById(req.params.id);
    
    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material not found'
      });
    }
    
    if (req.user.role === 'tutor' && material.tutor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }
    
    await Material.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Material deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get recent materials for student
// @route   GET /api/materials/student/recent
// @access  Private (Student)
exports.getRecentMaterialsForStudent = async (req, res, next) => {
  try {
    const { limit = 6 } = req.query;
    
    // Get materials from all available courses (no enrollment check needed)
    const materials = await Material.find({
      isActive: true
    })
      .populate('course', 'title grade')
      .sort('-createdAt')
      .limit(parseInt(limit));
    
    res.json({
      success: true,
      data: materials
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get materials for course
// @route   GET /api/materials/:courseId
// @access  Private
exports.getMaterialsByCourse = async (req, res, next) => {
  try {
    const { type, isFree } = req.query;
    
    const query = { 
      course: req.params.courseId,
      isActive: true
    };
    
    if (type) query.type = type;
    if (isFree !== undefined) query.isFree = isFree === 'true';
    
    if (req.user.role === 'student') {
      const [viewAccess, downloadAccess] = await Promise.all([
        featureAccessService.checkAccess(req.user._id, 'materials.view'),
        featureAccessService.checkAccess(req.user._id, 'materials.download')
      ]);

      const hasFullMaterialAccess = viewAccess.allowed || downloadAccess.allowed;

      if (!hasFullMaterialAccess) {
        query.isFree = true;
      }
    }
    
    const materials = await Material.find(query)
      .populate('course', 'title grade')
      .sort('order');
    
    res.json({
      success: true,
      data: materials
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get material previews by course (public access)
// @route   GET /api/materials/previews/:courseId
// @access  Public
exports.getMaterialPreviewsByCourse = async (req, res, next) => {
  try {
    const { type, difficulty, category } = req.query;

    const query = {
      course: req.params.courseId,
      isActive: true,
      previewContent: { $exists: true, $ne: '' } // Only materials with preview content
    };

    if (type) query.type = type;
    if (difficulty) query.difficulty = difficulty;
    if (category) query.category = category;

    const materials = await Material.find(query)
      .populate('course', 'title grade')
      .select('title description type difficulty category tags previewContent contentFormat fileUrl fileName mimeType order viewCount')
      .sort('order')
      .limit(10); // Limit preview materials

    res.json({
      success: true,
      materials
    });
  } catch (error) {
    next(error);
  }
};

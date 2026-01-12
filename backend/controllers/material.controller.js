const Material = require('../models/Material.model');
const Course = require('../models/Course.model');

// @desc    Get all materials for tutor
// @route   GET /api/materials
// @access  Private (Tutor)
exports.getMaterialsByTutor = async (req, res, next) => {
  try {
    const { courseId, type } = req.query;
    
    const query = { 
      tutor: req.user._id,
      isActive: true
    };
    
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
// @access  Private (Tutor)
exports.uploadMaterial = async (req, res, next) => {
  try {
    const { courseId, title, description, type, accessLevel } = req.body;
    
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'File is required'
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
    
    if (course.tutor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }
    
    // Create file URL
    const fileUrl = `/uploads/materials/${req.file.filename}`;
    
    const material = await Material.create({
      course: courseId,
      tutor: req.user._id,
      title,
      description,
      type,
      fileUrl,
      isFree: accessLevel === 'free'
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
// @access  Private (Tutor)
exports.updateMaterial = async (req, res, next) => {
  try {
    const { title, description, type, fileUrl, isFree } = req.body;
    
    const material = await Material.findById(req.params.id);
    
    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material not found'
      });
    }
    
    if (material.tutor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }
    
    const updatedMaterial = await Material.findByIdAndUpdate(
      req.params.id,
      { title, description, type, fileUrl, isFree },
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
// @access  Private (Tutor)
exports.deleteMaterial = async (req, res, next) => {
  try {
    const material = await Material.findById(req.params.id);
    
    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material not found'
      });
    }
    
    if (material.tutor.toString() !== req.user._id.toString()) {
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
    
    const materials = await Material.find(query).sort('order');
    
    res.json({
      success: true,
      materials
    });
  } catch (error) {
    next(error);
  }
};

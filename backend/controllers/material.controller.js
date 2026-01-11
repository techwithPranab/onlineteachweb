const Material = require('../models/Material.model');
const Course = require('../models/Course.model');

// @desc    Upload material
// @route   POST /api/materials
// @access  Private (Tutor)
exports.uploadMaterial = async (req, res, next) => {
  try {
    const { courseId, title, description, type, fileUrl, isFree } = req.body;
    
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
    
    const material = await Material.create({
      course: courseId,
      tutor: req.user._id,
      title,
      description,
      type,
      fileUrl,
      isFree
    });
    
    res.status(201).json({
      success: true,
      material
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

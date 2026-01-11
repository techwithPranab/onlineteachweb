const User = require('../models/User.model');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');

// Configure multer for avatar uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/avatars/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname))
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Only image files are allowed'))
    }
  }
});

// @desc    Get current user
// @route   GET /api/users/me
// @access  Private
exports.getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('subscription')
      .populate('enrolledCourses', 'title thumbnail');
    
    res.json({
      success: true,
      user: user.getPublicProfile()
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update current user profile
// @route   PUT /api/users/me
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, bio, phone, subjects, qualifications, experience } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (phone) updateData.phone = phone;
    
    // Tutor specific fields
    if (req.user.role === 'tutor') {
      if (subjects) updateData.subjects = subjects;
      if (qualifications) updateData.qualifications = qualifications;
      if (experience !== undefined) updateData.experience = experience;
    }
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    );
    
    res.json({
      success: true,
      user: user.getPublicProfile(),
      message: 'Profile updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change user password
// @route   PUT /api/users/me/password
// @access  Private
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }
    
    const user = await User.findById(req.user._id).select('+password');
    
    // Check current password
    const isCurrentPasswordValid = await user.matchPassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update notification preferences
// @route   PUT /api/users/me/notifications
// @access  Private
exports.updateNotifications = async (req, res, next) => {
  try {
    const { notifications } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { notifications },
      { new: true, runValidators: true }
    );
    
    res.json({
      success: true,
      user: user.getPublicProfile(),
      message: 'Notification preferences updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload user avatar
// @route   POST /api/users/me/avatar
// @access  Private
exports.uploadAvatar = [
  upload.single('avatar'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }
      
      const avatarUrl = `/uploads/avatars/${req.file.filename}`;
      
      const user = await User.findByIdAndUpdate(
        req.user._id,
        { avatar: avatarUrl },
        { new: true, runValidators: true }
      );
      
      res.json({
        success: true,
        user: user.getPublicProfile(),
        avatarUrl,
        message: 'Avatar uploaded successfully'
      });
    } catch (error) {
      next(error);
    }
  }
];

// @desc    Delete user account
// @route   DELETE /api/users/me
// @access  Private
exports.deleteAccount = async (req, res, next) => {
  try {
    await User.findByIdAndDelete(req.user._id);
    
    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user
// @route   GET /api/users/me
// @access  Private
exports.getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('subscription')
      .populate('enrolledCourses', 'title thumbnail');
    
    res.json({
      success: true,
      user: user.getPublicProfile()
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-refreshTokens -verificationToken -resetPasswordToken')
      .populate('enrolledCourses', 'title thumbnail');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/users/:id
// @access  Private
exports.updateUser = async (req, res, next) => {
  try {
    // Check if user is updating their own profile
    if (req.params.id !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own profile'
      });
    }
    
    const { name, bio, avatar, subjects, phone, qualifications, experience } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (avatar) updateData.avatar = avatar;
    if (phone) updateData.phone = phone;
    
    // Tutor specific
    if (req.user.role === 'tutor') {
      if (subjects) updateData.subjects = subjects;
      if (qualifications) updateData.qualifications = qualifications;
      if (experience !== undefined) updateData.experience = experience;
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    res.json({
      success: true,
      user: user.getPublicProfile()
    });
  } catch (error) {
    next(error);
  }
};

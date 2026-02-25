const User = require('../models/User.model');
const { generateToken, generateRefreshToken, verifyRefreshToken } = require('../utils/tokenUtils');
const { sendPasswordResetEmail, sendPasswordResetConfirmation } = require('../utils/emailService');
const crypto = require('crypto');
const logger = require('../utils/logger');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role, grade, subjects } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered'
      });
    }
    
    // Create user
    const userData = {
      name,
      email,
      password,
      role: role || 'student'
    };
    
    if (role === 'student' && grade) {
      userData.grade = grade;
    }
    
    if (role === 'tutor' && subjects) {
      userData.subjects = subjects;
    }
    
    const user = await User.create(userData);

    // If student, assign default free subscription
    if (user.role === 'student') {
      const { SubscriptionPlan, Subscription } = require('../models/Subscription.model');

      // find or create free plan
      let freePlan = await SubscriptionPlan.findOne({ name: 'Free' });
      if (!freePlan) {
        freePlan = await SubscriptionPlan.create({
          name: 'Free',
          description: 'Free plan with limited features',
          price: 0,
          interval: 'month',
          features: [],
          allowedFeatures: [],
          limits: {},
          quality: {}
        });
      }

      // create subscription record
      const subscription = await Subscription.create({
        user: user._id,
        plan: freePlan._id,
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year free
        autoRenew: false
      });

      user.subscription = subscription._id;
      user.activeSubscription = subscription._id;
      await user.save();
    }

    // Generate tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    
    // Save refresh token
    user.refreshTokens.push({
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });
    await user.save();
    
    res.status(201).json({
      success: true,
      user: user.getPublicProfile(),
      token,
      refreshToken
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // Find user with password
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Check if account is active
    if (user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Account suspended. Please contact support.'
      });
    }
    
    if (user.status === 'inactive') {
      return res.status(403).json({
        success: false,
        message: 'Account inactive. Please contact support.'
      });
    }
    
    if (user.status === 'pending') {
      return res.status(403).json({
        success: false,
        message: 'Your account is pending approval. Please wait for admin approval before logging in.'
      });
    }
    
    // Generate tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    
    // Save refresh token
    user.refreshTokens.push({
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });
    user.lastLogin = new Date();
    await user.save();
    
    res.json({
      success: true,
      user: user.getPublicProfile(),
      token,
      refreshToken
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Refresh token
// @route   POST /api/auth/refresh
// @access  Public
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token required'
      });
    }
    
    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    
    // Find user and check if refresh token exists
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }
    
    const tokenExists = user.refreshTokens.find(
      t => t.token === refreshToken && t.expiresAt > new Date()
    );
    
    if (!tokenExists) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    }
    
    // Generate new access token
    const token = generateToken(user._id);
    
    res.json({
      success: true,
      token
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }
    next(error);
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    // Remove refresh token from user
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { refreshTokens: { token: refreshToken } }
    });
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot password - Send reset email
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }
    
    // Generate reset token
    const resetToken = user.getResetPasswordToken();
    
    // Save user with reset token and expiration
    await user.save({ validateBeforeSave: false });
    
    try {
      // Send email
      await sendPasswordResetEmail(user.email, resetToken, user.name);
      
      logger.info(`Password reset email sent to ${user.email}`);
      
      res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    } catch (emailError) {
      // If email fails, remove reset token from database
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      
      logger.error('Error sending password reset email:', emailError);
      
      return res.status(500).json({
        success: false,
        message: 'Email could not be sent. Please try again later.'
      });
    }
  } catch (error) {
    logger.error('Forgot password error:', error);
    next(error);
  }
};

// @desc    Reset password using token
// @route   POST /api/auth/reset-password/:token
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    const { password } = req.body;
    const { token } = req.params;
    
    // Validate password
    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }
    
    // Hash the token from URL to compare with database
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
    
    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    }).select('+password');
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token. Please request a new password reset.'
      });
    }
    
    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    
    await user.save();
    
    // Send confirmation email
    try {
      await sendPasswordResetConfirmation(user.email, user.name);
    } catch (emailError) {
      logger.error('Error sending password reset confirmation email:', emailError);
      // Continue even if confirmation email fails
    }
    
    // Generate new tokens
    const accessToken = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    
    // Save refresh token
    user.refreshTokens.push({
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });
    await user.save();
    
    logger.info(`Password reset successful for user ${user.email}`);
    
    res.json({
      success: true,
      message: 'Password reset successful! You can now log in with your new password.',
      user: user.getPublicProfile(),
      token: accessToken,
      refreshToken
    });
  } catch (error) {
    logger.error('Reset password error:', error);
    next(error);
  }
};

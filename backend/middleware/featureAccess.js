const featureAccessService = require('../services/featureAccess.service');
const logger = require('../utils/logger');

/**
 * Middleware factory to require a specific feature
 * Usage: requireFeature('courses.enroll')
 */
exports.requireFeature = (featureKey, options = {}) => {
  return async (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user || !req.user._id) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const userId = req.user._id;

      // Check feature access
      const access = await featureAccessService.checkAccess(userId, featureKey);

      if (!access.allowed) {
        // Log denied access
        await featureAccessService.logFeatureUsage(
          userId,
          featureKey,
          'denied',
          {
            reason: access.reason,
            endpoint: req.originalUrl,
            method: req.method
          }
        );

        return res.status(403).json({
          success: false,
          message: access.reason || 'Access denied',
          featureKey,
          upgradeRequired: access.upgradeRequired,
          currentPlan: access.currentPlan,
          limit: access.limit,
          current: access.current,
          resetDate: access.resetDate,
          error: 'FEATURE_ACCESS_DENIED'
        });
      }

      // Track usage if configured (default: true)
      if (options.trackUsage !== false) {
        await featureAccessService.incrementUsage(userId, featureKey);
      }

      // Attach feature access info to request
      req.featureAccess = access;

      next();
    } catch (error) {
      logger.error('Error in requireFeature middleware:', error);
      next(error);
    }
  };
};

/**
 * Middleware to check if user needs at least one of multiple features
 * Usage: requireAnyFeature(['courses.enroll', 'courses.premium'])
 */
exports.requireAnyFeature = (featureKeys = []) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const userId = req.user._id;
      let hasAccess = false;
      let allowedFeature = null;

      // Check each feature
      for (const featureKey of featureKeys) {
        const access = await featureAccessService.checkAccess(userId, featureKey);
        if (access.allowed) {
          hasAccess = true;
          allowedFeature = featureKey;
          req.featureAccess = access;
          break;
        }
      }

      if (!hasAccess) {
        await featureAccessService.logFeatureUsage(
          userId,
          featureKeys.join(','),
          'denied',
          {
            reason: 'None of the required features available',
            requiredFeatures: featureKeys,
            endpoint: req.originalUrl
          }
        );

        return res.status(403).json({
          success: false,
          message: 'You need an upgraded plan to access this feature',
          requiredFeatures: featureKeys,
          upgradeRequired: true,
          error: 'FEATURE_ACCESS_DENIED'
        });
      }

      // Track usage of the feature that granted access
      await featureAccessService.incrementUsage(userId, allowedFeature);

      next();
    } catch (error) {
      logger.error('Error in requireAnyFeature middleware:', error);
      next(error);
    }
  };
};

/**
 * Middleware to attach all user's features to request
 * Useful for endpoints that need to check multiple features
 */
exports.attachUserFeatures = async (req, res, next) => {
  try {
    if (req.user && req.user._id) {
      req.userFeatures = await featureAccessService.getUserFeatures(req.user._id);
    }
    next();
  } catch (error) {
    logger.error('Error in attachUserFeatures middleware:', error);
    // Don't fail the request if feature attachment fails
    next();
  }
};

/**
 * Middleware to check feature with custom limit logic
 * Usage: checkFeatureLimit('quiz.take', { period: 'daily', limit: 10 })
 */
exports.checkFeatureLimit = (featureKey, limitConfig = {}) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const userId = req.user._id;
      const access = await featureAccessService.checkAccess(userId, featureKey);

      if (!access.allowed) {
        // If limit exceeded, provide detailed info
        if (access.limit !== undefined) {
          return res.status(429).json({
            success: false,
            message: access.reason || 'Usage limit exceeded',
            featureKey,
            limit: access.limit,
            current: access.current,
            resetDate: access.resetDate,
            error: 'FEATURE_LIMIT_EXCEEDED'
          });
        }

        // Otherwise, feature not in plan
        return res.status(403).json({
          success: false,
          message: access.reason || 'Feature not available',
          featureKey,
          upgradeRequired: access.upgradeRequired,
          error: 'FEATURE_ACCESS_DENIED'
        });
      }

      // Attach remaining quota to request
      req.featureLimit = {
        limit: access.limit,
        remaining: access.remaining,
        unlimited: access.unlimited
      };

      next();
    } catch (error) {
      logger.error('Error in checkFeatureLimit middleware:', error);
      next(error);
    }
  };
};

/**
 * Middleware to check if user has an active subscription
 */
exports.requireActiveSubscription = async (req, res, next) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const User = require('../models/User.model');
    const user = await User.findById(req.user._id).populate({
      path: 'activeSubscription',
      populate: { path: 'plan' }
    });

    if (!user.activeSubscription || user.activeSubscription.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Active subscription required',
        upgradeRequired: true,
        error: 'NO_ACTIVE_SUBSCRIPTION'
      });
    }

    // Check if subscription has expired
    if (user.activeSubscription.endDate && 
        new Date() > new Date(user.activeSubscription.endDate)) {
      return res.status(403).json({
        success: false,
        message: 'Subscription has expired',
        upgradeRequired: true,
        error: 'SUBSCRIPTION_EXPIRED'
      });
    }

    req.subscription = user.activeSubscription;
    next();
  } catch (error) {
    logger.error('Error in requireActiveSubscription middleware:', error);
    next(error);
  }
};

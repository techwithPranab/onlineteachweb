const featureAccessService = require('../services/featureAccess.service');
const User = require('../models/User.model');
const logger = require('../utils/logger');

// @desc    Get current user's accessible features
// @route   GET /api/users/me/features
// @access  Private
exports.getMyFeatures = async (req, res, next) => {
  try {
    const data = await featureAccessService.getUserFeatures(req.user._id);

    res.json({
      success: true,
      ...data
    });
  } catch (error) {
    logger.error('Error getting user features:', error);
    next(error);
  }
};

// @desc    Check access to specific feature
// @route   GET /api/users/me/features/:featureKey/check
// @access  Private
exports.checkFeatureAccess = async (req, res, next) => {
  try {
    const { featureKey } = req.params;
    const access = await featureAccessService.checkAccess(req.user._id, featureKey);

    res.json({
      success: true,
      feature: featureKey,
      ...access
    });
  } catch (error) {
    logger.error('Error checking feature access:', error);
    next(error);
  }
};

// @desc    Get feature usage stats for current user
// @route   GET /api/users/me/features/usage
// @access  Private
exports.getFeatureUsage = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'activeSubscription',
      populate: { path: 'plan' }
    });

    if (!user.activeSubscription) {
      return res.json({
        success: true,
        usage: [],
        plan: null,
        hasActiveSubscription: false
      });
    }

    const plan = user.activeSubscription.plan;
    
    // Build usage array with feature details
    const usage = (user.featureUsage || []).map(u => {
      const planFeature = plan.allowedFeatures?.find(
        f => f.featureKey === u.featureKey
      );

      return {
        feature: u.featureKey,
        featureName: u.featureKey.split('.').pop().replace('_', ' '),
        count: u.usageCount || 0,
        limit: planFeature?.limit || -1,
        unlimited: planFeature?.limit === -1,
        lastUsed: u.lastUsed,
        resetDate: u.periodEnd,
        percentUsed: planFeature?.limit && planFeature.limit !== -1
          ? Math.round((u.usageCount / planFeature.limit) * 100)
          : 0
      };
    });

    res.json({
      success: true,
      usage,
      plan: {
        id: plan._id,
        name: plan.name,
        featuresCount: plan.allowedFeatures?.length || 0
      },
      hasActiveSubscription: true
    });
  } catch (error) {
    logger.error('Error getting feature usage:', error);
    next(error);
  }
};

// @desc    Get usage for specific feature
// @route   GET /api/users/me/features/:featureKey/usage
// @access  Private
exports.getSpecificFeatureUsage = async (req, res, next) => {
  try {
    const { featureKey } = req.params;
    const usage = await featureAccessService.getFeatureUsage(
      req.user._id,
      featureKey
    );

    // Get feature limit from plan
    const user = await User.findById(req.user._id).populate({
      path: 'activeSubscription',
      populate: { path: 'plan' }
    });

    let limit = -1;
    if (user.activeSubscription?.plan) {
      const planFeature = user.activeSubscription.plan.allowedFeatures?.find(
        f => f.featureKey === featureKey
      );
      limit = planFeature?.limit || -1;
    }

    res.json({
      success: true,
      feature: featureKey,
      count: usage.count,
      limit,
      unlimited: limit === -1,
      remaining: limit === -1 ? null : Math.max(0, limit - usage.count),
      resetDate: usage.resetDate,
      percentUsed: limit && limit !== -1
        ? Math.round((usage.count / limit) * 100)
        : 0
    });
  } catch (error) {
    logger.error('Error getting specific feature usage:', error);
    next(error);
  }
};

// @desc    Get user's subscription with feature details
// @route   GET /api/users/me/subscription/features
// @access  Private
exports.getSubscriptionFeatures = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'activeSubscription',
      populate: { path: 'plan' }
    });

    if (!user.activeSubscription) {
      return res.json({
        success: true,
        hasSubscription: false,
        message: 'No active subscription'
      });
    }

    const subscription = user.activeSubscription;
    const plan = subscription.plan;

    // Organize features by category
    const featuresByCategory = {};
    
    for (const planFeature of plan.allowedFeatures || []) {
      const category = planFeature.featureKey.split('.')[0];
      
      if (!featuresByCategory[category]) {
        featuresByCategory[category] = [];
      }

      // Check current access
      const access = await featureAccessService.checkAccess(
        req.user._id,
        planFeature.featureKey
      );

      featuresByCategory[category].push({
        key: planFeature.featureKey,
        name: planFeature.featureKey.split('.').pop().replace('_', ' '),
        enabled: planFeature.enabled,
        limit: planFeature.limit,
        ...access
      });
    }

    res.json({
      success: true,
      hasSubscription: true,
      subscription: {
        id: subscription._id,
        status: subscription.status,
        startDate: subscription.startDate,
        endDate: subscription.endDate
      },
      plan: {
        id: plan._id,
        name: plan.name,
        description: plan.description,
        price: plan.price,
        currency: plan.currency,
        limits: plan.limits,
        quality: plan.quality
      },
      features: featuresByCategory
    });
  } catch (error) {
    logger.error('Error getting subscription features:', error);
    next(error);
  }
};

// @desc    Get feature restrictions for current user
// @route   GET /api/users/me/features/restrictions
// @access  Private
exports.getMyRestrictions = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('restrictedFeatures.restrictedBy', 'name email');

    const restrictions = (user.restrictedFeatures || []).map(r => ({
      featureKey: r.featureKey,
      reason: r.reason,
      restrictedAt: r.restrictedAt,
      restrictedBy: r.restrictedBy ? {
        id: r.restrictedBy._id,
        name: r.restrictedBy.name,
        email: r.restrictedBy.email
      } : null
    }));

    res.json({
      success: true,
      count: restrictions.length,
      restrictions
    });
  } catch (error) {
    logger.error('Error getting restrictions:', error);
    next(error);
  }
};

const featureDefinitionService = require('../services/featureDefinition.service');
const { SubscriptionPlan } = require('../models/Subscription.model');
const logger = require('../utils/logger');

// @desc    Get all feature definitions
// @route   GET /api/admin/features
// @access  Private (Admin)
exports.getAllFeatures = async (req, res, next) => {
  try {
    const { category, isActive } = req.query;
    
    const filters = {};
    if (category) filters.category = category;
    if (isActive !== undefined) filters.isActive = isActive === 'true';

    const features = await featureDefinitionService.getAllFeatures(filters);

    res.json({
      success: true,
      count: features.length,
      features
    });
  } catch (error) {
    logger.error('Error getting features:', error);
    next(error);
  }
};

// @desc    Get features by category
// @route   GET /api/admin/features/category/:category
// @access  Private (Admin)
exports.getFeaturesByCategory = async (req, res, next) => {
  try {
    const { category } = req.params;
    const features = await featureDefinitionService.getFeaturesByCategory(category);

    res.json({
      success: true,
      category,
      count: features.length,
      features
    });
  } catch (error) {
    logger.error('Error getting features by category:', error);
    next(error);
  }
};

// @desc    Get single feature definition
// @route   GET /api/admin/features/:key
// @access  Private (Admin)
exports.getFeature = async (req, res, next) => {
  try {
    const { key } = req.params;
    const feature = await featureDefinitionService.getFeatureByKey(key);

    if (!feature) {
      return res.status(404).json({
        success: false,
        message: 'Feature not found'
      });
    }

    res.json({
      success: true,
      feature
    });
  } catch (error) {
    logger.error('Error getting feature:', error);
    next(error);
  }
};

// @desc    Create feature definition
// @route   POST /api/admin/features
// @access  Private (Admin)
exports.createFeature = async (req, res, next) => {
  try {
    const feature = await featureDefinitionService.createFeature(req.body);

    res.status(201).json({
      success: true,
      message: 'Feature created successfully',
      feature
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Feature with this key already exists'
      });
    }
    logger.error('Error creating feature:', error);
    next(error);
  }
};

// @desc    Update feature definition
// @route   PUT /api/admin/features/:key
// @access  Private (Admin)
exports.updateFeature = async (req, res, next) => {
  try {
    const { key } = req.params;
    const feature = await featureDefinitionService.updateFeature(key, req.body);

    if (!feature) {
      return res.status(404).json({
        success: false,
        message: 'Feature not found'
      });
    }

    res.json({
      success: true,
      message: 'Feature updated successfully',
      feature
    });
  } catch (error) {
    logger.error('Error updating feature:', error);
    next(error);
  }
};

// @desc    Delete feature definition
// @route   DELETE /api/admin/features/:key
// @access  Private (Admin)
exports.deleteFeature = async (req, res, next) => {
  try {
    const { key } = req.params;
    const feature = await featureDefinitionService.deleteFeature(key);

    if (!feature) {
      return res.status(404).json({
        success: false,
        message: 'Feature not found'
      });
    }

    res.json({
      success: true,
      message: 'Feature deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting feature:', error);
    next(error);
  }
};

// @desc    Update subscription plan features
// @route   PUT /api/admin/subscription-plans/:id/features
// @access  Private (Admin)
exports.updatePlanFeatures = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { allowedFeatures, limits, quality } = req.body;

    const plan = await SubscriptionPlan.findById(id);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Subscription plan not found'
      });
    }

    // Update allowed features
    if (allowedFeatures !== undefined) {
      plan.allowedFeatures = allowedFeatures;
    }

    // Update limits
    if (limits !== undefined) {
      plan.limits = { ...plan.limits, ...limits };
    }

    // Update quality settings
    if (quality !== undefined) {
      plan.quality = { ...plan.quality, ...quality };
    }

    await plan.save();

    res.json({
      success: true,
      message: 'Plan features updated successfully',
      plan
    });
  } catch (error) {
    logger.error('Error updating plan features:', error);
    next(error);
  }
};

// @desc    Get plan features comparison
// @route   GET /api/admin/subscription-plans/features/compare
// @access  Private (Admin)
exports.comparePlanFeatures = async (req, res, next) => {
  try {
    // Get all active plans
    const plans = await SubscriptionPlan.find({ isActive: true })
      .sort({ priority: 1 });

    // Get all active features
    const allFeatures = await featureDefinitionService.getAllFeatures({ 
      isActive: true 
    });

    // Build comparison matrix
    const comparison = {
      features: allFeatures,
      plans: plans.map(plan => ({
        id: plan._id,
        name: plan.name,
        description: plan.description,
        price: plan.price,
        currency: plan.currency,
        interval: plan.interval,
        priority: plan.priority,
        allowedFeatures: plan.allowedFeatures || [],
        limits: plan.limits || {},
        quality: plan.quality || {}
      }))
    };

    res.json({
      success: true,
      comparison
    });
  } catch (error) {
    logger.error('Error comparing plan features:', error);
    next(error);
  }
};

// @desc    Seed default features
// @route   POST /api/admin/features/seed
// @access  Private (Admin)
exports.seedFeatures = async (req, res, next) => {
  try {
    await featureDefinitionService.seedDefaultFeatures();

    res.json({
      success: true,
      message: 'Default features seeded successfully'
    });
  } catch (error) {
    logger.error('Error seeding features:', error);
    next(error);
  }
};

// @desc    Bulk update plan features (set features for multiple plans at once)
// @route   POST /api/admin/subscription-plans/features/bulk-update
// @access  Private (Admin)
exports.bulkUpdatePlanFeatures = async (req, res, next) => {
  try {
    const { updates } = req.body; // Array of { planId, allowedFeatures, limits, quality }

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Updates array is required'
      });
    }

    const results = [];

    for (const update of updates) {
      const { planId, allowedFeatures, limits, quality } = update;
      
      const plan = await SubscriptionPlan.findById(planId);
      if (!plan) {
        results.push({
          planId,
          success: false,
          message: 'Plan not found'
        });
        continue;
      }

      if (allowedFeatures !== undefined) plan.allowedFeatures = allowedFeatures;
      if (limits !== undefined) plan.limits = { ...plan.limits, ...limits };
      if (quality !== undefined) plan.quality = { ...plan.quality, ...quality };

      await plan.save();

      results.push({
        planId,
        success: true,
        message: 'Plan updated successfully'
      });
    }

    res.json({
      success: true,
      message: 'Bulk update completed',
      results
    });
  } catch (error) {
    logger.error('Error in bulk update:', error);
    next(error);
  }
};

// @desc    Get feature usage analytics
// @route   GET /api/admin/features/analytics
// @access  Private (Admin)
exports.getFeatureAnalytics = async (req, res, next) => {
  try {
    const { featureKey, startDate, endDate } = req.query;
    
    const featureAccessService = require('../services/featureAccess.service');
    
    const analytics = await featureAccessService.getFeatureAnalytics(
      featureKey,
      startDate ? new Date(startDate) : null,
      endDate ? new Date(endDate) : null
    );

    res.json({
      success: true,
      analytics
    });
  } catch (error) {
    logger.error('Error getting feature analytics:', error);
    next(error);
  }
};

const User = require('../models/User.model');
const { Subscription } = require('../models/Subscription.model');
const FeatureUsageLog = require('../models/FeatureUsageLog.model');
const logger = require('../utils/logger');

class FeatureAccessService {
  /**
   * Check if user has access to a feature
   * @param {string} userId - User ID
   * @param {string} featureKey - Feature key (e.g., 'courses.enroll')
   * @returns {Object} Access result with allowed, reason, limit, remaining
   */
  async checkAccess(userId, featureKey) {
    try {
      // Get user with subscription
      const user = await User.findById(userId).populate({
        path: 'activeSubscription',
        populate: { path: 'plan' }
      });

      if (!user) {
        return {
          allowed: false,
          reason: 'User not found',
          upgradeRequired: false
        };
      }

      // Check if user has active subscription
      if (!user.activeSubscription) {
        return {
          allowed: false,
          reason: 'No active subscription',
          upgradeRequired: true,
          currentPlan: null
        };
      }

      const subscription = user.activeSubscription;

      // Check subscription status
      if (subscription.status !== 'active') {
        return {
          allowed: false,
          reason: `Subscription is ${subscription.status}`,
          upgradeRequired: true,
          currentPlan: subscription.plan?.name
        };
      }

      // Check if subscription has expired
      if (subscription.endDate && new Date() > new Date(subscription.endDate)) {
        return {
          allowed: false,
          reason: 'Subscription has expired',
          upgradeRequired: true,
          currentPlan: subscription.plan?.name
        };
      }

      const plan = subscription.plan;
      if (!plan) {
        return {
          allowed: false,
          reason: 'Subscription plan not found',
          upgradeRequired: true
        };
      }

      // Find feature in plan's allowed features
      const planFeature = plan.allowedFeatures?.find(
        f => f.featureKey === featureKey
      );

      // Feature not in plan or not enabled
      if (!planFeature || !planFeature.enabled) {
        return {
          allowed: false,
          reason: 'Feature not included in your plan',
          upgradeRequired: true,
          currentPlan: plan.name,
          featureKey
        };
      }

      // Check manual restrictions
      const restricted = user.restrictedFeatures?.find(
        r => r.featureKey === featureKey
      );
      if (restricted) {
        return {
          allowed: false,
          reason: restricted.reason || 'Feature has been restricted',
          upgradeRequired: false,
          restrictedAt: restricted.restrictedAt,
          restrictedBy: restricted.restrictedBy
        };
      }

      // Check usage limits
      if (planFeature.limit !== undefined && planFeature.limit !== -1) {
        const usage = await this.getFeatureUsage(userId, featureKey);
        
        if (usage.count >= planFeature.limit) {
          return {
            allowed: false,
            reason: 'Usage limit reached for this period',
            upgradeRequired: true,
            limit: planFeature.limit,
            current: usage.count,
            resetDate: usage.resetDate
          };
        }

        // Feature allowed with remaining quota
        return {
          allowed: true,
          limit: planFeature.limit,
          remaining: planFeature.limit - usage.count,
          resetDate: usage.resetDate
        };
      }

      // Feature allowed without limits
      return {
        allowed: true,
        unlimited: true
      };

    } catch (error) {
      logger.error('Error checking feature access:', error);
      throw error;
    }
  }

  /**
   * Get user's feature usage for specific feature
   * @param {string} userId - User ID
   * @param {string} featureKey - Feature key
   * @returns {Object} Usage count and reset date
   */
  async getFeatureUsage(userId, featureKey) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return { count: 0, resetDate: null };
      }

      const usage = user.featureUsage?.find(u => u.featureKey === featureKey);

      if (!usage) {
        return { count: 0, resetDate: null };
      }

      // Check if period has expired (monthly reset)
      if (usage.periodEnd && new Date() > new Date(usage.periodEnd)) {
        // Reset usage
        const usageIndex = user.featureUsage.findIndex(
          u => u.featureKey === featureKey
        );
        user.featureUsage[usageIndex].usageCount = 0;
        user.featureUsage[usageIndex].periodStart = new Date();
        user.featureUsage[usageIndex].periodEnd = this.getNextPeriodEnd();
        await user.save();

        return {
          count: 0,
          resetDate: user.featureUsage[usageIndex].periodEnd
        };
      }

      return {
        count: usage.usageCount || 0,
        resetDate: usage.periodEnd
      };
    } catch (error) {
      logger.error('Error getting feature usage:', error);
      throw error;
    }
  }

  /**
   * Increment feature usage
   * @param {string} userId - User ID
   * @param {string} featureKey - Feature key
   */
  async incrementUsage(userId, featureKey) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const usageIndex = user.featureUsage?.findIndex(
        u => u.featureKey === featureKey
      );

      if (usageIndex === -1 || usageIndex === undefined) {
        // Create new usage entry
        if (!user.featureUsage) {
          user.featureUsage = [];
        }
        user.featureUsage.push({
          featureKey,
          usageCount: 1,
          lastUsed: new Date(),
          periodStart: new Date(),
          periodEnd: this.getNextPeriodEnd()
        });
      } else {
        // Increment existing usage
        user.featureUsage[usageIndex].usageCount += 1;
        user.featureUsage[usageIndex].lastUsed = new Date();
      }

      await user.save();

      // Log usage
      await this.logFeatureUsage(userId, featureKey, 'accessed');
    } catch (error) {
      logger.error('Error incrementing feature usage:', error);
      throw error;
    }
  }

  /**
   * Log feature access attempt
   * @param {string} userId - User ID
   * @param {string} featureKey - Feature key
   * @param {string} action - Action type (accessed, denied, limited)
   * @param {Object} metadata - Additional metadata
   */
  async logFeatureUsage(userId, featureKey, action, metadata = {}) {
    try {
      const user = await User.findById(userId).populate('activeSubscription');
      
      await FeatureUsageLog.create({
        user: userId,
        feature: featureKey,
        action,
        subscription: user.activeSubscription?._id,
        metadata,
        timestamp: new Date()
      });
    } catch (error) {
      logger.error('Error logging feature usage:', error);
      // Don't throw - logging failures shouldn't break feature access
    }
  }

  /**
   * Get all accessible features for a user
   * @param {string} userId - User ID
   * @returns {Object} Features map and plan info
   */
  async getUserFeatures(userId) {
    try {
      const user = await User.findById(userId).populate({
        path: 'activeSubscription',
        populate: { path: 'plan' }
      });

      if (!user || !user.activeSubscription) {
        return {
          features: {},
          plan: null,
          hasActiveSubscription: false
        };
      }

      const plan = user.activeSubscription.plan;
      const features = {};

      // Check each feature in the plan
      for (const planFeature of plan.allowedFeatures || []) {
        if (planFeature.enabled) {
          const access = await this.checkAccess(userId, planFeature.featureKey);
          features[planFeature.featureKey] = {
            enabled: planFeature.enabled,
            limit: planFeature.limit,
            ...access
          };
        }
      }

      return {
        features,
        plan: {
          id: plan._id,
          name: plan.name,
          tier: plan.priority
        },
        hasActiveSubscription: true
      };
    } catch (error) {
      logger.error('Error getting user features:', error);
      throw error;
    }
  }

  /**
   * Calculate next period end date (monthly)
   * @returns {Date} Next month's start date
   */
  getNextPeriodEnd() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 1);
  }

  /**
   * Restrict a feature for a specific user (admin action)
   * @param {string} userId - User ID
   * @param {string} featureKey - Feature key
   * @param {string} reason - Restriction reason
   * @param {string} adminId - Admin who restricted
   */
  async restrictFeature(userId, featureKey, reason, adminId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Check if already restricted
      const existingRestriction = user.restrictedFeatures?.find(
        r => r.featureKey === featureKey
      );

      if (existingRestriction) {
        throw new Error('Feature already restricted for this user');
      }

      if (!user.restrictedFeatures) {
        user.restrictedFeatures = [];
      }

      user.restrictedFeatures.push({
        featureKey,
        reason,
        restrictedAt: new Date(),
        restrictedBy: adminId
      });

      await user.save();

      // Log the restriction
      await this.logFeatureUsage(userId, featureKey, 'restricted', {
        reason,
        restrictedBy: adminId
      });

      return user;
    } catch (error) {
      logger.error('Error restricting feature:', error);
      throw error;
    }
  }

  /**
   * Remove feature restriction
   * @param {string} userId - User ID
   * @param {string} featureKey - Feature key
   */
  async unrestrictFeature(userId, featureKey) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      user.restrictedFeatures = user.restrictedFeatures?.filter(
        r => r.featureKey !== featureKey
      ) || [];

      await user.save();
      return user;
    } catch (error) {
      logger.error('Error unrestricting feature:', error);
      throw error;
    }
  }

  /**
   * Get feature usage statistics for analytics
   * @param {string} featureKey - Feature key (optional)
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   */
  async getFeatureAnalytics(featureKey = null, startDate = null, endDate = null) {
    try {
      const query = {};
      
      if (featureKey) {
        query.feature = featureKey;
      }

      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = startDate;
        if (endDate) query.timestamp.$lte = endDate;
      }

      const logs = await FeatureUsageLog.find(query)
        .populate('user', 'name email role')
        .populate('subscription', 'plan')
        .sort({ timestamp: -1 });

      // Aggregate statistics
      const stats = {
        totalAccess: logs.filter(l => l.action === 'accessed').length,
        totalDenied: logs.filter(l => l.action === 'denied').length,
        totalLimited: logs.filter(l => l.action === 'limited').length,
        byFeature: {},
        byUser: {},
        byAction: {
          accessed: 0,
          denied: 0,
          limited: 0
        }
      };

      logs.forEach(log => {
        // By feature
        if (!stats.byFeature[log.feature]) {
          stats.byFeature[log.feature] = { accessed: 0, denied: 0, limited: 0 };
        }
        stats.byFeature[log.feature][log.action]++;

        // By user
        const userId = log.user?._id?.toString();
        if (userId) {
          if (!stats.byUser[userId]) {
            stats.byUser[userId] = {
              name: log.user.name,
              email: log.user.email,
              accessed: 0,
              denied: 0,
              limited: 0
            };
          }
          stats.byUser[userId][log.action]++;
        }

        // By action
        stats.byAction[log.action]++;
      });

      return stats;
    } catch (error) {
      logger.error('Error getting feature analytics:', error);
      throw error;
    }
  }
}

module.exports = new FeatureAccessService();

import api from './api';

/**
 * Feature Service - Student/User feature access APIs
 * Provides methods to check feature access, get usage statistics, and query permissions
 */

class FeatureService {
  /**
   * Get all features accessible to the current user
   * @returns {Promise} - { features, plan, subscription }
   */
  async getMyFeatures() {
    try {
      const response = await api.get('/users/me/features');
      return response.data;
    } catch (error) {
      console.error('Error fetching user features:', error);
      throw error;
    }
  }

  /**
   * Check if current user has access to a specific feature
   * @param {string} featureKey - Feature key to check (e.g., 'courses.enroll')
   * @returns {Promise} - { allowed, reason, limit, remaining, upgradeRequired }
   */
  async checkFeatureAccess(featureKey) {
    try {
      const response = await api.get(`/users/me/features/${featureKey}/check`);
      return response.data;
    } catch (error) {
      console.error(`Error checking feature access for ${featureKey}:`, error);
      throw error;
    }
  }

  /**
   * Get usage statistics for all features
   * @returns {Promise} - Array of { featureKey, featureName, usageCount, limit, percentage, remaining, resetDate }
   */
  async getFeatureUsage() {
    try {
      const response = await api.get('/users/me/features/usage');
      return response.data;
    } catch (error) {
      console.error('Error fetching feature usage:', error);
      throw error;
    }
  }

  /**
   * Get usage statistics for a specific feature
   * @param {string} featureKey - Feature key (e.g., 'courses.enroll')
   * @returns {Promise} - { featureKey, featureName, usageCount, limit, percentage, remaining, resetDate }
   */
  async getSpecificFeatureUsage(featureKey) {
    try {
      const response = await api.get(`/users/me/features/${featureKey}/usage`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching usage for ${featureKey}:`, error);
      throw error;
    }
  }

  /**
   * Get features organized by category with subscription details
   * @returns {Promise} - { plan, features: { category: [features] }, subscription }
   */
  async getSubscriptionFeatures() {
    try {
      const response = await api.get('/users/me/subscription/features');
      return response.data;
    } catch (error) {
      console.error('Error fetching subscription features:', error);
      throw error;
    }
  }

  /**
   * Get list of manually restricted features for current user
   * @returns {Promise} - Array of { featureKey, featureName, reason, restrictedAt, restrictedBy }
   */
  async getMyRestrictions() {
    try {
      const response = await api.get('/users/me/features/restrictions');
      return response.data;
    } catch (error) {
      console.error('Error fetching feature restrictions:', error);
      throw error;
    }
  }

  /**
   * Check multiple features at once
   * @param {string[]} featureKeys - Array of feature keys to check
   * @returns {Promise} - Object with featureKey as key and access result as value
   */
  async checkMultipleFeatures(featureKeys) {
    try {
      const results = {};
      await Promise.all(
        featureKeys.map(async (key) => {
          try {
            const result = await this.checkFeatureAccess(key);
            results[key] = result;
          } catch (error) {
            results[key] = { allowed: false, reason: 'Error checking feature', error };
          }
        })
      );
      return results;
    } catch (error) {
      console.error('Error checking multiple features:', error);
      throw error;
    }
  }

  /**
   * Helper to check if user has any of the specified features
   * @param {string[]} featureKeys - Array of feature keys
   * @returns {Promise<boolean>} - True if user has at least one feature
   */
  async hasAnyFeature(featureKeys) {
    try {
      const results = await this.checkMultipleFeatures(featureKeys);
      return Object.values(results).some(result => result.allowed);
    } catch (error) {
      console.error('Error checking any feature:', error);
      return false;
    }
  }

  /**
   * Helper to check if user has all of the specified features
   * @param {string[]} featureKeys - Array of feature keys
   * @returns {Promise<boolean>} - True if user has all features
   */
  async hasAllFeatures(featureKeys) {
    try {
      const results = await this.checkMultipleFeatures(featureKeys);
      return Object.values(results).every(result => result.allowed);
    } catch (error) {
      console.error('Error checking all features:', error);
      return false;
    }
  }

  /**
   * Get features that require upgrade (restricted or limited)
   * @returns {Promise} - Array of features that need upgrade
   */
  async getFeaturesRequiringUpgrade() {
    try {
      const [myFeatures, restrictions, usage] = await Promise.all([
        this.getMyFeatures(),
        this.getMyRestrictions(),
        this.getFeatureUsage()
      ]);

      const upgradableFeatures = [];

      // Add restricted features
      restrictions.data?.forEach(restriction => {
        upgradableFeatures.push({
          ...restriction,
          type: 'restricted',
          reason: restriction.reason
        });
      });

      // Add features with exceeded limits
      usage.data?.forEach(item => {
        if (item.percentage >= 100) {
          upgradableFeatures.push({
            featureKey: item.featureKey,
            featureName: item.featureName,
            type: 'limit_exceeded',
            reason: `You've used all ${item.limit} ${item.featureName.toLowerCase()} this month`
          });
        }
      });

      return upgradableFeatures;
    } catch (error) {
      console.error('Error getting features requiring upgrade:', error);
      throw error;
    }
  }
}

export default new FeatureService();

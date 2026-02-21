import api from './api';

/**
 * Admin Feature Service - Admin feature management APIs
 * Provides methods for feature CRUD, plan configuration, and analytics
 */

class AdminFeatureService {
  /**
   * Get all feature definitions
   * @param {Object} filters - Optional filters { category, isActive, applicableRoles }
   * @returns {Promise} - Array of feature definitions
   */
  async getAllFeatures(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.isActive !== undefined) params.append('isActive', filters.isActive);
      if (filters.applicableRoles) params.append('applicableRoles', filters.applicableRoles);

      const response = await api.get(`/admin/features?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching all features:', error);
      throw error;
    }
  }

  /**
   * Get features by category
   * @param {string} category - Feature category (e.g., 'courses', 'live_sessions')
   * @returns {Promise} - Array of features in category
   */
  async getFeaturesByCategory(category) {
    try {
      const response = await api.get(`/admin/features/category/${category}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching features for category ${category}:`, error);
      throw error;
    }
  }

  /**
   * Get a single feature by key
   * @param {string} key - Feature key (e.g., 'courses.enroll')
   * @returns {Promise} - Feature definition
   */
  async getFeature(key) {
    try {
      const response = await api.get(`/admin/features/${key}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching feature ${key}:`, error);
      throw error;
    }
  }

  /**
   * Create a new feature
   * @param {Object} featureData - Feature definition data
   * @returns {Promise} - Created feature
   */
  async createFeature(featureData) {
    try {
      const response = await api.post('/admin/features', featureData);
      return response.data;
    } catch (error) {
      console.error('Error creating feature:', error);
      throw error;
    }
  }

  /**
   * Update an existing feature
   * @param {string} key - Feature key
   * @param {Object} updates - Updated feature data
   * @returns {Promise} - Updated feature
   */
  async updateFeature(key, updates) {
    try {
      const response = await api.put(`/admin/features/${key}`, updates);
      return response.data;
    } catch (error) {
      console.error(`Error updating feature ${key}:`, error);
      throw error;
    }
  }

  /**
   * Delete a feature
   * @param {string} key - Feature key
   * @returns {Promise} - Success message
   */
  async deleteFeature(key) {
    try {
      const response = await api.delete(`/admin/features/${key}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting feature ${key}:`, error);
      throw error;
    }
  }

  /**
   * Seed default features into database
   * @returns {Promise} - Seed result with counts
   */
  async seedFeatures() {
    try {
      const response = await api.post('/admin/features/seed');
      return response.data;
    } catch (error) {
      console.error('Error seeding features:', error);
      throw error;
    }
  }

  /**
   * Update features for a subscription plan
   * @param {string} planId - Subscription plan ID
   * @param {Object} planData - { allowedFeatures: [...], limits: {...}, quality: {...} }
   * @returns {Promise} - Updated plan
   */
  async updatePlanFeatures(planId, planData) {
    try {
      const response = await api.put(`/admin/subscription-plans/${planId}/features`, planData);
      return response.data;
    } catch (error) {
      console.error(`Error updating plan features for ${planId}:`, error);
      throw error;
    }
  }

  /**
   * Get feature comparison across all subscription plans
   * @returns {Promise} - Comparison matrix with all plans and features
   */
  async comparePlanFeatures() {
    try {
      const response = await api.get('/admin/subscription-plans/features/compare');
      return response.data;
    } catch (error) {
      console.error('Error comparing plan features:', error);
      throw error;
    }
  }

  /**
   * Bulk update features for multiple plans
   * @param {Array} updates - Array of { planId, allowedFeatures, limits, quality }
   * @returns {Promise} - Array of updated plans
   */
  async bulkUpdatePlanFeatures(updates) {
    try {
      const response = await api.post('/admin/subscription-plans/features/bulk-update', { updates });
      return response.data;
    } catch (error) {
      console.error('Error bulk updating plan features:', error);
      throw error;
    }
  }

  /**
   * Get feature usage analytics
   * @param {string} featureKey - Optional feature key to filter
   * @param {Date} startDate - Optional start date
   * @param {Date} endDate - Optional end date
   * @returns {Promise} - Analytics data with usage counts
   */
  async getFeatureAnalytics(featureKey = null, startDate = null, endDate = null) {
    try {
      const params = new URLSearchParams();
      if (featureKey) params.append('featureKey', featureKey);
      if (startDate) params.append('startDate', startDate.toISOString());
      if (endDate) params.append('endDate', endDate.toISOString());

      const response = await api.get(`/admin/features/analytics?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching feature analytics:', error);
      throw error;
    }
  }

  /**
   * Get all feature categories
   * @returns {Array} - List of available categories
   */
  getCategories() {
    return [
      { value: 'courses', label: 'Course Access', icon: '📚' },
      { value: 'live_sessions', label: 'Live Sessions', icon: '🎥' },
      { value: 'quiz', label: 'Quizzes & Assessments', icon: '📝' },
      { value: 'interactive', label: 'Interactive Features', icon: '🎨' },
      { value: 'content', label: 'Content Access', icon: '📄' },
      { value: 'support', label: 'Support & Help', icon: '🆘' },
      { value: 'analytics', label: 'Analytics & Reports', icon: '📊' },
      { value: 'communication', label: 'Communication', icon: '💬' }
    ];
  }

  /**
   * Helper to format plan comparison data for UI table
   * @param {Object} comparisonData - Raw comparison data from API
   * @returns {Object} - Formatted data ready for rendering
   */
  formatComparisonForTable(comparisonData) {
    // Support multiple response shapes:
    // - { data: { plans, features } }
    // - { comparison: { plans, features } }
    // - { plans, features }
    const payload = (comparisonData && (comparisonData.data || comparisonData.comparison)) || comparisonData || {};
    const plans = payload.plans || [];
    const features = payload.features || [];

    // Group features by category
    const featuresByCategory = (features || []).reduce((acc, feature) => {
      if (!acc[feature.category]) {
        acc[feature.category] = [];
      }
      acc[feature.category].push(feature);
      return acc;
    }, {});

    // Build matrix: matrix[featureKey][planId] = { enabled, limit }
    const matrix = {};
    features.forEach(feature => {
      matrix[feature.key] = {};
      plans.forEach(plan => {
        const planFeature = plan.allowedFeatures?.find(f => f.featureKey === feature.key);
        matrix[feature.key][plan._id] = planFeature || { enabled: false, limit: null };
      });
    });

    return {
      plans,
      features,
      featuresByCategory,
      matrix,
      categories: this.getCategories()
    };
  }

  /**
   * Helper to validate feature data before creating/updating
   * @param {Object} featureData - Feature data to validate
   * @returns {Object} - { valid: boolean, errors: [] }
   */
  validateFeatureData(featureData) {
    const errors = [];

    if (!featureData.key || !featureData.key.trim()) {
      errors.push('Feature key is required');
    }

    if (!featureData.name || !featureData.name.trim()) {
      errors.push('Feature name is required');
    }

    if (!featureData.category) {
      errors.push('Feature category is required');
    }

    if (!['boolean', 'numeric', 'enum'].includes(featureData.type)) {
      errors.push('Feature type must be boolean, numeric, or enum');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

export default new AdminFeatureService();

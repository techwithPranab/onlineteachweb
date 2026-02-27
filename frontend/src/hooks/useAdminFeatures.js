import { useState, useEffect, useCallback } from 'react';
import adminFeatureService from '../services/adminFeatureService';

/**
 * Hook to get all feature definitions (admin)
 * @param {Object} filters - Optional filters { category, isActive, applicableRoles }
 * @returns {Object} - { features, loading, error, refetch }
 */
export const useAdminFeatures = (filters = {}) => {
  const [state, setState] = useState({
    features: [],
    loading: true,
    error: null
  });

  const fetchFeatures = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await adminFeatureService.getAllFeatures(filters);
      setState({
        features: result.data || [],
        loading: false,
        error: null
      });
    } catch (error) {
      setState({
        features: [],
        loading: false,
        error: error.response?.data?.message || 'Failed to fetch features'
      });
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    fetchFeatures();
  }, [fetchFeatures]);

  return {
    ...state,
    refetch: fetchFeatures
  };
};

/**
 * Hook to get features by category (admin)
 * @param {string} category - Feature category
 * @returns {Object} - { features, loading, error, refetch }
 */
export const useAdminFeaturesByCategory = (category) => {
  const [state, setState] = useState({
    features: [],
    loading: true,
    error: null
  });

  const fetchFeatures = useCallback(async () => {
    if (!category) {
      setState({ features: [], loading: false, error: 'No category provided' });
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await adminFeatureService.getFeaturesByCategory(category);
      setState({
        features: result.data || [],
        loading: false,
        error: null
      });
    } catch (error) {
      setState({
        features: [],
        loading: false,
        error: error.response?.data?.message || 'Failed to fetch features'
      });
    }
  }, [category]);

  useEffect(() => {
    fetchFeatures();
  }, [fetchFeatures]);

  return {
    ...state,
    refetch: fetchFeatures
  };
};

/**
 * Hook to get plan feature comparison (admin)
 * @returns {Object} - { plans, features, featuresByCategory, matrix, categories, loading, error, refetch }
 */
export const usePlanComparison = () => {
  const [state, setState] = useState({
    plans: [],
    features: [],
    featuresByCategory: {},
    matrix: {},
    categories: [],
    loading: true,
    error: null
  });

  const fetchComparison = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await adminFeatureService.comparePlanFeatures();
      const formatted = adminFeatureService.formatComparisonForTable(result);

      setState({
        plans: formatted.plans,
        features: formatted.features,
        featuresByCategory: formatted.featuresByCategory || {},
        matrix: formatted.matrix || {},
        categories: formatted.categories || [],
        loading: false,
        error: null
      });
    } catch (error) {
      setState({
        plans: [],
        features: [],
        featuresByCategory: {},
        matrix: {},
        categories: [],
        loading: false,
        error: error.response?.data?.message || 'Failed to fetch plan comparison'
      });
    }
  }, []);

  useEffect(() => {
    fetchComparison();
  }, [fetchComparison]);

  /**
   * Update features for a specific plan
   * @param {string} planId - Plan ID
   * @param {Object} planData - Updated plan data
   */
  const updatePlan = useCallback(async (planId, planData) => {
    try {
      await adminFeatureService.updatePlanFeatures(planId, planData);
      await fetchComparison(); // Refetch to update UI
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update plan'
      };
    }
  }, [fetchComparison]);

  /**
   * Toggle a feature for a specific plan
   * @param {string} planId - Plan ID
   * @param {string} featureKey - Feature key
   * @param {boolean} enabled - New enabled state
   */
  const toggleFeature = useCallback(async (planId, featureKey, enabled) => {
    try {
      const plan = state.plans.find(p => p._id === planId);
      if (!plan) {
        throw new Error('Plan not found');
      }

      const allowedFeatures = plan.allowedFeatures || [];
      const existingIndex = allowedFeatures.findIndex(f => f.featureKey === featureKey);

      // If enabled not explicitly provided, flip the current value
      const currentEnabled = existingIndex >= 0 ? (allowedFeatures[existingIndex].enabled !== false) : false;
      const newEnabled = enabled !== undefined ? enabled : !currentEnabled;

      let updatedFeatures;
      if (existingIndex >= 0) {
        // Update existing feature
        updatedFeatures = [...allowedFeatures];
        updatedFeatures[existingIndex] = {
          ...updatedFeatures[existingIndex],
          enabled: newEnabled
        };
      } else {
        // Add new feature
        updatedFeatures = [
          ...allowedFeatures,
          { featureKey, enabled: newEnabled, limit: null }
        ];
      }

      await adminFeatureService.updatePlanFeatures(planId, {
        allowedFeatures: updatedFeatures
      });

      await fetchComparison(); // Refetch to update UI
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to toggle feature'
      };
    }
  }, [state.plans, fetchComparison]);

  /**
   * Set limit for a feature in a specific plan
   * @param {string} planId - Plan ID
   * @param {string} featureKey - Feature key
   * @param {number|null} limit - New limit (null for unlimited)
   */
  const setFeatureLimit = useCallback(async (planId, featureKey, limit) => {
    try {
      const plan = state.plans.find(p => p._id === planId);
      if (!plan) {
        throw new Error('Plan not found');
      }

      const allowedFeatures = plan.allowedFeatures || [];
      const existingIndex = allowedFeatures.findIndex(f => f.featureKey === featureKey);

      if (existingIndex < 0) {
        throw new Error('Feature not found in plan');
      }

      const updatedFeatures = [...allowedFeatures];
      updatedFeatures[existingIndex] = {
        ...updatedFeatures[existingIndex],
        limit
      };

      await adminFeatureService.updatePlanFeatures(planId, {
        allowedFeatures: updatedFeatures
      });

      await fetchComparison(); // Refetch to update UI
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to set feature limit'
      };
    }
  }, [state.plans, fetchComparison]);

  return {
    ...state,
    refetch: fetchComparison,
    updatePlan,
    toggleFeature,
    setFeatureLimit,
    // Changes are saved immediately on each toggle/limit change,
    // so savePlanChanges is a no-op kept for API compatibility.
    savePlanChanges: async () => ({ success: true }),
  };
};

/**
 * Hook to manage feature CRUD operations (admin)
 * @returns {Object} - { createFeature, updateFeature, deleteFeature, loading, error }
 */
export const useFeatureManagement = () => {
  const [state, setState] = useState({
    loading: false,
    error: null
  });

  /**
   * Create a new feature
   * @param {Object} featureData - Feature data
   */
  const createFeature = useCallback(async (featureData) => {
    setState({ loading: true, error: null });

    // Validate feature data
    const validation = adminFeatureService.validateFeatureData(featureData);
    if (!validation.valid) {
      setState({ loading: false, error: validation.errors.join(', ') });
      return { success: false, error: validation.errors.join(', ') };
    }

    try {
      const result = await adminFeatureService.createFeature(featureData);
      setState({ loading: false, error: null });
      return { success: true, data: result.data };
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to create feature';
      setState({ loading: false, error: errorMsg });
      return { success: false, error: errorMsg };
    }
  }, []);

  /**
   * Update an existing feature
   * @param {string} key - Feature key
   * @param {Object} updates - Updated data
   */
  const updateFeature = useCallback(async (key, updates) => {
    setState({ loading: true, error: null });

    try {
      const result = await adminFeatureService.updateFeature(key, updates);
      setState({ loading: false, error: null });
      return { success: true, data: result.data };
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to update feature';
      setState({ loading: false, error: errorMsg });
      return { success: false, error: errorMsg };
    }
  }, []);

  /**
   * Delete a feature
   * @param {string} key - Feature key
   */
  const deleteFeature = useCallback(async (key) => {
    setState({ loading: true, error: null });

    try {
      const result = await adminFeatureService.deleteFeature(key);
      setState({ loading: false, error: null });
      return { success: true, data: result.data };
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to delete feature';
      setState({ loading: false, error: errorMsg });
      return { success: false, error: errorMsg };
    }
  }, []);

  /**
   * Seed default features
   */
  const seedFeatures = useCallback(async () => {
    setState({ loading: true, error: null });

    try {
      const result = await adminFeatureService.seedFeatures();
      setState({ loading: false, error: null });
      return { success: true, data: result.data };
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to seed features';
      setState({ loading: false, error: errorMsg });
      return { success: false, error: errorMsg };
    }
  }, []);

  return {
    ...state,
    createFeature,
    updateFeature,
    deleteFeature,
    seedFeatures
  };
};

/**
 * Hook to get feature analytics (admin)
 * @param {string} featureKey - Optional feature key to filter
 * @param {Date} startDate - Optional start date
 * @param {Date} endDate - Optional end date
 * @returns {Object} - { analytics, loading, error, refetch }
 */
export const useFeatureAnalytics = (featureKey = null, startDate = null, endDate = null) => {
  const [state, setState] = useState({
    analytics: null,
    loading: true,
    error: null
  });

  const fetchAnalytics = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await adminFeatureService.getFeatureAnalytics(featureKey, startDate, endDate);
      setState({
        analytics: result.data || null,
        loading: false,
        error: null
      });
    } catch (error) {
      setState({
        analytics: null,
        loading: false,
        error: error.response?.data?.message || 'Failed to fetch analytics'
      });
    }
  }, [featureKey, startDate, endDate]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    ...state,
    refetch: fetchAnalytics
  };
};

/**
 * Hook to get feature categories
 * @returns {Array} - Array of category objects
 */
export const useFeatureCategories = () => {
  return adminFeatureService.getCategories();
};

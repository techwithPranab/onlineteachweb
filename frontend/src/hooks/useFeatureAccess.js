import { useState, useEffect, useCallback } from 'react';
import featureService from '../services/featureService';

/**
 * Hook to check if user has access to a specific feature
 * @param {string} featureKey - Feature key to check (e.g., 'courses.enroll')
 * @param {boolean} autoCheck - Whether to automatically check on mount (default: true)
 * @returns {Object} - { allowed, loading, error, reason, limit, remaining, upgradeRequired, refetch }
 */
export const useFeatureAccess = (featureKey, autoCheck = true) => {
  const [state, setState] = useState({
    allowed: false,
    loading: true,
    error: null,
    reason: null,
    limit: null,
    remaining: null,
    upgradeRequired: false
  });

  const checkAccess = useCallback(async () => {
    if (!featureKey) {
      setState(prev => ({ ...prev, loading: false, error: 'No feature key provided' }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await featureService.checkFeatureAccess(featureKey);
      setState({
        allowed: result.data?.allowed || false,
        loading: false,
        error: null,
        reason: result.data?.reason || null,
        limit: result.data?.limit || null,
        remaining: result.data?.remaining || null,
        upgradeRequired: result.data?.upgradeRequired || false
      });
    } catch (error) {
      setState({
        allowed: false,
        loading: false,
        error: error.response?.data?.message || 'Failed to check feature access',
        reason: null,
        limit: null,
        remaining: null,
        upgradeRequired: false
      });
    }
  }, [featureKey]);

  useEffect(() => {
    if (autoCheck) {
      checkAccess();
    }
  }, [autoCheck, checkAccess]);

  return {
    ...state,
    refetch: checkAccess
  };
};

/**
 * Hook to get all features accessible to current user
 * @returns {Object} - { features, plan, subscription, loading, error, refetch }
 */
export const useUserFeatures = () => {
  const [state, setState] = useState({
    features: [],
    plan: null,
    subscription: null,
    loading: true,
    error: null
  });

  const fetchFeatures = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await featureService.getMyFeatures();
      setState({
        features: result.data?.features || [],
        plan: result.data?.plan || null,
        subscription: result.data?.subscription || null,
        loading: false,
        error: null
      });
    } catch (error) {
      setState({
        features: [],
        plan: null,
        subscription: null,
        loading: false,
        error: error.response?.data?.message || 'Failed to fetch features'
      });
    }
  }, []);

  useEffect(() => {
    fetchFeatures();
  }, [fetchFeatures]);

  return {
    ...state,
    refetch: fetchFeatures
  };
};

/**
 * Hook to get feature usage statistics
 * @param {string} featureKey - Optional specific feature key to get usage for
 * @returns {Object} - { usage, loading, error, refetch }
 */
export const useFeatureUsage = (featureKey = null) => {
  const [state, setState] = useState({
    usage: featureKey ? null : [],
    loading: true,
    error: null
  });

  const fetchUsage = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = featureKey
        ? await featureService.getSpecificFeatureUsage(featureKey)
        : await featureService.getFeatureUsage();

      setState({
        usage: result.data || (featureKey ? null : []),
        loading: false,
        error: null
      });
    } catch (error) {
      setState({
        usage: featureKey ? null : [],
        loading: false,
        error: error.response?.data?.message || 'Failed to fetch usage'
      });
    }
  }, [featureKey]);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  return {
    ...state,
    refetch: fetchUsage
  };
};

/**
 * Hook to check if user has any of the specified features
 * @param {string[]} featureKeys - Array of feature keys to check
 * @returns {Object} - { hasAny, loading, error, results, refetch }
 */
export const useHasAnyFeature = (featureKeys = []) => {
  const [state, setState] = useState({
    hasAny: false,
    loading: true,
    error: null,
    results: {}
  });

  const checkFeatures = useCallback(async () => {
    if (!featureKeys || featureKeys.length === 0) {
      setState({ hasAny: false, loading: false, error: null, results: {} });
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const results = await featureService.checkMultipleFeatures(featureKeys);
      const hasAny = Object.values(results).some(result => result.data?.allowed);

      setState({
        hasAny,
        loading: false,
        error: null,
        results
      });
    } catch (error) {
      setState({
        hasAny: false,
        loading: false,
        error: error.response?.data?.message || 'Failed to check features',
        results: {}
      });
    }
  }, [JSON.stringify(featureKeys)]);

  useEffect(() => {
    checkFeatures();
  }, [checkFeatures]);

  return {
    ...state,
    refetch: checkFeatures
  };
};

/**
 * Hook to check if user has all of the specified features
 * @param {string[]} featureKeys - Array of feature keys to check
 * @returns {Object} - { hasAll, loading, error, results, refetch }
 */
export const useHasAllFeatures = (featureKeys = []) => {
  const [state, setState] = useState({
    hasAll: false,
    loading: true,
    error: null,
    results: {}
  });

  const checkFeatures = useCallback(async () => {
    if (!featureKeys || featureKeys.length === 0) {
      setState({ hasAll: false, loading: false, error: null, results: {} });
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const results = await featureService.checkMultipleFeatures(featureKeys);
      const hasAll = Object.values(results).every(result => result.data?.allowed);

      setState({
        hasAll,
        loading: false,
        error: null,
        results
      });
    } catch (error) {
      setState({
        hasAll: false,
        loading: false,
        error: error.response?.data?.message || 'Failed to check features',
        results: {}
      });
    }
  }, [JSON.stringify(featureKeys)]);

  useEffect(() => {
    checkFeatures();
  }, [checkFeatures]);

  return {
    ...state,
    refetch: checkFeatures
  };
};

/**
 * Hook to get subscription features organized by category
 * @returns {Object} - { plan, features, subscription, loading, error, refetch }
 */
export const useSubscriptionFeatures = () => {
  const [state, setState] = useState({
    plan: null,
    features: {},
    subscription: null,
    loading: true,
    error: null
  });

  const fetchSubscriptionFeatures = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await featureService.getSubscriptionFeatures();
      setState({
        plan: result.data?.plan || null,
        features: result.data?.features || {},
        subscription: result.data?.subscription || null,
        loading: false,
        error: null
      });
    } catch (error) {
      setState({
        plan: null,
        features: {},
        subscription: null,
        loading: false,
        error: error.response?.data?.message || 'Failed to fetch subscription features'
      });
    }
  }, []);

  useEffect(() => {
    fetchSubscriptionFeatures();
  }, [fetchSubscriptionFeatures]);

  return {
    ...state,
    refetch: fetchSubscriptionFeatures
  };
};

/**
 * Hook to get manually restricted features for current user
 * @returns {Object} - { restrictions, loading, error, refetch }
 */
export const useFeatureRestrictions = () => {
  const [state, setState] = useState({
    restrictions: [],
    loading: true,
    error: null
  });

  const fetchRestrictions = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await featureService.getMyRestrictions();
      setState({
        restrictions: result.data || [],
        loading: false,
        error: null
      });
    } catch (error) {
      setState({
        restrictions: [],
        loading: false,
        error: error.response?.data?.message || 'Failed to fetch restrictions'
      });
    }
  }, []);

  useEffect(() => {
    fetchRestrictions();
  }, [fetchRestrictions]);

  return {
    ...state,
    refetch: fetchRestrictions
  };
};

/**
 * Hook to get features that require upgrade
 * @returns {Object} - { upgradableFeatures, loading, error, refetch }
 */
export const useUpgradableFeatures = () => {
  const [state, setState] = useState({
    upgradableFeatures: [],
    loading: true,
    error: null
  });

  const fetchUpgradableFeatures = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const features = await featureService.getFeaturesRequiringUpgrade();
      setState({
        upgradableFeatures: features || [],
        loading: false,
        error: null
      });
    } catch (error) {
      setState({
        upgradableFeatures: [],
        loading: false,
        error: error.response?.data?.message || 'Failed to fetch upgradable features'
      });
    }
  }, []);

  useEffect(() => {
    fetchUpgradableFeatures();
  }, [fetchUpgradableFeatures]);

  return {
    ...state,
    refetch: fetchUpgradableFeatures
  };
};

/**
 * Utility hook to check a single feature (simpler version)
 * @param {string} featureKey - Feature key to check
 * @returns {boolean} - True if user has access, false otherwise
 */
export const useHasFeature = (featureKey) => {
  const { allowed } = useFeatureAccess(featureKey);
  return allowed;
};

/**
 * Utility hook to get remaining quota for a feature
 * @param {string} featureKey - Feature key to check
 * @returns {number|null} - Remaining quota or null if unlimited/not applicable
 */
export const useFeatureRemaining = (featureKey) => {
  const { remaining } = useFeatureAccess(featureKey);
  return remaining;
};

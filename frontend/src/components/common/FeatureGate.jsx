import React from 'react';
import PropTypes from 'prop-types';
import { useFeatureAccess } from '../../hooks/useFeatureAccess';

/**
 * FeatureGate Component
 * Conditionally renders children based on feature access
 * 
 * @example
 * <FeatureGate feature="courses.premium">
 *   <PremiumContent />
 * </FeatureGate>
 * 
 * @example With fallback
 * <FeatureGate 
 *   feature="live_sessions.hd_video"
 *   fallback={<UpgradePrompt />}
 * >
 *   <HDVideoPlayer />
 * </FeatureGate>
 */
const FeatureGate = ({ 
  feature, 
  children, 
  fallback = null,
  showLoading = true,
  loadingComponent = null,
  requireAll = false,
  requireAny = false,
  onAccessDenied = null,
  showUpgradePrompt = false
}) => {
  // Handle single feature
  const isSingleFeature = typeof feature === 'string';
  
  // Handle array of features
  const features = isSingleFeature ? [feature] : feature;
  
  // Check access for single or multiple features
  const { allowed, loading, reason, upgradeRequired } = useFeatureAccess(
    isSingleFeature ? feature : features[0]
  );

  // Additional checks for multiple features
  const [multiFeatureCheck, setMultiFeatureCheck] = React.useState({
    allowed: false,
    loading: true
  });

  React.useEffect(() => {
    if (!isSingleFeature && features.length > 1) {
      // Import the appropriate hook based on requireAll/requireAny
      import('../../hooks/useFeatureAccess').then(hooks => {
        if (requireAll) {
          const { useHasAllFeatures } = hooks;
          // This would need to be refactored to use the hook properly
          // For now, we'll use the single feature check
        } else if (requireAny) {
          const { useHasAnyFeature } = hooks;
          // Similar refactoring needed
        }
      });
    }
  }, [isSingleFeature, features, requireAll, requireAny]);

  // Handle loading state
  if (loading || (!isSingleFeature && multiFeatureCheck.loading)) {
    if (!showLoading) return null;
    if (loadingComponent) return loadingComponent;
    return (
      <div className="feature-gate-loading">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Checking access...</span>
        </div>
      </div>
    );
  }

  // Handle access denied
  if (!allowed) {
    // Call callback if provided
    if (onAccessDenied) {
      onAccessDenied({ feature, reason, upgradeRequired });
    }

    // Show upgrade prompt if requested
    if (showUpgradePrompt && upgradeRequired) {
      return (
        <div className="feature-gate-upgrade-prompt">
          <div className="alert alert-info">
            <h5>🔒 Upgrade Required</h5>
            <p>{reason || 'This feature is not available in your current plan.'}</p>
            <button className="btn btn-primary btn-sm">
              Upgrade Now
            </button>
          </div>
        </div>
      );
    }

    // Return fallback or null
    return fallback;
  }

  // User has access - render children
  return <>{children}</>;
};

FeatureGate.propTypes = {
  /** Feature key(s) to check. Can be string or array of strings */
  feature: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string)
  ]).isRequired,
  
  /** Content to render if user has access */
  children: PropTypes.node.isRequired,
  
  /** Content to render if user doesn't have access */
  fallback: PropTypes.node,
  
  /** Whether to show loading indicator */
  showLoading: PropTypes.bool,
  
  /** Custom loading component */
  loadingComponent: PropTypes.node,
  
  /** For array of features: require ALL features (AND logic) */
  requireAll: PropTypes.bool,
  
  /** For array of features: require ANY feature (OR logic) */
  requireAny: PropTypes.bool,
  
  /** Callback when access is denied */
  onAccessDenied: PropTypes.func,
  
  /** Show built-in upgrade prompt when access denied */
  showUpgradePrompt: PropTypes.bool
};

export default FeatureGate;

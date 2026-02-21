import React from 'react';
import PropTypes from 'prop-types';
import { useFeatureAccess } from '../../hooks/useFeatureAccess';

/**
 * FeatureButton Component
 * Button that checks feature access before allowing interaction
 * Automatically disables and shows upgrade prompt if access denied
 * 
 * @example
 * <FeatureButton 
 *   feature="materials.download"
 *   onClick={handleDownload}
 *   className="btn btn-primary"
 * >
 *   Download PDF
 * </FeatureButton>
 */
const FeatureButton = ({
  feature,
  onClick,
  children,
  className = '',
  disabled = false,
  showUpgradeTooltip = true,
  onAccessDenied = null,
  type = 'button',
  variant = 'primary',
  size = 'md',
  icon = null,
  lockedIcon = '🔒',
  loadingText = 'Checking...',
  deniedText = null,
  ...rest
}) => {
  const { allowed, loading, reason, upgradeRequired, remaining } = useFeatureAccess(feature);
  const [showTooltip, setShowTooltip] = React.useState(false);

  // Handle click
  const handleClick = (e) => {
    if (!allowed) {
      e.preventDefault();
      
      // Show tooltip
      if (showUpgradeTooltip) {
        setShowTooltip(true);
        setTimeout(() => setShowTooltip(false), 3000);
      }

      // Call callback
      if (onAccessDenied) {
        onAccessDenied({ feature, reason, upgradeRequired });
      }

      return;
    }

    // User has access - proceed with original onClick
    if (onClick) {
      onClick(e);
    }
  };

  // Determine button state
  const isDisabled = disabled || loading || !allowed;
  const buttonClass = `btn btn-${variant} btn-${size} ${className} ${isDisabled ? 'disabled' : ''}`;

  // Determine button text
  let buttonContent = children;
  if (loading) {
    buttonContent = (
      <>
        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
        {loadingText}
      </>
    );
  } else if (!allowed && deniedText) {
    buttonContent = (
      <>
        {lockedIcon && <span className="me-1">{lockedIcon}</span>}
        {deniedText}
      </>
    );
  } else if (!allowed && !deniedText) {
    buttonContent = (
      <>
        {lockedIcon && <span className="me-1">{lockedIcon}</span>}
        {children}
      </>
    );
  } else if (icon) {
    buttonContent = (
      <>
        {icon && <span className="me-1">{icon}</span>}
        {children}
      </>
    );
  }

  return (
    <div className="feature-button-wrapper position-relative d-inline-block">
      <button
        type={type}
        className={buttonClass}
        onClick={handleClick}
        disabled={isDisabled}
        aria-label={!allowed ? `Upgrade required: ${reason}` : undefined}
        {...rest}
      >
        {buttonContent}
      </button>

      {/* Usage indicator (if feature has limits) */}
      {allowed && remaining !== null && remaining !== undefined && (
        <div className="feature-usage-badge">
          <small className="text-muted">{remaining} left</small>
        </div>
      )}

      {/* Tooltip for upgrade prompt */}
      {showTooltip && !allowed && showUpgradeTooltip && (
        <div className="feature-button-tooltip">
          <div className="tooltip bs-tooltip-top show" role="tooltip">
            <div className="tooltip-arrow"></div>
            <div className="tooltip-inner">
              {upgradeRequired ? (
                <>
                  <strong>Upgrade Required</strong>
                  <br />
                  {reason || 'This feature is not available in your plan'}
                </>
              ) : (
                reason || 'Access denied'
              )}
            </div>
          </div>
        </div>
      )}

      {/* Inline styles for tooltip */}
      <style jsx>{`
        .feature-button-wrapper {
          display: inline-block;
        }

        .feature-usage-badge {
          position: absolute;
          top: -8px;
          right: -8px;
          background: var(--bs-primary);
          color: white;
          border-radius: 10px;
          padding: 2px 6px;
          font-size: 10px;
          font-weight: 600;
          z-index: 10;
        }

        .feature-button-tooltip {
          position: absolute;
          top: -100%;
          left: 50%;
          transform: translateX(-50%);
          z-index: 1000;
          margin-bottom: 8px;
        }

        .feature-button-tooltip .tooltip {
          position: static;
          display: block;
          opacity: 1;
        }

        .feature-button-tooltip .tooltip-inner {
          max-width: 250px;
          text-align: center;
          padding: 8px 12px;
        }
      `}</style>
    </div>
  );
};

FeatureButton.propTypes = {
  /** Feature key to check */
  feature: PropTypes.string.isRequired,
  
  /** Click handler (only fires if user has access) */
  onClick: PropTypes.func,
  
  /** Button content */
  children: PropTypes.node.isRequired,
  
  /** Additional CSS classes */
  className: PropTypes.string,
  
  /** Whether button is disabled (in addition to feature check) */
  disabled: PropTypes.bool,
  
  /** Show tooltip on click when access denied */
  showUpgradeTooltip: PropTypes.bool,
  
  /** Callback when access is denied */
  onAccessDenied: PropTypes.func,
  
  /** Button type */
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  
  /** Button variant (Bootstrap classes) */
  variant: PropTypes.string,
  
  /** Button size */
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  
  /** Icon to show (when allowed) */
  icon: PropTypes.node,
  
  /** Icon to show when locked */
  lockedIcon: PropTypes.node,
  
  /** Text to show while loading */
  loadingText: PropTypes.string,
  
  /** Text to show when denied (overrides children) */
  deniedText: PropTypes.string
};

export default FeatureButton;

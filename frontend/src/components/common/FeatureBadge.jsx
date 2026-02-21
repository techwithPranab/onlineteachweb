import React from 'react';
import PropTypes from 'prop-types';

/**
 * FeatureBadge Component
 * Displays a badge indicating feature tier or status
 * 
 * @example
 * <FeatureBadge type="premium" />
 * <FeatureBadge type="pro" text="Pro Only" />
 * <FeatureBadge type="new" text="New!" />
 */
const FeatureBadge = ({
  type = 'premium',
  text = null,
  size = 'sm',
  icon = null,
  className = '',
  position = 'inline',
  tooltip = null
}) => {
  // Predefined badge configurations
  const badgeConfigs = {
    premium: {
      text: 'Premium',
      icon: '👑',
      color: 'warning',
      bgColor: '#ffc107',
      textColor: '#000'
    },
    pro: {
      text: 'Pro',
      icon: '⭐',
      color: 'info',
      bgColor: '#0dcaf0',
      textColor: '#000'
    },
    enterprise: {
      text: 'Enterprise',
      icon: '💼',
      color: 'dark',
      bgColor: '#212529',
      textColor: '#fff'
    },
    new: {
      text: 'New',
      icon: '✨',
      color: 'success',
      bgColor: '#198754',
      textColor: '#fff'
    },
    beta: {
      text: 'Beta',
      icon: '🧪',
      color: 'secondary',
      bgColor: '#6c757d',
      textColor: '#fff'
    },
    limited: {
      text: 'Limited',
      icon: '⏰',
      color: 'danger',
      bgColor: '#dc3545',
      textColor: '#fff'
    },
    free: {
      text: 'Free',
      icon: '🆓',
      color: 'success',
      bgColor: '#198754',
      textColor: '#fff'
    },
    locked: {
      text: 'Locked',
      icon: '🔒',
      color: 'secondary',
      bgColor: '#6c757d',
      textColor: '#fff'
    }
  };

  const config = badgeConfigs[type] || badgeConfigs.premium;
  const displayText = text || config.text;
  const displayIcon = icon !== null ? icon : config.icon;

  // Size classes
  const sizeClasses = {
    xs: 'badge-xs',
    sm: 'badge-sm',
    md: 'badge-md',
    lg: 'badge-lg'
  };

  // Position classes
  const positionClasses = {
    inline: 'badge-inline',
    'top-right': 'badge-absolute badge-top-right',
    'top-left': 'badge-absolute badge-top-left',
    'bottom-right': 'badge-absolute badge-bottom-right',
    'bottom-left': 'badge-absolute badge-bottom-left'
  };

  const badgeClass = `
    badge 
    bg-${config.color} 
    ${sizeClasses[size]} 
    ${positionClasses[position]} 
    ${className}
  `.trim();

  const badgeContent = (
    <>
      {displayIcon && <span className="badge-icon">{displayIcon}</span>}
      {displayText && <span className="badge-text">{displayText}</span>}
    </>
  );

  return (
    <>
      {tooltip ? (
        <span
          className={badgeClass}
          data-bs-toggle="tooltip"
          data-bs-placement="top"
          title={tooltip}
          style={{
            backgroundColor: config.bgColor,
            color: config.textColor
          }}
        >
          {badgeContent}
        </span>
      ) : (
        <span
          className={badgeClass}
          style={{
            backgroundColor: config.bgColor,
            color: config.textColor
          }}
        >
          {badgeContent}
        </span>
      )}

      {/* Inline styles */}
      <style jsx>{`
        .badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-weight: 600;
          border-radius: 4px;
          white-space: nowrap;
        }

        .badge-xs {
          font-size: 0.65rem;
          padding: 2px 6px;
        }

        .badge-sm {
          font-size: 0.75rem;
          padding: 3px 8px;
        }

        .badge-md {
          font-size: 0.875rem;
          padding: 4px 10px;
        }

        .badge-lg {
          font-size: 1rem;
          padding: 6px 12px;
        }

        .badge-inline {
          vertical-align: middle;
          margin-left: 6px;
        }

        .badge-absolute {
          position: absolute;
          z-index: 10;
        }

        .badge-top-right {
          top: 8px;
          right: 8px;
        }

        .badge-top-left {
          top: 8px;
          left: 8px;
        }

        .badge-bottom-right {
          bottom: 8px;
          right: 8px;
        }

        .badge-bottom-left {
          bottom: 8px;
          left: 8px;
        }

        .badge-icon {
          line-height: 1;
        }

        .badge-text {
          line-height: 1;
        }
      `}</style>
    </>
  );
};

FeatureBadge.propTypes = {
  /** Badge type (predefined styles) */
  type: PropTypes.oneOf([
    'premium',
    'pro',
    'enterprise',
    'new',
    'beta',
    'limited',
    'free',
    'locked'
  ]),
  
  /** Custom text (overrides default) */
  text: PropTypes.string,
  
  /** Badge size */
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg']),
  
  /** Custom icon (overrides default) */
  icon: PropTypes.node,
  
  /** Additional CSS classes */
  className: PropTypes.string,
  
  /** Badge position */
  position: PropTypes.oneOf([
    'inline',
    'top-right',
    'top-left',
    'bottom-right',
    'bottom-left'
  ]),
  
  /** Tooltip text */
  tooltip: PropTypes.string
};

export default FeatureBadge;

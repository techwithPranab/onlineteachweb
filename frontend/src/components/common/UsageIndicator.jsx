import React from 'react';
import PropTypes from 'prop-types';
import { useFeatureUsage } from '../../hooks/useFeatureAccess';

/**
 * UsageIndicator Component
 * Displays usage statistics and limits for a feature
 * Shows progress bar, remaining quota, and reset date
 * 
 * @example
 * <UsageIndicator feature="courses.enroll" />
 * <UsageIndicator feature="quiz.take" variant="circular" />
 */
const UsageIndicator = ({
  feature,
  variant = 'bar',
  size = 'md',
  showLabel = true,
  showPercentage = true,
  showRemaining = true,
  showResetDate = true,
  showIcon = true,
  className = '',
  warningThreshold = 80,
  dangerThreshold = 95,
  onLimitApproaching = null,
  onLimitExceeded = null
}) => {
  const { usage, loading, error } = useFeatureUsage(feature);
  const [hasWarned, setHasWarned] = React.useState(false);
  const [hasExceeded, setHasExceeded] = React.useState(false);

  // Trigger callbacks when thresholds reached
  React.useEffect(() => {
    if (usage && usage.percentage >= warningThreshold && !hasWarned && onLimitApproaching) {
      onLimitApproaching(usage);
      setHasWarned(true);
    }
    if (usage && usage.percentage >= 100 && !hasExceeded && onLimitExceeded) {
      onLimitExceeded(usage);
      setHasExceeded(true);
    }
  }, [usage, warningThreshold, hasWarned, hasExceeded, onLimitApproaching, onLimitExceeded]);

  if (loading) {
    return (
      <div className={`usage-indicator-loading ${className}`}>
        <div className="spinner-border spinner-border-sm" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error || !usage) {
    return null;
  }

  // Check if unlimited
  if (usage.limit === null || usage.limit === 'unlimited') {
    return showLabel ? (
      <div className={`usage-indicator unlimited ${className}`}>
        {showIcon && <span className="usage-icon">✨</span>}
        <span className="usage-text">Unlimited</span>
      </div>
    ) : null;
  }

  // Determine color based on percentage
  const getColor = (percentage) => {
    if (percentage >= dangerThreshold) return 'danger';
    if (percentage >= warningThreshold) return 'warning';
    return 'success';
  };

  const color = getColor(usage.percentage);
  const percentage = Math.min(usage.percentage, 100);

  // Format reset date
  const formatResetDate = (date) => {
    if (!date) return '';
    const resetDate = new Date(date);
    const now = new Date();
    const diffDays = Math.ceil((resetDate - now) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Resets today';
    if (diffDays === 1) return 'Resets tomorrow';
    if (diffDays < 7) return `Resets in ${diffDays} days`;
    return `Resets ${resetDate.toLocaleDateString()}`;
  };

  // Bar variant
  if (variant === 'bar') {
    return (
      <div className={`usage-indicator usage-bar ${size} ${className}`}>
        {showLabel && (
          <div className="usage-header">
            <span className="usage-label">
              {showIcon && <span className="usage-icon">📊</span>}
              {usage.featureName || 'Usage'}
            </span>
            {showPercentage && (
              <span className="usage-percentage">{Math.round(percentage)}%</span>
            )}
          </div>
        )}

        <div className="progress">
          <div
            className={`progress-bar bg-${color}`}
            role="progressbar"
            style={{ width: `${percentage}%` }}
            aria-valuenow={usage.usageCount}
            aria-valuemin="0"
            aria-valuemax={usage.limit}
          ></div>
        </div>

        <div className="usage-footer">
          {showRemaining && (
            <small className="text-muted">
              {usage.remaining > 0 ? (
                <strong className={`text-${color}`}>{usage.remaining} remaining</strong>
              ) : (
                <strong className="text-danger">Limit reached</strong>
              )}
              {' of '}{usage.limit} used
            </small>
          )}
          {showResetDate && usage.resetDate && (
            <small className="text-muted ms-auto">
              {formatResetDate(usage.resetDate)}
            </small>
          )}
        </div>

        <style jsx>{`
          .usage-indicator {
            margin: 10px 0;
          }

          .usage-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 5px;
          }

          .usage-label {
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 5px;
          }

          .usage-percentage {
            font-weight: 700;
            color: var(--bs-${color});
          }

          .progress {
            height: 8px;
            border-radius: 4px;
            overflow: hidden;
          }

          .usage-bar.sm .progress {
            height: 6px;
          }

          .usage-bar.lg .progress {
            height: 12px;
          }

          .usage-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 5px;
          }

          .usage-icon {
            font-size: 1rem;
          }
        `}</style>
      </div>
    );
  }

  // Circular variant
  if (variant === 'circular') {
    const radius = size === 'sm' ? 30 : size === 'lg' ? 50 : 40;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className={`usage-indicator usage-circular ${size} ${className}`}>
        <svg width={radius * 2.5} height={radius * 2.5}>
          {/* Background circle */}
          <circle
            cx={radius * 1.25}
            cy={radius * 1.25}
            r={radius}
            fill="none"
            stroke="#e0e0e0"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <circle
            cx={radius * 1.25}
            cy={radius * 1.25}
            r={radius}
            fill="none"
            stroke={`var(--bs-${color})`}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${radius * 1.25} ${radius * 1.25})`}
          />
          {/* Center text */}
          <text
            x={radius * 1.25}
            y={radius * 1.25}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={size === 'sm' ? '12' : size === 'lg' ? '20' : '16'}
            fontWeight="700"
            fill={`var(--bs-${color})`}
          >
            {usage.remaining}
          </text>
        </svg>
        {showLabel && (
          <div className="usage-circular-label">
            <div className="usage-name">{usage.featureName}</div>
            {showResetDate && usage.resetDate && (
              <small className="text-muted">{formatResetDate(usage.resetDate)}</small>
            )}
          </div>
        )}

        <style jsx>{`
          .usage-circular {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
          }

          .usage-circular-label {
            margin-top: 8px;
          }

          .usage-name {
            font-weight: 600;
            font-size: 0.875rem;
          }
        `}</style>
      </div>
    );
  }

  // Badge variant
  if (variant === 'badge') {
    return (
      <span className={`badge bg-${color} usage-badge ${className}`}>
        {showIcon && <span>📊</span>}
        {showRemaining && `${usage.remaining} left`}
        {showPercentage && !showRemaining && `${Math.round(percentage)}%`}
      </span>
    );
  }

  // Inline variant
  return (
    <span className={`usage-indicator usage-inline text-${color} ${className}`}>
      {showIcon && <span className="usage-icon">📊</span>}
      {showRemaining && (
        <strong>{usage.remaining}</strong>
      )}
      {showRemaining && ' of '}
      {usage.limit}
      {showPercentage && ` (${Math.round(percentage)}%)`}
    </span>
  );
};

UsageIndicator.propTypes = {
  /** Feature key to show usage for */
  feature: PropTypes.string.isRequired,
  
  /** Display variant */
  variant: PropTypes.oneOf(['bar', 'circular', 'badge', 'inline']),
  
  /** Size */
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  
  /** Show feature label */
  showLabel: PropTypes.bool,
  
  /** Show percentage */
  showPercentage: PropTypes.bool,
  
  /** Show remaining count */
  showRemaining: PropTypes.bool,
  
  /** Show reset date */
  showResetDate: PropTypes.bool,
  
  /** Show icon */
  showIcon: PropTypes.bool,
  
  /** Additional CSS classes */
  className: PropTypes.string,
  
  /** Warning threshold percentage (default: 80) */
  warningThreshold: PropTypes.number,
  
  /** Danger threshold percentage (default: 95) */
  dangerThreshold: PropTypes.number,
  
  /** Callback when approaching limit */
  onLimitApproaching: PropTypes.func,
  
  /** Callback when limit exceeded */
  onLimitExceeded: PropTypes.func
};

export default UsageIndicator;

import React from 'react';
import PropTypes from 'prop-types';
import { useSubscriptionFeatures } from '../../hooks/useFeatureAccess';

/**
 * UpgradePrompt Component
 * Beautiful modal/banner to encourage users to upgrade their subscription
 * 
 * @example
 * <UpgradePrompt 
 *   feature="courses.premium"
 *   reason="Access premium courses"
 *   show={true}
 *   onClose={() => setShow(false)}
 * />
 */
const UpgradePrompt = ({
  feature = null,
  reason = null,
  show = true,
  onClose = null,
  onUpgrade = null,
  type = 'modal',
  title = null,
  description = null,
  showComparison = true,
  ctaText = 'Upgrade Now',
  ctaVariant = 'primary',
  className = ''
}) => {
  const { plan: currentPlan, loading } = useSubscriptionFeatures();
  const [isVisible, setIsVisible] = React.useState(show);

  React.useEffect(() => {
    setIsVisible(show);
  }, [show]);

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) onClose();
  };

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      // Default: redirect to subscription page
      window.location.href = '/student/subscription';
    }
  };

  if (!isVisible) return null;

  // Default messages
  const defaultTitle = feature 
    ? '🔒 Upgrade to Access This Feature'
    : '✨ Unlock More Features';
  
  const defaultDescription = reason 
    ? reason
    : 'Upgrade your subscription to unlock premium features and get the most out of your learning experience.';

  // Sample plan comparison (this should ideally come from backend)
  const planComparison = [
    {
      name: 'Free',
      price: '₹0/month',
      features: ['2 courses', '5 live sessions', 'Basic support'],
      current: currentPlan?.name === 'Free'
    },
    {
      name: 'Standard',
      price: '₹19/month',
      features: ['10 courses', 'Unlimited live sessions', 'Priority support', 'HD videos'],
      current: currentPlan?.name === 'Standard',
      recommended: true
    },
    {
      name: 'Premium',
      price: '₹39/month',
      features: ['Unlimited courses', 'All features', '1-on-1 tutoring', 'Offline access', 'Advanced analytics'],
      current: currentPlan?.name === 'Premium'
    }
  ];

  if (type === 'banner') {
    return (
      <div className={`upgrade-banner ${className}`}>
        <div className="upgrade-banner-content">
          <div className="upgrade-banner-icon">🚀</div>
          <div className="upgrade-banner-text">
            <strong>{title || defaultTitle}</strong>
            <p>{description || defaultDescription}</p>
          </div>
          <div className="upgrade-banner-actions">
            <button
              className={`btn btn-${ctaVariant}`}
              onClick={handleUpgrade}
            >
              {ctaText}
            </button>
            {onClose && (
              <button
                className="btn btn-link"
                onClick={handleClose}
              >
                Maybe Later
              </button>
            )}
          </div>
        </div>

        <style jsx>{`
          .upgrade-banner {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }

          .upgrade-banner-content {
            display: flex;
            align-items: center;
            gap: 20px;
          }

          .upgrade-banner-icon {
            font-size: 2.5rem;
          }

          .upgrade-banner-text {
            flex: 1;
          }

          .upgrade-banner-text strong {
            font-size: 1.25rem;
            display: block;
            margin-bottom: 5px;
          }

          .upgrade-banner-text p {
            margin: 0;
            opacity: 0.9;
          }

          .upgrade-banner-actions {
            display: flex;
            gap: 10px;
            align-items: center;
          }

          @media (max-width: 768px) {
            .upgrade-banner-content {
              flex-direction: column;
              text-align: center;
            }
          }
        `}</style>
      </div>
    );
  }

  // Modal version
  return (
    <>
      <div className={`modal fade show d-block ${className}`} tabIndex="-1" role="dialog">
        <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
          <div className="modal-content upgrade-modal">
            {/* Header */}
            <div className="modal-header border-0">
              <h5 className="modal-title">{title || defaultTitle}</h5>
              {onClose && (
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleClose}
                  aria-label="Close"
                ></button>
              )}
            </div>

            {/* Body */}
            <div className="modal-body">
              <p className="text-center mb-4">
                {description || defaultDescription}
              </p>

              {showComparison && !loading && (
                <div className="plan-comparison">
                  <div className="row g-3">
                    {planComparison.map((plan, index) => (
                      <div key={index} className="col-md-4">
                        <div className={`plan-card ${plan.current ? 'current-plan' : ''} ${plan.recommended ? 'recommended' : ''}`}>
                          {plan.recommended && (
                            <div className="recommended-badge">Recommended</div>
                          )}
                          {plan.current && (
                            <div className="current-badge">Current Plan</div>
                          )}
                          <h4 className="plan-name">{plan.name}</h4>
                          <div className="plan-price">{plan.price}</div>
                          <ul className="plan-features">
                            {plan.features.map((f, i) => (
                              <li key={i}>✓ {f}</li>
                            ))}
                          </ul>
                          {!plan.current && (
                            <button
                              className={`btn btn-${plan.recommended ? ctaVariant : 'outline-' + ctaVariant} w-100`}
                              onClick={handleUpgrade}
                            >
                              Choose {plan.name}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {feature && (
                <div className="feature-highlight mt-4">
                  <div className="alert alert-info">
                    <strong>🎯 Feature Required:</strong> {feature}
                    {reason && <p className="mb-0 mt-2">{reason}</p>}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="modal-footer border-0">
              {onClose && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleClose}
                >
                  Maybe Later
                </button>
              )}
              <button
                type="button"
                className={`btn btn-${ctaVariant}`}
                onClick={handleUpgrade}
              >
                {ctaText}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Backdrop */}
      <div className="modal-backdrop fade show"></div>

      {/* Styles */}
      <style jsx>{`
        .upgrade-modal {
          border: none;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        }

        .modal-header {
          padding: 2rem 2rem 1rem 2rem;
        }

        .modal-title {
          font-size: 1.5rem;
          font-weight: 700;
          width: 100%;
          text-align: center;
        }

        .modal-body {
          padding: 1rem 2rem 2rem 2rem;
        }

        .plan-comparison {
          margin-top: 1.5rem;
        }

        .plan-card {
          border: 2px solid #e0e0e0;
          border-radius: 12px;
          padding: 1.5rem;
          text-align: center;
          position: relative;
          transition: all 0.3s ease;
          height: 100%;
        }

        .plan-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
        }

        .plan-card.recommended {
          border-color: var(--bs-primary);
          box-shadow: 0 5px 20px rgba(13, 110, 253, 0.2);
        }

        .plan-card.current-plan {
          background-color: #f8f9fa;
          border-color: #6c757d;
        }

        .recommended-badge,
        .current-badge {
          position: absolute;
          top: -10px;
          left: 50%;
          transform: translateX(-50%);
          background: var(--bs-primary);
          color: white;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .current-badge {
          background: #6c757d;
        }

        .plan-name {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          margin-top: 0.5rem;
        }

        .plan-price {
          font-size: 2rem;
          font-weight: 700;
          color: var(--bs-primary);
          margin-bottom: 1rem;
        }

        .plan-features {
          list-style: none;
          padding: 0;
          margin: 1.5rem 0;
          text-align: left;
        }

        .plan-features li {
          padding: 0.5rem 0;
          border-bottom: 1px solid #f0f0f0;
        }

        .plan-features li:last-child {
          border-bottom: none;
        }

        .feature-highlight {
          border-top: 1px solid #e0e0e0;
          padding-top: 1rem;
        }

        @media (max-width: 768px) {
          .plan-card {
            margin-bottom: 1rem;
          }
        }
      `}</style>
    </>
  );
};

UpgradePrompt.propTypes = {
  /** Feature key that triggered the prompt */
  feature: PropTypes.string,
  
  /** Reason for upgrade requirement */
  reason: PropTypes.string,
  
  /** Whether to show the prompt */
  show: PropTypes.bool,
  
  /** Callback when closed */
  onClose: PropTypes.func,
  
  /** Callback when upgrade button clicked */
  onUpgrade: PropTypes.func,
  
  /** Display type */
  type: PropTypes.oneOf(['modal', 'banner']),
  
  /** Custom title */
  title: PropTypes.string,
  
  /** Custom description */
  description: PropTypes.string,
  
  /** Show plan comparison */
  showComparison: PropTypes.bool,
  
  /** CTA button text */
  ctaText: PropTypes.string,
  
  /** CTA button variant */
  ctaVariant: PropTypes.string,
  
  /** Additional CSS classes */
  className: PropTypes.string
};

export default UpgradePrompt;

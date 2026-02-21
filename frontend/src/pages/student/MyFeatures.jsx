import { useState } from 'react';
import { useQuery } from 'react-query';
import { Crown, Star, TrendingUp, Lock, Unlock, Search, Filter } from 'lucide-react';
import { useSubscriptionFeatures, useFeatureUsage } from '@/hooks/useFeatureAccess';
import { UsageIndicator, FeatureBadge, UpgradePrompt } from '@/components/common';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorMessage from '@/components/common/ErrorMessage';
import SEOHead from '@/components/SEO/SEOHead';
import { useAuthStore } from '@/store/authStore';
import { Link } from 'react-router-dom';

export default function MyFeatures() {
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Get subscription features
  const { 
    features, 
    loading: featuresLoading, 
    error: featuresError,
    currentPlan 
  } = useSubscriptionFeatures();

  // Get usage data
  const { 
    usageData, 
    loading: usageLoading 
  } = useFeatureUsage();

  if (featuresLoading || usageLoading) return <LoadingSpinner fullScreen />;
  if (featuresError) return <ErrorMessage message={featuresError.message || 'Failed to load features'} />;

  // Group features by category
  const featuresByCategory = features.reduce((acc, feature) => {
    const category = feature.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(feature);
    return acc;
  }, {});

  // Filter features
  const filteredCategories = Object.entries(featuresByCategory).reduce((acc, [category, categoryFeatures]) => {
    const filtered = categoryFeatures.filter(feature => {
      const matchesSearch = feature.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          feature.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'all' || category === filterCategory;
      return matchesSearch && matchesCategory;
    });
    if (filtered.length > 0) {
      acc[category] = filtered;
    }
    return acc;
  }, {});

  // Calculate stats
  const totalFeatures = features.length;
  const accessibleFeatures = features.filter(f => f.enabled).length;
  const featuresWithLimits = features.filter(f => f.enabled && f.hasLimit && f.limit !== null).length;

  // Get features with high usage
  const highUsageFeatures = usageData.filter(u => {
    if (u.limit === null) return false;
    const percentage = (u.used / u.limit) * 100;
    return percentage >= 80;
  });

  const categoryIcons = {
    'Course Access': '📚',
    'Live Sessions': '🎥',
    'Quiz Features': '📝',
    'Materials & Downloads': '📥',
    'Performance Tracking': '📊',
    'AI Features': '🤖',
    'Community Features': '👥',
    'Support & Help': '💬'
  };

  const planBadgeType = {
    'Free': 'free',
    'Basic': 'free',
    'Standard': 'pro',
    'Premium': 'premium',
    'Enterprise': 'enterprise'
  };

  return (
    <>
      <SEOHead
        title="My Features & Usage"
        description="View your subscription features and usage statistics"
      />

      <div className="container-fluid py-4">
        {/* Header */}
        <div className="mb-4">
          <h2 className="mb-1">My Features & Usage</h2>
          <p className="text-muted mb-0">View your subscription plan and feature usage</p>
        </div>

        {/* Current Plan Card */}
        <div className="row mb-4">
          <div className="col-md-8 mx-auto">
            <div className="card shadow-sm border-0" style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white'
            }}>
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <h3 className="mb-0">{currentPlan?.name || 'Free Plan'}</h3>
                      <FeatureBadge 
                        type={planBadgeType[currentPlan?.name] || 'free'}
                        size="lg"
                      />
                    </div>
                    <p className="mb-0 opacity-75">
                      {currentPlan?.description || 'Start with basic features'}
                    </p>
                  </div>
                  <div className="text-end">
                    <div className="h2 mb-0">${currentPlan?.price || 0}</div>
                    <small className="opacity-75">per month</small>
                  </div>
                </div>

                <div className="row g-3 mt-3">
                  <div className="col-4">
                    <div className="text-center">
                      <div className="h4 mb-1">{accessibleFeatures}</div>
                      <small className="opacity-75">Active Features</small>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="text-center border-start border-end border-white border-opacity-25">
                      <div className="h4 mb-1">{featuresWithLimits}</div>
                      <small className="opacity-75">With Limits</small>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="text-center">
                      <div className="h4 mb-1">{totalFeatures - accessibleFeatures}</div>
                      <small className="opacity-75">Locked</small>
                    </div>
                  </div>
                </div>

                <div className="d-flex gap-2 mt-4">
                  <Link to="/student/subscription" className="btn btn-light flex-grow-1">
                    Manage Subscription
                  </Link>
                  <button 
                    className="btn btn-warning flex-grow-1"
                    onClick={() => setShowUpgradeModal(true)}
                  >
                    <Crown size={16} className="me-2" />
                    Upgrade Plan
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* High Usage Alert */}
        {highUsageFeatures.length > 0 && (
          <div className="alert alert-warning d-flex align-items-start mb-4">
            <TrendingUp size={20} className="me-2 mt-1 flex-shrink-0" />
            <div>
              <strong>Usage Alert:</strong> You're approaching the limit on {highUsageFeatures.length} feature(s).
              Consider upgrading to get unlimited access.
            </div>
          </div>
        )}

        {/* Usage Overview Section */}
        {usageData.length > 0 && (
          <div className="mb-4">
            <h4 className="mb-3">Usage Overview</h4>
            <div className="row g-3">
              {usageData.slice(0, 6).map(usage => (
                <div key={usage.featureKey} className="col-md-6 col-lg-4">
                  <div className="card h-100">
                    <div className="card-body">
                      <UsageIndicator
                        feature={usage.featureKey}
                        variant="bar"
                        showLabel={true}
                        showRemaining={true}
                        showResetDate={true}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search and Filter */}
        <div className="d-flex gap-2 mb-3">
          <div className="input-group flex-grow-1" style={{ maxWidth: '400px' }}>
            <span className="input-group-text">
              <Search size={16} />
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Search features..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="form-select"
            style={{ maxWidth: '200px' }}
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            {Object.keys(featuresByCategory).map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Features by Category */}
        <div className="row">
          <div className="col-12">
            {Object.entries(filteredCategories).map(([category, categoryFeatures]) => (
              <div key={category} className="mb-4">
                <h5 className="mb-3 d-flex align-items-center">
                  <span className="me-2">{categoryIcons[category] || '📁'}</span>
                  {category}
                  <span className="badge bg-secondary ms-2">{categoryFeatures.length}</span>
                </h5>
                <div className="row g-3">
                  {categoryFeatures.map(feature => {
                    const usage = usageData.find(u => u.featureKey === feature.key);
                    const isAccessible = feature.enabled;
                    
                    return (
                      <div key={feature.key} className="col-md-6 col-lg-4">
                        <div className={`card h-100 ${!isAccessible ? 'border-secondary' : ''}`}>
                          <div className="card-body">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <h6 className="mb-0">{feature.name}</h6>
                              {isAccessible ? (
                                <Unlock size={18} className="text-success" />
                              ) : (
                                <Lock size={18} className="text-secondary" />
                              )}
                            </div>
                            <p className="text-muted small mb-3">{feature.description}</p>

                            {isAccessible && feature.hasLimit && (
                              <div className="mb-2">
                                {feature.limit === null ? (
                                  <span className="badge bg-success">
                                    <Star size={12} className="me-1" />
                                    Unlimited
                                  </span>
                                ) : usage ? (
                                  <UsageIndicator
                                    feature={feature.key}
                                    variant="badge"
                                    showPercentage={false}
                                  />
                                ) : (
                                  <span className="badge bg-primary">
                                    Limit: {feature.limit}
                                  </span>
                                )}
                              </div>
                            )}

                            {isAccessible && !feature.hasLimit && (
                              <span className="badge bg-info">Always Available</span>
                            )}

                            {!isAccessible && (
                              <button
                                className="btn btn-sm btn-outline-warning w-100"
                                onClick={() => setShowUpgradeModal(true)}
                              >
                                <Crown size={14} className="me-1" />
                                Upgrade to Unlock
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* No Results */}
        {Object.keys(filteredCategories).length === 0 && (
          <div className="text-center py-5">
            <Filter size={48} className="text-muted mb-3" />
            <h5 className="text-muted">No features found</h5>
            <p className="text-muted">Try adjusting your search or filter</p>
          </div>
        )}
      </div>

      {/* Upgrade Modal */}
      <UpgradePrompt
        show={showUpgradeModal}
        type="modal"
        onClose={() => setShowUpgradeModal(false)}
        showComparison={true}
      />
    </>
  );
}

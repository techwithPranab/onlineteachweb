import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Save, RefreshCw, Plus, ChevronDown, ChevronRight, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { usePlanComparison, useFeatureManagement } from '@/hooks/useAdminFeatures';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorMessage from '@/components/common/ErrorMessage';
import SEOHead from '@/components/SEO/SEOHead';

export default function FeatureManagement() {
  const queryClient = useQueryClient();
  const [expandedCategories, setExpandedCategories] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);

  // Get plan comparison data
  const {
    plans,
    features,
    featuresByCategory,
    matrix,
    loading,
    error,
    toggleFeature,
    setFeatureLimit,
    savePlanChanges
  } = usePlanComparison();

  const { seedFeatures, loading: seeding } = useFeatureManagement();

  // Toggle category expansion
  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // Expand all categories
  const expandAll = () => {
    const allExpanded = {};
    Object.keys(featuresByCategory || {}).forEach(cat => {
      allExpanded[cat] = true;
    });
    setExpandedCategories(allExpanded);
  };

  // Collapse all categories
  const collapseAll = () => {
    setExpandedCategories({});
  };

  // Handle feature toggle
  const handleToggle = (planId, featureKey) => {
    toggleFeature(planId, featureKey);
    setHasChanges(true);
    setSaveStatus(null);
  };

  // Handle limit change
  const handleLimitChange = (planId, featureKey, value) => {
    const limit = value === '' || value === 'unlimited' ? null : parseInt(value);
    setFeatureLimit(planId, featureKey, limit);
    setHasChanges(true);
    setSaveStatus(null);
  };

  // Save all changes
  const handleSave = async () => {
    try {
      setSaveStatus('saving');
      await savePlanChanges();
      setHasChanges(false);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err) {
      setSaveStatus('error');
      console.error('Save error:', err);
    }
  };

  // Seed features
  const handleSeedFeatures = async () => {
    try {
      await seedFeatures();
      queryClient.invalidateQueries('planComparison');
    } catch (err) {
      console.error('Seed error:', err);
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;
  if (error) return <ErrorMessage message={error.message || 'Failed to load features'} />;

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

  return (
    <>
      <SEOHead
        title="Feature Management - Admin"
        description="Manage subscription plan features and limits"
      />

      <div className="container-fluid py-4">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="mb-1">Feature Management</h2>
            <p className="text-muted mb-0">Configure features and limits for each subscription plan</p>
          </div>
          <div className="d-flex gap-2">
            <button
              className="btn btn-outline-secondary"
              onClick={handleSeedFeatures}
              disabled={seeding}
            >
              {seeding ? (
                <>
                  <RefreshCw className="spin me-2" size={16} />
                  Seeding...
                </>
              ) : (
                <>
                  <Plus size={16} className="me-2" />
                  Seed Features
                </>
              )}
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={!hasChanges || saveStatus === 'saving'}
            >
              {saveStatus === 'saving' ? (
                <>
                  <RefreshCw className="spin me-2" size={16} />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} className="me-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>

        {/* Save Status Alert */}
        {saveStatus === 'success' && (
          <div className="alert alert-success d-flex align-items-center mb-4" role="alert">
            <CheckCircle size={20} className="me-2" />
            Changes saved successfully!
          </div>
        )}
        {saveStatus === 'error' && (
          <div className="alert alert-danger d-flex align-items-center mb-4" role="alert">
            <AlertCircle size={20} className="me-2" />
            Failed to save changes. Please try again.
          </div>
        )}

        {/* Info Alert */}
        <div className="alert alert-info d-flex align-items-start mb-4" role="alert">
          <Info size={20} className="me-2 mt-1 flex-shrink-0" />
          <div>
            <strong>How to use:</strong> Toggle features ON/OFF for each plan. Set numeric limits or leave as "Unlimited" (∞).
            Changes are highlighted in yellow. Click "Save Changes" when done.
          </div>
        </div>

        {/* View Controls */}
        <div className="d-flex gap-2 mb-3">
          <button className="btn btn-sm btn-outline-secondary" onClick={expandAll}>
            Expand All
          </button>
          <button className="btn btn-sm btn-outline-secondary" onClick={collapseAll}>
            Collapse All
          </button>
        </div>

        {/* Plan Comparison Table */}
        <div className="card shadow-sm">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light sticky-top">
                  <tr>
                    <th style={{ width: '35%', minWidth: '250px' }}>Feature</th>
                    {plans.map(plan => (
                      <th key={plan._id} className="text-center" style={{ width: `${65 / plans.length}%` }}>
                        <div>
                          <div className="fw-bold">{plan.name}</div>
                          <div className="text-muted small">${plan.price}/month</div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(featuresByCategory || {}).map(([category, categoryFeatures]) => {
                    const isExpanded = expandedCategories[category];
                    return (
                      <React.Fragment key={category}>
                        {/* Category Header */}
                        <tr 
                          className="table-secondary cursor-pointer"
                          onClick={() => toggleCategory(category)}
                          style={{ cursor: 'pointer' }}
                        >
                          <td colSpan={plans.length + 1}>
                            <div className="d-flex align-items-center fw-bold">
                              {isExpanded ? (
                                <ChevronDown size={20} className="me-2" />
                              ) : (
                                <ChevronRight size={20} className="me-2" />
                              )}
                              <span className="me-2">{categoryIcons[category] || '📁'}</span>
                              {category}
                              <span className="badge bg-secondary ms-2">{categoryFeatures.length}</span>
                            </div>
                          </td>
                        </tr>

                        {/* Category Features */}
                        {isExpanded && categoryFeatures.map(feature => (
                          <tr key={feature.key}>
                            <td>
                              <div className="ps-4">
                                <div className="fw-medium">{feature.name}</div>
                                <div className="text-muted small">{feature.description}</div>
                              </div>
                            </td>
                            {plans.map(plan => {
                              const featureData = matrix[plan._id]?.[feature.key];
                              const isEnabled = featureData?.enabled || false;
                              const limit = featureData?.limit;
                              
                              return (
                                <td key={plan._id} className="text-center align-middle">
                                  <div className="d-flex flex-column align-items-center gap-2">
                                    {/* Toggle Switch */}
                                    <div className="form-check form-switch">
                                      <input
                                        className="form-check-input"
                                        type="checkbox"
                                        checked={isEnabled}
                                        onChange={() => handleToggle(plan._id, feature.key)}
                                        style={{ cursor: 'pointer' }}
                                      />
                                    </div>

                                    {/* Limit Input */}
                                    {isEnabled && (
                                      <div style={{ minWidth: '100px' }}>
                                        {feature.hasLimit ? (
                                          <input
                                            type="text"
                                            className="form-control form-control-sm text-center"
                                            value={limit === null ? 'unlimited' : limit}
                                            onChange={(e) => handleLimitChange(plan._id, feature.key, e.target.value)}
                                            placeholder="∞"
                                            style={{ fontSize: '0.875rem' }}
                                          />
                                        ) : (
                                          <span className="badge bg-success">Enabled</span>
                                        )}
                                      </div>
                                    )}

                                    {!isEnabled && (
                                      <span className="badge bg-secondary">Disabled</span>
                                    )}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="row mt-4">
          {plans.map(plan => {
            const planFeatures = Object.values(matrix[plan._id] || {});
            const enabledCount = planFeatures.filter(f => f.enabled).length;
            const totalCount = features.length;
            
            return (
              <div key={plan._id} className="col-md-4 mb-3">
                <div className="card">
                  <div className="card-body">
                    <h5 className="card-title">{plan.name}</h5>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span>Features Enabled:</span>
                      <span className="badge bg-primary">{enabledCount} / {totalCount}</span>
                    </div>
                    <div className="progress">
                      <div
                        className="progress-bar"
                        role="progressbar"
                        style={{ width: `${(enabledCount / totalCount) * 100}%` }}
                        aria-valuenow={enabledCount}
                        aria-valuemin="0"
                        aria-valuemax={totalCount}
                      >
                        {Math.round((enabledCount / totalCount) * 100)}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Unsaved Changes Warning */}
        {hasChanges && (
          <div className="position-fixed bottom-0 start-50 translate-middle-x mb-4" style={{ zIndex: 1050 }}>
            <div className="alert alert-warning shadow-lg d-flex align-items-center" role="alert">
              <AlertCircle size={20} className="me-2" />
              You have unsaved changes. Click "Save Changes" to apply them.
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .cursor-pointer {
          cursor: pointer;
        }
        .table tbody tr:hover {
          background-color: rgba(0, 0, 0, 0.02);
        }
      `}</style>
    </>
  );
}

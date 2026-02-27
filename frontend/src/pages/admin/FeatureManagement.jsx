import { useState, Fragment } from 'react';
import { useQueryClient } from 'react-query';
import { Save, RefreshCw, Plus, ChevronDown, ChevronRight, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { usePlanComparison, useFeatureManagement } from '@/hooks/useAdminFeatures';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorMessage from '@/components/common/ErrorMessage';
import SEOHead from '@/components/SEO/SEOHead';

export default function FeatureManagement() {
  const queryClient = useQueryClient();
  const [expandedCategories, setExpandedCategories] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // null | 'saving' | 'success' | 'error'

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

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({ ...prev, [category]: !prev[category] }));
  };

  const expandAll = () => {
    const all = {};
    Object.keys(featuresByCategory || {}).forEach(cat => { all[cat] = true; });
    setExpandedCategories(all);
  };

  const collapseAll = () => setExpandedCategories({});

  const handleToggle = (planId, featureKey) => {
    toggleFeature(planId, featureKey);
    setHasChanges(true);
    setSaveStatus(null);
  };

  const handleLimitChange = (planId, featureKey, value) => {
    const limit = value === '' || value === 'unlimited' ? null : parseInt(value);
    setFeatureLimit(planId, featureKey, limit);
    setHasChanges(true);
    setSaveStatus(null);
  };

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

  const handleSeedFeatures = async () => {
    try {
      await seedFeatures();
      queryClient.invalidateQueries('planComparison');
    } catch (err) {
      console.error('Seed error:', err);
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;
  if (error) return <ErrorMessage message={error?.message || 'Failed to load features'} />;

  const categoryIcons = {
    'Course Access': '📚',
    'Live Sessions': '🎥',
    'Quiz Features': '📝',
    'Materials & Downloads': '📥',
    'Performance Tracking': '📊',
    'AI Features': '🤖',
    'Community Features': '👥',
    'Support & Help': '💬',
  };

  const totalFeatures = features?.length || 0;

  return (
    <>
      <SEOHead
        title="Feature Management - Admin"
        description="Manage subscription plan features and limits"
        noIndex={true}
        noFollow={true}
      />

      <div className="space-y-6">

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Feature Management</h1>
            <p className="text-sm text-gray-500 mt-1">
              Configure features and limits for each subscription plan
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleSeedFeatures}
              disabled={seeding}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {seeding ? <RefreshCw size={15} className="animate-spin" /> : <Plus size={15} />}
              {seeding ? 'Seeding…' : 'Seed Features'}
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges || saveStatus === 'saving'}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-sm"
            >
              {saveStatus === 'saving' ? <RefreshCw size={15} className="animate-spin" /> : <Save size={15} />}
              {saveStatus === 'saving' ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* ── Status alerts ─────────────────────────────────────────────────── */}
        {saveStatus === 'success' && (
          <div className="flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
            <CheckCircle size={18} className="flex-shrink-0 text-green-600" />
            Changes saved successfully!
          </div>
        )}
        {saveStatus === 'error' && (
          <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
            <AlertCircle size={18} className="flex-shrink-0 text-red-600" />
            Failed to save changes. Please try again.
          </div>
        )}

        {/* Info banner */}
        <div className="flex items-start gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm">
          <Info size={18} className="flex-shrink-0 mt-0.5 text-blue-500" />
          <div>
            <span className="font-semibold">How to use: </span>
            Toggle features ON/OFF for each plan. Set numeric limits or leave as "Unlimited" (∞).
            Click <strong>Save Changes</strong> when done.
          </div>
        </div>

        {/* ── Per-plan summary cards ─────────────────────────────────────────── */}
        {plans?.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map(plan => {
              const planFeatures = Object.values(matrix?.[plan._id] || {});
              const enabledCount = planFeatures.filter(f => f.enabled).length;
              const pct = totalFeatures > 0 ? Math.round((enabledCount / totalFeatures) * 100) : 0;
              return (
                <div key={plan._id} className="card p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-semibold text-gray-900">{plan.name}</p>
                      <p className="text-xs text-gray-500">₹{plan.price}/month</p>
                    </div>
                    <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-700">
                      {enabledCount} / {totalFeatures}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1 text-right">{pct}% enabled</p>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Feature matrix table ───────────────────────────────────────────── */}
        <div className="card overflow-hidden">

          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
            <p className="text-sm font-medium text-gray-600">
              {Object.keys(featuresByCategory || {}).length} categories · {totalFeatures} features
            </p>
            <div className="flex gap-2">
              <button
                onClick={expandAll}
                className="px-3 py-1.5 text-xs border border-gray-300 rounded-md text-gray-600 bg-white hover:bg-gray-50 transition-colors"
              >
                Expand All
              </button>
              <button
                onClick={collapseAll}
                className="px-3 py-1.5 text-xs border border-gray-300 rounded-md text-gray-600 bg-white hover:bg-gray-50 transition-colors"
              >
                Collapse All
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-700" style={{ minWidth: '260px' }}>
                    Feature
                  </th>
                  {plans?.map(plan => (
                    <th
                      key={plan._id}
                      className="text-center px-4 py-3 font-semibold text-gray-700 whitespace-nowrap"
                      style={{ minWidth: '140px' }}
                    >
                      <div className="text-gray-900">{plan.name}</div>
                      <div className="text-xs text-gray-400 font-normal">₹{plan.price}/mo</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {Object.entries(featuresByCategory || {}).map(([category, categoryFeatures]) => {
                  const isExpanded = expandedCategories[category];
                  return (
                    <Fragment key={category}>

                      {/* Category header row */}
                      <tr
                        className="bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer select-none"
                        onClick={() => toggleCategory(category)}
                      >
                        <td
                          className="px-4 py-2.5 font-semibold text-gray-700"
                          colSpan={(plans?.length || 0) + 1}
                        >
                          <div className="flex items-center gap-2">
                            {isExpanded
                              ? <ChevronDown size={16} className="text-gray-400" />
                              : <ChevronRight size={16} className="text-gray-400" />
                            }
                            <span className="text-base">{categoryIcons[category] || '📁'}</span>
                            <span>{category}</span>
                            <span className="px-2 py-0.5 text-xs rounded-full bg-gray-200 text-gray-600 ml-1">
                              {categoryFeatures.length}
                            </span>
                          </div>
                        </td>
                      </tr>

                      {/* Feature rows */}
                      {isExpanded && categoryFeatures.map(feature => (
                        <tr key={feature.key} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 pl-10">
                            <p className="font-medium text-gray-800">{feature.name}</p>
                            {feature.description && (
                              <p className="text-xs text-gray-500 mt-0.5">{feature.description}</p>
                            )}
                          </td>
                          {plans?.map(plan => {
                            const featureData = matrix?.[plan._id]?.[feature.key];
                            const isEnabled = featureData?.enabled || false;
                            const limit = featureData?.limit;
                            return (
                              <td key={plan._id} className="px-4 py-3 text-center align-middle">
                                <div className="flex flex-col items-center gap-2">

                                  {/* Toggle switch */}
                                  <button
                                    role="switch"
                                    aria-checked={isEnabled}
                                    onClick={() => handleToggle(plan._id, feature.key)}
                                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                                      isEnabled ? 'bg-indigo-600' : 'bg-gray-300'
                                    }`}
                                  >
                                    <span
                                      className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
                                        isEnabled ? 'translate-x-4' : 'translate-x-1'
                                      }`}
                                    />
                                  </button>

                                  {/* Limit / badge */}
                                  {isEnabled ? (
                                    feature.hasLimit ? (
                                      <input
                                        type="text"
                                        value={limit === null ? 'unlimited' : limit}
                                        onChange={e => handleLimitChange(plan._id, feature.key, e.target.value)}
                                        placeholder="∞"
                                        className="w-20 text-center text-xs border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                                      />
                                    ) : (
                                      <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700 font-medium">
                                        Enabled
                                      </span>
                                    )
                                  ) : (
                                    <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-500 font-medium">
                                      Off
                                    </span>
                                  )}

                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}

                    </Fragment>
                  );
                })}
              </tbody>
            </table>

            {/* Empty state */}
            {Object.keys(featuresByCategory || {}).length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <Info size={40} className="mb-3 opacity-30" />
                <p className="font-medium text-gray-500">No features found</p>
                <p className="text-sm mt-1">Click <strong>Seed Features</strong> to populate the list.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ── Floating unsaved changes banner ───────────────────────────────── */}
      {hasChanges && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-3 px-5 py-3 bg-amber-50 border border-amber-300 rounded-xl shadow-lg text-amber-800 text-sm whitespace-nowrap">
            <AlertCircle size={18} className="flex-shrink-0 text-amber-500" />
            You have unsaved changes.
            <button
              onClick={handleSave}
              disabled={saveStatus === 'saving'}
              className="ml-2 px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              Save now
            </button>
          </div>
        </div>
      )}
    </>
  );
}

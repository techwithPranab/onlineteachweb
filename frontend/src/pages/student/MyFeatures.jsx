import { useState } from 'react';
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

  // Normalise: features may come back as an object map { key: featureObj } or an array
  const featuresArray = Array.isArray(features)
    ? features
    : Object.values(features || {});

  // Group features by category
  const featuresByCategory = featuresArray.reduce((acc, feature) => {
    const category = feature.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(feature);
    return acc;
  }, {});

  // Filter features
  const filteredCategories = Object.entries(featuresByCategory).reduce((acc, [category, categoryFeatures]) => {
    const filtered = categoryFeatures.filter(feature => {
      const matchesSearch =
        feature.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (feature.description || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'all' || category === filterCategory;
      return matchesSearch && matchesCategory;
    });
    if (filtered.length > 0) acc[category] = filtered;
    return acc;
  }, {});

  // Calculate stats
  const allFeatures = featuresArray;
  const totalFeatures = allFeatures.length;
  const accessibleFeatures = allFeatures.filter(f => f.enabled).length;
  const featuresWithLimits = allFeatures.filter(f => f.enabled && f.hasLimit && f.limit !== null).length;

  // Get features with high usage (≥80%)
  const safeUsageData = usageData || [];
  const highUsageFeatures = safeUsageData.filter(u => {
    if (!u.limit) return false;
    return (u.used / u.limit) * 100 >= 80;
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
        noIndex={true}
        noFollow={true}
      />

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">

          {/* ── Page Header ──────────────────────────────────────── */}
          <div className="genz-card mb-4 sm:mb-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-indigo-500" />
            <div className="p-4 sm:p-5 lg:p-6">
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                ⚡ My Features &amp; Usage
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">
                View your subscription plan and feature usage
              </p>
            </div>
          </div>

          {/* ── Current Plan Card ─────────────────────────────────── */}
          <div className="max-w-3xl mx-auto mb-4 sm:mb-6">
            <div className="rounded-2xl shadow-xl overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              <div className="p-5 sm:p-6 lg:p-8 text-white">
                {/* Plan name + price row */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h2 className="text-xl sm:text-2xl font-bold">
                        {currentPlan?.name || 'Free Plan'}
                      </h2>
                      <FeatureBadge
                        type={planBadgeType[currentPlan?.name] || 'free'}
                        size="lg"
                      />
                    </div>
                    <p className="text-white/75 text-sm sm:text-base">
                      {currentPlan?.description || 'Start with basic features'}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-3xl sm:text-4xl font-extrabold">
                      ₹{currentPlan?.price || 0}
                    </div>
                    <div className="text-white/75 text-sm">per month</div>
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl font-bold">{accessibleFeatures}</div>
                    <div className="text-white/75 text-xs sm:text-sm mt-1">Active Features</div>
                  </div>
                  <div className="text-center border-x border-white/25">
                    <div className="text-2xl sm:text-3xl font-bold">{featuresWithLimits}</div>
                    <div className="text-white/75 text-xs sm:text-sm mt-1">With Limits</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl font-bold">{totalFeatures - accessibleFeatures}</div>
                    <div className="text-white/75 text-xs sm:text-sm mt-1">Locked</div>
                  </div>
                </div>

                {/* CTA buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    to="/student/subscription"
                    className="flex-1 text-center py-2.5 sm:py-3 rounded-xl bg-white text-purple-700 font-bold text-sm sm:text-base hover:bg-white/90 transition-all hover:scale-105 min-h-[44px] flex items-center justify-center"
                  >
                    Manage Subscription
                  </Link>
                  <button
                    className="flex-1 py-2.5 sm:py-3 rounded-xl bg-amber-400 text-gray-900 font-bold text-sm sm:text-base hover:bg-amber-300 transition-all hover:scale-105 flex items-center justify-center gap-2 min-h-[44px]"
                    onClick={() => setShowUpgradeModal(true)}
                  >
                    <Crown size={16} />
                    Upgrade Plan
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ── High Usage Alert ──────────────────────────────────── */}
          {highUsageFeatures.length > 0 && (
            <div className="flex items-start gap-3 bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 mb-4 sm:mb-6">
              <TrendingUp size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-amber-800 text-sm sm:text-base">
                <span className="font-bold">Usage Alert: </span>
                You're approaching the limit on {highUsageFeatures.length} feature(s).
                Consider upgrading to get unlimited access.
              </p>
            </div>
          )}

          {/* ── Usage Overview ────────────────────────────────────── */}
          {safeUsageData.length > 0 && (
            <div className="mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">
                📊 Usage Overview
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {safeUsageData.slice(0, 6).map(usage => (
                  <div key={usage.featureKey} className="genz-card p-4 hover:shadow-md transition-all">
                    <UsageIndicator
                      feature={usage.featureKey}
                      variant="bar"
                      showLabel={true}
                      showRemaining={true}
                      showResetDate={true}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Search and Filter ─────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4 sm:mb-6">
            <div className="relative flex-1 max-w-full sm:max-w-sm">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border-2 border-gray-200 bg-white focus:outline-none focus:border-purple-400 text-sm transition-colors min-h-[44px]"
                placeholder="Search features..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="w-full sm:w-48 px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-white focus:outline-none focus:border-purple-400 text-sm transition-colors min-h-[44px]"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              {Object.keys(featuresByCategory).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* ── Features by Category ──────────────────────────────── */}
          <div className="space-y-6 sm:space-y-8">
            {Object.entries(filteredCategories).map(([category, categoryFeatures]) => (
              <div key={category}>
                {/* Category heading */}
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <span className="text-xl">{categoryIcons[category] || '📁'}</span>
                  <h3 className="text-base sm:text-lg font-bold text-gray-800">{category}</h3>
                  <span className="ml-1 px-2 py-0.5 bg-gray-200 text-gray-600 text-xs font-bold rounded-full">
                    {categoryFeatures.length}
                  </span>
                </div>

                {/* Feature cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {categoryFeatures.map(feature => {
                    const usage = safeUsageData.find(u => u.featureKey === feature.key);
                    const isAccessible = feature.enabled;

                    return (
                      <div
                        key={feature.key}
                        className={`genz-card p-4 flex flex-col gap-3 hover:shadow-md transition-all ${
                          !isAccessible ? 'opacity-70 border-dashed' : ''
                        }`}
                      >
                        {/* Feature header */}
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm sm:text-base font-semibold text-gray-800 leading-tight">
                            {feature.name}
                          </h4>
                          {isAccessible ? (
                            <Unlock size={18} className="text-emerald-500 flex-shrink-0" />
                          ) : (
                            <Lock size={18} className="text-gray-400 flex-shrink-0" />
                          )}
                        </div>

                        {/* Description */}
                        <p className="text-gray-500 text-xs sm:text-sm leading-relaxed flex-1">
                          {feature.description}
                        </p>

                        {/* Limit / badge row */}
                        {isAccessible && feature.hasLimit && (
                          <div>
                            {feature.limit === null ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
                                <Star size={11} />
                                Unlimited
                              </span>
                            ) : usage ? (
                              <UsageIndicator
                                feature={feature.key}
                                variant="badge"
                                showPercentage={false}
                              />
                            ) : (
                              <span className="inline-block px-2.5 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full">
                                Limit: {feature.limit}
                              </span>
                            )}
                          </div>
                        )}

                        {isAccessible && !feature.hasLimit && (
                          <span className="inline-block px-2.5 py-1 bg-sky-100 text-sky-700 text-xs font-bold rounded-full">
                            Always Available
                          </span>
                        )}

                        {!isAccessible && (
                          <button
                            className="w-full py-2 rounded-xl border-2 border-amber-400 text-amber-600 font-bold text-xs sm:text-sm hover:bg-amber-50 hover:scale-105 transition-all flex items-center justify-center gap-1.5 min-h-[40px]"
                            onClick={() => setShowUpgradeModal(true)}
                          >
                            <Crown size={14} />
                            Upgrade to Unlock
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* ── No Results ────────────────────────────────────────── */}
          {Object.keys(filteredCategories).length === 0 && (
            <div className="text-center py-12 sm:py-16">
              <Filter size={48} className="text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-500 mb-2">No features found</h3>
              <p className="text-gray-400 text-sm">Try adjusting your search or filter</p>
            </div>
          )}

        </div>
      </div>

      {/* ── Upgrade Modal ─────────────────────────────────────────── */}
      <UpgradePrompt
        show={showUpgradeModal}
        type="modal"
        onClose={() => setShowUpgradeModal(false)}
        showComparison={true}
      />
    </>
  );
}

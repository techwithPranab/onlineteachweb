import React, { useState } from 'react';
import {
  FeatureGate,
  FeatureButton,
  FeatureBadge,
  UpgradePrompt,
  UsageIndicator
} from '../common';
import { useUserFeatures, useFeatureUsage } from '../../hooks/useFeatureAccess';

/**
 * FeatureComponentsDemo
 * Demonstration of all feature access components
 * Use this to test and understand how components work
 */
const FeatureComponentsDemo = () => {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { features, plan, loading: featuresLoading } = useUserFeatures();
  const { usage: allUsage, loading: usageLoading } = useFeatureUsage();

  if (featuresLoading || usageLoading) {
    return (
      <div className="container mt-5">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading feature demo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-5 mb-5">
      <h1 className="mb-4">Feature Components Demo</h1>
      
      <div className="alert alert-info">
        <strong>Current Plan:</strong> {plan?.name || 'No active plan'}
        <br />
        <strong>Features Available:</strong> {features?.length || 0}
      </div>

      {/* Section 1: FeatureGate */}
      <section className="mb-5">
        <h2>1. FeatureGate Component</h2>
        <p className="text-muted">Conditionally renders content based on feature access</p>
        
        <div className="row g-3">
          <div className="col-md-6">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Basic Usage</h5>
                <FeatureGate feature="courses.enroll">
                  <div className="alert alert-success">
                    ✅ You can see this because you have course enrollment access!
                  </div>
                </FeatureGate>
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">With Fallback</h5>
                <FeatureGate 
                  feature="courses.premium"
                  fallback={
                    <div className="alert alert-warning">
                      🔒 Premium feature - Upgrade to access
                    </div>
                  }
                >
                  <div className="alert alert-success">
                    ✅ Premium content visible!
                  </div>
                </FeatureGate>
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">With Upgrade Prompt</h5>
                <FeatureGate 
                  feature="live_sessions.hd_video"
                  showUpgradePrompt={true}
                >
                  <div className="alert alert-success">
                    ✅ HD Video Player Active
                  </div>
                </FeatureGate>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3">
          <pre className="bg-light p-3 rounded">
{`<FeatureGate feature="courses.enroll">
  <PremiumContent />
</FeatureGate>

<FeatureGate 
  feature="courses.premium"
  fallback={<UpgradeBanner />}
  showUpgradePrompt={true}
>
  <PremiumContent />
</FeatureGate>`}
          </pre>
        </div>
      </section>

      {/* Section 2: FeatureButton */}
      <section className="mb-5">
        <h2>2. FeatureButton Component</h2>
        <p className="text-muted">Buttons that check feature access automatically</p>
        
        <div className="row g-3">
          <div className="col-md-4">
            <FeatureButton
              feature="materials.download"
              onClick={() => alert('Download started!')}
              className="w-100"
            >
              Download Materials
            </FeatureButton>
          </div>

          <div className="col-md-4">
            <FeatureButton
              feature="courses.premium"
              onClick={() => alert('Enrolled!')}
              variant="success"
              className="w-100"
              deniedText="Upgrade to Enroll"
            >
              Enroll in Premium Course
            </FeatureButton>
          </div>

          <div className="col-md-4">
            <FeatureButton
              feature="quiz.take"
              onClick={() => alert('Quiz started!')}
              variant="info"
              className="w-100"
              icon="📝"
            >
              Start Quiz
            </FeatureButton>
          </div>
        </div>

        <div className="mt-3">
          <pre className="bg-light p-3 rounded">
{`<FeatureButton
  feature="materials.download"
  onClick={handleDownload}
  deniedText="Upgrade to Download"
>
  Download PDF
</FeatureButton>`}
          </pre>
        </div>
      </section>

      {/* Section 3: FeatureBadge */}
      <section className="mb-5">
        <h2>3. FeatureBadge Component</h2>
        <p className="text-muted">Visual indicators for feature tiers</p>
        
        <div className="row g-3">
          <div className="col-md-3">
            <div className="card">
              <div className="card-body text-center">
                <h5>Premium Course <FeatureBadge type="premium" /></h5>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card">
              <div className="card-body text-center">
                <h5>Pro Feature <FeatureBadge type="pro" /></h5>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card">
              <div className="card-body text-center">
                <h5>New! <FeatureBadge type="new" /></h5>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card">
              <div className="card-body text-center">
                <h5>Beta <FeatureBadge type="beta" /></h5>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3">
          <h6>All Badge Types:</h6>
          <div className="d-flex gap-2 flex-wrap">
            <FeatureBadge type="premium" />
            <FeatureBadge type="pro" />
            <FeatureBadge type="enterprise" />
            <FeatureBadge type="new" />
            <FeatureBadge type="beta" />
            <FeatureBadge type="limited" />
            <FeatureBadge type="free" />
            <FeatureBadge type="locked" />
          </div>
        </div>

        <div className="mt-3">
          <h6>Different Sizes:</h6>
          <div className="d-flex gap-2 align-items-center">
            <FeatureBadge type="premium" size="xs" text="XS" />
            <FeatureBadge type="premium" size="sm" text="SM" />
            <FeatureBadge type="premium" size="md" text="MD" />
            <FeatureBadge type="premium" size="lg" text="LG" />
          </div>
        </div>

        <div className="mt-3">
          <pre className="bg-light p-3 rounded">
{`<h5>Premium Course <FeatureBadge type="premium" /></h5>
<FeatureBadge type="new" size="lg" />
<FeatureBadge type="pro" text="Custom Text" />`}
          </pre>
        </div>
      </section>

      {/* Section 4: UsageIndicator */}
      <section className="mb-5">
        <h2>4. UsageIndicator Component</h2>
        <p className="text-muted">Display usage statistics and limits</p>
        
        {allUsage && allUsage.length > 0 ? (
          <div className="row g-3">
            <div className="col-md-6">
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title">Bar Style (Default)</h5>
                  <UsageIndicator 
                    feature={allUsage[0]?.featureKey || 'courses.enroll'}
                    variant="bar"
                  />
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title">Circular Style</h5>
                  <UsageIndicator 
                    feature={allUsage[0]?.featureKey || 'courses.enroll'}
                    variant="circular"
                  />
                </div>
              </div>
            </div>

            <div className="col-md-12">
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title">All Your Feature Usage</h5>
                  {allUsage.map((item, index) => (
                    <UsageIndicator 
                      key={index}
                      feature={item.featureKey}
                      variant="bar"
                      size="sm"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="alert alert-info">
            No usage data available yet. Start using features to see statistics!
          </div>
        )}

        <div className="mt-3">
          <pre className="bg-light p-3 rounded">
{`<UsageIndicator feature="courses.enroll" variant="bar" />
<UsageIndicator feature="quiz.take" variant="circular" />
<UsageIndicator feature="materials.download" variant="badge" />`}
          </pre>
        </div>
      </section>

      {/* Section 5: UpgradePrompt */}
      <section className="mb-5">
        <h2>5. UpgradePrompt Component</h2>
        <p className="text-muted">Encourage users to upgrade their subscription</p>
        
        <div className="row g-3">
          <div className="col-md-6">
            <button 
              className="btn btn-primary w-100"
              onClick={() => setShowUpgradeModal(true)}
            >
              Show Modal Prompt
            </button>
          </div>

          <div className="col-md-6">
            <UpgradePrompt
              type="banner"
              feature="courses.premium"
              reason="Unlock premium courses and advanced features"
              show={true}
              showComparison={false}
            />
          </div>
        </div>

        <div className="mt-3">
          <pre className="bg-light p-3 rounded">
{`// Modal version
<UpgradePrompt
  show={showModal}
  onClose={() => setShowModal(false)}
  feature="courses.premium"
  showComparison={true}
/>

// Banner version
<UpgradePrompt
  type="banner"
  reason="Unlock premium features"
  showComparison={false}
/>`}
          </pre>
        </div>
      </section>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <UpgradePrompt
          show={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          feature="demo.feature"
          reason="This is a demo of the upgrade modal"
          showComparison={true}
        />
      )}

      {/* Summary */}
      <section className="mb-5">
        <div className="card bg-light">
          <div className="card-body">
            <h3>Component Summary</h3>
            <ul>
              <li><strong>FeatureGate:</strong> Conditionally render content based on access</li>
              <li><strong>FeatureButton:</strong> Buttons with automatic access checking</li>
              <li><strong>FeatureBadge:</strong> Visual tier indicators (Premium, Pro, etc.)</li>
              <li><strong>UsageIndicator:</strong> Show usage stats with progress bars</li>
              <li><strong>UpgradePrompt:</strong> Beautiful upgrade modals and banners</li>
            </ul>

            <div className="mt-3">
              <h5>Import All Components:</h5>
              <pre className="bg-white p-3 rounded">
{`import {
  FeatureGate,
  FeatureButton,
  FeatureBadge,
  UpgradePrompt,
  UsageIndicator
} from '../components/common';`}
              </pre>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FeatureComponentsDemo;

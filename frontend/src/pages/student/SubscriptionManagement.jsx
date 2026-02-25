import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { CreditCard, CheckCircle, Clock, XCircle, Download } from 'lucide-react'
import { subscriptionService, paymentService, razorpayService } from '@/services/apiServices'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import SEOHead from '@/components/SEO/SEOHead';
import ErrorMessage from '@/components/common/ErrorMessage'
import Modal from '@/components/common/Modal'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import RazorpayCheckout from '@/components/payments/RazorpayCheckout'
import MeritaiButton from '@/components/ui/MeritaiButton'

export default function SubscriptionManagement() {
  const queryClient = useQueryClient()
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [billing, setBilling] = useState('monthly') // 'monthly' | 'annually'
  const [successMsg, setSuccessMsg] = useState('')

  // Subscription status
  const { data: statusData, isLoading: statusLoading, error: statusError } = useQuery(
    'subscriptionStatus',
    subscriptionService.getStatus,
    { refetchOnMount: true, staleTime: 0 }
  )

  // Public plans
  const { data: plansData, isLoading: plansLoading, error: plansError } = useQuery(
    'publicPlans',
    subscriptionService.getPublicPlans
  )

  // Billing history
  const { data: billingData, isLoading: billingLoading, error: billingError } = useQuery(
    'billingHistory',
    () => paymentService.getUserBillingHistory({ limit: 20 })
  )

  const isLoading = statusLoading || plansLoading || billingLoading
  const error = statusError || plansError || billingError

  const cancelMutation = useMutation(
    (reason) => subscriptionService.cancel(reason),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('subscriptionStatus')
        queryClient.invalidateQueries('subscriptionFeatures')
      },
    }
  )

  const downgradeMutation = useMutation(() => subscriptionService.downgradeToFree(), {
    onSuccess: () => {
      queryClient.invalidateQueries('subscriptionStatus')
      queryClient.invalidateQueries('subscriptionFeatures')
    }
  })

  // derive plans to display from API
  const fetchedPlans = plansData?.data || []
  const freePlanDoc = fetchedPlans.find(p => /free/i.test(p.name))
  const standardMonthly = fetchedPlans.find(p => /standard/i.test(p.name) && p.interval === 'month')
  const standardAnnual = fetchedPlans.find(p => /standard/i.test(p.name) && p.interval === 'year')

  const displayStandardPrice = billing === 'monthly'
    ? (standardMonthly?.price ?? (standardAnnual ? Math.round((standardAnnual.price / 12) * 100) / 100 : 0))
    : (standardAnnual?.price ?? (standardMonthly ? standardMonthly.price * 12 : 0))

  const displayStandardFeatures = standardMonthly?.features || standardAnnual?.features || []

  const plans = [
    {
      id: freePlanDoc?._id || 'free',
      docId: freePlanDoc?._id,
      name: freePlanDoc?.name || 'Free',
      price: freePlanDoc?.price ?? 0,
      interval: freePlanDoc?.interval || 'month',
      features: freePlanDoc?.features || [],
      popular: false,
    },
    {
      id: standardMonthly?._id || standardAnnual?._id || 'standard',
      docId: billing === 'monthly' ? (standardMonthly?._id || standardAnnual?._id) : (standardAnnual?._id || standardMonthly?._id),
      name: 'Standard',
      price: displayStandardPrice,
      interval: billing === 'monthly' ? 'month' : 'year',
      features: displayStandardFeatures,
      popular: true,
    }
  ]

  // Backend returns { success, subscription, plan } - not nested under .data
  const currentSubscription = statusData?.subscription || null
  const isCurrentFree = !currentSubscription || /free/i.test(currentSubscription.plan?.name || '')

  const handleUpgrade = (plan) => {
    setSelectedPlan(plan)
    setShowUpgradeModal(true)
  }

  const handleCancelSubscription = () => {
    cancelMutation.mutate('User requested cancellation')
    setShowCancelDialog(false)
  }

  const handlePaymentSuccess = (subscription) => {
    queryClient.invalidateQueries('subscriptionStatus')
    queryClient.invalidateQueries('billingHistory')
    queryClient.invalidateQueries('subscriptionFeatures')
    setShowUpgradeModal(false)
    setSelectedPlan(null)
    
    setSuccessMsg('Subscription activated successfully! Your plan has been updated.')
    setTimeout(() => setSuccessMsg(''), 6000)
  }

  if (isLoading) return <LoadingSpinner fullScreen />
  if (error) return <ErrorMessage message={(error && error.message) || 'Failed to load subscription'} />

  return (
    <>

    <SEOHead title="Subscription Management - Student" noIndex={true} noFollow={true} />

    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Header */}
      <div className="genz-card mb-4 sm:mb-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
        <div className="p-4 sm:p-5 lg:p-6">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent animate-shimmer mb-2">
            💎 Subscription Management
          </h1>
          <p className="text-gray-600 text-sm sm:text-base lg:text-lg">Manage your subscription plan and billing 🚀</p>
        </div>
      </div>

      {/* Success Banner */}
      {successMsg && (
        <div className="mb-4 flex items-center gap-3 bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-400 rounded-2xl px-5 py-4 shadow">
          <CheckCircle className="w-6 h-6 text-emerald-500 flex-shrink-0" />
          <p className="text-emerald-800 font-semibold text-sm">{successMsg}</p>
        </div>
      )}

      {/* Current Subscription */}
      {currentSubscription ? (
        <div className="genz-card mb-4 sm:mb-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500"></div>
          <div className="p-4 sm:p-5 lg:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3">
              <div>
                <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
                  🎯 Current Plan
                </h2>
                <p className="text-gray-600 text-sm sm:text-base">
                  {currentSubscription.plan?.name || 'No active subscription'} ✨
                </p>
              </div>
              <div className={`px-3 sm:px-4 py-2 rounded-full flex items-center gap-2 text-sm font-bold shadow-lg ${
                currentSubscription.status === 'active' ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white' :
                currentSubscription.status === 'cancelled' ? 'bg-gradient-to-r from-red-400 to-pink-500 text-white' :
                'bg-gradient-to-r from-yellow-400 to-orange-500 text-white'
              }`}>
                {currentSubscription.status === 'active' && <CheckCircle className="w-5 h-5 animate-bounce-slow" />}
                {currentSubscription.status === 'cancelled' && <XCircle className="w-5 h-5" />}
                {currentSubscription.status === 'trialing' && <Clock className="w-5 h-5" />}
                <span className="capitalize">{currentSubscription.status}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="genz-card p-3 sm:p-4 hover:scale-105 transition-all">
                <p className="text-xs sm:text-sm text-gray-500 font-medium mb-1">💰 Plan Price</p>
                <p className="text-lg sm:text-xl font-bold text-gray-900">
                  ₹{currentSubscription.plan?.price || 0}
                  <span className="text-xs sm:text-sm text-gray-600 font-normal">/month</span>
                </p>
              </div>
              <div className="genz-card p-3 sm:p-4 hover:scale-105 transition-all">
                <p className="text-xs sm:text-sm text-gray-500 font-medium mb-1">📅 Next Billing Date</p>
                <p className="text-sm sm:text-base font-bold text-gray-900">
                  {(currentSubscription.currentPeriodEnd || currentSubscription.endDate)
                    ? new Date(currentSubscription.currentPeriodEnd || currentSubscription.endDate)
                        .toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                    : 'N/A'}
                </p>
              </div>
              <div className="genz-card p-3 sm:p-4 hover:scale-105 transition-all">
                <p className="text-xs sm:text-sm text-gray-500 font-medium mb-1">💳 Payment Method</p>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg">
                    <CreditCard className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                  </div>
                  <p className="text-sm sm:text-base font-bold text-gray-900">•••• 4242</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
              <MeritaiButton className="flex items-center gap-2 text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3 hover:scale-105 transition-all w-full sm:w-auto">
                🔄 Update Payment Method
              </MeritaiButton>
              {currentSubscription.status === 'active' && (
                <button
                  onClick={() => setShowCancelDialog(true)}
                  className="px-4 sm:px-6 py-2 sm:py-3 border-2 border-red-300 text-red-600 rounded-xl hover:bg-red-50 hover:scale-105 transition-all w-full sm:w-auto font-bold text-sm sm:text-base"
                >
                  ❌ Cancel Subscription
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="genz-card mb-4 sm:mb-6 p-5 border-2 border-dashed border-emerald-300 text-center">
          <p className="text-2xl mb-2">👑</p>
          <h2 className="text-lg font-bold text-gray-800 mb-1">No Active Subscription</h2>
          <p className="text-gray-500 text-sm">You are on the Free plan. Subscribe to unlock all features.</p>
        </div>
      )}

      {/* Available Plans */}
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3">
          <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            {currentSubscription && !isCurrentFree ? 'Change Your Plan' : 'Choose a Plan'}
          </h2>

          {/* Billing toggle */}
          <div className="genz-card p-1 rounded-full inline-flex w-full sm:w-auto">
            <button
              onClick={() => setBilling('monthly')}
              className={`px-4 sm:px-4 py-2 rounded-full flex-1 sm:flex-none text-sm font-bold transition-all min-h-[44px] ${
                billing === 'monthly' 
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg scale-105' 
                  : 'text-gray-600 hover:text-emerald-600'
              }`}
              aria-pressed={billing === 'monthly'}
              aria-label="Monthly billing"
            >
              📅 Monthly
            </button>
            <button
              onClick={() => setBilling('annually')}
              className={`px-4 sm:px-4 py-2 rounded-full flex-1 sm:flex-none text-sm font-bold transition-all min-h-[44px] ${
                billing === 'annually' 
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg scale-105' 
                  : 'text-gray-600 hover:text-emerald-600'
              }`}
              aria-pressed={billing === 'annually'}
              aria-label="Annual billing"
            >
              📆 Annually
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:gap-6">
          {plans.map((plan) => {
                const currentPlanId = currentSubscription?.plan?._id?.toString()
                const currentPlanName = (currentSubscription?.plan?.name || '').toLowerCase()
                const isActive = currentSubscription?.status === 'active'
                // Match by ID first; fall back to name-based match (handles free plan)
                const isCurrent = isActive && (
                  (plan.docId && currentPlanId && currentPlanId === plan.docId.toString()) ||
                  (!plan.docId && currentPlanName && currentPlanName.includes(plan.name.toLowerCase()))
                )
            return (
              <div
                key={plan.id}
                className={`genz-card relative hover:scale-105 transition-all ${
                  plan.popular ? 'border-2 border-emerald-500 shadow-xl' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-1 text-xs font-bold rounded-full shadow-lg animate-bounce-slow">
                    ⭐ POPULAR
                  </div>
                )}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
                <div className="p-4 sm:p-5 lg:p-6">
                  <h3 className="text-base sm:text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
                    {plan.name} {plan.name === 'Free' ? '🆓' : '💎'}
                  </h3>
                  <div className="mb-4 sm:mb-6">
                    <span className="text-2xl sm:text-3xl font-bold text-gray-900">₹{plan.price}</span>
                    <span className="text-gray-600 text-sm">/{plan.interval}</span>
                  </div>

                  <ul className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 sm:gap-3">
                        <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg flex-shrink-0 mt-0.5">
                          <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                        </div>
                        <span className="text-gray-700 text-xs sm:text-sm font-medium">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {isCurrent ? (
                    <MeritaiButton disabled className="w-full text-sm sm:text-base py-2 sm:py-3 opacity-70 cursor-not-allowed">
                      Current Plan (Active)
                    </MeritaiButton>
                  ) : plan.price === 0 ? (
                    currentSubscription && !isCurrentFree ? (
                      <button
                        onClick={() => handleUpgrade(plan)}
                        className="genz-btn-secondary w-full text-sm sm:text-base py-2 sm:py-3 hover:scale-105 transition-all"
                      >
                        Switch to Free
                      </button>
                    ) : (
                      <MeritaiButton disabled className="w-full text-sm sm:text-base py-2 sm:py-3 opacity-70 cursor-not-allowed">
                        Current Plan (Active)
                      </MeritaiButton>
                    )
                  ) : (
                    <MeritaiButton
                      onClick={() => handleUpgrade(plan)}
                      className="w-full text-sm sm:text-base py-2 sm:py-3 hover:scale-105 transition-all"
                    >
                      {currentSubscription && !isCurrentFree ? 'Switch Plan' : 'Subscribe Now'}
                    </MeritaiButton>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Billing History */}
      <div className="genz-card relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
        <div className="p-4 sm:p-5 lg:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3">
            <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
              📊 Billing History
            </h2>
            <button className="genz-btn-secondary flex items-center gap-2 text-sm px-3 sm:px-4 py-2 hover:scale-105 transition-all w-full sm:w-auto">
              <Download className="w-4 h-4 sm:w-5 sm:h-5" />
              📥 Download All
            </button>
          </div>

          {/* Mobile Card View */}
          <div className="block sm:hidden space-y-3">
            {billingLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : billingData?.data?.payments?.length > 0 ? (
              billingData.data.payments.map((invoice, index) => (
                <div key={invoice.id || index} className="genz-card p-4 hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{invoice.description}</p>
                      <p className="text-xs text-gray-600">{new Date(invoice.date).toLocaleDateString()}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold capitalize ${
                      invoice.status === 'completed' ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white' :
                      invoice.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {invoice.status === 'completed' ? '✅ Paid' : invoice.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-lg font-bold text-gray-900">
                      {invoice.currency === 'INR' ? '₹' : '$'}{invoice.amount.toFixed(2)}
                    </p>
                    {invoice.invoiceUrl && (
                      <a
                        href={invoice.invoiceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="genz-btn-secondary text-xs px-3 py-1 hover:scale-105 transition-all"
                      >
                        📥 Download
                      </a>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No billing history found</p>
              </div>
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto -mx-4 sm:-mx-5 lg:-mx-6">
            <div className="inline-block min-w-full align-middle px-4 sm:px-5 lg:px-6">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 sm:py-4 px-2 sm:px-4 text-xs sm:text-sm font-bold text-gray-700 whitespace-nowrap">📅 Date</th>
                    <th className="text-left py-3 sm:py-4 px-2 sm:px-4 text-xs sm:text-sm font-bold text-gray-700">📝 Description</th>
                    <th className="text-left py-3 sm:py-4 px-2 sm:px-4 text-xs sm:text-sm font-bold text-gray-700 whitespace-nowrap">💰 Amount</th>
                    <th className="text-left py-3 sm:py-4 px-2 sm:px-4 text-xs sm:text-sm font-bold text-gray-700 whitespace-nowrap">📊 Status</th>
                    <th className="text-left py-3 sm:py-4 px-2 sm:px-4 text-xs sm:text-sm font-bold text-gray-700 whitespace-nowrap">📄 Invoice</th>
                  </tr>
                </thead>
                <tbody>
                  {billingLoading ? (
                    <tr>
                      <td colSpan="5" className="py-8 text-center">
                        <LoadingSpinner />
                      </td>
                    </tr>
                  ) : billingData?.data?.payments?.length > 0 ? (
                    billingData.data.payments.map((invoice, index) => (
                      <tr key={invoice.id || index} className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 transition-all">
                        <td className="py-3 sm:py-4 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-900 whitespace-nowrap">
                          {new Date(invoice.date).toLocaleDateString()}
                        </td>
                        <td className="py-3 sm:py-4 px-2 sm:px-4 text-xs sm:text-sm text-gray-900 max-w-xs truncate font-medium">
                          {invoice.description}
                        </td>
                        <td className="py-3 sm:py-4 px-2 sm:px-4 text-xs sm:text-sm font-bold text-gray-900 whitespace-nowrap">
                          {invoice.currency === 'INR' ? '₹' : '$'}{invoice.amount.toFixed(2)}
                        </td>
                        <td className="py-3 sm:py-4 px-2 sm:px-4 whitespace-nowrap">
                          <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-bold capitalize shadow-lg ${
                            invoice.status === 'completed' ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white' :
                            invoice.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {invoice.status === 'completed' ? '✅ Paid' : invoice.status}
                          </span>
                        </td>
                        <td className="py-3 sm:py-4 px-2 sm:px-4 whitespace-nowrap">
                          {invoice.invoiceUrl ? (
                            <a
                              href={invoice.invoiceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="genz-btn-secondary text-xs sm:text-sm px-2 sm:px-3 py-1 hover:scale-105 transition-all inline-block"
                            >
                              📥 Download
                            </a>
                          ) : (
                            <span className="text-gray-400 text-xs">N/A</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-gray-500">
                        No billing history found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Upgrade Modal */}
      <Modal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        title="💎 Upgrade Subscription"
      >
        {selectedPlan && (
          <div className="space-y-4 sm:space-y-6">
            {selectedPlan.price > 0 ? (
              <RazorpayCheckout
                plan={selectedPlan}
                onSuccess={handlePaymentSuccess}
                onClose={() => setShowUpgradeModal(false)}
              />
            ) : (
              <div className="space-y-4 sm:space-y-6">
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border-2 border-emerald-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">📋 Plan Summary</h3>
                  <div className="flex justify-between mb-2 text-sm sm:text-base">
                    <span className="text-gray-600">New Plan:</span>
                    <span className="font-semibold">{selectedPlan.name}</span>
                  </div>
                  <div className="flex justify-between mb-2 text-sm sm:text-base">
                    <span className="text-gray-600">Price:</span>
                    <span className="font-semibold text-emerald-600">Free</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600">This plan does not require a payment method.</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button 
                    onClick={() => setShowUpgradeModal(false)} 
                    className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all min-h-[44px] text-sm sm:text-base"
                  >
                    Cancel
                  </button>
                  <MeritaiButton
                    onClick={() => {
                      downgradeMutation.mutate()
                      setShowUpgradeModal(false)
                    }}
                    className="flex-1 px-4 py-3 font-semibold rounded-xl shadow-lg hover:scale-105 transition-all min-h-[44px] text-sm sm:text-base"
                  >
                    Switch to Free
                  </MeritaiButton>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Cancel Confirmation */}
      <ConfirmDialog
        isOpen={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        onConfirm={handleCancelSubscription}
        title="Cancel Subscription"
        message="Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period."
        confirmText="Yes, Cancel"
        variant="danger"
      />
    </div>
    </div>
    </>
  )
}

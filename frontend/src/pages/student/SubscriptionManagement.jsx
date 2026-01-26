import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { CreditCard, CheckCircle, Clock, XCircle, Download } from 'lucide-react'
import { subscriptionService } from '@/services/apiServices'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import ErrorMessage from '@/components/common/ErrorMessage'
import Modal from '@/components/common/Modal'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'
import CheckoutForm from '@/components/payments/CheckoutForm'
import MeritaiButton from '@/components/ui/MeritaiButton'

// Initialize Stripe if publishable key is present
const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null

export default function SubscriptionManagement() {
  const queryClient = useQueryClient()
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [billing, setBilling] = useState('monthly') // 'monthly' | 'annually'

  // Subscription status
  const { data: statusData, isLoading: statusLoading, error: statusError } = useQuery(
    'subscriptionStatus',
    subscriptionService.getStatus
  )

  // Public plans
  const { data: plansData, isLoading: plansLoading, error: plansError } = useQuery(
    'publicPlans',
    subscriptionService.getPublicPlans
  )

  const isLoading = statusLoading || plansLoading
  const error = statusError || plansError

  const cancelMutation = useMutation(
    (reason) => subscriptionService.cancel(reason),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('subscriptionStatus')
      },
    }
  )

  const downgradeMutation = useMutation(() => subscriptionService.downgradeToFree(), {
    onSuccess: () => {
      queryClient.invalidateQueries('subscriptionStatus')
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

  const currentSubscription = statusData?.data

  const handleUpgrade = (plan) => {
    setSelectedPlan(plan)
    setShowUpgradeModal(true)
  }

  const handleCancelSubscription = () => {
    cancelMutation.mutate('User requested cancellation')
    setShowCancelDialog(false)
  }

  const handleConfirmWithoutStripe = async () => {
    if (!selectedPlan || !selectedPlan.docId) return
    try {
      // Call checkout API without a payment method (fallback)
      const res = await subscriptionService.checkout(selectedPlan.docId, null)
      if (res && res.subscription) {
        queryClient.invalidateQueries('subscriptionStatus')
        setShowUpgradeModal(false)
        setSelectedPlan(null)
      } else {
        console.error('Unexpected response when creating subscription without Stripe', res)
      }
    } catch (err) {
      console.error('Error creating subscription without Stripe', err)
    }
  }

  if (isLoading) return <LoadingSpinner fullScreen />
  if (error) return <ErrorMessage message={(error && error.message) || 'Failed to load subscription'} />

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="genz-card mb-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-indigo-500"></div>
        <div className="p-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent animate-shimmer mb-2">
            💎 Subscription Management
          </h1>
          <p className="text-gray-600 text-base">Manage your subscription plan and billing 🚀</p>
        </div>
      </div>

      {/* Current Subscription */}
      {currentSubscription && (
        <div className="genz-card mb-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500"></div>
          <div className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
              <div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
                  🎯 Current Plan
                </h2>
                <p className="text-gray-600 text-base">
                  {currentSubscription.plan?.name || 'No active subscription'} ✨
                </p>
              </div>
              <div className={`px-4 py-2 rounded-full flex items-center gap-2 text-sm font-bold shadow-lg ${
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <div className="genz-card p-4 hover:scale-105 transition-all">
                <p className="text-sm text-gray-500 font-medium mb-1">💰 Plan Price</p>
                <p className="text-xl font-bold text-gray-900">
                  ₹{currentSubscription.plan?.price || 0}
                  <span className="text-sm text-gray-600 font-normal">/month</span>
                </p>
              </div>
              <div className="genz-card p-4 hover:scale-105 transition-all">
                <p className="text-sm text-gray-500 font-medium mb-1">📅 Next Billing Date</p>
                <p className="text-base font-bold text-gray-900">
                  {currentSubscription.currentPeriodEnd
                    ? new Date(currentSubscription.currentPeriodEnd).toLocaleDateString()
                    : 'N/A'}
                </p>
              </div>
              <div className="genz-card p-4 hover:scale-105 transition-all">
                <p className="text-sm text-gray-500 font-medium mb-1">💳 Payment Method</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg">
                    <CreditCard className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-base font-bold text-gray-900">•••• 4242</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-6 border-t border-gray-200">
              <MeritaiButton className="flex items-center gap-2 text-base px-6 py-3 hover:scale-105 transition-all w-full sm:w-auto">
                🔄 Update Payment Method
              </MeritaiButton>
              {currentSubscription.status === 'active' && (
                <button
                  onClick={() => setShowCancelDialog(true)}
                  className="px-6 py-3 border-2 border-red-300 text-red-600 rounded-xl hover:bg-red-50 hover:scale-105 transition-all w-full sm:w-auto font-bold"
                >
                  ❌ Cancel Subscription
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Available Plans */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
          <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            {currentSubscription ? '🚀 Upgrade Your Plan' : '🎯 Choose a Plan'}
          </h2>

          {/* Billing toggle */}
          <div className="genz-card p-1 rounded-full inline-flex w-full sm:w-auto">
            <button
              onClick={() => setBilling('monthly')}
              className={`px-4 py-2 rounded-full flex-1 sm:flex-none text-sm font-bold transition-all ${
                billing === 'monthly' 
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg scale-105' 
                  : 'text-gray-600 hover:text-purple-600'
              }`}
              aria-pressed={billing === 'monthly'}
              aria-label="Monthly billing"
            >
              📅 Monthly
            </button>
            <button
              onClick={() => setBilling('annually')}
              className={`px-4 py-2 rounded-full flex-1 sm:flex-none text-sm font-bold transition-all ${
                billing === 'annually' 
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg scale-105' 
                  : 'text-gray-600 hover:text-purple-600'
              }`}
              aria-pressed={billing === 'annually'}
              aria-label="Annual billing"
            >
              📆 Annually
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {plans.map((plan) => {
            const isCurrent = currentSubscription?.plan?._id?.toString() === (plan.docId?.toString() || plan.id)
            return (
              <div
                key={plan.id}
                className={`genz-card relative hover:scale-105 transition-all ${
                  plan.popular ? 'border-2 border-purple-500 shadow-xl' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-4 py-1 text-xs font-bold rounded-full shadow-lg animate-bounce-slow">
                    ⭐ POPULAR
                  </div>
                )}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-indigo-500"></div>
                <div className="p-6">
                  <h3 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                    {plan.name} {plan.name === 'Free' ? '🆓' : '💎'}
                  </h3>
                  <div className="mb-6">
                    <span className="text-3xl font-bold text-gray-900">₹{plan.price}</span>
                    <span className="text-gray-600 text-sm">/{plan.interval}</span>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg flex-shrink-0 mt-0.5">
                          <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-gray-700 text-sm font-medium">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {isCurrent ? (
                    <MeritaiButton disabled className="w-full text-base py-3">
                      ✅ Current Plan
                    </MeritaiButton>
                  ) : plan.price === 0 ? (
                    <button
                      onClick={() => handleUpgrade(plan)}
                      className="genz-btn-secondary w-full text-base py-3 hover:scale-105 transition-all"
                    >
                      🔄 Switch to Free
                    </button>
                  ) : (
                    <MeritaiButton
                      onClick={() => handleUpgrade(plan)}
                      className="w-full text-base py-3 hover:scale-105 transition-all"
                    >
                      {currentSubscription ? '🚀 Upgrade' : '💎 Subscribe'}
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
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500"></div>
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
            <h2 className="text-xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
              📊 Billing History
            </h2>
            <button className="genz-btn-secondary flex items-center gap-2 text-sm px-4 py-2 hover:scale-105 transition-all w-full sm:w-auto">
              <Download className="w-5 h-5" />
              📥 Download All
            </button>
          </div>

          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 whitespace-nowrap">📅 Date</th>
                    <th className="text-left py-4 px-4 text-sm font-bold text-gray-700">📝 Description</th>
                    <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 whitespace-nowrap">💰 Amount</th>
                    <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 whitespace-nowrap">📊 Status</th>
                    <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 whitespace-nowrap">📄 Invoice</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { date: '2024-01-01', description: 'Standard Plan - Monthly', amount: 29.99, status: 'paid' },
                    { date: '2023-12-01', description: 'Standard Plan - Monthly', amount: 29.99, status: 'paid' },
                    { date: '2023-11-01', description: 'Standard Plan - Monthly', amount: 29.99, status: 'paid' },
                  ].map((invoice, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-purple-50 hover:to-indigo-50 transition-all">
                      <td className="py-4 px-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                        {new Date(invoice.date).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-900 max-w-xs truncate font-medium">
                        {invoice.description}
                      </td>
                      <td className="py-4 px-4 text-sm font-bold text-gray-900 whitespace-nowrap">
                        ₹{invoice.amount.toFixed(2)}
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className="px-3 py-1 bg-gradient-to-r from-green-400 to-emerald-500 text-white rounded-full text-xs font-bold capitalize shadow-lg">
                          ✅ {invoice.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <button className="genz-btn-secondary text-sm px-3 py-1 hover:scale-105 transition-all">
                          📥 Download
                        </button>
                      </td>
                    </tr>
                  ))}
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
        title="Upgrade Subscription"
      >
        {selectedPlan && (
          <div className="space-y-4 sm:space-y-6">
            <p className="text-gray-700 text-sm sm:text-base">
              You are upgrading to the <strong>{selectedPlan.name}</strong> plan.
            </p>

            {selectedPlan.price > 0 ? (
              stripePromise ? (
                <Elements stripe={stripePromise}>
                  <CheckoutForm
                    plan={selectedPlan}
                    onSuccess={() => {
                      setShowUpgradeModal(false)
                      setSelectedPlan(null)
                    }}
                    onCancel={() => setShowUpgradeModal(false)}
                  />
                </Elements>
              ) : (
                <div className="space-y-4">
                  <div className="bg-yellow-50 p-3 sm:p-4 rounded text-sm text-yellow-800">
                    Stripe is not configured in this environment. We will create the subscription entry without processing payment.
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button onClick={() => setShowUpgradeModal(false)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 min-h-[44px]">Cancel</button>
                    <button onClick={handleConfirmWithoutStripe} className="flex-1 btn-primary min-h-[44px]">Confirm Subscription</button>
                  </div>
                </div>
              )
            ) : (
              <div className="space-y-4 sm:space-y-6">
                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                  <div className="flex justify-between mb-2 text-sm sm:text-base">
                    <span className="text-gray-600">New Plan:</span>
                    <span className="font-semibold">{selectedPlan.name}</span>
                  </div>
                  <div className="flex justify-between mb-2 text-sm sm:text-base">
                    <span className="text-gray-600">Price:</span>
                    <span className="font-semibold">Free</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600">This plan does not require a payment method.</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button onClick={() => setShowUpgradeModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 min-h-[44px]">Cancel</button>
                  <button
                    onClick={() => {
                      // switch to free plan
                      downgradeMutation.mutate()
                      setShowUpgradeModal(false)
                    }}
                    className="flex-1 btn-primary min-h-[44px]"
                  >
                    Switch to Free
                  </button>
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
  )
}

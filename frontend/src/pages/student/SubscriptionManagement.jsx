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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Subscription Management</h1>
        <p className="text-gray-600 text-sm sm:text-base">Manage your subscription plan and billing</p>
      </div>

      {/* Current Subscription */}
      {currentSubscription && (
        <div className="card mb-6 sm:mb-8">
          <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1 sm:mb-2">Current Plan</h2>
                <p className="text-gray-600 text-sm sm:text-base">
                  {currentSubscription.plan?.name || 'No active subscription'}
                </p>
              </div>
              <div className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full flex items-center gap-2 text-sm w-fit ${
                currentSubscription.status === 'active' ? 'bg-green-100 text-green-700' :
                currentSubscription.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {currentSubscription.status === 'active' && <CheckCircle className="w-4 h-4" />}
                {currentSubscription.status === 'cancelled' && <XCircle className="w-4 h-4" />}
                {currentSubscription.status === 'trialing' && <Clock className="w-4 h-4" />}
                <span className="capitalize">{currentSubscription.status}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Plan Price</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  ₹{currentSubscription.plan?.price || 0}
                  <span className="text-sm text-gray-600 font-normal">/month</span>
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Next Billing Date</p>
                <p className="text-base sm:text-lg font-medium text-gray-900">
                  {currentSubscription.currentPeriodEnd
                    ? new Date(currentSubscription.currentPeriodEnd).toLocaleDateString()
                    : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Payment Method</p>
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-gray-600" />
                  <p className="text-base sm:text-lg font-medium text-gray-900">•••• 4242</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-6 border-t border-gray-200">
              <button className="btn-primary w-full sm:w-auto">Update Payment Method</button>
              {currentSubscription.status === 'active' && (
                <button
                  onClick={() => setShowCancelDialog(true)}
                  className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 w-full sm:w-auto min-h-[44px] sm:min-h-0"
                >
                  Cancel Subscription
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Available Plans */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            {currentSubscription ? 'Upgrade Your Plan' : 'Choose a Plan'}
          </h2>

          {/* Billing toggle */}
          <div className="inline-flex bg-gray-200 rounded-full p-1 w-full sm:w-auto">
            <button
              onClick={() => setBilling('monthly')}
              className={`px-3 py-2 sm:px-4 rounded-full flex-1 sm:flex-none text-sm sm:text-base ${
                billing === 'monthly' ? 'bg-white shadow font-semibold' : 'text-gray-600'
              }`}
              aria-pressed={billing === 'monthly'}
              aria-label="Monthly billing"
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling('annually')}
              className={`px-3 py-2 sm:px-4 rounded-full flex-1 sm:flex-none text-sm sm:text-base ${
                billing === 'annually' ? 'bg-white shadow font-semibold' : 'text-gray-600'
              }`}
              aria-pressed={billing === 'annually'}
              aria-label="Annual billing"
            >
              Annually
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {plans.map((plan) => {
            const isCurrent = currentSubscription?.plan?._id?.toString() === (plan.docId?.toString() || plan.id)
            return (
              <div
                key={plan.id}
                className={`card relative ${
                  plan.popular ? 'border-2 border-primary-600 shadow-lg' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-primary-600 text-white px-2 py-1 sm:px-3 text-xs font-semibold rounded-bl-lg rounded-tr-lg">
                    POPULAR
                  </div>
                )}
                <div className="p-4 sm:p-6">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="mb-4 sm:mb-6">
                    <span className="text-3xl sm:text-4xl font-bold text-gray-900">₹{plan.price}</span>
                    <span className="text-gray-600 text-sm sm:text-base">/{plan.interval}</span>
                  </div>

                  <ul className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 text-sm sm:text-base">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {isCurrent ? (
                    <button disabled className="btn-primary w-full opacity-50 cursor-not-allowed min-h-[44px]">
                      Current Plan
                    </button>
                  ) : plan.price === 0 ? (
                    <button
                      onClick={() => handleUpgrade(plan)}
                      className="btn-primary w-full min-h-[44px]"
                    >
                      Switch to Free
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpgrade(plan)}
                      className="btn-primary w-full min-h-[44px]"
                    >
                      {currentSubscription ? 'Upgrade' : 'Subscribe'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Billing History */}
      <div className="card">
        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Billing History</h2>
            <button className="text-primary-600 hover:text-primary-700 flex items-center gap-2 text-sm font-medium w-full sm:w-auto justify-center sm:justify-start min-h-[44px] sm:min-h-0 px-3 py-2 sm:px-0 sm:py-0 border sm:border-0 border-gray-300 rounded-lg sm:rounded-none">
              <Download className="w-4 h-4" />
              Download All
            </button>
          </div>

          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 whitespace-nowrap">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Description</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 whitespace-nowrap">Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 whitespace-nowrap">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 whitespace-nowrap">Invoice</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { date: '2024-01-01', description: 'Standard Plan - Monthly', amount: 29.99, status: 'paid' },
                    { date: '2023-12-01', description: 'Standard Plan - Monthly', amount: 29.99, status: 'paid' },
                    { date: '2023-11-01', description: 'Standard Plan - Monthly', amount: 29.99, status: 'paid' },
                  ].map((invoice, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-900 whitespace-nowrap">
                        {new Date(invoice.date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900 max-w-xs truncate">
                        {invoice.description}
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                        ₹{invoice.amount.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium capitalize">
                          {invoice.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <button className="text-primary-600 hover:text-primary-700 text-sm font-medium min-h-[44px] px-2 py-1">
                          Download
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

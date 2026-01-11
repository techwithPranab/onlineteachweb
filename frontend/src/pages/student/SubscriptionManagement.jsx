import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { CreditCard, CheckCircle, Clock, XCircle, Download } from 'lucide-react'
import { subscriptionService } from '@/services/apiServices'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import ErrorMessage from '@/components/common/ErrorMessage'
import Modal from '@/components/common/Modal'
import ConfirmDialog from '@/components/common/ConfirmDialog'

export default function SubscriptionManagement() {
  const queryClient = useQueryClient()
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(null)

  const { data: statusData, isLoading, error } = useQuery(
    'subscriptionStatus',
    subscriptionService.getStatus
  )

  const cancelMutation = useMutation(
    (reason) => subscriptionService.cancel(reason),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('subscriptionStatus')
      },
    }
  )

  const plans = [
    {
      id: 'basic',
      name: 'Basic',
      price: 9.99,
      interval: 'month',
      features: [
        '5 Courses per month',
        'Access to recorded sessions',
        'Basic learning materials',
        'Email support',
      ],
      popular: false,
    },
    {
      id: 'standard',
      name: 'Standard',
      price: 29.99,
      interval: 'month',
      features: [
        'Unlimited Courses',
        'Live interactive sessions',
        'All learning materials',
        'Priority support',
        'Progress tracking',
        'Downloadable resources',
      ],
      popular: true,
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 49.99,
      interval: 'month',
      features: [
        'Everything in Standard',
        'One-on-one tutoring sessions',
        'Personalized learning path',
        'Certificate of completion',
        '24/7 Premium support',
        'Career guidance',
      ],
      popular: false,
    },
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

  if (isLoading) return <LoadingSpinner fullScreen />
  if (error) return <ErrorMessage message={error.message || 'Failed to load subscription'} />

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Subscription Management</h1>
        <p className="text-gray-600">Manage your subscription plan and billing</p>
      </div>

      {/* Current Subscription */}
      {currentSubscription && (
        <div className="card mb-8">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Current Plan</h2>
                <p className="text-gray-600">
                  {currentSubscription.plan?.name || 'No active subscription'}
                </p>
              </div>
              <div className={`px-4 py-2 rounded-full flex items-center gap-2 ${
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Plan Price</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${currentSubscription.plan?.price || 0}
                  <span className="text-sm text-gray-600 font-normal">/month</span>
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Next Billing Date</p>
                <p className="text-lg font-medium text-gray-900">
                  {currentSubscription.currentPeriodEnd
                    ? new Date(currentSubscription.currentPeriodEnd).toLocaleDateString()
                    : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Payment Method</p>
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-gray-600" />
                  <p className="text-lg font-medium text-gray-900">•••• 4242</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
              <button className="btn-primary">Update Payment Method</button>
              {currentSubscription.status === 'active' && (
                <button
                  onClick={() => setShowCancelDialog(true)}
                  className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
                >
                  Cancel Subscription
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Available Plans */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {currentSubscription ? 'Upgrade Your Plan' : 'Choose a Plan'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrent = currentSubscription?.plan?.name === plan.name
            return (
              <div
                key={plan.id}
                className={`card relative ${
                  plan.popular ? 'border-2 border-primary-600 shadow-lg' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-primary-600 text-white px-3 py-1 text-xs font-semibold rounded-bl-lg rounded-tr-lg">
                    POPULAR
                  </div>
                )}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                    <span className="text-gray-600">/{plan.interval}</span>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {isCurrent ? (
                    <button disabled className="btn-primary w-full opacity-50 cursor-not-allowed">
                      Current Plan
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpgrade(plan)}
                      className="btn-primary w-full"
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
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Billing History</h2>
            <button className="text-primary-600 hover:text-primary-700 flex items-center gap-2 text-sm font-medium">
              <Download className="w-4 h-4" />
              Download All
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Description</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Amount</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Invoice</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { date: '2024-01-01', description: 'Standard Plan - Monthly', amount: 29.99, status: 'paid' },
                  { date: '2023-12-01', description: 'Standard Plan - Monthly', amount: 29.99, status: 'paid' },
                  { date: '2023-11-01', description: 'Standard Plan - Monthly', amount: 29.99, status: 'paid' },
                ].map((invoice, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {new Date(invoice.date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">{invoice.description}</td>
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">
                      ${invoice.amount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium capitalize">
                        {invoice.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
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

      {/* Upgrade Modal */}
      <Modal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        title="Upgrade Subscription"
      >
        {selectedPlan && (
          <div className="space-y-4">
            <p className="text-gray-700">
              You are upgrading to the <strong>{selectedPlan.name}</strong> plan.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">New Plan:</span>
                <span className="font-semibold">{selectedPlan.name}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Price:</span>
                <span className="font-semibold">${selectedPlan.price}/month</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Billing Date:</span>
                <span className="font-semibold">Immediate</span>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              You will be charged immediately for the new plan. Any remaining balance from your
              current plan will be prorated.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button className="flex-1 btn-primary">Confirm Upgrade</button>
            </div>
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

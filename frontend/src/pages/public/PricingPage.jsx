import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import { useQuery } from 'react-query'
import { subscriptionService } from '@/services/apiServices'

// PricingPage - displays two plans: Free and Standard (data-driven)
export default function PricingPage() {
  const [billing, setBilling] = useState('monthly') // 'monthly' | 'annually'

  const { data: plansData, isLoading, error } = useQuery('publicPlans', subscriptionService.getPublicPlans)

  const plans = plansData?.data || []
  const freePlan = plans.find(p => /free/i.test(p.name))
  const standardMonthly = plans.find(p => /standard/i.test(p.name) && p.interval === 'month')
  const standardAnnual = plans.find(p => /standard/i.test(p.name) && p.interval === 'year')

  // Determine display price for standard plan based on billing cycle
  const standardPrice = billing === 'monthly'
    ? (standardMonthly?.price ?? (standardAnnual ? Math.round((standardAnnual.price / 12) * 100) / 100 : 0))
    : (standardAnnual?.price ?? (standardMonthly ? standardMonthly.price * 12 : 0))
  const standardLabel = billing === 'monthly' ? '/month' : '/year'

  // Features
  const FEATURES_FREE = freePlan?.features || [
    '5 Quizzes per Subject / month',
    'Progress Report',
    'Online Study Material',
  ]

  const FEATURES_STANDARD = (standardMonthly?.features || standardAnnual?.features) || [
    'Unlimited Quizzes',
    '1:1 Session with Expert Tutor on Identified Gap',
    'Expert Study Material',
    'Progress Tracking & Analytics',
    'Personalized Mentorship',
    'Priority Support',
  ]

  if (isLoading) {
    return (
      <div className="py-20 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Pricing Plans</h1>
            <p className="text-lg text-gray-600">Loading plans...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-20 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Pricing Plans</h1>
            <p className="text-lg text-gray-600">Failed to load plans</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="py-20 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Pricing Plans</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Choose the plan that fits your learning needs. Get started for free or unlock unlimited practice
            and expert mentorship with Standard.
          </p>
        </div>

        {/* Billing toggle */}
        <div className="flex items-center justify-center mb-8">
          <div className="inline-flex bg-gray-200 rounded-full p-1">
            <button
              onClick={() => setBilling('monthly')}
              className={`px-4 py-2 rounded-full ${billing === 'monthly' ? 'bg-white shadow font-semibold' : 'text-gray-600'}`}
              aria-pressed={billing === 'monthly'}
              aria-label="Monthly billing"
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling('annually')}
              className={`px-4 py-2 rounded-full ${billing === 'annually' ? 'bg-white shadow font-semibold' : 'text-gray-600'}`}
              aria-pressed={billing === 'annually'}
              aria-label="Annual billing"
            >
              Annually
            </button>
          </div>
        </div>

        {/* Plans grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Free Plan Card */}
          <div className="bg-white rounded-xl shadow-md p-8 border border-gray-200">
            {/* Header */}
            <h3 className="text-xl font-semibold text-gray-900 mb-2 text-center">{freePlan?.name || 'Free'}</h3>
            <p className="text-gray-600 text-center mb-6">
              Start with free assessments and materials to discover your learning gaps.
            </p>

            {/* Price */}
            <div className="text-center mb-6">
              <span className="text-4xl font-bold text-gray-900">{freePlan?.price === 0 ? 'Free' : `₹${freePlan?.price}`}</span>
              <div className="text-sm text-gray-500 mt-1">Forever • No credit card required</div>
            </div>

            {/* Features */}
            <ul className="space-y-3 mb-6">
              {FEATURES_FREE.map((feature) => (
                <li key={feature} className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" aria-hidden />
                  <span className="ml-3 text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <Link
              to="/signup?plan=free"
              className="w-full inline-flex items-center justify-center bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition"
              aria-label="Start Free Plan"
            >
              Start Free
            </Link>
          </div>

          {/* Standard Plan Card */}
          <div className="relative bg-gradient-to-br from-white to-primary-50 rounded-xl p-8 border border-primary-200 shadow-lg transform hover:-translate-y-1 transition">
            <div className="absolute -top-4 right-4">
              <span className="text-xs bg-primary-600 text-white px-3 py-1 rounded-full">Most Popular</span>
            </div>

            {/* Header */}
            <div className="text-center mb-4">
              <h3 className="text-2xl font-bold text-gray-900 mb-1">Standard</h3>
              <p className="text-sm text-gray-600">For learners who want comprehensive practice and expert mentorship</p>
            </div>

            {/* Price */}
            <div className="text-center mb-6">
              <div className="flex items-baseline justify-center">
                <span className="text-4xl font-extrabold text-gray-900">₹{standardPrice}</span>
                <span className="ml-2 text-gray-600">{standardLabel}</span>
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {billing === 'annually' ? 'Billed annually • Save on yearly plan' : 'Billed monthly • Cancel anytime'}
              </div>
            </div>

            {/* Features */}
            <ul className="space-y-3 mb-6">
              {FEATURES_STANDARD.map((feature) => (
                <li key={feature} className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" aria-hidden />
                  <span className="ml-3 text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <Link
              to={`/signup?plan=standard&billing=${billing}`}
              className="w-full inline-flex items-center justify-center bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition"
              aria-label="Start Standard Plan"
            >
              Start Standard
            </Link>

            {/* Small billing note */}
            <div className="mt-4 text-xs text-gray-500 text-center">
              <p>
                <strong>Billing Details:</strong> {billing === 'annually' ? (
                  standardAnnual ? `Standard is billed ₹${standardAnnual.price} once per year.` : 'Standard annual price not available.'
                ) : (
                  standardMonthly ? `Standard is billed ₹${standardMonthly.price} per month.` : 'Standard monthly price not available.'
                )} You may upgrade, downgrade, or cancel at any time from your account settings.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

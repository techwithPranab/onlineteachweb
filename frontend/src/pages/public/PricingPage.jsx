import { Check } from 'lucide-react'

const plans = [
  {
    name: 'Basic',
    price: 9.99,
    interval: 'month',
    features: [
      'Access to 3 courses',
      'Join 5 live sessions per month',
      'Download materials',
      'Email support',
    ],
  },
  {
    name: 'Standard',
    price: 29.99,
    interval: 'month',
    popular: true,
    features: [
      'Access to 10 courses',
      'Unlimited live sessions',
      'Download materials',
      'Priority support',
      'Progress tracking',
    ],
  },
  {
    name: 'Premium',
    price: 49.99,
    interval: 'month',
    features: [
      'Unlimited courses',
      'Unlimited live sessions',
      'Download materials',
      '24/7 support',
      'Progress tracking',
      'One-on-one tutoring',
      'Exam preparation',
    ],
  },
]

export default function PricingPage() {
  return (
    <div className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600">
            Choose the plan that works best for you
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`card relative ${
                plan.popular ? 'border-2 border-primary-600' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="flex items-baseline justify-center">
                  <span className="text-5xl font-bold text-gray-900">${plan.price}</span>
                  <span className="text-gray-600 ml-2">/{plan.interval}</span>
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="ml-3 text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                className={`w-full py-3 rounded-lg font-semibold transition ${
                  plan.popular
                    ? 'bg-primary-600 text-white hover:bg-primary-700'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                Get Started
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

import React, { useState } from 'react'
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js'
import { subscriptionService } from '@/services/apiServices'
import { useQueryClient } from 'react-query'

export default function CheckoutForm({ plan, onSuccess, onCancel }) {
  const stripe = useStripe()
  const elements = useElements()
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (!plan || !plan.docId) throw new Error('Invalid plan selected')

      // If Stripe is available and Elements initialized, use CardElement
      if (stripe && elements) {
        const card = elements.getElement(CardElement)
        if (!card) throw new Error('Payment form not loaded')

        const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
          type: 'card',
          card,
        })

        if (pmError) throw pmError

        const res = await subscriptionService.checkout(plan.docId, paymentMethod.id)

        // If server returns clientSecret, confirm payment
        if (res.clientSecret) {
          const confirm = await stripe.confirmCardPayment(res.clientSecret, {
            payment_method: paymentMethod.id
          })

          if (confirm.error) {
            throw confirm.error
          }

          // payment succeeded
          queryClient.invalidateQueries('subscriptionStatus')
          onSuccess && onSuccess(confirm)
          return
        }

        // Fallback: server created subscription without Stripe
        if (res.subscription) {
          queryClient.invalidateQueries('subscriptionStatus')
          onSuccess && onSuccess(res)
          return
        }

        throw new Error('Unexpected server response')
      }

      // No Stripe - fallback to server-side subscription creation (test/dev mode)
      const res = await subscriptionService.checkout(plan.docId, null)
      if (res.subscription) {
        queryClient.invalidateQueries('subscriptionStatus')
        onSuccess && onSuccess(res)
        return
      }

      throw new Error(res.message || 'Subscription failed')
    } catch (err) {
      setError(err.message || 'Payment failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-sm text-gray-700">
        You will be charged ₹{plan.price}/{plan.interval} for the <strong>{plan.name}</strong> plan.
      </div>

      <div className="bg-white p-4 rounded border">
        <label className="text-sm text-gray-700">Card Details</label>
        <div className="mt-2">
          <div className="p-3 border rounded">
            <CardElement options={{ style: { base: { fontSize: '16px' } } }} />
          </div>
        </div>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      <div className="flex gap-3">
        <button type="button" onClick={onCancel} className="px-4 py-2 border rounded-lg bg-gray-50">
          Cancel
        </button>
        <button type="submit" disabled={loading} className="btn-primary flex-1">
          {loading ? 'Processing...' : 'Confirm & Pay'}
        </button>
      </div>

      <div className="text-xs text-gray-500">
        Use test card 4242 4242 4242 4242 (any future date) for testing payments.
      </div>
    </form>
  )
}

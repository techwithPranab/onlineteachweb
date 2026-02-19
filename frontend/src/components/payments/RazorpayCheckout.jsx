import { useState, useEffect } from 'react';
import { razorpayService } from '@/services/apiServices';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorMessage from '@/components/common/ErrorMessage';
import MeritaiButton from '@/components/ui/MeritaiButton';

const RazorpayCheckout = ({ plan, onSuccess, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    script.onerror = () => setError('Failed to load Razorpay. Please try again.');
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handlePayment = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get Razorpay config
      const configRes = await razorpayService.getConfig();
      
      if (!configRes.success || !configRes.enabled) {
        throw new Error('Razorpay is not configured. Please contact support.');
      }

      // Create order
      const orderRes = await razorpayService.createOrder(plan.docId || plan.id);

      if (!orderRes.success) {
        throw new Error(orderRes.message || 'Failed to create order');
      }

      const { order, paymentId, key } = orderRes;

      // Razorpay options
      const options = {
        key: key,
        amount: order.amount,
        currency: order.currency,
        name: 'MeritAI Learning Platform',
        description: `${plan.name} Subscription`,
        image: '/logo.png', // Optional: Add your logo
        order_id: order.id,
        handler: async function (response) {
          try {
            setIsLoading(true);
            
            // Verify payment
            const verifyRes = await razorpayService.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planId: plan.docId || plan.id,
              paymentId: paymentId
            });

            if (verifyRes.success) {
              onSuccess(verifyRes.subscription);
            } else {
              throw new Error(verifyRes.message || 'Payment verification failed');
            }
          } catch (err) {
            console.error('Payment verification error:', err);
            setError(err.message || 'Payment verification failed. Please contact support.');
            setIsLoading(false);
          }
        },
        prefill: {
          name: localStorage.getItem('userName') || '',
          email: localStorage.getItem('userEmail') || '',
          contact: '', // Optional: Add phone number if available
        },
        notes: {
          plan_id: plan.docId || plan.id,
          plan_name: plan.name,
        },
        theme: {
          color: '#10b981', // Emerald color to match your theme
        },
        // Enable only specific payment methods
        method: {
          upi: true,
          card: true,
          netbanking: true,
          wallet: true
          // Don't include emi and paylater - they will be disabled
        },
        // Explicitly hide unwanted payment methods
        config: {
          display: {
            hide: [
              { method: 'paylater' },
              { method: 'emi' }
            ]
          }
        },
        modal: {
          ondismiss: function() {
            setIsLoading(false);
            setError('Payment cancelled');
          },
          escape: true,
          confirm_close: true
        }
      };

      // Debug: Log the configuration
      console.log('🔧 Razorpay Configuration:', {
        methods: options.method,
        hidden: options.config?.display?.hide,
        currency: options.currency,
        amount: options.amount
      });

      // Open Razorpay checkout
      const razorpay = new window.Razorpay(options);
      razorpay.open();
      
      setIsLoading(false);
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message || 'Failed to initiate payment');
      setIsLoading(false);
    }
  };

  if (!razorpayLoaded) {
    return (
      <div className="text-center py-8">
        <LoadingSpinner />
        <p className="mt-4 text-gray-600">Loading payment gateway...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Plan Summary */}
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border-2 border-emerald-200">
        <h3 className="text-xl font-bold text-gray-900 mb-4">📋 Payment Summary</h3>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Plan:</span>
            <span className="font-bold text-gray-900">{plan.name}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Billing Cycle:</span>
            <span className="font-bold text-gray-900 capitalize">{plan.interval}ly</span>
          </div>
          
          <div className="border-t border-emerald-200 pt-3 mt-3">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
              <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                ₹{plan.price}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Features List */}
      {plan.features && plan.features.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-gray-900">✨ What's Included:</h4>
          <ul className="space-y-2">
            {plan.features.map((feature, index) => (
              <li key={index} className="flex items-start gap-2 text-gray-600">
                <span className="text-emerald-500 mt-1">✓</span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <ErrorMessage message={error} />
      )}

      {/* Payment Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🔒</span>
          <div className="flex-1">
            <h4 className="font-semibold text-blue-900 mb-1">Secure Payment</h4>
            <p className="text-sm text-blue-700">
              Your payment is processed securely through Razorpay. We support UPI, Cards, Net Banking, and Wallets.
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={onClose}
          disabled={isLoading}
          className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        
        <MeritaiButton
          onClick={handlePayment}
          disabled={isLoading}
          className="flex-1 px-6 py-3 font-semibold rounded-xl shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <LoadingSpinner size="small" />
              Processing...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              💳 Pay ₹{plan.price}
            </span>
          )}
        </MeritaiButton>
      </div>

      {/* Payment Methods */}
      <div className="text-center text-sm text-gray-500">
        <p className="mb-2">We accept:</p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <span className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs font-medium">💳 Cards</span>
          <span className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs font-medium">📱 UPI</span>
          <span className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs font-medium">🏦 Net Banking</span>
          <span className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs font-medium">💰 Wallets</span>
        </div>
      </div>
    </div>
  );
};

export default RazorpayCheckout;

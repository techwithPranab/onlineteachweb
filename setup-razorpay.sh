#!/bin/bash

# Razorpay Integration Setup Script
# This script helps you set up Razorpay integration

echo "🚀 Razorpay Integration Setup"
echo "=============================="
echo ""

# Check if .env exists
if [ ! -f "backend/.env" ]; then
    echo "⚠️  No .env file found in backend directory"
    echo "Creating from .env.example..."
    cp backend/.env.example backend/.env
    echo "✅ Created backend/.env from .env.example"
else
    echo "✅ Found existing backend/.env file"
fi

echo ""
echo "📝 Next Steps:"
echo ""
echo "1. Sign up at https://razorpay.com if you haven't already"
echo ""
echo "2. Get your API keys:"
echo "   - Go to Dashboard → Settings → API Keys"
echo "   - Generate Test keys for development"
echo "   - Copy Key ID and Key Secret"
echo ""
echo "3. Add these to backend/.env:"
echo "   RAZORPAY_KEY_ID=rzp_test_your_key_id"
echo "   RAZORPAY_KEY_SECRET=your_razorpay_key_secret"
echo ""
echo "4. Set up webhooks (for production):"
echo "   - Go to Dashboard → Settings → Webhooks"
echo "   - Add webhook URL: https://yourdomain.com/api/payments/razorpay/webhook"
echo "   - Select events: payment.captured, payment.failed, subscription.cancelled"
echo "   - Copy webhook secret and add to .env:"
echo "   RAZORPAY_WEBHOOK_SECRET=your_webhook_secret"
echo ""
echo "5. Test the integration:"
echo "   - Start backend: cd backend && npm start"
echo "   - Start frontend: cd frontend && npm run dev"
echo "   - Navigate to Student Dashboard → Subscriptions"
echo "   - Try a test payment with test credentials"
echo ""
echo "📚 For detailed documentation, see RAZORPAY_INTEGRATION.md"
echo ""
echo "🧪 Test Credentials:"
echo "   Card: 4111 1111 1111 1111 | CVV: Any 3 digits"
echo "   UPI: success@razorpay"
echo ""
echo "✨ Setup complete! Happy coding!"

import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { CheckCircle, Clock, ArrowRight } from 'lucide-react'

export default function SignupSuccess() {
  const navigate = useNavigate()
  const location = useLocation()
  const { role, message } = location.state || {}

  useEffect(() => {
    // If no state, redirect to home
    if (!role || !message) {
      navigate('/')
    }
  }, [role, message, navigate])

  if (!role || !message) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center">
          {role === 'tutor' ? (
            <Clock className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          ) : (
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          )}

          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {role === 'tutor' ? 'Application Submitted!' : 'Welcome!'}
          </h2>

          <div className="card text-left mb-6">
            <p className="text-gray-700 leading-relaxed">{message}</p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => navigate('/login')}
              className="w-full btn-primary inline-flex items-center justify-center space-x-2"
            >
              <span>Go to Login</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              onClick={() => navigate('/')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

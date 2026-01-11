import { Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { BookOpen, LogIn, UserPlus } from 'lucide-react'

export default function Navbar() {
  const { isAuthenticated, user } = useAuthStore()

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-primary-600" />
              <span className="text-xl font-bold text-gray-900">EduPlatform</span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <Link to="/pricing" className="text-gray-700 hover:text-primary-600 transition">
              Pricing
            </Link>
            <Link to="/" className="text-gray-700 hover:text-primary-600 transition">
              About
            </Link>

            {isAuthenticated ? (
              <Link
                to={`/${user.role}`}
                className="btn-primary inline-flex items-center space-x-2"
              >
                <span>Dashboard</span>
              </Link>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="inline-flex items-center space-x-2 text-gray-700 hover:text-primary-600"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Login</span>
                </Link>
                <Link to="/signup" className="btn-primary inline-flex items-center space-x-2">
                  <UserPlus className="h-4 w-4" />
                  <span>Sign Up</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

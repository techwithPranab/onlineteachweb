import { Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { BookOpen } from 'lucide-react'

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

          <div className="flex items-center space-x-8">
            <Link to="/courses" className="text-gray-700 hover:text-primary-600 transition font-medium">
              Courses
            </Link>
            <Link to="/pricing" className="text-gray-700 hover:text-primary-600 transition font-medium">
              Pricing
            </Link>
            <Link to="/" className="text-gray-700 hover:text-primary-600 transition font-medium">
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
              <div className="flex items-center space-x-6">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-primary-600 font-medium transition"
                >
                  Login
                </Link>
                <Link 
                  to="/signup" 
                  className="text-gray-700 hover:text-primary-600 font-medium transition"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

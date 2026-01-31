import { Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { BookOpen, Menu, X } from 'lucide-react'
import { useState } from 'react'

export default function Navbar() {
  const { isAuthenticated, user } = useAuthStore()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-primary-600" />
              <span className="text-xl font-bold text-gray-900">MeritAI</span>
            </Link>
          </div>

          <div className="flex items-center space-x-8">
            {/* Desktop Links */}
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/courses" className="text-gray-700 hover:text-primary-600 transition font-medium">
                Courses
              </Link>
              <Link to="/pricing" className="text-gray-700 hover:text-primary-600 transition font-medium">
                Pricing
              </Link>

              {isAuthenticated ? (
                null
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

            {/* Mobile menu button */}
            <div className="flex items-center md:hidden">
              <button
                onClick={() => setMobileOpen((s) => !s)}
                aria-expanded={mobileOpen}
                aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                className="p-2 rounded-md text-gray-700 hover:bg-gray-100"
              >
                {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-4 py-3 space-y-3">
            <Link to="/courses" className="block text-gray-700 font-medium" onClick={() => setMobileOpen(false)}>Courses</Link>
            <Link to="/pricing" className="block text-gray-700 font-medium" onClick={() => setMobileOpen(false)}>Pricing</Link>
            {isAuthenticated ? (
              null
            ) : (
              <>
                <Link to="/login" className="block text-gray-700" onClick={() => setMobileOpen(false)}>Login</Link>
                <Link to="/signup" className="block text-gray-700" onClick={() => setMobileOpen(false)}>Sign Up</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}

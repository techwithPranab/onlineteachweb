import { Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { BookOpen, Menu, X, User, LogOut } from 'lucide-react'
import { useState } from 'react'

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await logout()
      setMobileOpen(false)
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

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
                <div className="flex items-center space-x-4">
                  {/* Dashboard Link */}
                  <Link 
                    to={`/${user?.role}`}
                    className="text-gray-700 hover:text-primary-600 transition font-medium"
                  >
                    Dashboard
                  </Link>
                  
                  {/* User Menu */}
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-primary-700 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-gray-700 font-medium text-sm">
                      {user?.name}
                    </span>
                  </div>
                  
                  {/* Logout Button */}
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 px-3 py-2 text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-lg transition font-medium"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
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
              <div className="border-t border-gray-200 pt-3 space-y-3">
                <Link to={`/${user?.role}`} className="block text-gray-700 font-medium" onClick={() => setMobileOpen(false)}>Dashboard</Link>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-primary-700 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-gray-700 font-medium text-sm">
                    {user?.name}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 w-full text-left text-gray-700 hover:text-primary-600 font-medium"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
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

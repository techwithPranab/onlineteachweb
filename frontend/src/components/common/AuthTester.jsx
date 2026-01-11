import { useState } from 'react'
import { useAuthStore } from '../store/authStore'

export default function AuthTester() {
  const { login, logout, user, isAuthenticated } = useAuthStore()
  const [testResults, setTestResults] = useState([])
  const [isRunning, setIsRunning] = useState(false)

  const addResult = (test, success, message, data = null) => {
    setTestResults(prev => [...prev, {
      test,
      success,
      message,
      data,
      timestamp: new Date().toLocaleTimeString()
    }])
  }

  const testCredentials = [
    {
      role: 'admin',
      email: 'admin@teachingplatform.com',
      password: 'admin123'
    },
    {
      role: 'tutor',
      email: 'john.smith@example.com',
      password: 'tutor123'
    },
    {
      role: 'student',
      email: 'emily.davis@example.com',
      password: 'student123'
    }
  ]

  const runAuthTests = async () => {
    setIsRunning(true)
    setTestResults([])

    for (const credential of testCredentials) {
      try {
        // Test login
        addResult(`${credential.role.toUpperCase()} Login`, null, `Testing login for ${credential.email}...`)
        
        const result = await login(credential.email, credential.password)
        
        if (result && result.user) {
          addResult(
            `${credential.role.toUpperCase()} Login`, 
            true, 
            `Successfully logged in as ${result.user.name} (${result.user.role})`,
            result.user
          )
          
          // Wait a moment then logout
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          await logout()
          addResult(`${credential.role.toUpperCase()} Logout`, true, 'Successfully logged out')
        } else {
          addResult(`${credential.role.toUpperCase()} Login`, false, 'Login failed - no user data returned')
        }
        
      } catch (error) {
        addResult(
          `${credential.role.toUpperCase()} Login`, 
          false, 
          `Login failed: ${error.message || 'Unknown error'}`,
          error
        )
      }
      
      // Wait between tests
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    setIsRunning(false)
  }

  const clearResults = () => {
    setTestResults([])
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="card">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Authentication Flow Tester</h2>
        
        {/* Current Auth Status */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-2">Current Status:</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Authenticated:</span> 
              <span className={`ml-2 ${isAuthenticated ? 'text-green-600' : 'text-red-600'}`}>
                {isAuthenticated ? 'Yes' : 'No'}
              </span>
            </div>
            <div>
              <span className="font-medium">User:</span> 
              <span className="ml-2">
                {user ? `${user.name} (${user.role})` : 'None'}
              </span>
            </div>
          </div>
        </div>

        {/* Test Credentials */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-700 mb-3">Test Credentials:</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {testCredentials.map((cred, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg">
                <div className="font-semibold text-sm uppercase text-gray-600">{cred.role}</div>
                <div className="text-sm text-gray-700">{cred.email}</div>
                <div className="text-sm text-gray-500">{cred.password}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={runAuthTests}
            disabled={isRunning}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunning ? 'Running Tests...' : 'Run Authentication Tests'}
          </button>
          
          <button
            onClick={clearResults}
            className="btn-secondary"
            disabled={isRunning}
          >
            Clear Results
          </button>

          {isAuthenticated && (
            <button
              onClick={logout}
              className="btn-danger"
            >
              Logout Current User
            </button>
          )}
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div>
            <h3 className="font-semibold text-gray-700 mb-3">Test Results:</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    result.success === null
                      ? 'bg-blue-50 border-blue-200'
                      : result.success
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="font-medium">{result.test}</span>
                      {result.success !== null && (
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            result.success
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {result.success ? 'PASS' : 'FAIL'}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">{result.timestamp}</span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mt-1">{result.message}</p>
                  
                  {result.data && (
                    <details className="mt-2">
                      <summary className="text-xs text-gray-500 cursor-pointer">
                        Show Details
                      </summary>
                      <pre className="text-xs bg-gray-100 p-2 mt-1 rounded overflow-x-auto">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

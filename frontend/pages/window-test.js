import { useState } from 'react'

export default function WindowTest() {
  const [message, setMessage] = useState('')

  const testWindowOpen = () => {
    setMessage('Opening window...')
    
    // Test the same approach as our Start Session
    const newWindow = window.open('about:blank', '_blank')
    
    if (!newWindow) {
      setMessage('❌ Popup blocked! Please allow popups.')
      return
    }

    newWindow.document.write(`
      <html>
        <head>
          <title>Test Loading...</title>
          <style>
            body { 
              font-family: Arial, sans-serif;
              display: flex; 
              align-items: center; 
              justify-content: center; 
              height: 100vh; 
              margin: 0; 
              background: #4f46e5;
              color: white;
            }
            .loading { text-align: center; }
            .spinner { 
              border: 4px solid rgba(255,255,255,0.3);
              border-radius: 50%;
              border-top: 4px solid white;
              width: 40px;
              height: 40px;
              animation: spin 1s linear infinite;
              margin: 0 auto 20px;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          </style>
        </head>
        <body>
          <div class="loading">
            <div class="spinner"></div>
            <h2>Testing Window Open...</h2>
            <p>This window will redirect in 3 seconds</p>
          </div>
        </body>
      </html>
    `)

    setMessage('✅ Window opened! Redirecting in 3 seconds...')

    // Simulate API delay and then redirect
    setTimeout(() => {
      if (!newWindow.closed) {
        newWindow.location.href = '/tutor/schedule'
        setMessage('✅ Window redirected to schedule page!')
      } else {
        setMessage('❌ Window was closed')
      }
    }, 3000)
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
        <h1 className="text-2xl font-bold mb-6">Window Open Test</h1>
        
        <button
          onClick={testWindowOpen}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium mb-4"
        >
          Test Window Open
        </button>
        
        {message && (
          <div className={`p-3 rounded ${
            message.includes('❌') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
          }`}>
            {message}
          </div>
        )}
        
        <div className="mt-6 text-sm text-gray-600">
          <p>This test simulates the Start Session functionality:</p>
          <ul className="list-disc list-inside text-left mt-2 space-y-1">
            <li>Opens a window immediately (no popup blocking)</li>
            <li>Shows loading content</li>
            <li>Redirects after "API call" completes</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

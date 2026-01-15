import { useState } from 'react'
import Whiteboard from '../src/components/whiteboard/TldrawWhiteboard'

export default function TldrawDemo() {
  const [mockSocket, setMockSocket] = useState({
    emit: (event, data) => console.log('Socket emit:', event, data),
    on: (event, handler) => console.log('Socket on:', event),
    off: (event, handler) => console.log('Socket off:', event),
    userId: 'demo-user'
  })

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Tldraw Whiteboard Demo</h1>
          <p className="text-gray-600 mb-4">
            This is a demonstration of the new tldraw-based whiteboard with integrated math support.
          </p>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">✨ New Features</h3>
              <ul className="list-disc pl-5 space-y-1 text-gray-700">
                <li>Professional infinite canvas with tldraw</li>
                <li>Built-in drawing tools (pen, shapes, text, etc.)</li>
                <li>Zoom and pan capabilities</li>
                <li>Mathematical formula support with LaTeX</li>
                <li>Math templates for common equations</li>
                <li>Real-time collaboration support</li>
                <li>Export functionality</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">🔧 How to Use</h3>
              <ul className="list-disc pl-5 space-y-1 text-gray-700">
                <li>Use the built-in tldraw tools for drawing</li>
                <li>Click the calculator icon for math formulas</li>
                <li>Click the library icon for math templates</li>
                <li>Enter LaTeX formulas (e.g., fractions, superscripts)</li>
                <li>Preview formulas before adding them</li>
                <li>Save and export your work</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Whiteboard Container */}
        <div className="bg-white rounded-lg shadow-lg p-4">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Interactive Whiteboard</h2>
          <Whiteboard
            socket={mockSocket}
            sessionId="demo-session"
            userRole="tutor"
            className="w-full"
          />
        </div>

        {/* Additional Info */}
        <div className="bg-white rounded-lg shadow-lg p-6 mt-4">
          <h3 className="text-lg font-semibold mb-3">Benefits of tldraw Integration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">🚀 Performance</h4>
              <p className="text-blue-700 text-sm">
                Optimized for smooth drawing with hardware acceleration and efficient rendering.
              </p>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">🎨 Rich Features</h4>
              <p className="text-green-700 text-sm">
                Professional drawing tools, shapes, text, and collaboration features out of the box.
              </p>
            </div>
            
            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-semibold text-purple-800 mb-2">📊 Math Support</h4>
              <p className="text-purple-700 text-sm">
                Seamless integration with LaTeX for mathematical expressions and formulas.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

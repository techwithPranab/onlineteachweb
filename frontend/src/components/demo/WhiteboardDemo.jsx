import { useState } from 'react'
import Whiteboard from '../whiteboard/TldrawWhiteboard'

export default function WhiteboardDemo() {
  const [sessionId] = useState('demo-session-123')
  
  // Mock socket for demo purposes
  const mockSocket = {
    userId: 'demo-user',
    emit: (event, data) => {
      console.log('Socket emit:', event, data)
    },
    on: (event, handler) => {
      console.log('Socket listening:', event)
    },
    off: (event) => {
      console.log('Socket off:', event)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Interactive Whiteboard with Math Templates</h1>
          <p className="text-gray-600 mb-4">
            This whiteboard includes comprehensive mathematical templates and symbols for online teaching.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Features:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Drawing tools (pen, eraser, shapes)</li>
                <li>• Mathematical formula support</li>
                <li>• Pre-built math templates</li>
                <li>• Symbol picker</li>
                <li>• Real-time collaboration</li>
                <li>• Grid view</li>
                <li>• Undo/Redo functionality</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Math Template Categories:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Basic Operations (fractions, powers, roots)</li>
                <li>• Calculus (derivatives, integrals, limits)</li>
                <li>• Algebra (quadratic formula, matrices)</li>
                <li>• Geometry (distance, circles, areas)</li>
                <li>• Statistics (mean, std dev, distributions)</li>
                <li>• Trigonometry (sine rule, identities)</li>
              </ul>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h4 className="font-semibold text-blue-800 mb-2">How to use Math Templates:</h4>
            <ol className="text-sm text-blue-700 space-y-1">
              <li>1. Click the Calculator icon (📖) in the toolbar to open Math Symbols</li>
              <li>2. Click "Templates" button to open the Math Templates modal</li>
              <li>3. Browse categories and select a template</li>
              <li>4. Click "Add to Whiteboard" to insert the formula</li>
              <li>5. Edit the formula as needed for your lesson</li>
            </ol>
          </div>
        </div>

        {/* Whiteboard Container */}
        <div className="bg-white rounded-lg shadow-lg p-4">
          <div style={{ height: '600px', position: 'relative' }}>
            <Whiteboard
              socket={mockSocket}
              sessionId={sessionId}
              userRole="tutor"
              className="w-full h-full"
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mt-4">
          <h3 className="font-semibold text-gray-800 mb-2">Quick Tips:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Use the Library icon (📚) to access pre-built mathematical templates</li>
            <li>• The Calculator icon (🧮) opens the symbol picker for custom formulas</li>
            <li>• Click on any template preview to add it directly to the whiteboard</li>
            <li>• Templates include fractions, integrals, matrices, and much more</li>
            <li>• All formulas are rendered using LaTeX for professional appearance</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

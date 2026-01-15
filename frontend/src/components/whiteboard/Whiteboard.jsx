import { useState, useRef, useEffect, useCallback } from 'react'
import { Tldraw, createTLStore, defaultShapeUtils, getSnapshot, loadSnapshot } from 'tldraw'
import 'tldraw/tldraw.css'
import 'katex/dist/katex.min.css'
import { InlineMath, BlockMath } from 'react-katex'
import MathTemplates from './MathTemplates'
import {
  Download,
  Upload,
  Trash2,
  Calculator,
  Save,
  X,
  Library
} from 'lucide-react'

const MATH_SYMBOLS = [
  { label: '√', value: '\\sqrt{}', description: 'Square root' },
  { label: 'x²', value: '^2', description: 'Superscript' },
  { label: 'x₁', value: '_1', description: 'Subscript' },
  { label: '∫', value: '\\int', description: 'Integral' },
  { label: '∑', value: '\\sum', description: 'Sum' },
  { label: '∏', value: '\\prod', description: 'Product' },
  { label: '∂', value: '\\partial', description: 'Partial derivative' },
  { label: '∞', value: '\\infty', description: 'Infinity' },
  { label: 'α', value: '\\alpha', description: 'Alpha' },
  { label: 'β', value: '\\beta', description: 'Beta' },
  { label: 'γ', value: '\\gamma', description: 'Gamma' },
  { label: 'θ', value: '\\theta', description: 'Theta' },
  { label: 'π', value: '\\pi', description: 'Pi' },
  { label: '≠', value: '\\neq', description: 'Not equal' },
  { label: '≤', value: '\\leq', description: 'Less than or equal' },
  { label: '≥', value: '\\geq', description: 'Greater than or equal' },
  { label: '±', value: '\\pm', description: 'Plus minus' },
  { label: '×', value: '\\times', description: 'Times' },
  { label: '÷', value: '\\div', description: 'Division' },
  { label: '∈', value: '\\in', description: 'Element of' },
  { label: '∉', value: '\\notin', description: 'Not element of' },
  { label: '∪', value: '\\cup', description: 'Union' },
  { label: '∩', value: '\\cap', description: 'Intersection' },
  { label: '⊂', value: '\\subset', description: 'Subset' },
  { label: '⊆', value: '\\subseteq', description: 'Subset or equal' },
]

export default function Whiteboard({ socket, sessionId, userRole, className = '' }) {
  // Store and editor refs
  const editorRef = useRef(null)
  const storeRef = useRef(null)
  
  // State
  const [showMathTemplates, setShowMathTemplates] = useState(false)
  const [showMathSymbols, setShowMathSymbols] = useState(false)
  const [mathInput, setMathInput] = useState('')
  const [mathPreview, setMathPreview] = useState('')
  const [isReady, setIsReady] = useState(false)

  // Initialize tldraw store
  useEffect(() => {
    if (!storeRef.current) {
      storeRef.current = createTLStore({ shapeUtils: defaultShapeUtils })
      setIsReady(true)
    }
  }, [])

  // Save and broadcast whiteboard state
  const saveAndBroadcast = useCallback(() => {
    if (!storeRef.current || !socket || !sessionId) return

    const snapshot = getSnapshot(storeRef.current)
    socket.emit('whiteboard:update', {
      sessionId,
      data: snapshot,
      userId: socket.userId
    })
  }, [socket, sessionId])

  // Handle remote whiteboard updates
  const handleRemoteUpdate = useCallback((data) => {
    if (!storeRef.current || !data.data || data.userId === socket?.userId) return
    
    try {
      loadSnapshot(storeRef.current, data.data)
    } catch (error) {
      console.error('Failed to load whiteboard snapshot:', error)
    }
  }, [socket])

  // Handle remote clear
  const handleRemoteClear = useCallback(() => {
    if (storeRef.current) {
      storeRef.current.clear()
    }
  }, [])

  // Socket event listeners
  useEffect(() => {
    if (!socket) return

    socket.on('whiteboard:update', handleRemoteUpdate)
    socket.on('whiteboard:clear', handleRemoteClear)

    return () => {
      socket.off('whiteboard:update', handleRemoteUpdate)
      socket.off('whiteboard:clear', handleRemoteClear)
    }
  }, [socket, handleRemoteUpdate, handleRemoteClear])

  // Handle store changes
  const handleMount = useCallback((editor) => {
    editorRef.current = editor
    
    if (!storeRef.current) return

    // Listen for changes and broadcast them (only for tutors or when allowed)
    const handleChange = () => {
      if (userRole === 'tutor') {
        saveAndBroadcast()
      }
    }

    // Throttle the change handler to avoid too many updates
    let timeoutId = null
    const throttledHandleChange = () => {
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(handleChange, 300)
    }

    const unsubscribe = editor.store.listen(throttledHandleChange)
    return unsubscribe
  }, [saveAndBroadcast, userRole])

  // Math formula functions
  const addMathFormula = (latex = null) => {
    const formula = latex || mathInput.trim()
    if (!formula || !editorRef.current) return

    try {
      // Create a text shape with the LaTeX formula
      const editor = editorRef.current
      const { x, y } = editor.getViewportScreenCenter()
      
      // Use the correct tldraw v4 API
      editor.createShapes([{
        type: 'text',
        x: x - 50,
        y: y - 20,
        props: {
          text: `$${formula}$`,
          color: 'black',
          size: 'm',
          font: 'serif'
        }
      }])
      
      setMathInput('')
      setShowMathSymbols(false)
    } catch (error) {
      console.error('Error adding math formula:', error)
      // Fallback: try simpler approach
      try {
        const editor = editorRef.current
        editor.createShapes([{
          type: 'text',
          x: 100,
          y: 100,
          props: {
            text: formula
          }
        }])
        setMathInput('')
        setShowMathSymbols(false)
      } catch (fallbackError) {
        console.error('Fallback error:', fallbackError)
        alert('Unable to add formula. Please try again.')
      }
    }
  }

  const insertMathSymbol = (symbol) => {
    setMathInput(prev => prev + symbol)
  }

  const selectMathTemplate = (template) => {
    // Add the template directly to the whiteboard
    addMathFormula(template)
    setShowMathTemplates(false)
    
    // Also set it in the input for potential editing
    setMathInput(template)
    setShowMathSymbols(true)
  }

  // Whiteboard utility functions
  const saveWhiteboard = () => {
    if (!storeRef.current || !socket) return

    const snapshot = getSnapshot(storeRef.current)
    socket.emit('whiteboard:save', {
      sessionId,
      data: snapshot,
      userId: socket.userId,
    })
    
    // Show save confirmation
    const notification = document.createElement('div')
    notification.textContent = 'Whiteboard saved!'
    notification.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg z-50'
    document.body.appendChild(notification)
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification)
      }
    }, 2000)
  }

  const clearCanvas = () => {
    if (!editorRef.current) return

    editorRef.current.selectAll()
    editorRef.current.deleteShapes()
    
    socket?.emit('whiteboard:clear', { sessionId })
  }

  const exportCanvas = () => {
    if (!editorRef.current) return

    editorRef.current.exportAs(['selected'], 'png', { scale: 2, background: true })
      .then(blob => {
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.download = 'whiteboard.png'
        link.href = url
        link.click()
        URL.revokeObjectURL(url)
      })
      .catch(error => {
        console.error('Export failed:', error)
      })
  }

  // Math preview effect
  useEffect(() => {
    if (mathInput.trim()) {
      setMathPreview(mathInput.trim())
    } else {
      setMathPreview('')
    }
  }, [mathInput])

  if (!isReady || !storeRef.current) {
    return (
      <div className={`relative bg-white rounded-lg shadow-lg ${className} flex items-center justify-center h-96`}>
        <div className="text-gray-500">Loading whiteboard...</div>
      </div>
    )
  }

  return (
    <div className={`relative bg-white rounded-lg shadow-lg ${className}`}>
      {/* Custom Toolbar Overlay */}
      <div className="absolute top-4 right-4 z-10 bg-white rounded-lg shadow-lg p-2 flex gap-2">
        <button
          onClick={() => setShowMathSymbols(!showMathSymbols)}
          className={`p-2 rounded ${showMathSymbols ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
          title="Math Formula"
        >
          <Calculator className="w-4 h-4" />
        </button>

        <button
          onClick={() => setShowMathTemplates(true)}
          className="p-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-700"
          title="Math Templates"
        >
          <Library className="w-4 h-4" />
        </button>

        <button
          onClick={saveWhiteboard}
          className="p-2 rounded bg-green-100 hover:bg-green-200 text-green-700"
          title="Save Whiteboard"
        >
          <Save className="w-4 h-4" />
        </button>

        <button
          onClick={clearCanvas}
          className="p-2 rounded bg-red-100 hover:bg-red-200 text-red-700"
          title="Clear All"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        <button
          onClick={exportCanvas}
          className="p-2 rounded bg-blue-100 hover:bg-blue-200 text-blue-700"
          title="Export"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>

      {/* Math Symbols Panel */}
      {showMathSymbols && (
        <div className="absolute top-16 right-4 bg-white rounded-lg shadow-lg p-4 z-20 w-96 max-h-96 overflow-y-auto">
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-800">Mathematical Formula</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowMathTemplates(true)}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded"
                >
                  Templates
                </button>
                <button
                  onClick={() => setShowMathSymbols(false)}
                  className="p-1 text-gray-500 hover:text-gray-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* Math Input */}
            <div className="mb-3">
              <textarea
                value={mathInput}
                onChange={(e) => setMathInput(e.target.value)}
                placeholder="Enter LaTeX formula (e.g., \\frac{a}{b}, x^2, \\sqrt{x})"
                className="w-full p-2 border border-gray-300 rounded resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="3"
              />
              
              {mathPreview && (
                <div className="mt-2 p-2 bg-gray-50 rounded border">
                  <strong className="text-sm text-gray-600">Preview:</strong>
                  <div className="mt-1">
                    <InlineMath math={mathPreview} />
                  </div>
                </div>
              )}
              
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => addMathFormula()}
                  disabled={!mathInput.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded"
                >
                  Add Formula
                </button>
                <button
                  onClick={() => setMathInput('')}
                  className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Math Symbols Grid */}
            <div>
              <h4 className="text-sm font-medium mb-2 text-gray-700">Common Symbols:</h4>
              <div className="grid grid-cols-6 gap-2">
                {MATH_SYMBOLS.map((symbol, index) => (
                  <button
                    key={index}
                    onClick={() => insertMathSymbol(symbol.value)}
                    className="p-2 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded text-center transition-colors"
                    title={symbol.description}
                  >
                    {symbol.label}
                  </button>
                ))}
              </div>
              
              {/* Quick Actions */}
              <div className="mt-3 pt-3 border-t border-gray-200">
                <h4 className="text-sm font-medium mb-2 text-gray-700">Quick Actions:</h4>
                <div className="flex gap-2 text-xs flex-wrap">
                  <button
                    onClick={() => setMathInput('\\frac{a}{b}')}
                    className="px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded"
                  >
                    Fraction
                  </button>
                  <button
                    onClick={() => setMathInput('x^{2}')}
                    className="px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded"
                  >
                    Power
                  </button>
                  <button
                    onClick={() => setMathInput('\\sqrt{x}')}
                    className="px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded"
                  >
                    Root
                  </button>
                  <button
                    onClick={() => setMathInput('\\sum_{i=1}^{n}')}
                    className="px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded"
                  >
                    Sum
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tldraw Whiteboard */}
      <div className="h-96 w-full rounded-lg overflow-hidden border border-gray-300">
        <Tldraw
          store={storeRef.current}
          onMount={handleMount}
          hideUi={false}
          inferDarkMode
        />
      </div>

      {/* Math Templates Modal */}
      <MathTemplates
        isOpen={showMathTemplates}
        onClose={() => setShowMathTemplates(false)}
        onSelectTemplate={selectMathTemplate}
      />
    </div>
  )
}

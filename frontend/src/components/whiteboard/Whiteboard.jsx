import { useState, useRef, useEffect, useCallback } from 'react'
import { fabric } from 'fabric'
import 'katex/dist/katex.min.css'
import { InlineMath, BlockMath } from 'react-katex'
import MathTemplates from './MathTemplates'
import {
  Pen,
  Eraser,
  Square,
  Circle,
  Minus,
  Type,
  Palette,
  Undo2,
  Redo2,
  Download,
  Upload,
  Trash2,
  Function,
  Calculator,
  Ruler,
  Triangle,
  Grid,
  MousePointer2,
  RotateCcw,
  Move,
  Library,
  Save
} from 'lucide-react'

const DRAWING_TOOLS = {
  SELECT: 'select',
  PEN: 'pen',
  ERASER: 'eraser',
  LINE: 'line',
  RECTANGLE: 'rectangle',
  CIRCLE: 'circle',
  TEXT: 'text',
  MATH: 'math',
}

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

const COLORS = [
  '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', 
  '#00FFFF', '#FFA500', '#800080', '#FFC0CB', '#A52A2A', '#808080'
]

export default function Whiteboard({ socket, sessionId, userRole, className = '' }) {
  // Canvas and fabric refs
  const canvasRef = useRef(null)
  const fabricCanvasRef = useRef(null)
  
  // State
  const [activeTool, setActiveTool] = useState(DRAWING_TOOLS.PEN)
  const [brushSize, setBrushSize] = useState(3)
  const [currentColor, setCurrentColor] = useState('#000000')
  const [showColorPalette, setShowColorPalette] = useState(false)
  const [showMathSymbols, setShowMathSymbols] = useState(false)
  const [mathInput, setMathInput] = useState('')
  const [mathPreview, setMathPreview] = useState('')
  const [isDrawing, setIsDrawing] = useState(false)
  const [showGrid, setShowGrid] = useState(false)
  const [history, setHistory] = useState([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [showToolbar, setShowToolbar] = useState(true)
  const [showMathTemplates, setShowMathTemplates] = useState(false)

  // Initialize fabric canvas
  useEffect(() => {
    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 1200,
      height: 800,
      backgroundColor: '#ffffff',
      selection: activeTool === DRAWING_TOOLS.SELECT,
    })

    fabricCanvasRef.current = canvas

    // Grid pattern
    if (showGrid) {
      addGridPattern(canvas)
    }

    // Set drawing mode based on active tool
    updateCanvasMode(canvas, activeTool)

    // Canvas events
    canvas.on('path:created', handleDrawingComplete)
    canvas.on('object:added', saveState)
    canvas.on('object:modified', saveState)
    canvas.on('object:removed', saveState)

    return () => {
      canvas.dispose()
    }
  }, [activeTool, showGrid])

  // Socket events for real-time collaboration
  useEffect(() => {
    if (!socket) return

    socket.on('whiteboard:update', handleRemoteUpdate)
    socket.on('whiteboard:clear', handleRemoteClear)
    socket.on('whiteboard:undo', handleRemoteUndo)
    socket.on('whiteboard:redo', handleRemoteRedo)

    return () => {
      socket.off('whiteboard:update')
      socket.off('whiteboard:clear')
      socket.off('whiteboard:undo')
      socket.off('whiteboard:redo')
    }
  }, [socket])

  const addGridPattern = (canvas) => {
    const grid = 20
    const width = canvas.width
    const height = canvas.height

    // Create grid lines
    for (let i = 0; i < width / grid; i++) {
      const line = new fabric.Line([i * grid, 0, i * grid, height], {
        stroke: '#e0e0e0',
        strokeWidth: 1,
        selectable: false,
        evented: false,
        excludeFromExport: true,
      })
      canvas.add(line)
      canvas.sendToBack(line)
    }

    for (let i = 0; i < height / grid; i++) {
      const line = new fabric.Line([0, i * grid, width, i * grid], {
        stroke: '#e0e0e0',
        strokeWidth: 1,
        selectable: false,
        evented: false,
        excludeFromExport: true,
      })
      canvas.add(line)
      canvas.sendToBack(line)
    }
  }

  const updateCanvasMode = (canvas, tool) => {
    canvas.isDrawingMode = tool === DRAWING_TOOLS.PEN || tool === DRAWING_TOOLS.ERASER
    
    if (tool === DRAWING_TOOLS.PEN) {
      canvas.freeDrawingBrush.width = brushSize
      canvas.freeDrawingBrush.color = currentColor
    } else if (tool === DRAWING_TOOLS.ERASER) {
      canvas.freeDrawingBrush.width = brushSize * 2
      canvas.freeDrawingBrush.color = '#ffffff'
    }

    canvas.selection = tool === DRAWING_TOOLS.SELECT
    canvas.defaultCursor = tool === DRAWING_TOOLS.SELECT ? 'default' : 'crosshair'
  }

  const handleToolChange = (tool) => {
    setActiveTool(tool)
    if (fabricCanvasRef.current) {
      updateCanvasMode(fabricCanvasRef.current, tool)
    }
  }

  const handleColorChange = (color) => {
    setCurrentColor(color)
    if (fabricCanvasRef.current && activeTool === DRAWING_TOOLS.PEN) {
      fabricCanvasRef.current.freeDrawingBrush.color = color
    }
    setShowColorPalette(false)
  }

  const handleBrushSizeChange = (size) => {
    setBrushSize(size)
    if (fabricCanvasRef.current) {
      const multiplier = activeTool === DRAWING_TOOLS.ERASER ? 2 : 1
      fabricCanvasRef.current.freeDrawingBrush.width = size * multiplier
    }
  }

  const addShape = (shapeType) => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return

    let shape
    const options = {
      left: 100,
      top: 100,
      fill: 'transparent',
      stroke: currentColor,
      strokeWidth: brushSize,
    }

    switch (shapeType) {
      case 'rectangle':
        shape = new fabric.Rect({ ...options, width: 100, height: 60 })
        break
      case 'circle':
        shape = new fabric.Circle({ ...options, radius: 50 })
        break
      case 'line':
        shape = new fabric.Line([100, 100, 200, 100], {
          ...options,
          fill: currentColor,
        })
        break
      case 'triangle':
        const trianglePoints = [
          { x: 150, y: 100 },
          { x: 100, y: 180 },
          { x: 200, y: 180 }
        ]
        shape = new fabric.Polygon(trianglePoints, options)
        break
    }

    if (shape) {
      canvas.add(shape)
      canvas.setActiveObject(shape)
      emitCanvasUpdate()
    }
  }

  const addText = () => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return

    const text = new fabric.IText('Click to edit', {
      left: 100,
      top: 100,
      fontSize: 20,
      fill: currentColor,
      fontFamily: 'Arial',
    })

    canvas.add(text)
    canvas.setActiveObject(text)
    text.enterEditing()
    emitCanvasUpdate()
  }

  const addMathFormula = () => {
    if (!mathInput.trim()) return

    const canvas = fabricCanvasRef.current
    if (!canvas) return

    // Create a temporary div to render the math
    const tempDiv = document.createElement('div')
    tempDiv.style.position = 'absolute'
    tempDiv.style.top = '-9999px'
    tempDiv.innerHTML = `<div id="math-temp"></div>`
    document.body.appendChild(tempDiv)

    try {
      // Import katex dynamically to render math
      import('katex').then((katex) => {
        katex.render(mathInput, tempDiv.firstChild, {
          displayMode: true,
          throwOnError: false,
        })

        // Convert to SVG or image (simplified approach)
        const mathText = new fabric.IText(mathInput, {
          left: 100,
          top: 100,
          fontSize: 24,
          fill: currentColor,
          fontFamily: 'Times New Roman',
          backgroundColor: '#f0f0f0',
          padding: 10,
        })

        canvas.add(mathText)
        canvas.setActiveObject(mathText)
        emitCanvasUpdate()
        
        setMathInput('')
        setShowMathSymbols(false)
        document.body.removeChild(tempDiv)
      })
    } catch (error) {
      console.error('Error rendering math:', error)
      document.body.removeChild(tempDiv)
    }
  }

  const insertMathSymbol = (symbol) => {
    setMathInput(prev => prev + symbol)
  }

  const selectMathTemplate = (template) => {
    setMathInput(template)
    setShowMathTemplates(false)
    setShowMathSymbols(true)
  }

  const saveWhiteboard = () => {
    const canvas = fabricCanvasRef.current
    if (!canvas || !socket) return

    const canvasData = canvas.toJSON()
    socket.emit('whiteboard:save', {
      sessionId,
      canvasData,
      userId: socket.userId,
    })
    
    // Show save confirmation
    const notification = document.createElement('div')
    notification.textContent = 'Whiteboard saved!'
    notification.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg z-50'
    document.body.appendChild(notification)
    setTimeout(() => {
      document.body.removeChild(notification)
    }, 2000)
  }

  const clearCanvas = () => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return

    canvas.clear()
    canvas.backgroundColor = '#ffffff'
    if (showGrid) {
      addGridPattern(canvas)
    }
    
    socket?.emit('whiteboard:clear', { sessionId })
    saveState()
  }

  const undo = () => {
    if (historyIndex > 0) {
      const canvas = fabricCanvasRef.current
      if (!canvas) return

      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      canvas.loadFromJSON(history[newIndex], canvas.renderAll.bind(canvas))
      
      socket?.emit('whiteboard:undo', { sessionId })
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const canvas = fabricCanvasRef.current
      if (!canvas) return

      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      canvas.loadFromJSON(history[newIndex], canvas.renderAll.bind(canvas))
      
      socket?.emit('whiteboard:redo', { sessionId })
    }
  }

  const saveState = () => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return

    const state = JSON.stringify(canvas.toJSON())
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(state)
    
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  const exportCanvas = () => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return

    const link = document.createElement('a')
    link.download = 'whiteboard.png'
    link.href = canvas.toDataURL()
    link.click()
  }

  const handleDrawingComplete = (e) => {
    emitCanvasUpdate()
  }

  const emitCanvasUpdate = () => {
    const canvas = fabricCanvasRef.current
    if (!canvas || !socket) return

    const canvasData = canvas.toJSON()
    socket.emit('whiteboard:update', {
      sessionId,
      data: canvasData,
      userId: socket.userId,
    })
  }

  const handleRemoteUpdate = (data) => {
    const canvas = fabricCanvasRef.current
    if (!canvas || data.userId === socket?.userId) return

    canvas.loadFromJSON(data.data, canvas.renderAll.bind(canvas))
  }

  const handleRemoteClear = () => {
    clearCanvas()
  }

  const handleRemoteUndo = () => {
    undo()
  }

  const handleRemoteRedo = () => {
    redo()
  }

  return (
    <div className={`relative bg-white rounded-lg shadow-lg ${className}`}>
      {/* Toolbar */}
      {showToolbar && (
        <div className="absolute top-2 left-2 bg-gray-800 rounded-lg p-2 z-10 flex flex-col gap-2 shadow-lg">
          {/* Drawing Tools */}
          <div className="flex flex-col gap-1">
            <button
              onClick={() => handleToolChange(DRAWING_TOOLS.SELECT)}
              className={`p-2 rounded ${activeTool === DRAWING_TOOLS.SELECT ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'} text-white`}
              title="Select"
            >
              <MousePointer2 className="w-4 h-4" />
            </button>

            <button
              onClick={() => handleToolChange(DRAWING_TOOLS.PEN)}
              className={`p-2 rounded ${activeTool === DRAWING_TOOLS.PEN ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'} text-white`}
              title="Pen"
            >
              <Pen className="w-4 h-4" />
            </button>

            <button
              onClick={() => handleToolChange(DRAWING_TOOLS.ERASER)}
              className={`p-2 rounded ${activeTool === DRAWING_TOOLS.ERASER ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'} text-white`}
              title="Eraser"
            >
              <Eraser className="w-4 h-4" />
            </button>
          </div>

          {/* Shape Tools */}
          <div className="border-t border-gray-600 pt-2 flex flex-col gap-1">
            <button
              onClick={() => addShape('line')}
              className="p-2 rounded bg-gray-700 hover:bg-gray-600 text-white"
              title="Line"
            >
              <Minus className="w-4 h-4" />
            </button>

            <button
              onClick={() => addShape('rectangle')}
              className="p-2 rounded bg-gray-700 hover:bg-gray-600 text-white"
              title="Rectangle"
            >
              <Square className="w-4 h-4" />
            </button>

            <button
              onClick={() => addShape('circle')}
              className="p-2 rounded bg-gray-700 hover:bg-gray-600 text-white"
              title="Circle"
            >
              <Circle className="w-4 h-4" />
            </button>

            <button
              onClick={() => addShape('triangle')}
              className="p-2 rounded bg-gray-700 hover:bg-gray-600 text-white"
              title="Triangle"
            >
              <Triangle className="w-4 h-4" />
            </button>
          </div>

          {/* Text and Math */}
          <div className="border-t border-gray-600 pt-2 flex flex-col gap-1">
            <button
              onClick={addText}
              className="p-2 rounded bg-gray-700 hover:bg-gray-600 text-white"
              title="Text"
            >
              <Type className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowMathSymbols(!showMathSymbols)}
              className={`p-2 rounded ${showMathSymbols ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'} text-white`}
              title="Math Formula"
            >
              <Function className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowMathTemplates(true)}
              className="p-2 rounded bg-gray-700 hover:bg-gray-600 text-white"
              title="Math Templates"
            >
              <Library className="w-4 h-4" />
            </button>
          </div>

          {/* Utilities */}
          <div className="border-t border-gray-600 pt-2 flex flex-col gap-1">
            <button
              onClick={saveWhiteboard}
              className="p-2 rounded bg-green-600 hover:bg-green-700 text-white"
              title="Save Whiteboard"
            >
              <Save className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowColorPalette(!showColorPalette)}
              className="p-2 rounded bg-gray-700 hover:bg-gray-600 text-white"
              title="Colors"
            >
              <Palette className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`p-2 rounded ${showGrid ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'} text-white`}
              title="Grid"
            >
              <Grid className="w-4 h-4" />
            </button>

            <button
              onClick={undo}
              disabled={historyIndex <= 0}
              className="p-2 rounded bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-50"
              title="Undo"
            >
              <Undo2 className="w-4 h-4" />
            </button>

            <button
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              className="p-2 rounded bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-50"
              title="Redo"
            >
              <Redo2 className="w-4 h-4" />
            </button>

            <button
              onClick={clearCanvas}
              className="p-2 rounded bg-red-600 hover:bg-red-700 text-white"
              title="Clear All"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              onClick={exportCanvas}
              className="p-2 rounded bg-gray-700 hover:bg-gray-600 text-white"
              title="Export"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Brush Size Control */}
      {(activeTool === DRAWING_TOOLS.PEN || activeTool === DRAWING_TOOLS.ERASER) && (
        <div className="absolute top-2 left-20 bg-gray-800 rounded-lg p-2 z-10">
          <div className="flex items-center gap-2 text-white">
            <span className="text-xs">Size:</span>
            <input
              type="range"
              min="1"
              max="20"
              value={brushSize}
              onChange={(e) => handleBrushSizeChange(parseInt(e.target.value))}
              className="w-16"
            />
            <span className="text-xs w-8">{brushSize}</span>
          </div>
        </div>
      )}

      {/* Color Palette */}
      {showColorPalette && (
        <div className="absolute top-12 left-20 bg-gray-800 rounded-lg p-3 z-20">
          <div className="grid grid-cols-4 gap-2">
            {COLORS.map((color) => (
              <button
                key={color}
                onClick={() => handleColorChange(color)}
                className={`w-8 h-8 rounded border-2 ${
                  currentColor === color ? 'border-white' : 'border-gray-600'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Math Symbols Panel */}
      {showMathSymbols && (
        <div className="absolute top-2 right-2 bg-gray-800 rounded-lg p-4 z-20 w-96">
          <div className="text-white mb-3">
            <h3 className="font-semibold mb-2">Mathematical Formula</h3>
            
            {/* Math Input */}
            <div className="mb-3">
              <textarea
                value={mathInput}
                onChange={(e) => setMathInput(e.target.value)}
                placeholder="Enter LaTeX formula (e.g., \\frac{a}{b}, x^2, \\sqrt{x})"
                className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 resize-none"
                rows="3"
              />
              
              {mathInput && (
                <div className="mt-2 p-2 bg-white rounded text-black">
                  <strong>Preview:</strong>
                  <div className="mt-1">
                    <InlineMath math={mathInput} />
                  </div>
                </div>
              )}
              
              <button
                onClick={addMathFormula}
                disabled={!mathInput.trim()}
                className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded"
              >
                Add Formula
              </button>
            </div>

            {/* Math Symbols Grid */}
            <div className="max-h-64 overflow-y-auto">
              <h4 className="text-sm font-medium mb-2">Common Symbols:</h4>
              <div className="grid grid-cols-6 gap-2">
                {MATH_SYMBOLS.map((symbol, index) => (
                  <button
                    key={index}
                    onClick={() => insertMathSymbol(symbol.value)}
                    className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-center"
                    title={symbol.description}
                  >
                    {symbol.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="border border-gray-300 rounded-lg"
      />

      {/* Hide/Show Toolbar Toggle */}
      <button
        onClick={() => setShowToolbar(!showToolbar)}
        className="absolute bottom-2 left-2 p-2 bg-gray-800 text-white rounded-lg z-10"
        title={showToolbar ? 'Hide Toolbar' : 'Show Toolbar'}
      >
        {showToolbar ? <Move className="w-4 h-4" /> : <MousePointer2 className="w-4 h-4" />}
      </button>

      {/* Math Templates Modal */}
      <MathTemplates
        isOpen={showMathTemplates}
        onClose={() => setShowMathTemplates(false)}
        onSelectTemplate={selectMathTemplate}
      />
    </div>
  )
}

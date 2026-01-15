import { useState, useEffect } from 'react'
import { X, Copy, Eye } from 'lucide-react'
import 'katex/dist/katex.min.css'

const MATH_TEMPLATES = [
  {
    category: "Basic Operations",
    templates: [
      { name: "Fraction", latex: "\\frac{a}{b}", description: "Simple fraction" },
      { name: "Square Root", latex: "\\sqrt{x}", description: "Square root" },
      { name: "Power", latex: "x^{n}", description: "Exponent" },
      { name: "Subscript", latex: "x_{n}", description: "Subscript" },
      { name: "Mixed", latex: "\\frac{x^{2}}{\\sqrt{y}}", description: "Complex fraction" }
    ]
  },
  {
    category: "Calculus",
    templates: [
      { name: "Derivative", latex: "\\frac{d}{dx}f(x)", description: "Derivative" },
      { name: "Partial Derivative", latex: "\\frac{\\partial f}{\\partial x}", description: "Partial derivative" },
      { name: "Integral", latex: "\\int_{a}^{b} f(x) dx", description: "Definite integral" },
      { name: "Indefinite Integral", latex: "\\int f(x) dx", description: "Indefinite integral" },
      { name: "Double Integral", latex: "\\iint_{D} f(x,y) dA", description: "Double integral" },
      { name: "Limit", latex: "\\lim_{x \\to a} f(x)", description: "Limit" }
    ]
  },
  {
    category: "Algebra",
    templates: [
      { name: "Quadratic Formula", latex: "x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}", description: "Quadratic formula" },
      { name: "System of Equations", latex: "\\begin{cases} x + y = 5 \\\\ 2x - y = 1 \\end{cases}", description: "System of equations" },
      { name: "Matrix", latex: "\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}", description: "2x2 matrix" },
      { name: "Determinant", latex: "\\det(A) = \\begin{vmatrix} a & b \\\\ c & d \\end{vmatrix}", description: "Matrix determinant" },
      { name: "Binomial", latex: "\\binom{n}{k} = \\frac{n!}{k!(n-k)!}", description: "Binomial coefficient" }
    ]
  },
  {
    category: "Geometry",
    templates: [
      { name: "Distance Formula", latex: "d = \\sqrt{(x_2-x_1)^2 + (y_2-y_1)^2}", description: "Distance between points" },
      { name: "Circle Equation", latex: "(x-h)^2 + (y-k)^2 = r^2", description: "Circle equation" },
      { name: "Pythagorean Theorem", latex: "a^2 + b^2 = c^2", description: "Pythagorean theorem" },
      { name: "Area of Circle", latex: "A = \\pi r^2", description: "Area of circle" },
      { name: "Volume of Sphere", latex: "V = \\frac{4}{3}\\pi r^3", description: "Volume of sphere" }
    ]
  },
  {
    category: "Statistics",
    templates: [
      { name: "Mean", latex: "\\bar{x} = \\frac{1}{n}\\sum_{i=1}^{n} x_i", description: "Sample mean" },
      { name: "Standard Deviation", latex: "s = \\sqrt{\\frac{\\sum_{i=1}^{n}(x_i - \\bar{x})^2}{n-1}}", description: "Sample standard deviation" },
      { name: "Normal Distribution", latex: "f(x) = \\frac{1}{\\sigma\\sqrt{2\\pi}}e^{-\\frac{(x-\\mu)^2}{2\\sigma^2}}", description: "Normal distribution PDF" },
      { name: "Binomial Probability", latex: "P(X = k) = \\binom{n}{k}p^k(1-p)^{n-k}", description: "Binomial probability" },
      { name: "Chi-Square", latex: "\\chi^2 = \\sum_{i=1}^{n} \\frac{(O_i - E_i)^2}{E_i}", description: "Chi-square statistic" }
    ]
  },
  {
    category: "Trigonometry",
    templates: [
      { name: "Sine Rule", latex: "\\frac{a}{\\sin A} = \\frac{b}{\\sin B} = \\frac{c}{\\sin C}", description: "Law of sines" },
      { name: "Cosine Rule", latex: "c^2 = a^2 + b^2 - 2ab\\cos C", description: "Law of cosines" },
      { name: "Unit Circle", latex: "\\sin^2\\theta + \\cos^2\\theta = 1", description: "Pythagorean identity" },
      { name: "Double Angle", latex: "\\sin(2\\theta) = 2\\sin\\theta\\cos\\theta", description: "Double angle formula" },
      { name: "Sum Formula", latex: "\\sin(A \\pm B) = \\sin A \\cos B \\pm \\cos A \\sin B", description: "Sine addition formula" }
    ]
  }
]

export default function MathTemplates({ isOpen, onClose, onSelectTemplate }) {
  const [selectedCategory, setSelectedCategory] = useState(MATH_TEMPLATES[0].category)
  const [previewTemplate, setPreviewTemplate] = useState(null)

  // Load KaTeX when component mounts
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      // Dynamically load KaTeX for rendering
      const script = document.createElement('script')
      script.src = 'https://cdn.jsdelivr.net/npm/katex@0.13.11/dist/katex.min.js'
      script.async = true
      document.head.appendChild(script)

      return () => {
        if (document.head.contains(script)) {
          document.head.removeChild(script)
        }
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  const currentTemplates = MATH_TEMPLATES.find(cat => cat.category === selectedCategory)?.templates || []

  const handleSelectTemplate = (latex) => {
    onSelectTemplate(latex)
    onClose()
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      // Show a brief success message
      const notification = document.createElement('div')
      notification.textContent = 'Copied to clipboard!'
      notification.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg z-50'
      document.body.appendChild(notification)
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification)
        }
      }, 2000)
    })
  }

  const renderMath = (latex) => {
    if (typeof window !== 'undefined' && window.katex) {
      try {
        return window.katex.renderToString(latex, {
          displayMode: true,
          throwOnError: false,
        })
      } catch (error) {
        return latex
      }
    }
    return latex
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">Mathematical Templates</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-4 flex-1 overflow-hidden">
          {/* Categories */}
          <div className="w-48 flex-shrink-0">
            <h3 className="font-semibold text-gray-700 mb-2">Categories</h3>
            <div className="space-y-1">
              {MATH_TEMPLATES.map((category) => (
                <button
                  key={category.category}
                  onClick={() => setSelectedCategory(category.category)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                    selectedCategory === category.category
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {category.category}
                </button>
              ))}
            </div>
          </div>

          {/* Templates */}
          <div className="flex-1 overflow-auto">
            <h3 className="font-semibold text-gray-700 mb-3">{selectedCategory}</h3>
            <div className="grid gap-3">
              {currentTemplates.map((template, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-800">{template.name}</h4>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setPreviewTemplate(template)}
                        className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                        title="Preview"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => copyToClipboard(template.latex)}
                        className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                        title="Copy LaTeX"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-500 mb-3">{template.description}</p>
                  
                  {/* Math Preview */}
                  <div 
                    className="bg-gray-50 p-3 rounded text-center cursor-pointer hover:bg-blue-50 transition-colors"
                    onClick={() => handleSelectTemplate(template.latex)}
                  >
                    <div 
                      className="math-preview text-lg"
                      dangerouslySetInnerHTML={{
                        __html: renderMath(template.latex)
                      }}
                    />
                  </div>
                  
                  {/* LaTeX Code */}
                  <div className="mt-2 text-xs text-gray-600 font-mono bg-gray-100 p-2 rounded select-all">
                    {template.latex}
                  </div>
                  
                  {/* Select Button */}
                  <button
                    onClick={() => handleSelectTemplate(template.latex)}
                    className="w-full mt-3 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Add to Whiteboard
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Click "Add to Whiteboard" or click on the preview to add a template to your whiteboard. 
            You can edit the formula after adding it. Use the copy button to copy LaTeX code.
          </p>
        </div>

        {/* Preview Modal */}
        {previewTemplate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">{previewTemplate.name}</h3>
                <button
                  onClick={() => setPreviewTemplate(null)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="text-center mb-4">
                <div 
                  className="text-xl p-4 bg-gray-50 rounded"
                  dangerouslySetInnerHTML={{
                    __html: renderMath(previewTemplate.latex)
                  }}
                />
              </div>
              
              <div className="text-sm text-gray-600 mb-4">
                {previewTemplate.description}
              </div>
              
              <div className="text-xs font-mono bg-gray-100 p-3 rounded mb-4 select-all">
                {previewTemplate.latex}
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => handleSelectTemplate(previewTemplate.latex)}
                  className="flex-1 py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Add to Whiteboard
                </button>
                <button
                  onClick={() => copyToClipboard(previewTemplate.latex)}
                  className="py-2 px-4 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                >
                  Copy LaTeX
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

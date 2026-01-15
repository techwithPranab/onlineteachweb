import { useState, useCallback } from 'react';
import { Calculator, Eye, EyeOff, Copy, Check, HelpCircle } from 'lucide-react';

/**
 * Math Equation Editor Component
 * Supports LaTeX input with live preview
 */
export default function MathEquationEditor({ 
  value = '', 
  onChange, 
  placeholder = 'Enter LaTeX equation...',
  label = 'Math Equation',
  showPreview = true,
  className = ''
}) {
  const [showHelp, setShowHelp] = useState(false);
  const [previewEnabled, setPreviewEnabled] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleChange = useCallback((e) => {
    onChange(e.target.value);
  }, [onChange]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [value]);

  const insertSymbol = useCallback((symbol) => {
    onChange(value + symbol);
  }, [value, onChange]);

  // Common LaTeX symbols
  const symbols = [
    { label: '√', latex: '\\sqrt{}', desc: 'Square root' },
    { label: 'x²', latex: '^{2}', desc: 'Superscript' },
    { label: 'x₂', latex: '_{2}', desc: 'Subscript' },
    { label: '÷', latex: '\\div', desc: 'Division' },
    { label: '×', latex: '\\times', desc: 'Multiplication' },
    { label: '±', latex: '\\pm', desc: 'Plus minus' },
    { label: '≤', latex: '\\leq', desc: 'Less than or equal' },
    { label: '≥', latex: '\\geq', desc: 'Greater than or equal' },
    { label: '≠', latex: '\\neq', desc: 'Not equal' },
    { label: '∞', latex: '\\infty', desc: 'Infinity' },
    { label: 'π', latex: '\\pi', desc: 'Pi' },
    { label: 'θ', latex: '\\theta', desc: 'Theta' },
    { label: 'α', latex: '\\alpha', desc: 'Alpha' },
    { label: 'β', latex: '\\beta', desc: 'Beta' },
    { label: '∑', latex: '\\sum', desc: 'Sum' },
    { label: '∫', latex: '\\int', desc: 'Integral' },
    { label: 'lim', latex: '\\lim_{x \\to 0}', desc: 'Limit' },
    { label: 'log', latex: '\\log', desc: 'Logarithm' },
    { label: 'sin', latex: '\\sin', desc: 'Sine' },
    { label: 'cos', latex: '\\cos', desc: 'Cosine' },
  ];

  // Common templates
  const templates = [
    { label: 'Fraction', latex: '\\frac{numerator}{denominator}' },
    { label: 'Square Root', latex: '\\sqrt{x}' },
    { label: 'Nth Root', latex: '\\sqrt[n]{x}' },
    { label: 'Power', latex: 'x^{n}' },
    { label: 'Subscript', latex: 'x_{i}' },
    { label: 'Summation', latex: '\\sum_{i=1}^{n} x_i' },
    { label: 'Integral', latex: '\\int_{a}^{b} f(x) dx' },
    { label: 'Limit', latex: '\\lim_{x \\to \\infty} f(x)' },
    { label: 'Matrix 2x2', latex: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}' },
  ];

  // Render LaTeX to HTML (basic implementation - use KaTeX for production)
  const renderLatex = (latex) => {
    if (!latex) return '';
    
    // This is a placeholder - in production, use KaTeX or MathJax
    // For now, just show the LaTeX wrapped in delimiters
    return `$${latex}$`;
  };

  return (
    <div className={`math-equation-editor ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          <Calculator className="w-4 h-4 inline-block mr-1" />
          {label}
        </label>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 mb-2 p-2 bg-gray-50 rounded-t-lg border border-b-0 border-gray-200">
        {/* Quick symbols */}
        <div className="flex flex-wrap gap-1">
          {symbols.slice(0, 10).map((sym) => (
            <button
              key={sym.latex}
              type="button"
              onClick={() => insertSymbol(sym.latex)}
              className="px-2 py-1 text-sm bg-white border border-gray-200 rounded hover:bg-gray-100 transition-colors"
              title={sym.desc}
            >
              {sym.label}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* Toggle preview */}
        <button
          type="button"
          onClick={() => setPreviewEnabled(!previewEnabled)}
          className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
          title={previewEnabled ? 'Hide preview' : 'Show preview'}
        >
          {previewEnabled ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>

        {/* Copy */}
        <button
          type="button"
          onClick={handleCopy}
          className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
          title="Copy LaTeX"
        >
          {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
        </button>

        {/* Help */}
        <button
          type="button"
          onClick={() => setShowHelp(!showHelp)}
          className={`p-1.5 rounded ${showHelp ? 'text-primary-600 bg-primary-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
          title="Show help"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>

      {/* Input */}
      <textarea
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-200 rounded-none font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        rows={3}
      />

      {/* Preview */}
      {showPreview && previewEnabled && value && (
        <div className="p-3 bg-gray-50 border border-t-0 border-gray-200 rounded-b-lg">
          <p className="text-xs text-gray-500 mb-1">Preview:</p>
          <div className="p-2 bg-white rounded border border-gray-200 font-serif text-lg text-center min-h-[40px]">
            {/* In production, replace this with KaTeX render */}
            <span className="text-gray-800">{renderLatex(value)}</span>
          </div>
          <p className="text-xs text-gray-400 mt-1 text-center">
            Note: Full LaTeX rendering requires KaTeX integration
          </p>
        </div>
      )}

      {/* Help panel */}
      {showHelp && (
        <div className="mt-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">LaTeX Quick Reference</h4>
          
          <div className="mb-3">
            <p className="text-sm font-medium text-blue-700 mb-1">Symbols:</p>
            <div className="flex flex-wrap gap-1">
              {symbols.map((sym) => (
                <button
                  key={sym.latex}
                  type="button"
                  onClick={() => insertSymbol(sym.latex)}
                  className="px-2 py-1 text-xs bg-white border border-blue-200 rounded hover:bg-blue-100"
                  title={`${sym.desc}: ${sym.latex}`}
                >
                  {sym.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-blue-700 mb-1">Templates:</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {templates.map((tpl) => (
                <button
                  key={tpl.label}
                  type="button"
                  onClick={() => insertSymbol(tpl.latex)}
                  className="px-2 py-1 text-xs bg-white border border-blue-200 rounded hover:bg-blue-100 text-left"
                >
                  <span className="font-medium">{tpl.label}</span>
                  <span className="block text-gray-500 truncate">{tpl.latex}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Math Display Component
 * Renders LaTeX equations in quiz views
 */
export function MathDisplay({ latex, inline = false, className = '' }) {
  if (!latex) return null;

  // Check if the content contains LaTeX
  const hasLatex = latex.includes('\\') || latex.includes('$');
  
  if (!hasLatex) {
    return <span className={className}>{latex}</span>;
  }

  // In production, use KaTeX to render
  // For now, display with LaTeX delimiters
  const displayLatex = inline 
    ? `$${latex.replace(/^\$|\$$/g, '')}$`
    : `$$${latex.replace(/^\$\$|\$\$$/g, '')}$$`;

  return (
    <span 
      className={`math-display ${inline ? 'inline' : 'block text-center my-2'} ${className}`}
      data-latex={latex}
    >
      {displayLatex}
    </span>
  );
}

/**
 * Parse text with embedded LaTeX
 * Returns array of text and math segments
 */
export function parseLatexContent(text) {
  if (!text) return [{ type: 'text', content: '' }];

  const segments = [];
  const regex = /\$\$(.*?)\$\$|\$(.*?)\$/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        content: text.slice(lastIndex, match.index)
      });
    }

    // Add math segment
    segments.push({
      type: match[1] ? 'display' : 'inline',
      content: match[1] || match[2]
    });

    lastIndex = regex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    segments.push({
      type: 'text',
      content: text.slice(lastIndex)
    });
  }

  return segments.length > 0 ? segments : [{ type: 'text', content: text }];
}

/**
 * Render text with embedded LaTeX
 */
export function RichMathText({ text, className = '' }) {
  const segments = parseLatexContent(text);

  return (
    <span className={className}>
      {segments.map((segment, index) => {
        if (segment.type === 'text') {
          return <span key={index}>{segment.content}</span>;
        }
        return (
          <MathDisplay 
            key={index} 
            latex={segment.content} 
            inline={segment.type === 'inline'} 
          />
        );
      })}
    </span>
  );
}

import { useEffect, useRef } from 'react'

export default function MathRenderer({ latex, className = '', style = {} }) {
  const mathRef = useRef(null)

  useEffect(() => {
    if (!latex || !mathRef.current) return

    // Dynamically import and use KaTeX
    const renderMath = async () => {
      try {
        const katex = await import('katex')
        
        katex.render(latex, mathRef.current, {
          displayMode: true,
          throwOnError: false,
          errorColor: '#cc0000',
          strict: false,
        })
      } catch (error) {
        console.error('Error rendering math:', error)
        // Fallback to plain text
        if (mathRef.current) {
          mathRef.current.textContent = latex
        }
      }
    }

    renderMath()
  }, [latex])

  return (
    <div 
      ref={mathRef} 
      className={`math-renderer ${className}`}
      style={style}
    />
  )
}

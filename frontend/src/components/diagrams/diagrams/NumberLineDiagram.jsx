/**
 * NumberLineDiagram – a number line with optional highlighted / marked points.
 * params: { start, end, marked: number[], highlighted: number[], step, label }
 */
export default function NumberLineDiagram({ params = {}, size = 280 }) {
  const {
    start = 0, end = 10,
    marked = [],
    highlighted = [],
    step = 1,
    label = ''
  } = params

  const height = 80
  const padX = 24
  const lineY = height / 2 + 8
  const lineW = size - 2 * padX
  const range = end - start || 1
  const toX = (n) => padX + ((n - start) / range) * lineW

  const ticks = []
  for (let v = start; v <= end; v += step) {
    ticks.push(v)
  }

  return (
    <svg width={size} height={height} viewBox={`0 0 ${size} ${height}`}>
      {/* Base line */}
      <line x1={padX - 6} y1={lineY} x2={size - padX + 6} y2={lineY} stroke="#334155" strokeWidth="2.5" />

      {/* Arrow heads */}
      <polygon points={`${size-padX+6},${lineY} ${size-padX-2},${lineY-5} ${size-padX-2},${lineY+5}`} fill="#334155" />
      <polygon points={`${padX-6},${lineY} ${padX+2},${lineY-5} ${padX+2},${lineY+5}`} fill="#334155" />

      {/* Ticks & numbers */}
      {ticks.map((v) => {
        const x = toX(v)
        const isHighlighted = highlighted.includes(v)
        const isMarked = marked.includes(v)
        return (
          <g key={v}>
            <line x1={x} y1={lineY - 7} x2={x} y2={lineY + 7} stroke="#334155" strokeWidth="1.5" />
            <text x={x} y={lineY + 20} textAnchor="middle" fontSize={11} fill="#334155">{v}</text>
            {isHighlighted && (
              <circle cx={x} cy={lineY} r={10} fill="#fde68a" stroke="#d97706" strokeWidth="1.5" opacity="0.85" />
            )}
            {isMarked && (
              <circle cx={x} cy={lineY} r={6} fill="#ef4444" />
            )}
          </g>
        )
      })}

      {/* Label */}
      {label && (
        <text x={size / 2} y={height - 2} textAnchor="middle" fontSize={11} fill="#64748b">{label}</text>
      )}
    </svg>
  )
}

/**
 * PatternDiagram – shows a repeating or growing pattern sequence.
 * params: {
 *   sequence: Array of shape names: "circle"|"square"|"triangle"|"star"|"diamond"|"pentagon",
 *   colors: optional array of colors per element,
 *   missingIndex: optional index to show as "?" (for fill-in-the-blank questions),
 *   showIndex: show position numbers below
 * }
 */
const SHAPES = {
  circle: (cx, cy, r, fill, stroke) => (
    <circle cx={cx} cy={cy} r={r} fill={fill} stroke={stroke} strokeWidth="2" />
  ),
  square: (cx, cy, r, fill, stroke) => (
    <rect x={cx - r} y={cy - r} width={r * 2} height={r * 2} fill={fill} stroke={stroke} strokeWidth="2" rx="3" />
  ),
  triangle: (cx, cy, r, fill, stroke) => {
    const h = r * 1.7
    const pts = `${cx},${cy - r} ${cx - r},${cy + r * 0.7} ${cx + r},${cy + r * 0.7}`
    return <polygon points={pts} fill={fill} stroke={stroke} strokeWidth="2" />
  },
  diamond: (cx, cy, r, fill, stroke) => (
    <polygon
      points={`${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}`}
      fill={fill} stroke={stroke} strokeWidth="2"
    />
  ),
  star: (cx, cy, r, fill, stroke) => {
    const points = Array.from({ length: 10 }).map((_, i) => {
      const a = (Math.PI / 5) * i - Math.PI / 2
      const ri = i % 2 === 0 ? r : r * 0.45
      return `${cx + ri * Math.cos(a)},${cy + ri * Math.sin(a)}`
    }).join(' ')
    return <polygon points={points} fill={fill} stroke={stroke} strokeWidth="1.5" />
  },
  pentagon: (cx, cy, r, fill, stroke) => {
    const points = Array.from({ length: 5 }, (_, i) => {
      const a = (2 * Math.PI * i) / 5 - Math.PI / 2
      return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`
    }).join(' ')
    return <polygon points={points} fill={fill} stroke={stroke} strokeWidth="2" />
  }
}

const DEFAULT_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']

export default function PatternDiagram({ params = {}, size = 320 }) {
  const {
    sequence = ['circle', 'square', 'triangle', 'circle', 'square', 'triangle'],
    colors,
    missingIndex = null,
    showIndex = false
  } = params

  const n = sequence.length
  const itemSize = Math.min((size - 20) / n, 52)
  const r = itemSize * 0.38
  const height = itemSize + (showIndex ? 22 : 6)
  const startX = (size - n * itemSize) / 2 + itemSize / 2

  return (
    <svg width={size} height={height} viewBox={`0 0 ${size} ${height}`}>
      {sequence.map((shape, i) => {
        const cx = startX + i * itemSize
        const cy = height / 2 - (showIndex ? 8 : 0)
        const fill = missingIndex === i ? '#f1f5f9' : (colors?.[i] || DEFAULT_COLORS[i % DEFAULT_COLORS.length]) + '55'
        const stroke = missingIndex === i ? '#94a3b8' : (colors?.[i] || DEFAULT_COLORS[i % DEFAULT_COLORS.length])
        const shapeFn = SHAPES[shape] || SHAPES.circle

        return (
          <g key={i}>
            {missingIndex === i ? (
              <>
                <rect x={cx - r - 4} y={cy - r - 4} width={(r + 4) * 2} height={(r + 4) * 2}
                  fill="#f8fafc" stroke="#94a3b8" strokeWidth="2" strokeDasharray="5,3" rx="4" />
                <text x={cx} y={cy + 5} textAnchor="middle" fontSize={r * 1.1} fontWeight="700" fill="#64748b">?</text>
              </>
            ) : (
              shapeFn(cx, cy, r, fill, stroke)
            )}
            {showIndex && (
              <text x={cx} y={height - 3} textAnchor="middle" fontSize={10} fill="#64748b">{i + 1}</text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

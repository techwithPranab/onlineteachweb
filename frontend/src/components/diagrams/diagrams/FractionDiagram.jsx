/**
 * FractionDiagram – pie, bar or set (dot) representation of a fraction.
 * params: { numerator, denominator, style: "pie"|"bar"|"set", color, showLabel }
 */
export default function FractionDiagram({ params = {}, size = 200 }) {
  const {
    numerator = 1,
    denominator = 4,
    style = 'pie',
    color = '#3b82f6',
    showLabel = true
  } = params

  const n = Math.min(Math.max(parseInt(numerator) || 1, 1), parseInt(denominator) || 4)
  const d = Math.max(parseInt(denominator) || 4, 2)

  if (style === 'bar') {
    return <BarFraction n={n} d={d} color={color} size={size} showLabel={showLabel} />
  }
  if (style === 'set') {
    return <SetFraction n={n} d={d} color={color} size={size} showLabel={showLabel} />
  }
  return <PieFraction n={n} d={d} color={color} size={size} showLabel={showLabel} />
}

// ── Pie fraction ──────────────────────────────────────────────────────────────
function PieFraction({ n, d, color, size, showLabel }) {
  const cx = size / 2, cy = size / 2, r = size / 2 - 20
  const startAngle = -Math.PI / 2

  const sectors = Array.from({ length: d }).map((_, i) => {
    const a1 = startAngle + (2 * Math.PI * i) / d
    const a2 = startAngle + (2 * Math.PI * (i + 1)) / d
    const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1)
    const x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2)
    const largeArc = (2 * Math.PI) / d > Math.PI ? 1 : 0
    return {
      d: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`,
      shaded: i < n
    }
  })

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {sectors.map((s, i) => (
        <path key={i} d={s.d} fill={s.shaded ? color : '#e2e8f0'} stroke="white" strokeWidth="2" />
      ))}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#334155" strokeWidth="2" />
      {showLabel && (
        <text x={cx} y={size - 6} textAnchor="middle" fontSize={size * 0.1} fill="#334155" fontWeight="600">
          {n}/{d}
        </text>
      )}
    </svg>
  )
}

// ── Bar fraction ──────────────────────────────────────────────────────────────
function BarFraction({ n, d, color, size, showLabel }) {
  const w = size - 30, h = size * 0.3, x0 = 15, y0 = (size - h) / 2
  const cellW = w / d
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {Array.from({ length: d }).map((_, i) => (
        <rect
          key={i}
          x={x0 + i * cellW} y={y0}
          width={cellW} height={h}
          fill={i < n ? color : '#e2e8f0'}
          stroke="white" strokeWidth="2"
          rx="2"
        />
      ))}
      <rect x={x0} y={y0} width={w} height={h} fill="none" stroke="#334155" strokeWidth="2" rx="3" />
      {showLabel && (
        <text x={size / 2} y={y0 + h + 18} textAnchor="middle" fontSize={size * 0.1} fill="#334155" fontWeight="600">
          {n}/{d}
        </text>
      )}
    </svg>
  )
}

// ── Set / dot fraction ────────────────────────────────────────────────────────
function SetFraction({ n, d, color, size, showLabel }) {
  const cols = Math.ceil(Math.sqrt(d))
  const rows = Math.ceil(d / cols)
  const dotR = Math.min(size / (cols * 2.5 + 1), 18)
  const spacingX = (size - 20) / cols
  const spacingY = (size * 0.75) / rows
  const startX = 10 + spacingX / 2
  const startY = 10 + spacingY / 2

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {Array.from({ length: d }).map((_, i) => {
        const col = i % cols, row = Math.floor(i / cols)
        return (
          <circle
            key={i}
            cx={startX + col * spacingX}
            cy={startY + row * spacingY}
            r={dotR}
            fill={i < n ? color : '#e2e8f0'}
            stroke={i < n ? '#1d4ed8' : '#94a3b8'}
            strokeWidth="1.5"
          />
        )
      })}
      {showLabel && (
        <text x={size / 2} y={size - 6} textAnchor="middle" fontSize={size * 0.1} fill="#334155" fontWeight="600">
          {n}/{d} of the set
        </text>
      )}
    </svg>
  )
}

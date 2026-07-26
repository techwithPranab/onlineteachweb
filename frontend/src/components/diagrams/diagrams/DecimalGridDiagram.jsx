/**
 * DecimalGridDiagram – 10×10 square grid where cells are coloured to show decimal values.
 * params: {
 *   value: number (0–1, e.g. 0.35),
 *   style: "tenths" | "hundredths",  // tenths = 10 columns, hundredths = 10×10 grid
 *   color, showLabel, label
 * }
 */
export default function DecimalGridDiagram({ params = {}, size = 220 }) {
  const {
    value = 0.3,
    style = 'hundredths',
    color = '#3b82f6',
    showLabel = true,
    label = ''
  } = params

  const v = Math.min(Math.max(Number(value) || 0, 0), 1)

  if (style === 'tenths') {
    return <TenthsGrid value={v} color={color} size={size} showLabel={showLabel} label={label} />
  }
  return <HundredthsGrid value={v} color={color} size={size} showLabel={showLabel} label={label} />
}

// ── 10-column tenths grid ─────────────────────────────────────────────────────
function TenthsGrid({ value, color, size, showLabel, label }) {
  const pad = 16
  const cellW = (size - 2 * pad) / 10
  const cellH = cellW * 2.5
  const y0 = (size - cellH) / 2

  const filled = Math.round(value * 10)

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {Array.from({ length: 10 }).map((_, i) => (
        <rect
          key={i}
          x={pad + i * cellW} y={y0}
          width={cellW} height={cellH}
          fill={i < filled ? color : '#e2e8f0'}
          stroke="white" strokeWidth="2"
          rx="2"
        />
      ))}
      <rect x={pad} y={y0} width={size - 2 * pad} height={cellH}
        fill="none" stroke="#334155" strokeWidth="2" rx="3" />
      {showLabel && (
        <text x={size / 2} y={y0 + cellH + 20} textAnchor="middle" fontSize={13} fontWeight="700" fill="#334155">
          {label || `${filled}/10 = ${value.toFixed(1)}`}
        </text>
      )}
    </svg>
  )
}

// ── 10×10 hundredths grid ─────────────────────────────────────────────────────
function HundredthsGrid({ value, color, size, showLabel, label }) {
  const pad = 14
  const gridSide = size - 2 * pad
  const cell = gridSide / 10

  const filled = Math.round(value * 100)

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {Array.from({ length: 100 }).map((_, i) => {
        const col = i % 10
        const row = Math.floor(i / 10)
        return (
          <rect
            key={i}
            x={pad + col * cell} y={pad + row * cell}
            width={cell} height={cell}
            fill={i < filled ? color : '#e2e8f0'}
            stroke="white" strokeWidth="1.2"
          />
        )
      })}
      <rect x={pad} y={pad} width={gridSide} height={gridSide}
        fill="none" stroke="#334155" strokeWidth="2" />
      {showLabel && (
        <text x={size / 2} y={size - 2} textAnchor="middle" fontSize={12} fontWeight="700" fill="#334155">
          {label || `${filled}/100 = ${value.toFixed(2)}`}
        </text>
      )}
    </svg>
  )
}

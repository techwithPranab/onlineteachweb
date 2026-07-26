/**
 * PieChartDiagram – multi-segment pie chart for data handling and percentage questions.
 * params: {
 *   data: [{ label, value, color }],   // values need not sum to 100
 *   title, showLegend, showPercent
 * }
 */
const DEFAULT_COLORS = ['#3b82f6','#ef4444','#10b981','#f59e0b','#8b5cf6','#ec4899','#06b6d4','#84cc16']

export default function PieChartDiagram({ params = {}, size = 230 }) {
  const {
    data = [
      { label: 'Maths', value: 35 },
      { label: 'Science', value: 25 },
      { label: 'English', value: 20 },
      { label: 'Other', value: 20 }
    ],
    title = '',
    showLegend = true,
    showPercent = true
  } = params

  // Assign default colors where missing
  const enriched = data.map((d, i) => ({
    ...d,
    color: d.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length]
  }))

  const total = enriched.reduce((s, d) => s + (Number(d.value) || 0), 0)
  if (total === 0) return null

  const legendH = showLegend ? Math.ceil(enriched.length / 2) * 18 + 8 : 0
  const svgH = size + legendH
  const cx = size / 2, cy = size / 2 - (title ? 10 : 0)
  const r = size / 2 - 26

  let cumAngle = -Math.PI / 2
  const sectors = enriched.map(d => {
    const pct = d.value / total
    const a1 = cumAngle
    const a2 = cumAngle + 2 * Math.PI * pct
    cumAngle = a2

    const midAngle = (a1 + a2) / 2
    const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1)
    const x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2)
    const largeArc = pct > 0.5 ? 1 : 0
    const lx = cx + (r * 0.65) * Math.cos(midAngle)
    const ly = cy + (r * 0.65) * Math.sin(midAngle)

    return { ...d, pct, path: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`, lx, ly }
  })

  return (
    <svg width={size} height={svgH} viewBox={`0 0 ${size} ${svgH}`}>
      {/* Title */}
      {title && <text x={cx} y={14} textAnchor="middle" fontSize={12} fontWeight="700" fill="#334155">{title}</text>}

      {/* Sectors */}
      {sectors.map((s, i) => (
        <path key={i} d={s.path} fill={s.color} stroke="white" strokeWidth="2" />
      ))}

      {/* Percentage labels */}
      {showPercent && sectors.filter(s => s.pct > 0.06).map((s, i) => (
        <text key={i} x={s.lx} y={s.ly} textAnchor="middle" dominantBaseline="central"
          fontSize={11} fontWeight="700" fill="white" style={{ textShadow: '0 0 3px rgba(0,0,0,0.5)' }}>
          {(s.pct * 100).toFixed(0)}%
        </text>
      ))}

      {/* Legend */}
      {showLegend && (
        <g transform={`translate(0, ${size})`}>
          {enriched.map((d, i) => {
            const col = i % 2, row = Math.floor(i / 2)
            const lx = col === 0 ? 10 : size / 2 + 4
            const ly = row * 18 + 10
            return (
              <g key={i}>
                <rect x={lx} y={ly} width={10} height={10} fill={d.color} rx="2" />
                <text x={lx + 14} y={ly + 9} fontSize={10} fill="#334155">{d.label} ({d.value})</text>
              </g>
            )
          })}
        </g>
      )}
    </svg>
  )
}

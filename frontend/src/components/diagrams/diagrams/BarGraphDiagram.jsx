/**
 * BarGraphDiagram – simple vertical bar chart.
 * params: { data: [{label, value}], xLabel, yLabel, title, color }
 */
export default function BarGraphDiagram({ params = {}, size = 280 }) {
  const {
    data = [
      { label: 'Mon', value: 5 },
      { label: 'Tue', value: 8 },
      { label: 'Wed', value: 3 },
      { label: 'Thu', value: 7 }
    ],
    xLabel = '',
    yLabel = '',
    title = '',
    color = '#3b82f6'
  } = params

  const height = size * 0.85
  const padL = 38, padR = 16, padT = title ? 28 : 14, padB = xLabel ? 46 : 36

  const chartW = size - padL - padR
  const chartH = height - padT - padB
  const maxVal = Math.max(...data.map(d => d.value), 1)

  const barW = Math.min(chartW / data.length - 6, 50)
  const toY = (v) => padT + chartH - (v / maxVal) * chartH

  // Y-axis labels
  const yTicks = 4
  const yStep = maxVal / yTicks

  return (
    <svg width={size} height={height} viewBox={`0 0 ${size} ${height}`}>
      {/* Title */}
      {title && <text x={size / 2} y={16} textAnchor="middle" fontSize={13} fontWeight="700" fill="#334155">{title}</text>}

      {/* Y-axis */}
      <line x1={padL} y1={padT} x2={padL} y2={padT + chartH} stroke="#334155" strokeWidth="1.5" />

      {/* X-axis */}
      <line x1={padL} y1={padT + chartH} x2={padL + chartW} y2={padT + chartH} stroke="#334155" strokeWidth="1.5" />

      {/* Y grid & labels */}
      {Array.from({ length: yTicks + 1 }).map((_, i) => {
        const v = yStep * i
        const y = toY(v)
        return (
          <g key={i}>
            <line x1={padL - 4} y1={y} x2={padL + chartW} y2={y} stroke="#e2e8f0" strokeWidth="1" />
            <text x={padL - 7} y={y} textAnchor="end" dominantBaseline="middle" fontSize={10} fill="#64748b">
              {Number.isInteger(v) ? v : v.toFixed(1)}
            </text>
          </g>
        )
      })}

      {/* Bars */}
      {data.map((d, i) => {
        const spacing = chartW / data.length
        const x = padL + i * spacing + (spacing - barW) / 2
        const barH = (d.value / maxVal) * chartH
        const y = padT + chartH - barH
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH} fill={color} rx="3" opacity="0.85" />
            <text x={x + barW / 2} y={y - 5} textAnchor="middle" fontSize={10} fontWeight="600" fill="#334155">{d.value}</text>
            <text x={x + barW / 2} y={padT + chartH + 14} textAnchor="middle" fontSize={10} fill="#64748b">{d.label}</text>
          </g>
        )
      })}

      {/* Axis labels */}
      {xLabel && <text x={size / 2} y={height - 4} textAnchor="middle" fontSize={11} fill="#64748b">{xLabel}</text>}
      {yLabel && (
        <text
          x={10} y={padT + chartH / 2}
          textAnchor="middle" fontSize={11} fill="#64748b"
          transform={`rotate(-90, 10, ${padT + chartH / 2})`}
        >
          {yLabel}
        </text>
      )}
    </svg>
  )
}

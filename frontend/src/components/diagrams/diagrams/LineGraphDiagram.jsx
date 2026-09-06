/**
 * LineGraphDiagram – line graph for data handling and speed-distance-time.
 * params: {
 *   data: [{ x, y, label? }],   // x can be a string or number
 *   xLabel, yLabel, title,
 *   color, showPoints, showArea,
 *   xValues: optional string array for x-axis labels (e.g. ['Mon','Tue',...])
 * }
 */
export default function LineGraphDiagram({ params = {}, size = 280 }) {
  const {
    data = [
      { x: 1, y: 10 },
      { x: 2, y: 25 },
      { x: 3, y: 18 },
      { x: 4, y: 35 },
      { x: 5, y: 28 }
    ],
    xLabel = '',
    yLabel = '',
    title = '',
    color = '#3b82f6',
    showPoints = true,
    showArea = true,
    xValues = null
  } = params

  const height = size * 0.82
  const padL = 42, padR = 16, padT = title ? 28 : 14, padB = xLabel ? 46 : 36

  const chartW = size - padL - padR
  const chartH = height - padT - padB

  const yVals = data.map(d => Number(d.y) || 0)
  const xVals = data.map((d, i) => Number(d.x) || i)

  const minY = 0, maxY = Math.max(...yVals, 1)
  const minX = xVals[0], maxX = xVals[xVals.length - 1]
  const xSpan = maxX - minX || 1

  const toSx = (x) => padL + ((x - minX) / xSpan) * chartW
  const toSy = (y) => padT + chartH - (y / maxY) * chartH

  const points = data.map((d, i) => ({ sx: toSx(xVals[i]), sy: toSy(Number(d.y) || 0), ...d }))
  const polyline = points.map(p => `${p.sx},${p.sy}`).join(' ')

  // Area path
  const areaPath = [
    `M ${points[0].sx} ${padT + chartH}`,
    ...points.map(p => `L ${p.sx} ${p.sy}`),
    `L ${points[points.length - 1].sx} ${padT + chartH}`,
    'Z'
  ].join(' ')

  const yTicks = 5
  const yStep = maxY / yTicks

  return (
    <svg width={size} height={height} viewBox={`0 0 ${size} ${height}`}>
      {/* Title */}
      {title && <text x={size / 2} y={16} textAnchor="middle" fontSize={12} fontWeight="700" fill="#334155">{title}</text>}

      {/* Grid */}
      {Array.from({ length: yTicks + 1 }).map((_, i) => {
        const y = toSy(yStep * i)
        return (
          <g key={i}>
            <line x1={padL} y1={y} x2={padL + chartW} y2={y} stroke="#e2e8f0" strokeWidth="1" />
            <text x={padL - 6} y={y + 4} textAnchor="end" fontSize={9} fill="#64748b">
              {(yStep * i).toFixed(Number.isInteger(yStep) ? 0 : 1)}
            </text>
          </g>
        )
      })}

      {/* Axes */}
      <line x1={padL} y1={padT} x2={padL} y2={padT + chartH} stroke="#334155" strokeWidth="1.5" />
      <line x1={padL} y1={padT + chartH} x2={padL + chartW} y2={padT + chartH} stroke="#334155" strokeWidth="1.5" />

      {/* Area fill */}
      {showArea && (
        <path d={areaPath} fill={color} opacity="0.12" />
      )}

      {/* Line */}
      <polyline points={polyline} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

      {/* Points */}
      {showPoints && points.map((p, i) => (
        <g key={i}>
          <circle cx={p.sx} cy={p.sy} r={5} fill="white" stroke={color} strokeWidth="2.5" />
          <text x={p.sx} y={p.sy - 9} textAnchor="middle" fontSize={9} fontWeight="600" fill={color}>
            {p.y}
          </text>
        </g>
      ))}

      {/* X-axis labels */}
      {points.map((p, i) => {
        const xLabel_ = xValues ? xValues[i] : (typeof data[i].x === 'string' ? data[i].x : data[i].x)
        return (
          <g key={i}>
            <line x1={p.sx} y1={padT + chartH - 3} x2={p.sx} y2={padT + chartH + 4} stroke="#334155" strokeWidth="1" />
            <text x={p.sx} y={padT + chartH + 15} textAnchor="middle" fontSize={9} fill="#64748b">{xLabel_}</text>
          </g>
        )
      })}

      {/* Axis labels */}
      {xLabel && <text x={size / 2} y={height - 4} textAnchor="middle" fontSize={11} fill="#64748b">{xLabel}</text>}
      {yLabel && (
        <text x={10} y={padT + chartH / 2} textAnchor="middle" fontSize={11} fill="#64748b"
          transform={`rotate(-90, 10, ${padT + chartH / 2})`}>{yLabel}</text>
      )}
    </svg>
  )
}

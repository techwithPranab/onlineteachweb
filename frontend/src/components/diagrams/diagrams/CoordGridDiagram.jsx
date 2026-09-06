/**
 * CoordGridDiagram – simple coordinate grid with points.
 * params: {
 *   xRange: [min, max],
 *   yRange: [min, max],
 *   points: [{x, y, label, color}],
 *   segments: [{from: [x,y], to: [x,y], color}],
 *   gridStep: 1,
 *   showGrid: true
 * }
 */
export default function CoordGridDiagram({ params = {}, size = 260 }) {
  const {
    xRange = [0, 6],
    yRange = [0, 6],
    points = [],
    segments = [],
    gridStep = 1,
    showGrid = true
  } = params

  const pad = 30
  const chartW = size - 2 * pad
  const chartH = size - 2 * pad

  const [xMin, xMax] = xRange
  const [yMin, yMax] = yRange
  const xSpan = xMax - xMin || 1
  const ySpan = yMax - yMin || 1

  const toSvg = (x, y) => ({
    sx: pad + ((x - xMin) / xSpan) * chartW,
    sy: pad + chartH - ((y - yMin) / ySpan) * chartH
  })

  // grid ticks
  const xTicks = []
  for (let v = xMin; v <= xMax; v += gridStep) xTicks.push(v)
  const yTicks = []
  for (let v = yMin; v <= yMax; v += gridStep) yTicks.push(v)

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Grid */}
      {showGrid && (
        <>
          {xTicks.map(v => {
            const { sx } = toSvg(v, yMin)
            return <line key={`xg${v}`} x1={sx} y1={pad} x2={sx} y2={pad + chartH} stroke="#e2e8f0" strokeWidth="1" />
          })}
          {yTicks.map(v => {
            const { sy } = toSvg(xMin, v)
            return <line key={`yg${v}`} x1={pad} y1={sy} x2={pad + chartW} y2={sy} stroke="#e2e8f0" strokeWidth="1" />
          })}
        </>
      )}

      {/* Axes */}
      <line x1={pad} y1={pad + chartH} x2={pad + chartW} y2={pad + chartH} stroke="#334155" strokeWidth="2" />
      <line x1={pad} y1={pad} x2={pad} y2={pad + chartH} stroke="#334155" strokeWidth="2" />

      {/* Arrow heads */}
      <polygon points={`${pad+chartW},${pad+chartH} ${pad+chartW-8},${pad+chartH-4} ${pad+chartW-8},${pad+chartH+4}`} fill="#334155" />
      <polygon points={`${pad},${pad} ${pad-4},${pad+8} ${pad+4},${pad+8}`} fill="#334155" />

      {/* Tick labels */}
      {xTicks.filter(v => v !== xMin).map(v => {
        const { sx, sy } = toSvg(v, yMin)
        return (
          <g key={`xl${v}`}>
            <line x1={sx} y1={sy - 4} x2={sx} y2={sy + 4} stroke="#334155" strokeWidth="1.5" />
            <text x={sx} y={sy + 14} textAnchor="middle" fontSize={9} fill="#64748b">{v}</text>
          </g>
        )
      })}
      {yTicks.filter(v => v !== yMin).map(v => {
        const { sx, sy } = toSvg(xMin, v)
        return (
          <g key={`yl${v}`}>
            <line x1={sx - 4} y1={sy} x2={sx + 4} y2={sy} stroke="#334155" strokeWidth="1.5" />
            <text x={sx - 10} y={sy + 4} textAnchor="end" fontSize={9} fill="#64748b">{v}</text>
          </g>
        )
      })}

      {/* Axis name labels */}
      <text x={pad + chartW + 8} y={pad + chartH + 4} fontSize={11} fill="#334155" fontStyle="italic">x</text>
      <text x={pad - 4} y={pad - 8} fontSize={11} fill="#334155" fontStyle="italic" textAnchor="middle">y</text>

      {/* Segments */}
      {segments.map((seg, i) => {
        const { sx: x1, sy: y1 } = toSvg(seg.from[0], seg.from[1])
        const { sx: x2, sy: y2 } = toSvg(seg.to[0], seg.to[1])
        return (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={seg.color || '#3b82f6'} strokeWidth="2" strokeLinecap="round" />
        )
      })}

      {/* Points */}
      {points.map((pt, i) => {
        const { sx, sy } = toSvg(pt.x, pt.y)
        const ptColor = pt.color || '#ef4444'
        return (
          <g key={i}>
            <circle cx={sx} cy={sy} r={5} fill={ptColor} stroke="white" strokeWidth="1.5" />
            {pt.label && (
              <text x={sx + 7} y={sy - 6} fontSize={10} fontWeight="600" fill={ptColor}>{pt.label}</text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

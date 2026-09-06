export default function OgiveDiagram({ params = {}, size = 300 }) {
  const {
    points = [{ x: 10, y: 4 }, { x: 20, y: 13 }, { x: 30, y: 22 }, { x: 40, y: 30 }],
    title = 'Cumulative frequency curve',
    xLabel = 'Upper class boundary',
    yLabel = 'Cumulative frequency'
  } = params

  const w = size
  const h = size * 0.78
  const padL = 44
  const padB = 42
  const padT = 28
  const chartW = w - padL - 18
  const chartH = h - padT - padB
  const maxX = Math.max(...points.map(p => Number(p.x) || 0), 1)
  const maxY = Math.max(...points.map(p => Number(p.y) || 0), 1)
  const toX = x => padL + (x / maxX) * chartW
  const toY = y => padT + chartH - (y / maxY) * chartH
  const polyline = points.map(p => `${toX(p.x)},${toY(p.y)}`).join(' ')

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={title}>
      <text x={w / 2} y="16" textAnchor="middle" fontSize="12" fontWeight="700" fill="#334155">{title}</text>
      <line x1={padL} y1={padT} x2={padL} y2={padT + chartH} stroke="#334155" strokeWidth="1.5" />
      <line x1={padL} y1={padT + chartH} x2={padL + chartW} y2={padT + chartH} stroke="#334155" strokeWidth="1.5" />
      <polyline points={polyline} fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={toX(p.x)} cy={toY(p.y)} r="4.5" fill="white" stroke="#2563eb" strokeWidth="2" />
          <text x={toX(p.x)} y={toY(p.y) - 8} textAnchor="middle" fontSize="9" fill="#1d4ed8">{p.y}</text>
          <text x={toX(p.x)} y={padT + chartH + 14} textAnchor="middle" fontSize="9" fill="#64748b">{p.x}</text>
        </g>
      ))}
      <text x={w / 2} y={h - 5} textAnchor="middle" fontSize="10" fill="#64748b">{xLabel}</text>
      <text x="11" y={padT + chartH / 2} textAnchor="middle" fontSize="10" fill="#64748b" transform={`rotate(-90, 11, ${padT + chartH / 2})`}>{yLabel}</text>
    </svg>
  )
}

export default function InequalityNumberLineDiagram({ params = {}, size = 300 }) {
  const {
    min = -5,
    max = 5,
    boundary = 2,
    direction = 'right',
    inclusive = true,
    title = 'Inequality on number line',
    label = 'x >= 2'
  } = params

  const w = size
  const h = size * 0.42
  const pad = 34
  const y = h / 2
  const toX = value => pad + ((value - min) / (max - min || 1)) * (w - 2 * pad)
  const bx = toX(boundary)
  const x1 = direction === 'right' ? bx : pad
  const x2 = direction === 'right' ? w - pad : bx

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={title}>
      <defs>
        <marker id="ineqArrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <path d="M 0 0 L 8 4 L 0 8 z" fill="#2563eb" />
        </marker>
      </defs>
      <text x={w / 2} y="16" textAnchor="middle" fontSize="12" fontWeight="700" fill="#334155">{title}</text>
      <line x1={pad} y1={y} x2={w - pad} y2={y} stroke="#334155" strokeWidth="2" />
      {Array.from({ length: max - min + 1 }, (_, i) => min + i).map(v => (
        <g key={v}>
          <line x1={toX(v)} y1={y - 5} x2={toX(v)} y2={y + 5} stroke="#334155" />
          <text x={toX(v)} y={y + 20} textAnchor="middle" fontSize="9" fill="#64748b">{v}</text>
        </g>
      ))}
      <line x1={x1} y1={y} x2={x2} y2={y} stroke="#2563eb" strokeWidth="5" strokeLinecap="round" markerEnd={direction === 'right' ? 'url(#ineqArrow)' : undefined} markerStart={direction === 'left' ? 'url(#ineqArrow)' : undefined} />
      <circle cx={bx} cy={y} r="8" fill={inclusive ? '#2563eb' : 'white'} stroke="#2563eb" strokeWidth="3" />
      <text x={w / 2} y={h - 6} textAnchor="middle" fontSize="11" fontWeight="700" fill="#1d4ed8">{label}</text>
    </svg>
  )
}

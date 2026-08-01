export default function ComplexPlaneDiagram({ params = {}, size = 280 }) {
  const {
    points = [{ real: 3, imaginary: 2, label: 'z' }],
    title = 'Complex plane',
    range = 5
  } = params

  const w = size
  const h = size
  const pad = 32
  const chart = w - 2 * pad
  const toX = x => pad + ((x + range) / (2 * range)) * chart
  const toY = y => pad + chart - ((y + range) / (2 * range)) * chart
  const ticks = Array.from({ length: range * 2 + 1 }, (_, i) => i - range)

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={title}>
      <text x={w / 2} y="16" textAnchor="middle" fontSize="12" fontWeight="700" fill="#334155">{title}</text>
      {ticks.map(v => <line key={`x${v}`} x1={toX(v)} y1={pad} x2={toX(v)} y2={pad + chart} stroke="#e2e8f0" />)}
      {ticks.map(v => <line key={`y${v}`} x1={pad} y1={toY(v)} x2={pad + chart} y2={toY(v)} stroke="#e2e8f0" />)}
      <line x1={pad} y1={toY(0)} x2={pad + chart} y2={toY(0)} stroke="#334155" strokeWidth="1.8" />
      <line x1={toX(0)} y1={pad} x2={toX(0)} y2={pad + chart} stroke="#334155" strokeWidth="1.8" />
      <text x={pad + chart + 4} y={toY(0) + 4} fontSize="10" fill="#334155">Re</text>
      <text x={toX(0) + 4} y={pad - 8} fontSize="10" fill="#334155">Im</text>
      {points.map((p, i) => (
        <g key={i}>
          <line x1={toX(0)} y1={toY(0)} x2={toX(p.real)} y2={toY(p.imaginary)} stroke="#2563eb" strokeWidth="2" />
          <circle cx={toX(p.real)} cy={toY(p.imaginary)} r="5" fill="#dc2626" stroke="white" strokeWidth="1.5" />
          <text x={toX(p.real) + 7} y={toY(p.imaginary) - 7} fontSize="11" fontWeight="700" fill="#dc2626">{p.label || 'z'}</text>
        </g>
      ))}
    </svg>
  )
}

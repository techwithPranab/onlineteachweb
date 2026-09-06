export default function EquationBalanceDiagram({ params = {}, size = 300 }) {
  const {
    left = ['x', '3'],
    right = ['7'],
    title = 'Equation balance'
  } = params

  const w = size
  const h = size * 0.7
  const cx = w / 2
  const beamY = 70

  const plate = (items, x, label) => (
    <g>
      <line x1={cx} y1={beamY} x2={x} y2={beamY + 42} stroke="#475569" strokeWidth="2" />
      <ellipse cx={x} cy={beamY + 50} rx="52" ry="12" fill="#e0f2fe" stroke="#0284c7" strokeWidth="2" />
      {items.map((item, i) => (
        <g key={`${label}-${i}`}>
          <rect x={x - 38 + i * 28} y={beamY + 20 - (i % 2) * 6} width="24" height="22" rx="4" fill="#fef3c7" stroke="#f59e0b" />
          <text x={x - 26 + i * 28} y={beamY + 35 - (i % 2) * 6} textAnchor="middle" fontSize="11" fontWeight="700" fill="#92400e">{item}</text>
        </g>
      ))}
      <text x={x} y={beamY + 78} textAnchor="middle" fontSize="11" fill="#64748b">{label}</text>
    </g>
  )

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={title}>
      <text x={cx} y="16" textAnchor="middle" fontSize="12" fontWeight="700" fill="#334155">{title}</text>
      <line x1={cx - 92} y1={beamY} x2={cx + 92} y2={beamY} stroke="#334155" strokeWidth="4" strokeLinecap="round" />
      <line x1={cx} y1={beamY} x2={cx} y2={h - 28} stroke="#334155" strokeWidth="4" />
      <polygon points={`${cx - 34},${h - 28} ${cx + 34},${h - 28} ${cx + 22},${h - 14} ${cx - 22},${h - 14}`} fill="#cbd5e1" />
      {plate(left, cx - 86, 'left side')}
      {plate(right, cx + 86, 'right side')}
      <text x={cx} y={beamY - 9} textAnchor="middle" fontSize="16" fontWeight="800" fill="#2563eb">=</text>
    </svg>
  )
}

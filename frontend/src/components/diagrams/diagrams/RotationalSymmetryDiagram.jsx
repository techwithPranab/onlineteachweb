/**
 * RotationalSymmetryDiagram – shows a 2-D shape rotated around a centre.
 * params: { shape, angle, order, title, showCopies }
 */
export default function RotationalSymmetryDiagram({ params = {}, size = 220 }) {
  const {
    shape = 'triangle',
    angle = 120,
    order = 3,
    title = 'Rotational symmetry',
    showCopies = true
  } = params

  const w = size
  const h = size
  const cx = w / 2
  const cy = h / 2 + 4
  const colors = ['#2563eb', '#16a34a', '#f97316', '#7c3aed', '#dc2626', '#0891b2']
  const copies = showCopies ? Math.max(1, Math.min(order, 6)) : 1

  const shapeNode = (fill, stroke) => {
    if (shape === 'rectangle') {
      return <rect x="-34" y="-18" width="68" height="36" rx="6" fill={fill} stroke={stroke} strokeWidth="2.5" />
    }
    if (shape === 'square') {
      return <rect x="-26" y="-26" width="52" height="52" rx="6" fill={fill} stroke={stroke} strokeWidth="2.5" />
    }
    if (shape === 'pinwheel') {
      return (
        <path
          d="M 0 -46 L 15 -10 L 46 0 L 10 15 L 0 46 L -15 10 L -46 0 L -10 -15 Z"
          fill={fill}
          stroke={stroke}
          strokeWidth="2.5"
        />
      )
    }
    return <polygon points="0,-44 38,28 -38,28" fill={fill} stroke={stroke} strokeWidth="2.5" />
  }

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={title}>
      <rect x="0" y="0" width={w} height={h} rx="16" fill="#f8fafc" />
      <text x={cx} y="20" textAnchor="middle" fontSize="13" fontWeight="700" fill="#334155">{title}</text>

      <circle cx={cx} cy={cy} r="66" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="5 5" />
      {Array.from({ length: copies }).map((_, index) => {
        const deg = index * angle
        return (
          <g key={deg} transform={`translate(${cx} ${cy}) rotate(${deg})`} opacity={index === 0 ? 1 : 0.42}>
            {shapeNode(index === 0 ? '#dbeafe' : '#fef3c7', colors[index % colors.length])}
            <line x1="0" y1="0" x2="0" y2="-44" stroke={colors[index % colors.length]} strokeWidth="2" strokeDasharray={index === 0 ? '' : '4 3'} />
          </g>
        )
      })}

      <circle cx={cx} cy={cy} r="5" fill="#111827" />
      <path d={`M ${cx + 46} ${cy - 58} A 72 72 0 0 1 ${cx + 70} ${cy - 10}`} fill="none" stroke="#475569" strokeWidth="2" markerEnd="url(#arrow)" />
      <defs>
        <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill="#475569" />
        </marker>
      </defs>
      <text x={cx} y={h - 28} textAnchor="middle" fontSize="11" fill="#475569">turn angle = {angle}°</text>
      <text x={cx} y={h - 12} textAnchor="middle" fontSize="10" fill="#64748b">order of rotational symmetry ≈ {order}</text>
    </svg>
  )
}

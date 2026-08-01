/**
 * QuadrilateralPropertiesDiagram – shows Grade 8 quadrilateral properties.
 * params: { kind, property, title, showLabels }
 */
export default function QuadrilateralPropertiesDiagram({ params = {}, size = 220 }) {
  const {
    kind = 'parallelogram',
    property = 'diagonalsBisect',
    title = 'Quadrilateral properties',
    showLabels = true
  } = params

  const w = size
  const h = size
  const cx = w / 2
  const cy = h / 2 + 6

  const pointsByKind = {
    rectangle: [[46, 68], [174, 68], [174, 156], [46, 156]],
    square: [[62, 58], [162, 58], [162, 158], [62, 158]],
    rhombus: [[110, 46], [176, 110], [110, 174], [44, 110]],
    trapezium: [[64, 70], [158, 70], [186, 158], [38, 158]],
    parallelogram: [[58, 70], [174, 70], [146, 158], [30, 158]]
  }

  const pts = pointsByKind[kind] || pointsByKind.parallelogram
  const [a, b, c, d] = pts
  const path = `M ${a[0]} ${a[1]} L ${b[0]} ${b[1]} L ${c[0]} ${c[1]} L ${d[0]} ${d[1]} Z`
  const mid = [(a[0] + c[0]) / 2, (a[1] + c[1]) / 2]

  const tick = (p, q, offset = 0, color = '#2563eb') => {
    const x = (p[0] + q[0]) / 2
    const y = (p[1] + q[1]) / 2
    return <line x1={x - 7 + offset} y1={y - 5} x2={x + 7 + offset} y2={y + 5} stroke={color} strokeWidth="2.5" />
  }

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={title}>
      <rect width={w} height={h} rx="16" fill="#f8fafc" />
      <text x={cx} y="20" textAnchor="middle" fontSize="13" fontWeight="700" fill="#334155">{title}</text>

      <path d={path} fill="#dbeafe" stroke="#2563eb" strokeWidth="2.5" />

      {(property === 'diagonalsBisect' || property === 'rectangleDiagonals' || property === 'rhombusDiagonals' || property === 'squareDiagonals') && (
        <>
          <line x1={a[0]} y1={a[1]} x2={c[0]} y2={c[1]} stroke="#f97316" strokeWidth="2.5" />
          <line x1={b[0]} y1={b[1]} x2={d[0]} y2={d[1]} stroke="#16a34a" strokeWidth="2.5" />
          <circle cx={mid[0]} cy={mid[1]} r="5" fill="#7c3aed" />
          <text x={mid[0] + 8} y={mid[1] - 8} fontSize="10" fill="#7c3aed">midpoint</text>
        </>
      )}

      {(property === 'oppositeSidesEqual' || property === 'diagonalsBisect') && (
        <>
          {tick(a, b)}
          {tick(c, d)}
          {tick(b, c, 0, '#16a34a')}
          {tick(d, a, 0, '#16a34a')}
        </>
      )}

      {(property === 'oppositeAnglesEqual' || property === 'angleSum') && (
        <>
          <path d={`M ${a[0] + 24} ${a[1]} Q ${a[0] + 18} ${a[1] + 20} ${a[0] + 2} ${a[1] + 22}`} fill="none" stroke="#f97316" strokeWidth="2.5" />
          <path d={`M ${c[0] - 24} ${c[1]} Q ${c[0] - 18} ${c[1] - 20} ${c[0] - 2} ${c[1] - 22}`} fill="none" stroke="#f97316" strokeWidth="2.5" />
          <text x={cx} y={h - 34} textAnchor="middle" fontSize="11" fill="#475569">angle sum = 360°</text>
        </>
      )}

      {(property === 'rhombusDiagonals' || property === 'squareDiagonals') && (
        <g>
          <path d={`M ${mid[0]} ${mid[1]} h 16 v 16 h -16 Z`} fill="none" stroke="#dc2626" strokeWidth="2" />
          <text x={cx} y={h - 34} textAnchor="middle" fontSize="11" fill="#dc2626">diagonals meet at right angles</text>
        </g>
      )}

      {showLabels && ['A', 'B', 'C', 'D'].map((label, index) => (
        <text key={label} x={pts[index][0] + (index < 2 ? -10 : 8)} y={pts[index][1] + (index < 2 ? -8 : 16)} fontSize="11" fill="#334155">{label}</text>
      ))}

      <text x={cx} y={h - 14} textAnchor="middle" fontSize="10" fill="#64748b">{kind}: {property}</text>
    </svg>
  )
}

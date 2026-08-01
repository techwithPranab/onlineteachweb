/**
 * CongruenceDiagram – compares two congruent triangles with matching marks.
 * params: { criterion, title, showLabels }
 */
export default function CongruenceDiagram({ params = {}, size = 220 }) {
  const {
    criterion = 'SSS',
    title = 'Triangle congruence',
    showLabels = true
  } = params

  const w = size
  const h = size
  const left = { a: [34, 154], b: [94, 52], c: [148, 154] }
  const right = { a: [w - 148, 154], b: [w - 94, 52], c: [w - 34, 154] }

  const trianglePath = (t) => `M ${t.a[0]} ${t.a[1]} L ${t.b[0]} ${t.b[1]} L ${t.c[0]} ${t.c[1]} Z`
  const mid = (p, q, offsetY = 0) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2 + offsetY]

  const tick = (x, y, label, color = '#2563eb') => (
    <g key={`${x}-${y}-${label}`}>
      <line x1={x - 6} y1={y - 5} x2={x + 6} y2={y + 5} stroke={color} strokeWidth="2.5" />
      <text x={x + 10} y={y + 4} fontSize="10" fill={color}>{label}</text>
    </g>
  )

  const angleArc = (x, y, flip = false, color = '#f97316') => (
    <path
      d={flip ? `M ${x - 18} ${y} Q ${x - 12} ${y - 17} ${x + 6} ${y - 14}` : `M ${x + 18} ${y} Q ${x + 12} ${y - 17} ${x - 6} ${y - 14}`}
      fill="none"
      stroke={color}
      strokeWidth="2.5"
    />
  )

  const sideMarks = [
    tick(...mid(left.a, left.b), '1'),
    tick(...mid(left.b, left.c), '2'),
    tick(...mid(left.a, left.c, 8), '3'),
    tick(...mid(right.a, right.b), '1'),
    tick(...mid(right.b, right.c), '2'),
    tick(...mid(right.a, right.c, 8), '3')
  ]

  const angleMarks = [
    angleArc(left.a[0] + 3, left.a[1] - 3),
    angleArc(left.b[0], left.b[1] + 24, true),
    angleArc(right.a[0] + 3, right.a[1] - 3),
    angleArc(right.b[0], right.b[1] + 24, true)
  ]

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={title}>
      <rect x="0" y="0" width={w} height={h} rx="16" fill="#f8fafc" />
      <text x={w / 2} y="20" textAnchor="middle" fontSize="13" fontWeight="700" fill="#334155">{title}</text>

      <path d={trianglePath(left)} fill="#dbeafe" stroke="#2563eb" strokeWidth="2.5" />
      <path d={trianglePath(right)} fill="#dcfce7" stroke="#16a34a" strokeWidth="2.5" />

      {criterion.includes('S') && sideMarks}
      {criterion.includes('A') && angleMarks}

      {showLabels && (
        <>
          <text x={left.a[0] - 14} y={left.a[1] + 16} fontSize="11" fill="#334155">A</text>
          <text x={left.b[0] - 4} y={left.b[1] - 8} fontSize="11" fill="#334155">B</text>
          <text x={left.c[0] + 6} y={left.c[1] + 16} fontSize="11" fill="#334155">C</text>
          <text x={right.a[0] - 14} y={right.a[1] + 16} fontSize="11" fill="#334155">P</text>
          <text x={right.b[0] - 4} y={right.b[1] - 8} fontSize="11" fill="#334155">Q</text>
          <text x={right.c[0] + 6} y={right.c[1] + 16} fontSize="11" fill="#334155">R</text>
        </>
      )}

      <text x={w / 2} y={h - 30} textAnchor="middle" fontSize="12" fontWeight="700" fill="#7c3aed">Criterion: {criterion}</text>
      <text x={w / 2} y={h - 12} textAnchor="middle" fontSize="10" fill="#64748b">matching marks show equal sides or equal angles</text>
    </svg>
  )
}

export default function LocusDiagram({ params = {}, size = 280 }) {
  const {
    kind = 'perpendicularBisector',
    title = 'Locus diagram',
    pointA = { x: 82, y: 145, label: 'A' },
    pointB = { x: 198, y: 145, label: 'B' }
  } = params

  const w = size
  const h = size * 0.78
  const midX = (pointA.x + pointB.x) / 2
  const midY = (pointA.y + pointB.y) / 2

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={title}>
      <text x={w / 2} y="16" textAnchor="middle" fontSize="12" fontWeight="700" fill="#334155">{title}</text>
      <line x1={pointA.x} y1={pointA.y} x2={pointB.x} y2={pointB.y} stroke="#334155" strokeWidth="2" />
      {[pointA, pointB].map(p => (
        <g key={p.label}>
          <circle cx={p.x} cy={p.y} r="6" fill="#dc2626" stroke="white" strokeWidth="1.5" />
          <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize="11" fontWeight="700" fill="#dc2626">{p.label}</text>
        </g>
      ))}
      {kind === 'circle' ? (
        <>
          <circle cx={pointA.x} cy={pointA.y} r="56" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeDasharray="5 4" />
          <text x={pointA.x + 58} y={pointA.y - 12} fontSize="10" fill="#1d4ed8">fixed distance from A</text>
        </>
      ) : (
        <>
          <line x1={midX} y1="38" x2={midX} y2={h - 18} stroke="#2563eb" strokeWidth="2.5" strokeDasharray="5 4" />
          <path d={`M ${midX - 10} ${midY - 10} L ${midX + 10} ${midY - 10} L ${midX + 10} ${midY + 10}`} fill="none" stroke="#334155" strokeWidth="1.8" />
          <text x={midX + 12} y="52" fontSize="10" fill="#1d4ed8">points equidistant from A and B</text>
        </>
      )}
      <text x={w / 2} y={h - 8} textAnchor="middle" fontSize="10" fill="#64748b">{kind === 'circle' ? 'circle locus' : 'perpendicular bisector locus'}</text>
    </svg>
  )
}

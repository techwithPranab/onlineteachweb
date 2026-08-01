export default function CircleTheoremDiagram({ params = {}, size = 280 }) {
  const {
    theorem = 'tangentRadius',
    title = 'Circle theorem'
  } = params

  const w = size
  const h = size * 0.82
  const cx = w / 2
  const cy = h / 2 + 8
  const r = 62
  const p = { x: cx + r * 0.75, y: cy - r * 0.66 }

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={title}>
      <text x={cx} y="16" textAnchor="middle" fontSize="12" fontWeight="700" fill="#334155">{title}</text>
      <circle cx={cx} cy={cy} r={r} fill="#dbeafe" stroke="#2563eb" strokeWidth="3" />
      <circle cx={cx} cy={cy} r="4" fill="#1d4ed8" />
      {theorem === 'tangentRadius' ? (
        <>
          <line x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#16a34a" strokeWidth="3" />
          <line x1={p.x - 70} y1={p.y - 78} x2={p.x + 70} y2={p.y + 78} stroke="#f97316" strokeWidth="3" />
          <path d={`M ${p.x - 10} ${p.y + 10} L ${p.x + 2} ${p.y + 21} L ${p.x + 13} ${p.y + 9}`} fill="none" stroke="#334155" strokeWidth="2" />
          <text x={p.x + 16} y={p.y + 28} fontSize="10" fill="#334155">90 deg</text>
        </>
      ) : (
        <>
          <line x1={cx - r + 8} y1={cy + 12} x2={cx + r - 8} y2={cy + 12} stroke="#16a34a" strokeWidth="3" />
          <line x1={cx - r + 8} y1={cy + 12} x2={cx} y2={cy - r} stroke="#f97316" strokeWidth="3" />
          <line x1={cx + r - 8} y1={cy + 12} x2={cx} y2={cy - r} stroke="#f97316" strokeWidth="3" />
          <text x={cx} y={cy - r - 8} textAnchor="middle" fontSize="10" fill="#c2410c">angle in segment</text>
        </>
      )}
    </svg>
  )
}

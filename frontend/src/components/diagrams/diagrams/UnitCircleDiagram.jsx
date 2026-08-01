export default function UnitCircleDiagram({ params = {}, size = 280 }) {
  const {
    angle = 45,
    title = 'Unit circle',
    showCoordinates = true
  } = params

  const w = size
  const h = size
  const cx = w / 2
  const cy = h / 2 + 8
  const r = size * 0.31
  const rad = (angle * Math.PI) / 180
  const px = cx + r * Math.cos(rad)
  const py = cy - r * Math.sin(rad)
  const coord = `(${Math.cos(rad).toFixed(2)}, ${Math.sin(rad).toFixed(2)})`

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={title}>
      <text x={cx} y="16" textAnchor="middle" fontSize="12" fontWeight="700" fill="#334155">{title}</text>
      <circle cx={cx} cy={cy} r={r} fill="#eff6ff" stroke="#2563eb" strokeWidth="2.5" />
      <line x1={cx - r - 28} y1={cy} x2={cx + r + 28} y2={cy} stroke="#334155" strokeWidth="1.5" />
      <line x1={cx} y1={cy + r + 28} x2={cx} y2={cy - r - 28} stroke="#334155" strokeWidth="1.5" />
      <line x1={cx} y1={cy} x2={px} y2={py} stroke="#f97316" strokeWidth="3" />
      <line x1={px} y1={py} x2={px} y2={cy} stroke="#16a34a" strokeDasharray="4 3" strokeWidth="2" />
      <line x1={cx} y1={cy} x2={px} y2={cy} stroke="#16a34a" strokeDasharray="4 3" strokeWidth="2" />
      <circle cx={px} cy={py} r="5" fill="#dc2626" stroke="white" strokeWidth="1.5" />
      <path d={`M ${cx + 28} ${cy} A 28 28 0 0 0 ${cx + 28 * Math.cos(rad)} ${cy - 28 * Math.sin(rad)}`} fill="none" stroke="#7c3aed" strokeWidth="2" />
      <text x={cx + 34} y={cy - 12} fontSize="11" fontWeight="700" fill="#7c3aed">{angle} deg</text>
      {showCoordinates && <text x={cx} y={h - 14} textAnchor="middle" fontSize="11" fill="#475569">point on circle = {coord}</text>}
    </svg>
  )
}

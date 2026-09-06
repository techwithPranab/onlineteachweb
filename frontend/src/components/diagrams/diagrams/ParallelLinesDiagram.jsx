export default function ParallelLinesDiagram({ params = {}, size = 280 }) {
  const {
    angle = 60,
    title = 'Parallel lines and transversal',
    showLabels = true
  } = params

  const w = size
  const h = size * 0.72
  const y1 = 70
  const y2 = 135
  const tx1 = 88
  const tx2 = 202

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={title}>
      <text x={w / 2} y="16" textAnchor="middle" fontSize="12" fontWeight="700" fill="#334155">{title}</text>
      <line x1="28" y1={y1} x2={w - 28} y2={y1} stroke="#2563eb" strokeWidth="3" />
      <line x1="28" y1={y2} x2={w - 28} y2={y2} stroke="#2563eb" strokeWidth="3" />
      <line x1={tx1} y1="34" x2={tx2} y2={h - 22} stroke="#f97316" strokeWidth="3" />
      <path d={`M ${tx1 + 36} ${y1} A 28 28 0 0 1 ${tx1 + 16} ${y1 - 22}`} fill="none" stroke="#16a34a" strokeWidth="2" />
      <path d={`M ${tx2 - 36} ${y2} A 28 28 0 0 1 ${tx2 - 16} ${y2 + 22}`} fill="none" stroke="#16a34a" strokeWidth="2" />
      {showLabels && (
        <>
          <text x={tx1 + 38} y={y1 - 12} fontSize="11" fontWeight="700" fill="#166534">{angle} deg</text>
          <text x={tx2 - 72} y={y2 + 26} fontSize="11" fontWeight="700" fill="#166534">{angle} deg</text>
          <text x={w - 24} y={y1 - 6} fontSize="10" fill="#1d4ed8">l</text>
          <text x={w - 24} y={y2 - 6} fontSize="10" fill="#1d4ed8">m</text>
          <text x={tx2 + 4} y={h - 24} fontSize="10" fill="#c2410c">t</text>
        </>
      )}
    </svg>
  )
}

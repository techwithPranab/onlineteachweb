export default function IntegerChipsDiagram({ params = {}, size = 280 }) {
  const {
    positives = 5,
    negatives = 3,
    title = 'Integer chips',
    showZeroPairs = true
  } = params

  const w = size
  const h = size * 0.68
  const chips = [
    ...Array.from({ length: Math.max(0, positives) }, (_, i) => ({ sign: '+', i })),
    ...Array.from({ length: Math.max(0, negatives) }, (_, i) => ({ sign: '-', i }))
  ]
  const net = positives - negatives
  const cols = Math.max(1, Math.min(8, Math.ceil(Math.sqrt(chips.length || 1))))
  const startX = 34
  const startY = 42
  const gap = 30

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={title}>
      <text x={w / 2} y="16" textAnchor="middle" fontSize="12" fontWeight="700" fill="#334155">{title}</text>
      {chips.map((chip, index) => {
        const x = startX + (index % cols) * gap
        const y = startY + Math.floor(index / cols) * gap
        const positive = chip.sign === '+'
        return (
          <g key={`${chip.sign}-${chip.i}`}>
            <circle cx={x} cy={y} r="12" fill={positive ? '#dcfce7' : '#fee2e2'} stroke={positive ? '#16a34a' : '#dc2626'} strokeWidth="2" />
            <text x={x} y={y + 4} textAnchor="middle" fontSize="13" fontWeight="800" fill={positive ? '#166534' : '#991b1b'}>{chip.sign}</text>
          </g>
        )
      })}
      {showZeroPairs && (
        <text x={w - 14} y={h - 30} textAnchor="end" fontSize="11" fill="#64748b">
          zero pairs: {Math.min(positives, negatives)}
        </text>
      )}
      <text x={w - 14} y={h - 12} textAnchor="end" fontSize="12" fontWeight="700" fill="#334155">net value = {net}</text>
    </svg>
  )
}

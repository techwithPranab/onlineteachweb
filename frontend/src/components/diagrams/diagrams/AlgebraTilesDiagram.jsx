export default function AlgebraTilesDiagram({ params = {}, size = 300 }) {
  const {
    x2 = 1,
    x = 3,
    ones = 2,
    title = 'Algebra tiles'
  } = params

  const w = size
  const h = size * 0.78
  const startX = 24
  const startY = 42
  const x2Tiles = Array.from({ length: Math.max(0, x2) })
  const xTiles = Array.from({ length: Math.max(0, x) })
  const oneTiles = Array.from({ length: Math.max(0, ones) })

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={title}>
      <text x={w / 2} y="16" textAnchor="middle" fontSize="12" fontWeight="700" fill="#334155">{title}</text>
      {x2Tiles.map((_, i) => (
        <g key={`x2-${i}`}>
          <rect x={startX + i * 72} y={startY} width="58" height="58" rx="6" fill="#dbeafe" stroke="#2563eb" strokeWidth="2" />
          <text x={startX + i * 72 + 29} y={startY + 34} textAnchor="middle" fontSize="15" fontWeight="800" fill="#1d4ed8">x^2</text>
        </g>
      ))}
      {xTiles.map((_, i) => (
        <g key={`x-${i}`}>
          <rect x={startX + i * 44} y={startY + 74} width="34" height="58" rx="5" fill="#dcfce7" stroke="#16a34a" strokeWidth="2" />
          <text x={startX + i * 44 + 17} y={startY + 108} textAnchor="middle" fontSize="15" fontWeight="800" fill="#166534">x</text>
        </g>
      ))}
      {oneTiles.map((_, i) => (
        <g key={`one-${i}`}>
          <rect x={startX + i * 28} y={startY + 148} width="20" height="20" rx="4" fill="#fef3c7" stroke="#f59e0b" strokeWidth="2" />
          <text x={startX + i * 28 + 10} y={startY + 163} textAnchor="middle" fontSize="11" fontWeight="800" fill="#92400e">1</text>
        </g>
      ))}
      <text x={w / 2} y={h - 10} textAnchor="middle" fontSize="12" fill="#475569">expression: {x2 ? `${x2}x^2` : ''}{x ? ` + ${x}x` : ''}{ones ? ` + ${ones}` : ''}</text>
    </svg>
  )
}

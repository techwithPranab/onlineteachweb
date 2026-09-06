export default function SolidNetDiagram({ params = {}, size = 280 }) {
  const {
    solid = 'cube',
    title = 'Net of a solid',
    labels = true
  } = params

  const w = size
  const h = size * 0.75
  const s = 34
  const startX = w / 2 - s * 1.5
  const startY = 52
  const cubeCells = [[1, 0], [0, 1], [1, 1], [2, 1], [3, 1], [1, 2]]
  const prismCells = [[0, 1], [1, 1], [2, 1], [3, 1], [1, 0], [2, 0], [1, 2], [2, 2]]
  const cells = solid === 'cuboid' ? prismCells : cubeCells

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={title}>
      <text x={w / 2} y="16" textAnchor="middle" fontSize="12" fontWeight="700" fill="#334155">{title}</text>
      {cells.map(([cx, cy], i) => (
        <g key={i}>
          <rect x={startX + cx * s} y={startY + cy * s} width={s} height={s} fill={i % 2 ? '#dcfce7' : '#dbeafe'} stroke="#334155" strokeWidth="1.5" />
          {labels && <text x={startX + cx * s + s / 2} y={startY + cy * s + s / 2 + 4} textAnchor="middle" fontSize="10" fill="#334155">F{i + 1}</text>}
        </g>
      ))}
      <text x={w / 2} y={h - 10} textAnchor="middle" fontSize="11" fill="#64748b">{solid} net</text>
    </svg>
  )
}

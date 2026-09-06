export default function MatrixDiagram({ params = {}, size = 280 }) {
  const {
    matrix = [[1, 2], [3, 4]],
    highlight = null,
    title = 'Matrix',
    determinant = null
  } = params

  const rows = matrix.length
  const cols = Math.max(...matrix.map(row => row.length))
  const cell = Math.min(42, Math.max(28, (size - 80) / cols))
  const w = Math.max(size, cols * cell + 90)
  const h = rows * cell + 72
  const startX = (w - cols * cell) / 2
  const startY = 36

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={title}>
      <text x={w / 2} y="16" textAnchor="middle" fontSize="12" fontWeight="700" fill="#334155">{title}</text>
      <path d={`M ${startX - 14} ${startY - 4} L ${startX - 24} ${startY - 4} L ${startX - 24} ${startY + rows * cell + 4} L ${startX - 14} ${startY + rows * cell + 4}`} fill="none" stroke="#334155" strokeWidth="2" />
      <path d={`M ${startX + cols * cell + 14} ${startY - 4} L ${startX + cols * cell + 24} ${startY - 4} L ${startX + cols * cell + 24} ${startY + rows * cell + 4} L ${startX + cols * cell + 14} ${startY + rows * cell + 4}`} fill="none" stroke="#334155" strokeWidth="2" />
      {matrix.map((row, r) => row.map((value, c) => {
        const isMarked = highlight && highlight[0] === r && highlight[1] === c
        return (
          <g key={`${r}-${c}`}>
            {isMarked && <rect x={startX + c * cell + 4} y={startY + r * cell + 4} width={cell - 8} height={cell - 8} rx="6" fill="#fef3c7" />}
            <text x={startX + c * cell + cell / 2} y={startY + r * cell + cell / 2 + 5} textAnchor="middle" fontSize="15" fontWeight="700" fill="#1e293b">{value}</text>
          </g>
        )
      }))}
      <text x={w / 2} y={h - 12} textAnchor="middle" fontSize="11" fill="#64748b">
        {determinant == null ? `${rows} rows x ${cols} columns` : `determinant = ${determinant}`}
      </text>
    </svg>
  )
}

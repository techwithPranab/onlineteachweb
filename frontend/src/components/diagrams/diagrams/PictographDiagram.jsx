const SYMBOLS = {
  apple: '🍎', cake: '🎂', chair: '🪑', car: '🚗',
  book: '📘', person: '🧑', star: '★', tree: '🌳',
  circle: '●', square: '■'
}

/**
 * A table-style pictograph with an explicit key.
 * params: { data:[{label,count}], symbol, valuePerSymbol, unit, title }
 */
export default function PictographDiagram({ params = {}, size = 320 }) {
  const {
    data = [{ label: 'Monday', count: 4 }, { label: 'Tuesday', count: 2 }],
    symbol = 'apple', valuePerSymbol = 5, unit = 'items', title = ''
  } = params
  const rows = data.slice(0, 10).map(item => ({
    label: String(item.label ?? ''),
    count: Math.max(0, Math.min(12, Math.round(Number(item.count) || 0)))
  }))
  const glyph = SYMBOLS[symbol] || String(symbol || SYMBOLS.circle).slice(0, 2)
  const width = size
  const rowH = 34
  const titleH = title ? 28 : 8
  const headerH = 32
  const legendH = 38
  const height = titleH + headerH + rows.length * rowH + legendH
  const labelW = Math.max(82, width * 0.3)
  const maxCount = Math.max(...rows.map(row => row.count), 1)
  const iconStep = Math.min(24, (width - labelW - 18) / maxCount)
  const iconSize = Math.min(18, iconStep)

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={title || 'Pictograph'}>
      {title && <text x={width / 2} y={18} textAnchor="middle" fontSize="14" fontWeight="700" fill="#334155">{title}</text>}
      <rect x="1" y={titleH} width={width - 2} height={height - titleH - 1} fill="white" stroke="#64748b" />
      <rect x="1" y={titleH} width={width - 2} height={headerH} fill="#e2e8f0" />
      <line x1={labelW} y1={titleH} x2={labelW} y2={height - legendH} stroke="#64748b" />
      <text x={labelW / 2} y={titleH + 21} textAnchor="middle" fontSize="11" fontWeight="700" fill="#334155">Category</text>
      <text x={(labelW + width) / 2} y={titleH + 21} textAnchor="middle" fontSize="11" fontWeight="700" fill="#334155">Number of {unit}</text>
      {rows.map((row, rowIndex) => {
        const y = titleH + headerH + rowIndex * rowH
        return (
          <g key={`${row.label}-${rowIndex}`}>
            <line x1="1" y1={y} x2={width - 1} y2={y} stroke="#cbd5e1" />
            <text x="8" y={y + 22} fontSize="11" fill="#334155">{row.label}</text>
            {Array.from({ length: row.count }, (_, iconIndex) => (
              <text key={iconIndex} x={labelW + 10 + iconIndex * iconStep} y={y + 23} fontSize={iconSize} fill="#334155">{glyph}</text>
            ))}
          </g>
        )
      })}
      <line x1="1" y1={height - legendH} x2={width - 1} y2={height - legendH} stroke="#64748b" />
      <text x="10" y={height - 13} fontSize="12" fill="#334155">
        Each <tspan fontSize="18">{glyph}</tspan> represents {valuePerSymbol} {unit}.
      </text>
    </svg>
  )
}

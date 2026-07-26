/**
 * PlaceValueDiagram – visual place-value blocks.
 * params: { thousands, hundreds, tens, ones, showLabel }
 * Renders unit cubes, ten-sticks, hundred-squares, thousand-big-cubes (symbolically).
 */
export default function PlaceValueDiagram({ params = {}, size = 300 }) {
  const {
    thousands = 0,
    hundreds = 0,
    tens = 0,
    ones = 0,
    showLabel = true
  } = params

  const cols = [
    { label: 'Thousands', value: thousands, color: '#7c3aed', symbol: '■■\n■■' },
    { label: 'Hundreds',  value: hundreds,  color: '#2563eb', symbol: '▦' },
    { label: 'Tens',      value: tens,       color: '#059669', symbol: '▬' },
    { label: 'Ones',      value: ones,       color: '#dc2626', symbol: '●' }
  ].filter(c => c.value >= 0)

  const colW = size / cols.length
  const blockSize = Math.min(colW * 0.35, 28)
  const gapY = 4
  const headerH = 28
  const maxBlocks = 9
  const gridCols = 3

  return (
    <svg width={size} height={size * 0.95} viewBox={`0 0 ${size} ${size * 0.95}`}>
      {/* Column headers & separators */}
      {cols.map((col, ci) => {
        const x0 = ci * colW
        return (
          <g key={ci}>
            {/* Header */}
            <rect x={x0 + 2} y={2} width={colW - 4} height={headerH - 2} fill={col.color} rx="4" />
            <text x={x0 + colW / 2} y={headerH / 2 + 5} textAnchor="middle" fontSize={10} fontWeight="700" fill="white">
              {col.label}
            </text>
            {/* Column BG */}
            <rect x={x0 + 2} y={headerH + 2} width={colW - 4} height={size * 0.95 - headerH - 30} fill={col.color + '11'} rx="4" />

            {/* Blocks (up to maxBlocks) */}
            {Array.from({ length: Math.min(col.value, maxBlocks) }).map((_, bi) => {
              const gcol = bi % gridCols
              const grow = Math.floor(bi / gridCols)
              const bx = x0 + 6 + gcol * (blockSize + gapY)
              const by = headerH + 8 + grow * (blockSize + gapY)
              return (
                <rect key={bi} x={bx} y={by} width={blockSize} height={blockSize}
                  fill={col.color} rx="3" opacity="0.85" />
              )
            })}

            {/* Overflow indicator */}
            {col.value > maxBlocks && (
              <text x={x0 + colW / 2} y={headerH + (blockSize + gapY) * (Math.ceil(maxBlocks / gridCols) + 0.5) + 12}
                textAnchor="middle" fontSize={10} fill={col.color}>+{col.value - maxBlocks} more</text>
            )}

            {/* Value label */}
            {showLabel && (
              <text x={x0 + colW / 2} y={size * 0.95 - 8} textAnchor="middle" fontSize={14} fontWeight="700" fill={col.color}>
                {col.value}
              </text>
            )}
          </g>
        )
      })}

      {/* Separator lines */}
      {cols.map((_, ci) => ci > 0 && (
        <line key={ci} x1={ci * colW} y1={0} x2={ci * colW} y2={size * 0.95} stroke="#e2e8f0" strokeWidth="2" />
      ))}

      {/* Total number */}
      {showLabel && (
        <text x={size / 2} y={size * 0.95 - 4} textAnchor="middle" fontSize={0}>{''}</text>
      )}
    </svg>
  )
}

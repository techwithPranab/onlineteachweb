/**
 * RatioBarDiagram – strip/tape diagram for ratio and proportion.
 * params: {
 *   ratio: [number, ...],         // e.g. [2, 3] or [1, 2, 4]
 *   labels: string[],             // label for each part, e.g. ['Boys', 'Girls']
 *   total: number | null,         // if given, shows actual values in each part
 *   colors: string[],
 *   showRatio, showValues, title
 * }
 */
const DEFAULT_COLORS = ['#3b82f6','#ef4444','#10b981','#f59e0b','#8b5cf6','#ec4899']

export default function RatioBarDiagram({ params = {}, size = 300 }) {
  const {
    ratio = [2, 3],
    labels = [],
    total = null,
    colors = [],
    showRatio = true,
    showValues = true,
    title = ''
  } = params

  const ratioArr = Array.isArray(ratio) ? ratio.map(Number) : [2, 3]
  const ratioSum = ratioArr.reduce((s, v) => s + v, 0)
  const partW = (size - 32) / ratioSum

  const barH = 44
  const labelH = 20
  const valueH = showValues && total ? 18 : 0
  const height = (title ? 24 : 8) + barH + labelH + valueH + (showRatio ? 22 : 8) + 12

  let curX = 16

  return (
    <svg width={size} height={height} viewBox={`0 0 ${size} ${height}`}>
      {/* Title */}
      {title && (
        <text x={size / 2} y={16} textAnchor="middle" fontSize={12} fontWeight="700" fill="#334155">{title}</text>
      )}

      {ratioArr.map((parts, i) => {
        const w = parts * partW
        const fill = colors[i] || DEFAULT_COLORS[i % DEFAULT_COLORS.length]
        const label = labels[i] || `Part ${i + 1}`
        const actualValue = total ? (parts / ratioSum * total).toFixed(1).replace('.0', '') : null
        const blockX = curX
        curX += w

        const ty = title ? 24 : 8

        return (
          <g key={i}>
            {/* Bar segment */}
            <rect x={blockX} y={ty} width={w} height={barH}
              fill={fill} stroke="white" strokeWidth="2" rx={i === 0 ? '6 0 0 6' : i === ratioArr.length - 1 ? '0 6 6 0' : '0'} />

            {/* Ratio number inside bar */}
            {showRatio && w > 22 && (
              <text x={blockX + w / 2} y={ty + barH / 2 + 5}
                textAnchor="middle" fontSize={16} fontWeight="800" fill="white">
                {parts}
              </text>
            )}

            {/* Label below bar */}
            <text x={blockX + w / 2} y={ty + barH + 14}
              textAnchor="middle" fontSize={10} fontWeight="600" fill={fill}>
              {label}
            </text>

            {/* Actual value */}
            {showValues && actualValue && (
              <text x={blockX + w / 2} y={ty + barH + 14 + 16}
                textAnchor="middle" fontSize={11} fontWeight="700" fill="#334155">
                = {actualValue}
              </text>
            )}
          </g>
        )
      })}

      {/* Outer border */}
      <rect x={16} y={title ? 24 : 8} width={size - 32} height={barH}
        fill="none" stroke="#334155" strokeWidth="2" rx="6" />

      {/* Ratio expression */}
      {showRatio && (
        <text x={size / 2} y={height - 5} textAnchor="middle" fontSize={12} fontWeight="700" fill="#334155">
          Ratio = {ratioArr.join(' : ')}{total ? `  |  Total = ${total}` : ''}
        </text>
      )}
    </svg>
  )
}

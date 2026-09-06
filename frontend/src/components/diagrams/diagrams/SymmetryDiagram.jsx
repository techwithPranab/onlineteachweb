/**
 * SymmetryDiagram – shows a shape with its line(s) of symmetry.
 * params: {
 *   shape: "square" | "rectangle" | "triangle" | "circle" | "hexagon" |
 *          "butterfly" | "leaf" | "arrow",
 *   symmetryAxis: "vertical" | "horizontal" | "both" | "all",
 *   color, showAxis, showLabel
 * }
 */
export default function SymmetryDiagram({ params = {}, size = 220 }) {
  const {
    shape = 'butterfly',
    symmetryAxis = 'vertical',
    color = '#3b82f6',
    showAxis = true,
    showLabel = true
  } = params

  const cx = size / 2, cy = size / 2
  const fill = color + '33'
  const stroke = color

  const renderShape = () => {
    switch (shape) {
      case 'square': {
        const s = size * 0.5
        return (
          <rect x={cx - s / 2} y={cy - s / 2} width={s} height={s}
            fill={fill} stroke={stroke} strokeWidth="2.5" />
        )
      }
      case 'rectangle': {
        const w = size * 0.65, h = size * 0.38
        return (
          <rect x={cx - w / 2} y={cy - h / 2} width={w} height={h}
            fill={fill} stroke={stroke} strokeWidth="2.5" />
        )
      }
      case 'triangle': {
        const b = size * 0.55, ht = size * 0.48
        const pts = `${cx},${cy - ht / 2} ${cx - b / 2},${cy + ht / 2} ${cx + b / 2},${cy + ht / 2}`
        return <polygon points={pts} fill={fill} stroke={stroke} strokeWidth="2.5" />
      }
      case 'circle': {
        return <circle cx={cx} cy={cy} r={size * 0.32} fill={fill} stroke={stroke} strokeWidth="2.5" />
      }
      case 'hexagon': {
        const r = size * 0.32
        const pts = Array.from({ length: 6 }, (_, i) => {
          const a = (Math.PI / 3) * i - Math.PI / 6
          return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`
        }).join(' ')
        return <polygon points={pts} fill={fill} stroke={stroke} strokeWidth="2.5" />
      }
      case 'butterfly': {
        // Two mirrored wing shapes
        const w = size * 0.38, h = size * 0.3
        const leftWing = `M ${cx} ${cy} C ${cx - w} ${cy - h} ${cx - w * 1.2} ${cy + h} ${cx} ${cy}`
        const rightWing = `M ${cx} ${cy} C ${cx + w} ${cy - h} ${cx + w * 1.2} ${cy + h} ${cx} ${cy}`
        return (
          <>
            <path d={leftWing} fill={fill} stroke={stroke} strokeWidth="2" />
            <path d={rightWing} fill={fill} stroke={stroke} strokeWidth="2" />
            <circle cx={cx} cy={cy} r={5} fill={stroke} />
          </>
        )
      }
      case 'leaf': {
        const lw = size * 0.2, lh = size * 0.38
        const d = `M ${cx} ${cy - lh} C ${cx + lw} ${cy} ${cx + lw} ${cy} ${cx} ${cy + lh} C ${cx - lw} ${cy} ${cx - lw} ${cy} ${cx} ${cy - lh}`
        return <path d={d} fill={fill} stroke={stroke} strokeWidth="2.5" />
      }
      default: {
        return <circle cx={cx} cy={cy} r={size * 0.3} fill={fill} stroke={stroke} strokeWidth="2.5" />
      }
    }
  }

  const renderAxes = () => {
    const pad = 18
    const axes = []
    const axisStyle = { stroke: '#ef4444', strokeWidth: 2, strokeDasharray: '8,5' }

    if (symmetryAxis === 'vertical' || symmetryAxis === 'both' || symmetryAxis === 'all') {
      axes.push(<line key="v" x1={cx} y1={pad} x2={cx} y2={size - pad} {...axisStyle} />)
    }
    if (symmetryAxis === 'horizontal' || symmetryAxis === 'both' || symmetryAxis === 'all') {
      axes.push(<line key="h" x1={pad} y1={cy} x2={size - pad} y2={cy} {...axisStyle} />)
    }
    if (symmetryAxis === 'all') {
      const d = size * 0.38
      axes.push(<line key="d1" x1={cx - d} y1={cy - d} x2={cx + d} y2={cy + d} {...axisStyle} />)
      axes.push(<line key="d2" x1={cx + d} y1={cy - d} x2={cx - d} y2={cy + d} {...axisStyle} />)
    }
    return axes
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {renderShape()}
      {showAxis && renderAxes()}
      {showLabel && (
        <text x={cx} y={size - 5} textAnchor="middle" fontSize={11} fill="#ef4444" fontWeight="600">
          — Line of Symmetry
        </text>
      )}
    </svg>
  )
}

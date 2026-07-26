/**
 * ShapesDiagram – renders 2-D geometric shapes.
 * params: { shape: "circle"|"rectangle"|"square"|"triangle"|"pentagon"|"hexagon"|"parallelogram",
 *           dimensions: { width, height, radius, side },
 *           color, showLabels, label }
 */
export default function ShapesDiagram({ params = {}, size = 200 }) {
  const {
    shape = 'rectangle',
    dimensions = {},
    color = '#3b82f6',
    showLabels = true,
    label = ''
  } = params

  const fill = color + '33'
  const stroke = color
  const pad = 28
  const w = size - 2 * pad
  const h = size - 2 * pad

  const Wrapper = ({ children }) => (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {children}
      {label && (
        <text x={size / 2} y={size - 5} textAnchor="middle" fontSize={12} fill="#334155" fontWeight="600">
          {label}
        </text>
      )}
    </svg>
  )

  if (shape === 'circle') {
    const r = Math.min(w, h) / 2
    const cx = size / 2, cy = size / 2
    const rLabel = dimensions.radius || r.toFixed(0)
    return (
      <Wrapper>
        <circle cx={cx} cy={cy} r={r} fill={fill} stroke={stroke} strokeWidth="2.5" />
        {showLabels && <>
          <line x1={cx} y1={cy} x2={cx + r} y2={cy} stroke={stroke} strokeWidth="1.5" strokeDasharray="4,3" />
          <text x={cx + r / 2} y={cy - 6} textAnchor="middle" fontSize={12} fill={stroke} fontWeight="600">r={rLabel}</text>
        </>}
      </Wrapper>
    )
  }

  if (shape === 'square') {
    const s = Math.min(w, h)
    const x0 = (size - s) / 2, y0 = (size - s) / 2
    const sLabel = dimensions.side || s.toFixed(0)
    return (
      <Wrapper>
        <rect x={x0} y={y0} width={s} height={s} fill={fill} stroke={stroke} strokeWidth="2.5" />
        {showLabels && <>
          <text x={size / 2} y={y0 + s + 16} textAnchor="middle" fontSize={12} fill={stroke} fontWeight="600">{sLabel}</text>
        </>}
      </Wrapper>
    )
  }

  if (shape === 'triangle') {
    const bx = w * 0.9, hy = h * 0.85
    const A = [pad + (w - bx) / 2, size - pad - 10]
    const B = [pad + (w + bx) / 2, size - pad - 10]
    const C = [size / 2, size - pad - 10 - hy]
    const pts = `${A[0]},${A[1]} ${B[0]},${B[1]} ${C[0]},${C[1]}`
    const bLabel = dimensions.base || bx.toFixed(0)
    const hLabel = dimensions.height || hy.toFixed(0)
    return (
      <Wrapper>
        <polygon points={pts} fill={fill} stroke={stroke} strokeWidth="2.5" />
        {showLabels && <>
          <text x={(A[0]+B[0])/2} y={A[1]+16} textAnchor="middle" fontSize={12} fill={stroke} fontWeight="600">{bLabel}</text>
          <line x1={size/2} y1={C[1]} x2={size/2} y2={A[1]} stroke={stroke} strokeWidth="1.2" strokeDasharray="4,3" />
          <text x={size/2+14} y={(A[1]+C[1])/2} fontSize={12} fill={stroke} fontWeight="600">{hLabel}</text>
        </>}
      </Wrapper>
    )
  }

  if (shape === 'pentagon') {
    return <Polygon sides={5} color={color} size={size} label={label} />
  }

  if (shape === 'hexagon') {
    return <Polygon sides={6} color={color} size={size} label={label} />
  }

  if (shape === 'parallelogram') {
    const bw = w * 0.85, bh = h * 0.4, offset = w * 0.18
    const x0 = pad + offset, y0 = (size - bh) / 2
    const pts = `${x0},${y0} ${x0+bw},${y0} ${x0+bw-offset},${y0+bh} ${x0-offset},${y0+bh}`
    const wLabel = dimensions.width || bw.toFixed(0)
    const hLabel = dimensions.height || bh.toFixed(0)
    return (
      <Wrapper>
        <polygon points={pts} fill={fill} stroke={stroke} strokeWidth="2.5" />
        {showLabels && <>
          <text x={(x0+x0+bw)/2} y={y0-6} textAnchor="middle" fontSize={12} fill={stroke} fontWeight="600">{wLabel}</text>
          <text x={x0+bw+6} y={(y0+y0+bh)/2} fontSize={12} fill={stroke} fontWeight="600">{hLabel}</text>
        </>}
      </Wrapper>
    )
  }

  // Default: rectangle
  const rw = w * 0.9, rh = h * 0.55
  const x0 = (size - rw) / 2, y0 = (size - rh) / 2
  const wLabel = dimensions.width || rw.toFixed(0)
  const hLabel = dimensions.height || rh.toFixed(0)
  return (
    <Wrapper>
      <rect x={x0} y={y0} width={rw} height={rh} fill={fill} stroke={stroke} strokeWidth="2.5" rx="3" />
      {showLabels && <>
        <text x={size / 2} y={y0 + rh + 16} textAnchor="middle" fontSize={12} fill={stroke} fontWeight="600">{wLabel}</text>
        <text x={x0 - 10} y={y0 + rh / 2} textAnchor="middle" fontSize={12} fill={stroke} fontWeight="600" transform={`rotate(-90, ${x0 - 10}, ${y0 + rh / 2})`}>{hLabel}</text>
      </>}
    </Wrapper>
  )
}

function Polygon({ sides, color, size, label }) {
  const cx = size / 2, cy = size / 2
  const r = size / 2 - 24
  const points = Array.from({ length: sides }, (_, i) => {
    const a = (2 * Math.PI * i) / sides - Math.PI / 2
    return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`
  }).join(' ')
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <polygon points={points} fill={color + '33'} stroke={color} strokeWidth="2.5" />
      {label && (
        <text x={size / 2} y={size - 5} textAnchor="middle" fontSize={12} fill="#334155" fontWeight="600">{label}</text>
      )}
    </svg>
  )
}

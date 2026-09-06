/**
 * TrigDiagram – trigonometric / geometry figures.
 * params: { style: "rightTriangle"|"unitCircle"|"isosceles", ... }
 *
 * rightTriangle: { base, height, hypotenuse, angle, showLabels, labelAngle }
 * unitCircle:    { angle (degrees), showCoords }
 * isosceles:     { base, equalSide, showLabels }
 */
export default function TrigDiagram({ params = {}, size = 220 }) {
  const style = params.style || 'rightTriangle'

  if (style === 'unitCircle') return <UnitCircle params={params} size={size} />
  if (style === 'isosceles') return <IsoscelesDiagram params={params} size={size} />
  return <RightTriangle params={params} size={size} />
}

// ── Right Triangle ────────────────────────────────────────────────────────────
function RightTriangle({ params, size }) {
  const {
    base = 3, height = 4, hypotenuse,
    showLabels = true,
    labelBase = '', labelHeight = '', labelHyp = '',
    angleLabel = 'θ'
  } = params

  const hyp = hypotenuse || Math.sqrt(base * base + height * height)
  const pad = 30
  const scale = Math.min((size - 2 * pad) / base, (size - 2 * pad) / height) * 0.85

  const bx = base * scale, hy = height * scale

  // corners: right angle at bottom-left
  const A = [pad, size - pad]           // right-angle corner
  const B = [pad + bx, size - pad]      // bottom-right
  const C = [pad, size - pad - hy]      // top-left

  const points = `${A[0]},${A[1]} ${B[0]},${B[1]} ${C[0]},${C[1]}`

  // right-angle square
  const sq = 10
  const sqPts = `${A[0]},${A[1]-sq} ${A[0]+sq},${A[1]-sq} ${A[0]+sq},${A[1]}`

  // midpoints for labels
  const midBase = [(A[0]+B[0])/2, A[1]+15]
  const midHeight = [A[0]-18, (A[1]+C[1])/2]
  const midHyp = [(B[0]+C[0])/2+10, (B[1]+C[1])/2]

  const actualBase = labelBase || base.toString()
  const actualHeight = labelHeight || height.toString()
  const actualHyp = labelHyp || hyp.toFixed(1).replace('.0','')

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <polygon points={points} fill="#dbeafe" stroke="#2563eb" strokeWidth="2.5" />
      <polyline points={sqPts} fill="none" stroke="#334155" strokeWidth="1.5" />
      {showLabels && (
        <>
          <text x={midBase[0]} y={midBase[1]} textAnchor="middle" fontSize={13} fontWeight="600" fill="#1d4ed8">{actualBase}</text>
          <text x={midHeight[0]} y={midHeight[1]} textAnchor="middle" fontSize={13} fontWeight="600" fill="#1d4ed8">{actualHeight}</text>
          <text x={midHyp[0]} y={midHyp[1]} textAnchor="middle" fontSize={13} fontWeight="600" fill="#7c3aed">{actualHyp}</text>
          {/* Angle label at B */}
          <text x={B[0]-22} y={B[1]-6} fontSize={12} fill="#dc2626" fontStyle="italic">{angleLabel}</text>
        </>
      )}
    </svg>
  )
}

// ── Unit Circle ───────────────────────────────────────────────────────────────
function UnitCircle({ params, size }) {
  const { angle = 45, showCoords = true, showGrid = true } = params
  const rad = (angle * Math.PI) / 180
  const cx = size / 2, cy = size / 2
  const r = size / 2 - 30

  const px = cx + r * Math.cos(-rad)
  const py = cy + r * Math.sin(-rad) // SVG y is flipped

  // Arc for angle
  const arcEnd = [cx + (r * 0.5) * Math.cos(-rad), cy + (r * 0.5) * Math.sin(-rad)]
  const arcStart = [cx + r * 0.5, cy]
  const largeArc = angle > 180 ? 1 : 0

  const cosVal = Math.cos(rad).toFixed(2)
  const sinVal = Math.sin(rad).toFixed(2)

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Axes */}
      {showGrid && <>
        <line x1={10} y1={cy} x2={size-10} y2={cy} stroke="#94a3b8" strokeWidth="1.5" />
        <line x1={cx} y1={10} x2={cx} y2={size-10} stroke="#94a3b8" strokeWidth="1.5" />
        <text x={size-12} y={cy-4} fontSize={10} fill="#64748b">x</text>
        <text x={cx+4} y={16} fontSize={10} fill="#64748b">y</text>
      </>}

      {/* Circle */}
      <circle cx={cx} cy={cy} r={r} fill="#eff6ff" stroke="#3b82f6" strokeWidth="2" />

      {/* Radius to point */}
      <line x1={cx} y1={cy} x2={px} y2={py} stroke="#ef4444" strokeWidth="2.5" />

      {/* Angle arc */}
      <path
        d={`M ${arcStart[0]} ${arcStart[1]} A ${r*0.5} ${r*0.5} 0 ${largeArc} 0 ${arcEnd[0]} ${arcEnd[1]}`}
        fill="none" stroke="#f59e0b" strokeWidth="2"
      />

      {/* Dotted projections */}
      <line x1={px} y1={py} x2={px} y2={cy} stroke="#64748b" strokeDasharray="4,3" strokeWidth="1.5" />
      <line x1={px} y1={cy} x2={cx} y2={cy} stroke="#64748b" strokeDasharray="4,3" strokeWidth="1.5" />

      {/* Point */}
      <circle cx={px} cy={py} r={5} fill="#ef4444" />

      {/* Angle label */}
      <text x={(arcStart[0]+arcEnd[0])/2+6} y={(arcStart[1]+arcEnd[1])/2-4} fontSize={11} fill="#f59e0b" fontWeight="600">
        {angle}°
      </text>

      {/* Coords */}
      {showCoords && (
        <text x={px+8} y={py-8} fontSize={10} fill="#334155">
          ({cosVal}, {sinVal})
        </text>
      )}
    </svg>
  )
}

// ── Isosceles Triangle ────────────────────────────────────────────────────────
function IsoscelesDiagram({ params, size }) {
  const { base = 6, equalSide = 5, showLabels = true, labelBase = '', labelSide = '' } = params
  const pad = 30
  const bx = (size - 2 * pad)
  const scaleBase = bx / base
  const hy = Math.sqrt(equalSide * equalSide - (base / 2) * (base / 2)) * scaleBase

  const A = [pad, size - pad]
  const B = [size - pad, size - pad]
  const C = [size / 2, size - pad - hy]

  const points = `${A[0]},${A[1]} ${B[0]},${B[1]} ${C[0]},${C[1]}`
  const lBase = labelBase || base.toString()
  const lSide = labelSide || equalSide.toString()

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <polygon points={points} fill="#fce7f3" stroke="#db2777" strokeWidth="2.5" />
      {showLabels && <>
        <text x={(A[0]+B[0])/2} y={A[1]+15} textAnchor="middle" fontSize={13} fontWeight="600" fill="#db2777">{lBase}</text>
        <text x={(A[0]+C[0])/2-12} y={(A[1]+C[1])/2} textAnchor="middle" fontSize={12} fontWeight="600" fill="#7c3aed">{lSide}</text>
        <text x={(B[0]+C[0])/2+12} y={(B[1]+C[1])/2} textAnchor="middle" fontSize={12} fontWeight="600" fill="#7c3aed">{lSide}</text>
      </>}
    </svg>
  )
}

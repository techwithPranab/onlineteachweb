/**
 * Shape3DDiagram – isometric-style 3D shapes drawn with SVG.
 * params: {
 *   shape: "cube" | "cuboid" | "sphere" | "cylinder" | "cone",
 *   dimensions: { length, width, height, radius },
 *   color, showLabels, label
 * }
 */
export default function Shape3DDiagram({ params = {}, size = 220 }) {
  const {
    shape = 'cube',
    dimensions = {},
    color = '#3b82f6',
    showLabels = true,
    label = ''
  } = params

  const fill = color + '44'
  const fillTop = color + '88'
  const fillRight = color + '22'
  const stroke = color

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

  if (shape === 'sphere') {
    const cx = size / 2, cy = size / 2, r = size / 2 - 30
    return (
      <Wrapper>
        <defs>
          <radialGradient id="sphereGrad" cx="35%" cy="35%">
            <stop offset="0%" stopColor="white" stopOpacity="0.6" />
            <stop offset="100%" stopColor={color} stopOpacity="0.9" />
          </radialGradient>
        </defs>
        <circle cx={cx} cy={cy} r={r} fill="url(#sphereGrad)" stroke={stroke} strokeWidth="2" />
        {/* Equator ellipse */}
        <ellipse cx={cx} cy={cy} rx={r} ry={r * 0.25} fill="none" stroke={stroke} strokeWidth="1.5" strokeDasharray="6,4" opacity="0.6" />
        {showLabels && (
          <>
            <line x1={cx} y1={cy} x2={cx + r} y2={cy} stroke="#ef4444" strokeWidth="1.5" />
            <text x={cx + r / 2} y={cy - 6} textAnchor="middle" fontSize={11} fill="#ef4444" fontWeight="600">
              {dimensions.radius || 'r'}
            </text>
          </>
        )}
      </Wrapper>
    )
  }

  if (shape === 'cylinder') {
    const cx = size / 2, cy = size * 0.25, rx = size * 0.3, ry = rx * 0.35
    const h = size * 0.48
    return (
      <Wrapper>
        {/* Body */}
        <rect x={cx - rx} y={cy} width={rx * 2} height={h} fill={fill} stroke={stroke} strokeWidth="2" />
        {/* Bottom ellipse */}
        <ellipse cx={cx} cy={cy + h} rx={rx} ry={ry} fill={fillTop} stroke={stroke} strokeWidth="2" />
        {/* Top ellipse */}
        <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={fillTop} stroke={stroke} strokeWidth="2" />
        {showLabels && (
          <>
            <line x1={cx} y1={cy} x2={cx + rx} y2={cy} stroke="#ef4444" strokeWidth="1.5" />
            <text x={cx + rx / 2} y={cy - 6} fontSize={11} textAnchor="middle" fill="#ef4444" fontWeight="600">
              r = {dimensions.radius || 'r'}
            </text>
            <line x1={cx + rx + 6} y1={cy} x2={cx + rx + 6} y2={cy + h} stroke="#2563eb" strokeWidth="1.5" strokeDasharray="4,2" />
            <text x={cx + rx + 16} y={cy + h / 2} fontSize={11} fill="#2563eb" fontWeight="600">
              h = {dimensions.height || 'h'}
            </text>
          </>
        )}
      </Wrapper>
    )
  }

  if (shape === 'cone') {
    const cx = size / 2, cy = size * 0.12, rx = size * 0.32, ry = rx * 0.3
    const h = size * 0.58
    return (
      <Wrapper>
        {/* Cone body */}
        <polygon
          points={`${cx},${cy} ${cx - rx},${cy + h} ${cx + rx},${cy + h}`}
          fill={fill} stroke={stroke} strokeWidth="2"
        />
        {/* Base ellipse */}
        <ellipse cx={cx} cy={cy + h} rx={rx} ry={ry} fill={fillTop} stroke={stroke} strokeWidth="2" />
        {/* Apex dot */}
        <circle cx={cx} cy={cy} r={4} fill={stroke} />
        {showLabels && (
          <>
            <line x1={cx} y1={cy + h} x2={cx + rx} y2={cy + h} stroke="#ef4444" strokeWidth="1.5" />
            <text x={cx + rx / 2} y={cy + h + 14} textAnchor="middle" fontSize={11} fill="#ef4444" fontWeight="600">
              r
            </text>
            <line x1={cx + rx + 6} y1={cy} x2={cx + rx + 6} y2={cy + h} stroke="#2563eb" strokeWidth="1.5" strokeDasharray="4,2" />
            <text x={cx + rx + 18} y={cy + h / 2} fontSize={11} fill="#2563eb" fontWeight="600">h</text>
          </>
        )}
      </Wrapper>
    )
  }

  // Cube and Cuboid — isometric-like using parallelograms
  const isCube = shape === 'cube'
  const lx = Number(dimensions.length || dimensions.side || (isCube ? 6 : 8))
  const wy = Number(dimensions.width || (isCube ? lx : 5))
  const ht = Number(dimensions.height || (isCube ? lx : 5))

  const unitX = Math.min((size - 60) / (lx + wy * 0.6), 20)
  const unitY = unitX * 0.5

  const ox = size / 2 - (lx * unitX) / 2 + (wy * unitX * 0.3)
  const oy = size / 2 + (ht * unitY) / 2

  // 8 vertices of the box (isometric-ish):
  // Front face vertices
  const A = [ox, oy]                                     // bottom-left front
  const B = [ox + lx * unitX, oy]                        // bottom-right front
  const C = [ox + lx * unitX, oy - ht * unitY * 2]      // top-right front
  const D = [ox, oy - ht * unitY * 2]                    // top-left front

  // Back offsets (isometric depth)
  const dx = wy * unitX * 0.5, dy = -(wy * unitY * 0.5)
  const E = [D[0] + dx, D[1] + dy]   // top-left back
  const F = [C[0] + dx, C[1] + dy]   // top-right back
  const G = [B[0] + dx, B[1] + dy]   // bottom-right back

  const pts = (arr) => arr.map(p => p.join(',')).join(' ')

  return (
    <Wrapper>
      {/* Right face */}
      <polygon points={pts([B, G, F, C])} fill={fillRight} stroke={stroke} strokeWidth="2" />
      {/* Top face */}
      <polygon points={pts([D, E, F, C])} fill={fillTop} stroke={stroke} strokeWidth="2" />
      {/* Front face */}
      <polygon points={pts([A, B, C, D])} fill={fill} stroke={stroke} strokeWidth="2" />

      {showLabels && (
        <>
          <text x={(A[0] + B[0]) / 2} y={A[1] + 15} textAnchor="middle" fontSize={11} fill={stroke} fontWeight="600">
            {dimensions.length || dimensions.side || lx}
          </text>
          <text x={(B[0] + G[0]) / 2 + 10} y={(B[1] + G[1]) / 2} fontSize={11} fill={stroke} fontWeight="600">
            {dimensions.width || wy}
          </text>
          <text x={A[0] - 22} y={(A[1] + D[1]) / 2} fontSize={11} fill={stroke} fontWeight="600">
            {dimensions.height || ht}
          </text>
        </>
      )}
    </Wrapper>
  )
}

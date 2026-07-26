/**
 * CircleLabeledDiagram – circle with mathematical parts labelled.
 * params: {
 *   showRadius, showDiameter, showChord, showArc, showSector,
 *   radius: display label, diameter: display label,
 *   angleForSector: degrees (default 90)
 * }
 */
export default function CircleLabeledDiagram({ params = {}, size = 220 }) {
  const {
    showRadius = true,
    showDiameter = true,
    showChord = true,
    showArc = true,
    showSector = true,
    radiusLabel = 'r',
    diameterLabel = 'd = 2r',
    angleForSector = 90
  } = params

  const cx = size / 2, cy = size / 2
  const r = size / 2 - 30

  // Sector angle
  const secAngle = (angleForSector * Math.PI) / 180
  const secX = cx + r * Math.cos(-secAngle / 2)
  const secY = cy + r * Math.sin(-secAngle / 2)
  const secX2 = cx + r * Math.cos(secAngle / 2)
  const secY2 = cy + r * Math.sin(secAngle / 2)
  const largeArc = angleForSector > 180 ? 1 : 0

  // Chord: horizontal chord near bottom
  const chordAngle = Math.PI / 4
  const chX1 = cx - r * Math.cos(chordAngle) * 0.9
  const chY1 = cy + r * Math.sin(chordAngle) * 0.5
  const chX2 = cx + r * Math.cos(chordAngle) * 0.9
  const chY2 = cy + r * Math.sin(chordAngle) * 0.5

  // Arc label midpoint (top arc)
  const arcMidX = cx + (r + 14) * Math.cos(-Math.PI / 2)
  const arcMidY = cy + (r + 14) * Math.sin(-Math.PI / 2)

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Sector fill */}
      {showSector && (
        <path
          d={`M ${cx} ${cy} L ${secX} ${secY} A ${r} ${r} 0 ${largeArc} 1 ${secX2} ${secY2} Z`}
          fill="#dbeafe" stroke="none"
        />
      )}

      {/* Main circle */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#334155" strokeWidth="2.5" />

      {/* Diameter (horizontal) */}
      {showDiameter && (
        <>
          <line x1={cx - r} y1={cy} x2={cx + r} y2={cy}
            stroke="#7c3aed" strokeWidth="2" strokeDasharray="6,3" />
          <text x={cx} y={cy - 6} textAnchor="middle" fontSize={11} fontWeight="600" fill="#7c3aed">
            {diameterLabel}
          </text>
        </>
      )}

      {/* Radius (to top) */}
      {showRadius && (
        <>
          <line x1={cx} y1={cy} x2={cx} y2={cy - r}
            stroke="#ef4444" strokeWidth="2" />
          <text x={cx + 8} y={cy - r / 2} fontSize={11} fontWeight="600" fill="#ef4444">
            {radiusLabel}
          </text>
        </>
      )}

      {/* Chord */}
      {showChord && (
        <>
          <line x1={chX1} y1={chY1} x2={chX2} y2={chY2}
            stroke="#059669" strokeWidth="2" />
          <text x={(chX1 + chX2) / 2} y={chY1 + 14} textAnchor="middle" fontSize={10} fill="#059669">
            chord
          </text>
        </>
      )}

      {/* Sector lines */}
      {showSector && (
        <>
          <line x1={cx} y1={cy} x2={secX} y2={secY} stroke="#3b82f6" strokeWidth="1.8" />
          <line x1={cx} y1={cy} x2={secX2} y2={secY2} stroke="#3b82f6" strokeWidth="1.8" />
          <text x={secX - 28} y={secY + 12} fontSize={10} fill="#3b82f6">sector</text>
          {/* Angle arc */}
          <path
            d={`M ${cx + 18 * Math.cos(-secAngle / 2)} ${cy + 18 * Math.sin(-secAngle / 2)} 
                A 18 18 0 ${largeArc} 1 ${cx + 18 * Math.cos(secAngle / 2)} ${cy + 18 * Math.sin(secAngle / 2)}`}
            fill="none" stroke="#3b82f6" strokeWidth="1.5"
          />
        </>
      )}

      {/* Arc label */}
      {showArc && (
        <text x={cx + r + 8} y={cy + 14} fontSize={10} fill="#f59e0b" fontWeight="600">arc</text>
      )}

      {/* Center dot */}
      <circle cx={cx} cy={cy} r={3.5} fill="#334155" />
      <text x={cx + 6} y={cy + 14} fontSize={10} fill="#334155">O</text>
    </svg>
  )
}

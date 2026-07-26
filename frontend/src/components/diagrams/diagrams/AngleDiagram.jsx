/**
 * AngleDiagram – shows an angle with optional protractor look.
 * params: { degrees, style: "simple"|"protractor", color, showLabel, label }
 */
export default function AngleDiagram({ params = {}, size = 200 }) {
  const {
    degrees = 45,
    style = 'simple',
    color = '#3b82f6',
    showLabel = true,
    label = ''
  } = params

  const rad = (Math.min(Math.max(degrees, 1), 359) * Math.PI) / 180
  const cx = style === 'protractor' ? size / 2 : size * 0.25
  const cy = size - 30
  const r = size * 0.55

  const ex = cx + r * Math.cos(-rad) // SVG y is flipped
  const ey = cy + r * Math.sin(-rad)

  const largeArc = degrees > 180 ? 1 : 0

  // Arc path for angle
  const arcR = r * 0.35
  const ax = cx + arcR * Math.cos(-rad / 2)
  const ay = cy + arcR * Math.sin(-rad / 2)

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {style === 'protractor' && (
        <>
          {/* Semicircle protractor */}
          <path
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            fill="#fef9c3" stroke="#d97706" strokeWidth="2"
          />
          {/* Degree markings */}
          {[0,30,45,60,90,120,135,150,180].map(d => {
            const a = (d * Math.PI) / 180
            const ir = r - 14
            const or = r + 4
            return (
              <g key={d}>
                <line
                  x1={cx + ir * Math.cos(Math.PI - a)} y1={cy - ir * Math.sin(Math.PI - a) + (ir * Math.sin(Math.PI - a) - ir * Math.sin(Math.PI - a))}
                  x2={cx + or * Math.cos(Math.PI - a)} y2={cy - or * Math.sin(Math.PI - a) + (or * Math.sin(Math.PI - a) - or * Math.sin(Math.PI - a))}
                  stroke="#92400e" strokeWidth="1"
                />
              </g>
            )
          })}
        </>
      )}

      {/* Base ray (horizontal) */}
      <line x1={cx} y1={cy} x2={cx + r} y2={cy} stroke="#334155" strokeWidth="2.5" />

      {/* Second ray */}
      <line x1={cx} y1={cy} x2={ex} y2={ey} stroke={color} strokeWidth="2.5" />

      {/* Angle arc */}
      <path
        d={`M ${cx + arcR} ${cy} A ${arcR} ${arcR} 0 ${largeArc} 0 ${cx + arcR * Math.cos(-rad)} ${cy + arcR * Math.sin(-rad)}`}
        fill={color + '33'} stroke={color} strokeWidth="1.5" fillRule="nonzero"
      />

      {/* Vertex dot */}
      <circle cx={cx} cy={cy} r={4} fill="#334155" />

      {/* Label */}
      {showLabel && (
        <text x={ax + 4} y={ay - 4} textAnchor="middle" fontSize={13} fontWeight="700" fill={color}>
          {label || `${degrees}°`}
        </text>
      )}

      {/* Arrow heads */}
      <polygon
        points={`${cx+r},${cy} ${cx+r-10},${cy-5} ${cx+r-10},${cy+5}`}
        fill="#334155"
      />
      <polygon
        points={`${ex},${ey} ${ex - 10*Math.cos(-rad) + 5*Math.sin(-rad)},${ey - 10*Math.sin(-rad) - 5*Math.cos(-rad)} ${ex - 10*Math.cos(-rad) - 5*Math.sin(-rad)},${ey - 10*Math.sin(-rad) + 5*Math.cos(-rad)}`}
        fill={color}
      />
    </svg>
  )
}

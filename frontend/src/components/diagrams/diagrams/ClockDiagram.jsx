/**
 * ClockDiagram – renders an analogue clock face for a given time.
 * params: { hours, minutes, showLabels, size }
 */
export default function ClockDiagram({ params = {}, size = 200 }) {
  const { hours = 12, minutes = 0, showLabels = true } = params
  const cx = size / 2
  const cy = size / 2
  const r = size / 2 - 10 // outer circle radius

  // Angles (in radians, 12 o'clock = -π/2)
  const minuteAngle = (Math.PI * 2 * (minutes / 60)) - Math.PI / 2
  const hourAngle = (Math.PI * 2 * ((hours % 12 + minutes / 60) / 12)) - Math.PI / 2

  const minuteLen = r * 0.75
  const hourLen = r * 0.55
  const secondTickLen = r * 0.85

  const hourNumbers = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-label={`Clock showing ${hours}:${String(minutes).padStart(2, '0')}`}>
      {/* Clock face */}
      <circle cx={cx} cy={cy} r={r} fill="white" stroke="#334155" strokeWidth="3" />

      {/* Tick marks */}
      {Array.from({ length: 60 }).map((_, i) => {
        const angle = (Math.PI * 2 * i) / 60 - Math.PI / 2
        const major = i % 5 === 0
        const innerR = major ? r - 12 : r - 6
        return (
          <line
            key={i}
            x1={cx + Math.cos(angle) * innerR}
            y1={cy + Math.sin(angle) * innerR}
            x2={cx + Math.cos(angle) * r}
            y2={cy + Math.sin(angle) * r}
            stroke="#334155"
            strokeWidth={major ? 2.5 : 1}
          />
        )
      })}

      {/* Hour numbers */}
      {showLabels && hourNumbers.map((num, i) => {
        const angle = (Math.PI * 2 * i) / 12 - Math.PI / 2
        const labelR = r - 20
        return (
          <text
            key={num}
            x={cx + Math.cos(angle) * labelR}
            y={cy + Math.sin(angle) * labelR}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={size * 0.09}
            fontWeight="600"
            fill="#1e293b"
          >
            {num}
          </text>
        )
      })}

      {/* Hour hand */}
      <line
        x1={cx} y1={cy}
        x2={cx + Math.cos(hourAngle) * hourLen}
        y2={cy + Math.sin(hourAngle) * hourLen}
        stroke="#1e293b" strokeWidth="5" strokeLinecap="round"
      />

      {/* Minute hand */}
      <line
        x1={cx} y1={cy}
        x2={cx + Math.cos(minuteAngle) * minuteLen}
        y2={cy + Math.sin(minuteAngle) * minuteLen}
        stroke="#3b82f6" strokeWidth="3.5" strokeLinecap="round"
      />

      {/* Center dot */}
      <circle cx={cx} cy={cy} r={4} fill="#ef4444" />

      {/* Time label */}
      {showLabels && (
        <text
          x={cx} y={cy + r - 4}
          textAnchor="middle"
          fontSize={size * 0.08}
          fill="#64748b"
          fontFamily="monospace"
        >
          {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}
        </text>
      )}
    </svg>
  )
}

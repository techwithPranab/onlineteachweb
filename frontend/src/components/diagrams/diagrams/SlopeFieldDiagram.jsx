export default function SlopeFieldDiagram({ params = {}, size = 280 }) {
  const {
    title = 'Slope field',
    xRange = [-3, 3],
    yRange = [-3, 3],
    density = 7
  } = params

  const w = size
  const h = size
  const pad = 32
  const chart = w - 2 * pad
  const toX = x => pad + ((x - xRange[0]) / (xRange[1] - xRange[0] || 1)) * chart
  const toY = y => pad + chart - ((y - yRange[0]) / (yRange[1] - yRange[0] || 1)) * chart
  const points = []
  for (let i = 0; i < density; i++) {
    for (let j = 0; j < density; j++) {
      const x = xRange[0] + (i / (density - 1)) * (xRange[1] - xRange[0])
      const y = yRange[0] + (j / (density - 1)) * (yRange[1] - yRange[0])
      points.push({ x, y, slope: 0.35 * (x - y) })
    }
  }

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={title}>
      <text x={w / 2} y="16" textAnchor="middle" fontSize="12" fontWeight="700" fill="#334155">{title}</text>
      <line x1={pad} y1={toY(0)} x2={pad + chart} y2={toY(0)} stroke="#334155" strokeWidth="1.5" />
      <line x1={toX(0)} y1={pad} x2={toX(0)} y2={pad + chart} stroke="#334155" strokeWidth="1.5" />
      {points.map((p, i) => {
        const angle = Math.atan(p.slope)
        const len = 12
        const dx = Math.cos(angle) * len / 2
        const dy = Math.sin(angle) * len / 2
        const sx = toX(p.x)
        const sy = toY(p.y)
        return <line key={i} x1={sx - dx} y1={sy + dy} x2={sx + dx} y2={sy - dy} stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />
      })}
      <text x={w / 2} y={h - 8} textAnchor="middle" fontSize="10" fill="#64748b">short segments show local direction</text>
    </svg>
  )
}

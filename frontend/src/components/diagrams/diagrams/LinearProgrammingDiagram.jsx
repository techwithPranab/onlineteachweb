export default function LinearProgrammingDiagram({ params = {}, size = 300 }) {
  const {
    title = 'Linear programming feasible region',
    vertices = [{ x: 0, y: 0 }, { x: 0, y: 4 }, { x: 3, y: 3 }, { x: 5, y: 0 }],
    objectiveLine = [{ x: 1, y: 5 }, { x: 5, y: 1 }],
    xRange = [0, 6],
    yRange = [0, 6]
  } = params

  const w = size
  const h = size
  const pad = 34
  const chart = w - 2 * pad
  const toX = x => pad + ((x - xRange[0]) / (xRange[1] - xRange[0] || 1)) * chart
  const toY = y => pad + chart - ((y - yRange[0]) / (yRange[1] - yRange[0] || 1)) * chart
  const polygon = vertices.map(v => `${toX(v.x)},${toY(v.y)}`).join(' ')

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={title}>
      <text x={w / 2} y="16" textAnchor="middle" fontSize="12" fontWeight="700" fill="#334155">{title}</text>
      {Array.from({ length: 7 }, (_, i) => <line key={`x${i}`} x1={pad + i * chart / 6} y1={pad} x2={pad + i * chart / 6} y2={pad + chart} stroke="#e2e8f0" />)}
      {Array.from({ length: 7 }, (_, i) => <line key={`y${i}`} x1={pad} y1={pad + i * chart / 6} x2={pad + chart} y2={pad + i * chart / 6} stroke="#e2e8f0" />)}
      <line x1={pad} y1={pad + chart} x2={pad + chart} y2={pad + chart} stroke="#334155" strokeWidth="1.8" />
      <line x1={pad} y1={pad} x2={pad} y2={pad + chart} stroke="#334155" strokeWidth="1.8" />
      <polygon points={polygon} fill="#bbf7d0" opacity="0.85" stroke="#16a34a" strokeWidth="2.2" />
      <line x1={toX(objectiveLine[0].x)} y1={toY(objectiveLine[0].y)} x2={toX(objectiveLine[1].x)} y2={toY(objectiveLine[1].y)} stroke="#f97316" strokeWidth="2.5" strokeDasharray="5 4" />
      {vertices.map((v, i) => (
        <g key={i}>
          <circle cx={toX(v.x)} cy={toY(v.y)} r="4" fill="#15803d" />
          <text x={toX(v.x) + 5} y={toY(v.y) - 6} fontSize="9" fill="#166534">({v.x},{v.y})</text>
        </g>
      ))}
      <text x={w / 2} y={h - 8} textAnchor="middle" fontSize="10" fill="#64748b">test objective values at the corner points</text>
    </svg>
  )
}

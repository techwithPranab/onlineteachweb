export default function Vector3DDiagram({ params = {}, size = 280 }) {
  const {
    vectors = [{ x: 3, y: 2, z: 2, label: 'a' }],
    title = '3D vectors'
  } = params

  const w = size
  const h = size * 0.82
  const origin = { x: 76, y: h - 52 }
  const project = ({ x = 0, y = 0, z = 0 }) => ({
    x: origin.x + x * 34 + z * 20,
    y: origin.y - y * 34 - z * 16
  })
  const axes = [
    { end: project({ x: 4.4, y: 0, z: 0 }), label: 'x' },
    { end: project({ x: 0, y: 3.8, z: 0 }), label: 'y' },
    { end: project({ x: 0, y: 0, z: 3.8 }), label: 'z' }
  ]

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={title}>
      <defs>
        <marker id="vectorArrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth">
          <path d="M 0 0 L 8 4 L 0 8 z" fill="#2563eb" />
        </marker>
        <marker id="axisArrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto" markerUnits="strokeWidth">
          <path d="M 0 0 L 7 3.5 L 0 7 z" fill="#475569" />
        </marker>
      </defs>
      <text x={w / 2} y="16" textAnchor="middle" fontSize="12" fontWeight="700" fill="#334155">{title}</text>
      {axes.map(axis => (
        <g key={axis.label}>
          <line x1={origin.x} y1={origin.y} x2={axis.end.x} y2={axis.end.y} stroke="#475569" strokeWidth="1.8" markerEnd="url(#axisArrow)" />
          <text x={axis.end.x + 6} y={axis.end.y} fontSize="11" fontWeight="700" fill="#475569">{axis.label}</text>
        </g>
      ))}
      {vectors.map((v, i) => {
        const end = project(v)
        const color = v.color || (i === 0 ? '#2563eb' : '#f97316')
        return (
          <g key={i}>
            <line x1={origin.x} y1={origin.y} x2={end.x} y2={end.y} stroke={color} strokeWidth="3" markerEnd="url(#vectorArrow)" />
            <circle cx={end.x} cy={end.y} r="4" fill={color} />
            <text x={end.x + 7} y={end.y - 7} fontSize="11" fontWeight="700" fill={color}>{v.label || `v${i + 1}`}</text>
          </g>
        )
      })}
      <text x={origin.x - 8} y={origin.y + 14} fontSize="10" fill="#64748b">O</text>
    </svg>
  )
}

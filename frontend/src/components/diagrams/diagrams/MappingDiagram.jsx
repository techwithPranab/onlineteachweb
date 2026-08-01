export default function MappingDiagram({ params = {}, size = 300 }) {
  const {
    domain = ['1', '2', '3'],
    codomain = ['2', '4', '6', '8'],
    arrows = [{ from: '1', to: '2' }, { from: '2', to: '4' }, { from: '3', to: '6' }],
    title = 'Function mapping',
    leftLabel = 'Domain',
    rightLabel = 'Codomain'
  } = params

  const w = size
  const h = Math.max(210, size * 0.72)
  const leftX = 78
  const rightX = w - 78
  const top = 58
  const gap = 34
  const yOf = (items, item) => top + Math.max(0, items.indexOf(item)) * gap

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={title}>
      <defs>
        <marker id="mappingArrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <path d="M 0 0 L 8 4 L 0 8 z" fill="#64748b" />
        </marker>
      </defs>
      <text x={w / 2} y="16" textAnchor="middle" fontSize="12" fontWeight="700" fill="#334155">{title}</text>
      <ellipse cx={leftX} cy={h / 2 + 8} rx="54" ry={Math.max(58, domain.length * 20)} fill="#eff6ff" stroke="#2563eb" strokeWidth="2" />
      <ellipse cx={rightX} cy={h / 2 + 8} rx="54" ry={Math.max(58, codomain.length * 20)} fill="#f0fdf4" stroke="#16a34a" strokeWidth="2" />
      <text x={leftX} y="38" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1d4ed8">{leftLabel}</text>
      <text x={rightX} y="38" textAnchor="middle" fontSize="11" fontWeight="700" fill="#166534">{rightLabel}</text>
      {domain.map(item => (
        <g key={`d-${item}`}>
          <circle cx={leftX} cy={yOf(domain, item)} r="12" fill="white" stroke="#2563eb" />
          <text x={leftX} y={yOf(domain, item) + 4} textAnchor="middle" fontSize="10" fontWeight="700" fill="#1d4ed8">{item}</text>
        </g>
      ))}
      {codomain.map(item => (
        <g key={`c-${item}`}>
          <circle cx={rightX} cy={yOf(codomain, item)} r="12" fill="white" stroke="#16a34a" />
          <text x={rightX} y={yOf(codomain, item) + 4} textAnchor="middle" fontSize="10" fontWeight="700" fill="#166534">{item}</text>
        </g>
      ))}
      {arrows.map((arrow, i) => (
        <line
          key={i}
          x1={leftX + 14}
          y1={yOf(domain, arrow.from)}
          x2={rightX - 14}
          y2={yOf(codomain, arrow.to)}
          stroke="#64748b"
          strokeWidth="1.8"
          markerEnd="url(#mappingArrow)"
        />
      ))}
    </svg>
  )
}

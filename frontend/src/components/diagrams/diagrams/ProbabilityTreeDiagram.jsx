export default function ProbabilityTreeDiagram({ params = {}, size = 300 }) {
  const {
    title = 'Probability tree',
    root = 'Start',
    branches = [
      { label: 'A', probability: '1/2', children: [{ label: 'C', probability: '1/3' }, { label: 'D', probability: '2/3' }] },
      { label: 'B', probability: '1/2', children: [{ label: 'C', probability: '1/4' }, { label: 'D', probability: '3/4' }] }
    ]
  } = params

  const w = size
  const h = size * 0.84
  const rootNode = { x: 42, y: h / 2 }
  const level1X = w * 0.43
  const level2X = w - 42
  const branchGap = h / Math.max(branches.length + 1, 3)

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={title}>
      <text x={w / 2} y="16" textAnchor="middle" fontSize="12" fontWeight="700" fill="#334155">{title}</text>
      <circle cx={rootNode.x} cy={rootNode.y} r="16" fill="#e0f2fe" stroke="#0284c7" strokeWidth="2" />
      <text x={rootNode.x} y={rootNode.y + 4} textAnchor="middle" fontSize="9" fontWeight="700" fill="#075985">{root}</text>
      {branches.map((branch, i) => {
        const y1 = branchGap * (i + 1)
        const children = branch.children || []
        const childGap = branchGap / Math.max(children.length, 1)
        return (
          <g key={i}>
            <line x1={rootNode.x + 16} y1={rootNode.y} x2={level1X - 16} y2={y1} stroke="#94a3b8" strokeWidth="2" />
            <text x={(rootNode.x + level1X) / 2} y={(rootNode.y + y1) / 2 - 5} textAnchor="middle" fontSize="10" fill="#475569">{branch.probability}</text>
            <circle cx={level1X} cy={y1} r="16" fill="#dcfce7" stroke="#16a34a" strokeWidth="2" />
            <text x={level1X} y={y1 + 4} textAnchor="middle" fontSize="10" fontWeight="700" fill="#166534">{branch.label}</text>
            {children.map((child, j) => {
              const offset = (j - (children.length - 1) / 2) * childGap
              const y2 = y1 + offset
              return (
                <g key={j}>
                  <line x1={level1X + 16} y1={y1} x2={level2X - 16} y2={y2} stroke="#94a3b8" strokeWidth="2" />
                  <text x={(level1X + level2X) / 2} y={(y1 + y2) / 2 - 5} textAnchor="middle" fontSize="10" fill="#475569">{child.probability}</text>
                  <circle cx={level2X} cy={y2} r="15" fill="#fef3c7" stroke="#f59e0b" strokeWidth="2" />
                  <text x={level2X} y={y2 + 4} textAnchor="middle" fontSize="10" fontWeight="700" fill="#92400e">{child.label}</text>
                </g>
              )
            })}
          </g>
        )
      })}
    </svg>
  )
}

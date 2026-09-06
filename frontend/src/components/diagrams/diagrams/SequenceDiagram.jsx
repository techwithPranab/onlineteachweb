export default function SequenceDiagram({ params = {}, size = 300 }) {
  const {
    terms = [2, 5, 8, 11, 14],
    kind = 'AP',
    title = 'Sequence'
  } = params

  const w = size
  const h = size * 0.55
  const y = h / 2
  const gap = (w - 60) / Math.max(terms.length - 1, 1)

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={title}>
      <text x={w / 2} y="16" textAnchor="middle" fontSize="12" fontWeight="700" fill="#334155">{title}</text>
      {terms.map((term, i) => {
        const x = 30 + i * gap
        return (
          <g key={i}>
            {i > 0 && <line x1={30 + (i - 1) * gap + 18} y1={y} x2={x - 18} y2={y} stroke="#94a3b8" strokeWidth="2" markerEnd="url(#seqArrow)" />}
            <circle cx={x} cy={y} r="18" fill="#dbeafe" stroke="#2563eb" strokeWidth="2" />
            <text x={x} y={y + 5} textAnchor="middle" fontSize="12" fontWeight="800" fill="#1d4ed8">{term}</text>
            <text x={x} y={y + 34} textAnchor="middle" fontSize="9" fill="#64748b">a{i + 1}</text>
          </g>
        )
      })}
      <defs>
        <marker id="seqArrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
          <path d="M 0 0 L 7 3.5 L 0 7 z" fill="#94a3b8" />
        </marker>
      </defs>
      <text x={w / 2} y={h - 8} textAnchor="middle" fontSize="10" fill="#64748b">{kind}: look for the rule from one term to the next</text>
    </svg>
  )
}

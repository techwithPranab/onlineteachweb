export default function HistogramDiagram({ params = {}, size = 300 }) {
  const {
    bins = [{ range: '0-10', frequency: 4 }, { range: '10-20', frequency: 9 }, { range: '20-30', frequency: 6 }, { range: '30-40', frequency: 3 }],
    title = 'Histogram',
    xLabel = 'Class interval',
    yLabel = 'Frequency'
  } = params

  const w = size
  const h = size * 0.78
  const padL = 42
  const padB = 42
  const padT = 28
  const chartW = w - padL - 18
  const chartH = h - padT - padB
  const max = Math.max(...bins.map(b => Number(b.frequency) || 0), 1)
  const barW = chartW / bins.length

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={title}>
      <text x={w / 2} y="16" textAnchor="middle" fontSize="12" fontWeight="700" fill="#334155">{title}</text>
      <line x1={padL} y1={padT} x2={padL} y2={padT + chartH} stroke="#334155" strokeWidth="1.5" />
      <line x1={padL} y1={padT + chartH} x2={padL + chartW} y2={padT + chartH} stroke="#334155" strokeWidth="1.5" />
      {bins.map((bin, i) => {
        const bh = (Number(bin.frequency) / max) * chartH
        return (
          <g key={bin.range}>
            <rect x={padL + i * barW} y={padT + chartH - bh} width={barW} height={bh} fill="#bfdbfe" stroke="#2563eb" strokeWidth="1.5" />
            <text x={padL + i * barW + barW / 2} y={padT + chartH - bh - 5} textAnchor="middle" fontSize="9" fill="#1d4ed8">{bin.frequency}</text>
            <text x={padL + i * barW + barW / 2} y={padT + chartH + 14} textAnchor="middle" fontSize="9" fill="#64748b">{bin.range}</text>
          </g>
        )
      })}
      <text x={w / 2} y={h - 5} textAnchor="middle" fontSize="10" fill="#64748b">{xLabel}</text>
      <text x="11" y={padT + chartH / 2} textAnchor="middle" fontSize="10" fill="#64748b" transform={`rotate(-90, 11, ${padT + chartH / 2})`}>{yLabel}</text>
    </svg>
  )
}

export default function BoxPlotDiagram({ params = {}, size = 300 }) {
  const {
    min = 2,
    q1 = 5,
    median = 8,
    q3 = 12,
    max = 16,
    title = 'Box plot'
  } = params

  const w = size
  const h = size * 0.48
  const pad = 34
  const axisY = h / 2 + 8
  const scaleMin = Math.min(min, q1, median, q3, max)
  const scaleMax = Math.max(min, q1, median, q3, max)
  const toX = v => pad + ((v - scaleMin) / (scaleMax - scaleMin || 1)) * (w - 2 * pad)
  const label = (v, text) => <text x={toX(v)} y={axisY + 34} textAnchor="middle" fontSize="9" fill="#64748b">{text}</text>

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={title}>
      <text x={w / 2} y="16" textAnchor="middle" fontSize="12" fontWeight="700" fill="#334155">{title}</text>
      <line x1={toX(min)} y1={axisY} x2={toX(max)} y2={axisY} stroke="#334155" strokeWidth="2" />
      <rect x={toX(q1)} y={axisY - 22} width={toX(q3) - toX(q1)} height="44" fill="#dbeafe" stroke="#2563eb" strokeWidth="2" />
      <line x1={toX(median)} y1={axisY - 24} x2={toX(median)} y2={axisY + 24} stroke="#dc2626" strokeWidth="3" />
      {[min, max].map(v => <line key={v} x1={toX(v)} y1={axisY - 16} x2={toX(v)} y2={axisY + 16} stroke="#334155" strokeWidth="2" />)}
      {label(min, 'min')}
      {label(q1, 'Q1')}
      {label(median, 'median')}
      {label(q3, 'Q3')}
      {label(max, 'max')}
    </svg>
  )
}

export default function CalculusDiagram({ params = {}, size = 300 }) {
  const {
    mode = 'derivative',
    title = mode === 'integral' ? 'Area under a curve' : 'Tangent as instant rate',
    pointX = 1
  } = params

  const w = size
  const h = size * 0.78
  const pad = 36
  const chartW = w - 2 * pad
  const chartH = h - 2 * pad
  const xMin = -3
  const xMax = 3
  const yMin = -1
  const yMax = 8
  const f = x => 0.55 * x * x + 1
  const df = x => 1.1 * x
  const toX = x => pad + ((x - xMin) / (xMax - xMin)) * chartW
  const toY = y => pad + chartH - ((y - yMin) / (yMax - yMin)) * chartH
  const samples = Array.from({ length: 90 }, (_, i) => {
    const x = xMin + (i / 89) * (xMax - xMin)
    return { x, y: f(x) }
  })
  const curve = samples.map((p, i) => `${i ? 'L' : 'M'} ${toX(p.x)} ${toY(p.y)}`).join(' ')
  const areaSamples = samples.filter(p => p.x >= -2 && p.x <= 2)
  const areaPath = [
    `M ${toX(-2)} ${toY(0)}`,
    ...areaSamples.map(p => `L ${toX(p.x)} ${toY(p.y)}`),
    `L ${toX(2)} ${toY(0)}`,
    'Z'
  ].join(' ')
  const px = pointX
  const py = f(px)
  const slope = df(px)
  const x1 = px - 1.6
  const x2 = px + 1.6
  const tangentY = x => py + slope * (x - px)

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={title}>
      <text x={w / 2} y="16" textAnchor="middle" fontSize="12" fontWeight="700" fill="#334155">{title}</text>
      <line x1={pad} y1={toY(0)} x2={pad + chartW} y2={toY(0)} stroke="#334155" strokeWidth="1.5" />
      <line x1={toX(0)} y1={pad} x2={toX(0)} y2={pad + chartH} stroke="#334155" strokeWidth="1.5" />
      {mode === 'integral' && <path d={areaPath} fill="#bfdbfe" opacity="0.9" />}
      <path d={curve} fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" />
      {mode !== 'integral' && (
        <>
          <line x1={toX(x1)} y1={toY(tangentY(x1))} x2={toX(x2)} y2={toY(tangentY(x2))} stroke="#f97316" strokeWidth="2.5" />
          <circle cx={toX(px)} cy={toY(py)} r="5" fill="#dc2626" stroke="white" strokeWidth="1.5" />
          <text x={toX(px) + 8} y={toY(py) - 8} fontSize="10" fill="#dc2626">instant rate</text>
        </>
      )}
      {mode === 'integral' && <text x={w / 2} y={h - 10} textAnchor="middle" fontSize="11" fill="#1d4ed8">shaded area represents accumulation</text>}
    </svg>
  )
}

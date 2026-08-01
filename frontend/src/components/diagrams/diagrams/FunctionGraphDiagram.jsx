const functionValue = (kind, x, params) => {
  const { a = 1, b = 0, c = 0, amplitude = 1, frequency = 1 } = params

  if (kind === 'quadratic') return a * x * x + b * x + c
  if (kind === 'cubic') return 0.12 * x * x * x - 0.6 * x
  if (kind === 'sine') return amplitude * Math.sin(frequency * x)
  if (kind === 'absolute') return Math.abs(x) + c
  return a * x + b
}

export default function FunctionGraphDiagram({ params = {}, size = 280 }) {
  const {
    kind = 'quadratic',
    xRange = [-5, 5],
    yRange = [-5, 5],
    a = 1,
    b = 0,
    c = 0,
    amplitude = 2,
    frequency = 1,
    points = [],
    title = 'Function graph',
    highlightRoots = true
  } = params

  const pad = 32
  const w = size
  const h = size * 0.82
  const chartW = w - 2 * pad
  const chartH = h - 2 * pad
  const [xMin, xMax] = xRange
  const [yMin, yMax] = yRange
  const toX = (x) => pad + ((x - xMin) / (xMax - xMin || 1)) * chartW
  const toY = (y) => pad + chartH - ((y - yMin) / (yMax - yMin || 1)) * chartH
  const graphParams = { a, b, c, amplitude, frequency }

  const samples = Array.from({ length: 121 }, (_, i) => {
    const x = xMin + (i / 120) * (xMax - xMin)
    const y = functionValue(kind, x, graphParams)
    return { x, y }
  }).filter(p => Number.isFinite(p.y) && p.y >= yMin - 1 && p.y <= yMax + 1)

  const path = samples.map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(p.x).toFixed(2)} ${toY(p.y).toFixed(2)}`).join(' ')
  const xTicks = []
  for (let x = Math.ceil(xMin); x <= Math.floor(xMax); x += 1) xTicks.push(x)
  const yTicks = []
  for (let y = Math.ceil(yMin); y <= Math.floor(yMax); y += 1) yTicks.push(y)
  const roots = highlightRoots
    ? samples.filter((p, i, arr) => i > 0 && p.y * arr[i - 1].y <= 0).slice(0, 4)
    : []

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={title}>
      <text x={w / 2} y={15} textAnchor="middle" fontSize="12" fontWeight="700" fill="#334155">{title}</text>
      {xTicks.map(x => <line key={`x${x}`} x1={toX(x)} y1={pad} x2={toX(x)} y2={pad + chartH} stroke="#e2e8f0" />)}
      {yTicks.map(y => <line key={`y${y}`} x1={pad} y1={toY(y)} x2={pad + chartW} y2={toY(y)} stroke="#e2e8f0" />)}
      <line x1={pad} y1={toY(0)} x2={pad + chartW} y2={toY(0)} stroke="#334155" strokeWidth="1.7" />
      <line x1={toX(0)} y1={pad} x2={toX(0)} y2={pad + chartH} stroke="#334155" strokeWidth="1.7" />
      <path d={path} fill="none" stroke="#2563eb" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      {roots.map((p, i) => (
        <g key={`r${i}`}>
          <circle cx={toX(p.x)} cy={toY(0)} r="4.5" fill="#f97316" stroke="white" strokeWidth="1.5" />
          <text x={toX(p.x)} y={toY(0) - 8} textAnchor="middle" fontSize="9" fill="#c2410c">root</text>
        </g>
      ))}
      {points.map((pt, i) => (
        <g key={`p${i}`}>
          <circle cx={toX(pt.x)} cy={toY(pt.y)} r="5" fill={pt.color || '#dc2626'} stroke="white" strokeWidth="1.5" />
          {pt.label && <text x={toX(pt.x) + 7} y={toY(pt.y) - 7} fontSize="10" fontWeight="700" fill={pt.color || '#dc2626'}>{pt.label}</text>}
        </g>
      ))}
      <text x={pad + chartW + 7} y={toY(0) + 4} fontSize="11" fill="#334155">x</text>
      <text x={toX(0) - 4} y={pad - 8} fontSize="11" fill="#334155">y</text>
    </svg>
  )
}

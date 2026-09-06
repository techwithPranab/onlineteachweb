export default function TransformationGridDiagram({ params = {}, size = 280 }) {
  const {
    title = 'Transformation on grid',
    original = [[1, 1], [3, 1], [2, 3]],
    image = [[-1, 1], [-3, 1], [-2, 3]],
    xRange = [-4, 4],
    yRange = [-1, 5]
  } = params

  const w = size
  const h = size
  const pad = 30
  const chart = w - 2 * pad
  const toX = x => pad + ((x - xRange[0]) / (xRange[1] - xRange[0] || 1)) * chart
  const toY = y => pad + chart - ((y - yRange[0]) / (yRange[1] - yRange[0] || 1)) * chart
  const poly = pts => pts.map(([x, y]) => `${toX(x)},${toY(y)}`).join(' ')

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={title}>
      <text x={w / 2} y="16" textAnchor="middle" fontSize="12" fontWeight="700" fill="#334155">{title}</text>
      {Array.from({ length: 9 }, (_, i) => <line key={`x${i}`} x1={pad + i * chart / 8} y1={pad} x2={pad + i * chart / 8} y2={pad + chart} stroke="#e2e8f0" />)}
      {Array.from({ length: 7 }, (_, i) => <line key={`y${i}`} x1={pad} y1={pad + i * chart / 6} x2={pad + chart} y2={pad + i * chart / 6} stroke="#e2e8f0" />)}
      <line x1={pad} y1={toY(0)} x2={pad + chart} y2={toY(0)} stroke="#334155" />
      <line x1={toX(0)} y1={pad} x2={toX(0)} y2={pad + chart} stroke="#334155" />
      <polygon points={poly(original)} fill="#bfdbfe" stroke="#2563eb" strokeWidth="2.5" />
      <polygon points={poly(image)} fill="#fed7aa" stroke="#f97316" strokeWidth="2.5" />
      <text x={toX(original[0][0]) + 5} y={toY(original[0][1]) - 7} fontSize="10" fill="#1d4ed8">original</text>
      <text x={toX(image[0][0]) - 48} y={toY(image[0][1]) - 7} fontSize="10" fill="#c2410c">image</text>
    </svg>
  )
}

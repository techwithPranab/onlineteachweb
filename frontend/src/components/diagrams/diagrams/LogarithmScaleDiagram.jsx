/**
 * LogarithmScaleDiagram – connects powers and logarithms for Grade 9.
 * params: { base, powers, title }
 */
export default function LogarithmScaleDiagram({ params = {}, size = 220 }) {
  const {
    base = 10,
    powers = [-2, -1, 0, 1, 2, 3],
    title = 'Logarithm scale'
  } = params

  const w = size
  const h = size * 0.72
  const pad = 24
  const lineY = h / 2
  const usable = w - 2 * pad
  const safePowers = powers.length ? powers : [-2, -1, 0, 1, 2, 3]
  const minP = Math.min(...safePowers)
  const maxP = Math.max(...safePowers)
  const toX = (p) => pad + ((p - minP) / (maxP - minP || 1)) * usable
  const valueText = (p) => {
    if (p === 0) return '1'
    if (p > 0) return `${base}${p > 1 ? `^${p}` : ''}`
    return `1/${base}${Math.abs(p) > 1 ? `^${Math.abs(p)}` : ''}`
  }

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={title}>
      <rect width={w} height={h} rx="16" fill="#f8fafc" />
      <text x={w / 2} y="20" textAnchor="middle" fontSize="13" fontWeight="700" fill="#334155">{title}</text>
      <line x1={pad} y1={lineY} x2={w - pad} y2={lineY} stroke="#334155" strokeWidth="2" />

      {safePowers.map((power) => {
        const x = toX(power)
        return (
          <g key={power}>
            <line x1={x} y1={lineY - 8} x2={x} y2={lineY + 8} stroke="#2563eb" strokeWidth="2" />
            <circle cx={x} cy={lineY} r="5" fill="#dbeafe" stroke="#2563eb" strokeWidth="2" />
            <text x={x} y={lineY - 17} textAnchor="middle" fontSize="10" fill="#1d4ed8">log = {power}</text>
            <text x={x} y={lineY + 27} textAnchor="middle" fontSize="10" fill="#475569">{valueText(power)}</text>
          </g>
        )
      })}

      <text x={w / 2} y={h - 12} textAnchor="middle" fontSize="10" fill="#64748b">
        If {base}^x = N, then log base {base} of N = x
      </text>
    </svg>
  )
}

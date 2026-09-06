/**
 * SimilarTrianglesDiagram – compare two similar triangles with matching angle
 * marks and proportional corresponding sides.
 * params: { criterion, scaleFactor, title, showLabels }
 */
export default function SimilarTrianglesDiagram({ params = {}, size = 240 }) {
  const {
    criterion = 'AAA',
    scaleFactor = 1.5,
    title = 'Similar triangles',
    showLabels = true
  } = params

  const w = size
  const h = size
  const cx = w / 2
  const k = Number(scaleFactor) || 1.5
  const small = [
    [32, 152],
    [92, 152],
    [50, 98]
  ]
  const bigBase = Math.min(92, 60 * k)
  const bigHeight = Math.min(82, 54 * k)
  const big = [
    [w - 32 - bigBase, 164],
    [w - 32, 164],
    [w - 32 - bigBase + 18, 164 - bigHeight]
  ]

  const points = pts => pts.map(p => p.join(',')).join(' ')

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={title}>
      <rect width={w} height={h} rx="16" fill="#f8fafc" />
      <text x={cx} y="22" textAnchor="middle" fontSize="13" fontWeight="700" fill="#334155">{title}</text>

      <polygon points={points(small)} fill="#dbeafe" stroke="#2563eb" strokeWidth="2.5" />
      <polygon points={points(big)} fill="#dcfce7" stroke="#16a34a" strokeWidth="2.5" />

      <path d="M40 144 Q45 135 52 143" fill="none" stroke="#f97316" strokeWidth="2" />
      <path d={`M${big[0][0] + 10} 154 Q${big[0][0] + 19} 142 ${big[0][0] + 30} 154`} fill="none" stroke="#f97316" strokeWidth="2" />
      <path d="M83 151 Q78 139 67 136" fill="none" stroke="#7c3aed" strokeWidth="2" />
      <path d={`M${big[1][0] - 8} 162 Q${big[1][0] - 20} 146 ${big[1][0] - 36} 144`} fill="none" stroke="#7c3aed" strokeWidth="2" />
      <circle cx="50" cy="98" r="4" fill="#ef4444" />
      <circle cx={big[2][0]} cy={big[2][1]} r="4" fill="#ef4444" />

      {showLabels && (
        <g fontSize="11" fill="#334155" fontWeight="700">
          <text x="27" y="167">A</text>
          <text x="94" y="167">B</text>
          <text x="43" y="92">C</text>
          <text x={big[0][0] - 12} y={big[0][1] + 15}>P</text>
          <text x={big[1][0] + 4} y={big[1][1] + 14}>Q</text>
          <text x={big[2][0] - 4} y={big[2][1] - 8}>R</text>
        </g>
      )}

      <line x1="43" y1="166" x2="83" y2="166" stroke="#f97316" strokeWidth="2.5" />
      <line x1={big[0][0] + 10} y1={big[0][1] + 14} x2={big[1][0] - 10} y2={big[1][1] + 14} stroke="#f97316" strokeWidth="2.5" />

      <rect x="30" y={h - 52} width={w - 60} height="34" rx="14" fill="#fff7ed" stroke="#fdba74" />
      <text x={cx} y={h - 34} textAnchor="middle" fontSize="11" fontWeight="700" fill="#9a3412">
        △ABC ∼ △PQR by {criterion}
      </text>
      <text x={cx} y={h - 20} textAnchor="middle" fontSize="10.5" fill="#9a3412">
        Corresponding sides are in ratio 1 : {k}
      </text>
    </svg>
  )
}

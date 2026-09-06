/**
 * SurfaceVolumeDiagram – formula-friendly model for surface area and volume.
 * params: { solid, mode, dimensions, title }
 */
export default function SurfaceVolumeDiagram({ params = {}, size = 220 }) {
  const {
    solid = 'cuboid',
    mode = 'volume',
    dimensions = { length: 5, width: 3, height: 4, radius: 3 },
    title = 'Surface area and volume'
  } = params

  const w = size
  const h = size
  const cx = w / 2
  const isCylinder = solid === 'cylinder'
  const isCone = solid === 'cone'
  const isSphere = solid === 'sphere'
  const isCube = solid === 'cube'
  const l = dimensions.length || dimensions.side || 5
  const b = dimensions.width || dimensions.side || 3
  const ht = dimensions.height || dimensions.side || 4
  const r = dimensions.radius || 3

  const formula = (() => {
    if (isSphere) return mode === 'volume' ? 'V = ⁴⁄₃πr³' : 'SA = 4πr²'
    if (isCone && mode === 'volume') return 'V = ⅓πr²h'
    if (isCone && mode === 'curvedSurface') return 'CSA = πrl'
    if (isCone) return 'TSA = πr(l + r)'
    if (isCylinder && mode === 'volume') return 'V = πr²h'
    if (isCylinder && mode === 'curvedSurface') return 'CSA = 2πrh'
    if (isCylinder) return 'TSA = 2πr(h + r)'
    if (isCube && mode === 'volume') return 'V = a³'
    if (isCube) return 'TSA = 6a²'
    if (mode === 'volume') return 'V = l × b × h'
    return 'TSA = 2(lb + bh + hl)'
  })()

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={title}>
      <rect width={w} height={h} rx="16" fill="#f8fafc" />
      <text x={cx} y="20" textAnchor="middle" fontSize="13" fontWeight="700" fill="#334155">{title}</text>

      {isSphere ? (
        <g>
          <circle cx={cx} cy="112" r="54" fill="#dbeafe" stroke="#2563eb" strokeWidth="2.5" />
          <ellipse cx={cx} cy="112" rx="54" ry="16" fill="none" stroke="#60a5fa" strokeWidth="2" strokeDasharray="5 4" />
          <path d={`M ${cx - 36} 72 Q ${cx} 100 ${cx + 36} 72`} fill="none" stroke="#93c5fd" strokeWidth="1.8" />
          <line x1={cx} y1="112" x2={cx + 54} y2="112" stroke="#f97316" strokeWidth="2.5" />
          <circle cx={cx} cy="112" r="3" fill="#ef4444" />
          <text x={cx + 24} y="105" fontSize="11" fill="#f97316">r={r}</text>
          {mode !== 'volume' && <circle cx={cx} cy="112" r="43" fill="#fde68a" opacity="0.25" />}
        </g>
      ) : isCone ? (
        <g>
          <path d={`M ${cx} 54 L ${cx - 50} 158 Q ${cx} 178 ${cx + 50} 158 Z`} fill="#dbeafe" stroke="#2563eb" strokeWidth="2.5" />
          <ellipse cx={cx} cy="158" rx="50" ry="16" fill="#bfdbfe" stroke="#2563eb" strokeWidth="2.5" />
          <line x1={cx} y1="54" x2={cx} y2="158" stroke="#16a34a" strokeWidth="2.5" strokeDasharray="5 4" />
          <line x1={cx} y1="158" x2={cx + 50} y2="158" stroke="#f97316" strokeWidth="2.5" />
          <line x1={cx} y1="54" x2={cx + 50} y2="158" stroke="#7c3aed" strokeWidth="2.5" />
          <text x={cx + 7} y="110" fontSize="11" fill="#16a34a">h={ht}</text>
          <text x={cx + 22} y="151" fontSize="11" fill="#f97316">r={r}</text>
          <text x={cx + 32} y="104" fontSize="11" fill="#7c3aed">l</text>
          {mode === 'curvedSurface' && <path d={`M ${cx} 54 L ${cx - 50} 158 Q ${cx} 148 ${cx + 50} 158 Z`} fill="#fde68a" opacity="0.35" />}
        </g>
      ) : isCylinder ? (
        <g>
          <ellipse cx={cx} cy="64" rx="46" ry="16" fill="#dbeafe" stroke="#2563eb" strokeWidth="2.5" />
          <path d={`M ${cx - 46} 64 V 152`} stroke="#2563eb" strokeWidth="2.5" />
          <path d={`M ${cx + 46} 64 V 152`} stroke="#2563eb" strokeWidth="2.5" />
          <ellipse cx={cx} cy="152" rx="46" ry="16" fill="#bfdbfe" stroke="#2563eb" strokeWidth="2.5" />
          <line x1={cx} y1="64" x2={cx + 46} y2="64" stroke="#f97316" strokeWidth="2.5" />
          <line x1={cx + 56} y1="64" x2={cx + 56} y2="152" stroke="#16a34a" strokeWidth="2.5" />
          <text x={cx + 20} y="58" fontSize="11" fill="#f97316">r={r}</text>
          <text x={cx + 62} y="112" fontSize="11" fill="#16a34a">h={ht}</text>
          {mode === 'curvedSurface' && (
            <rect x={cx - 46} y="80" width="92" height="56" fill="#fde68a" opacity="0.45" />
          )}
        </g>
      ) : (
        <g>
          <polygon points="54,76 132,76 166,106 88,106" fill="#dbeafe" stroke="#2563eb" strokeWidth="2.5" />
          <polygon points="88,106 166,106 166,164 88,164" fill="#bfdbfe" stroke="#2563eb" strokeWidth="2.5" />
          <polygon points="54,76 88,106 88,164 54,134" fill="#e0f2fe" stroke="#2563eb" strokeWidth="2.5" />
          <line x1="88" y1="174" x2="166" y2="174" stroke="#f97316" strokeWidth="2.5" />
          <line x1="176" y1="106" x2="176" y2="164" stroke="#16a34a" strokeWidth="2.5" />
          <line x1="54" y1="144" x2="88" y2="174" stroke="#7c3aed" strokeWidth="2.5" />
          <text x="122" y="190" fontSize="11" fill="#f97316">{isCube ? `a=${l}` : `l=${l}`}</text>
          <text x="181" y="137" fontSize="11" fill="#16a34a">{isCube ? `a=${l}` : `h=${ht}`}</text>
          {!isCube && <text x="56" y="174" fontSize="11" fill="#7c3aed">b={b}</text>}
        </g>
      )}

      <rect x="36" y={h - 38} width={w - 72} height="24" rx="12" fill="#ecfdf5" stroke="#86efac" />
      <text x={cx} y={h - 21} textAnchor="middle" fontSize="12" fontWeight="700" fill="#047857">{formula}</text>
    </svg>
  )
}

export default function ConicSectionsDiagram({ params = {}, size = 280 }) {
  const {
    conic = 'parabola',
    title = 'Conic section',
    showFocus = true,
    showDirectrix = true
  } = params

  const w = size
  const h = size * 0.82
  const cx = w / 2
  const cy = h / 2 + 8

  const shape = {
    parabola: <path d={`M ${cx - 85} ${cy + 55} Q ${cx} ${cy - 78} ${cx + 85} ${cy + 55}`} fill="none" stroke="#2563eb" strokeWidth="3" />,
    ellipse: <ellipse cx={cx} cy={cy} rx="88" ry="48" fill="#dbeafe" stroke="#2563eb" strokeWidth="3" />,
    hyperbola: (
      <>
        <path d={`M ${cx - 15} ${cy - 65} C ${cx - 86} ${cy - 38}, ${cx - 86} ${cy + 38}, ${cx - 15} ${cy + 65}`} fill="none" stroke="#2563eb" strokeWidth="3" />
        <path d={`M ${cx + 15} ${cy - 65} C ${cx + 86} ${cy - 38}, ${cx + 86} ${cy + 38}, ${cx + 15} ${cy + 65}`} fill="none" stroke="#2563eb" strokeWidth="3" />
      </>
    ),
    circle: <circle cx={cx} cy={cy} r="58" fill="#dbeafe" stroke="#2563eb" strokeWidth="3" />
  }[conic] || null

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={title}>
      <text x={cx} y="16" textAnchor="middle" fontSize="12" fontWeight="700" fill="#334155">{title}</text>
      <line x1="28" y1={cy} x2={w - 28} y2={cy} stroke="#cbd5e1" />
      <line x1={cx} y1="30" x2={cx} y2={h - 24} stroke="#cbd5e1" />
      {shape}
      {showFocus && (
        <>
          <circle cx={conic === 'ellipse' ? cx - 35 : cx} cy={conic === 'parabola' ? cy - 30 : cy} r="5" fill="#f97316" />
          <text x={conic === 'ellipse' ? cx - 35 : cx} y={(conic === 'parabola' ? cy - 30 : cy) - 9} textAnchor="middle" fontSize="10" fill="#c2410c">focus</text>
          {conic === 'ellipse' && <circle cx={cx + 35} cy={cy} r="5" fill="#f97316" />}
        </>
      )}
      {showDirectrix && conic === 'parabola' && (
        <>
          <line x1="38" y1={cy + 78} x2={w - 38} y2={cy + 78} stroke="#7c3aed" strokeWidth="2" strokeDasharray="5 5" />
          <text x={w - 42} y={cy + 70} textAnchor="end" fontSize="10" fill="#6d28d9">directrix</text>
        </>
      )}
      <text x={cx} y={h - 8} textAnchor="middle" fontSize="11" fill="#475569">{conic}</text>
    </svg>
  )
}

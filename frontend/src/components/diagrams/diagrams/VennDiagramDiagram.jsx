/**
 * VennDiagramDiagram – two-set Venn diagram for factors/multiples/HCF/LCM.
 * params: {
 *   setA: { label, items: string[] },
 *   setB: { label, items: string[] },
 *   intersection: string[],   // items in both sets
 *   title, colorA, colorB
 * }
 */
export default function VennDiagramDiagram({ params = {}, size = 280 }) {
  const {
    setA = { label: 'Factors of 12', items: ['1', '2', '3', '4', '6', '12'] },
    setB = { label: 'Factors of 18', items: ['1', '2', '3', '6', '9', '18'] },
    intersection = ['1', '2', '3', '6'],
    title = '',
    colorA = '#3b82f6',
    colorB = '#ef4444'
  } = params

  // Items only in A (not in intersection)
  const onlyA = setA.items.filter(i => !intersection.includes(i))
  const onlyB = setB.items.filter(i => !intersection.includes(i))

  const height = size * 0.85
  const cx = size / 2, cy = height / 2 + (title ? 12 : 0)
  const r = size * 0.34
  const offset = r * 0.55  // overlap distance

  const cxA = cx - offset, cxB = cx + offset

  // Text layout within each region
  const layoutItems = (items, centerX, centerY) => {
    const lineH = 16
    const startY = centerY - (items.length * lineH) / 2 + 8
    return items.map((it, i) => ({ text: it, x: centerX, y: startY + i * lineH }))
  }

  const onlyALayout = layoutItems(onlyA.slice(0, 5), cxA - r * 0.35, cy)
  const intersectLayout = layoutItems(intersection.slice(0, 5), cx, cy)
  const onlyBLayout = layoutItems(onlyB.slice(0, 5), cxB + r * 0.35, cy)

  return (
    <svg width={size} height={height} viewBox={`0 0 ${size} ${height}`}>
      {/* Title */}
      {title && <text x={size / 2} y={14} textAnchor="middle" fontSize={13} fontWeight="700" fill="#334155">{title}</text>}

      {/* Circle A */}
      <circle cx={cxA} cy={cy} r={r} fill={colorA} fillOpacity="0.18" stroke={colorA} strokeWidth="2.5" />
      {/* Circle B */}
      <circle cx={cxB} cy={cy} r={r} fill={colorB} fillOpacity="0.18" stroke={colorB} strokeWidth="2.5" />

      {/* Set labels */}
      <text x={cxA - r * 0.5} y={cy - r - 8} textAnchor="middle" fontSize={11} fontWeight="700" fill={colorA}>
        {setA.label}
      </text>
      <text x={cxB + r * 0.5} y={cy - r - 8} textAnchor="middle" fontSize={11} fontWeight="700" fill={colorB}>
        {setB.label}
      </text>

      {/* Items only in A */}
      {onlyALayout.map((it, i) => (
        <text key={i} x={it.x} y={it.y} textAnchor="middle" fontSize={11} fontWeight="600" fill={colorA}>{it.text}</text>
      ))}

      {/* Intersection items */}
      {intersectLayout.map((it, i) => (
        <text key={i} x={it.x} y={it.y} textAnchor="middle" fontSize={11} fontWeight="700" fill="#334155">{it.text}</text>
      ))}

      {/* Items only in B */}
      {onlyBLayout.map((it, i) => (
        <text key={i} x={it.x} y={it.y} textAnchor="middle" fontSize={11} fontWeight="600" fill={colorB}>{it.text}</text>
      ))}

      {/* HCF / LCM hint if intersection and items look numeric */}
      {intersection.length > 0 && (
        <text x={size / 2} y={height - 5} textAnchor="middle" fontSize={10} fill="#64748b">
          Common: {intersection.join(', ')} — HCF = {Math.max(...intersection.map(Number).filter(Boolean))}
        </text>
      )}
    </svg>
  )
}

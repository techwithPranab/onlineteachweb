import { fractionRegions, fractionValue, isShaded } from '../fractionGeometry.mjs'

const ink = '#334155'
const paper = '#ffffff'

/** Fraction figures, mixed wholes, and labelled panels for visual choices. */
export default function FractionDiagram({ params = {}, size = 200 }) {
  if (!params || typeof params !== 'object') return null
  if (Array.isArray(params.panels)) {
    if (!params.panels.length || params.panels.some(p => !p || typeof p !== 'object' || p.panels)) return <InvalidFigure />
    return <div style={{ width: size * 2, maxWidth: '100%', display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
      {params.panels.slice(0, 12).map((panel, i) => <div key={i} className="flex flex-col items-center gap-1">
        <span className="text-sm font-semibold">{panel.label || String.fromCharCode(65 + i)}</span>
        {panel.text ? <span className="text-sm text-center">{panel.text}</span> : <FractionDiagram params={{ ...panel, panels: undefined, showLabel: panel.showLabel ?? params.showLabel ?? false }} size={size} />}
      </div>)}
    </div>
  }
  const style = params.style || 'pie'
  const d = style === 'triangle' ? 3 : Number(params.denominator ?? 4)
  const n = Number(params.numerator ?? 1)
  // Multiple congruent wholes preserve improper and mixed fractions.
  if (['pie', 'bar', 'triangle'].includes(style) && n > d && !params.shadedIndices && !params.sectorWeights) {
    if (!Number.isInteger(n) || !Number.isInteger(d) || d < 1 || n / d > 12) return <InvalidFigure />
    return <div className="flex flex-wrap justify-center gap-2" style={{ maxWidth: size * 2 }}>
      {Array.from({ length: Math.ceil(n / d) }, (_, i) => <FractionDiagram key={i} params={{ ...params, numerator: Math.min(d, n - i * d), showLabel: false }} size={Math.min(size, 130)} />)}
      {params.showLabel && <span className="w-full text-center">{n}/{d}</span>}
    </div>
  }
  try {
    return SingleFigure({ params: { ...params, style, denominator: d, numerator: n }, size })
  } catch {
    return <InvalidFigure />
  }
}

function InvalidFigure() {
  return <span role="status" className="text-sm text-amber-700">Figure data needs correction.</span>
}

function SingleFigure({ params, size }) {
  const { style, denominator: d, color = '#64748b', showLabel = false } = params
  if (!['pie', 'bar', 'triangle', 'grid', 'regions', 'set'].includes(style) || !Number.isInteger(params.numerator) || params.numerator < 0 || !Number.isInteger(d) || d < 1 || d > 100) return <InvalidFigure />
  if (style === 'grid' && (!Number.isInteger(params.rows) || !Number.isInteger(params.cols) || params.rows < 1 || params.cols < 1 || params.rows * params.cols > 100 || !Array.isArray(params.cells) || params.cells.length !== params.rows * params.cols)) return <InvalidFigure />
  if (style === 'regions' && (!Array.isArray(params.regions) || !params.regions.length || params.regions.length > 100)) return <InvalidFigure />
  const regions = fractionRegions(params)
  const value = fractionValue(params)
  // Keep grid cells square even when the row and column counts differ.
  const gridWidth = style === 'grid' ? Math.min(1, params.cols / params.rows) : 1
  const gridHeight = style === 'grid' ? Math.min(1, params.rows / params.cols) : 1
  const regionTransform = style === 'bar' ? 'translate(0 30) scale(1 0.4)' : `translate(${50 * (1 - gridWidth)} ${50 * (1 - gridHeight)}) scale(${gridWidth} ${gridHeight})`
  if (!Number.isFinite(value)) return <InvalidFigure />
  return <svg width={size} height={size} viewBox="-5 -5 110 120" style={{ maxWidth: '100%', height: 'auto' }} role="img" aria-label={params.alt || 'Fraction figure; shaded regions are dark and unshaded regions are white.'}>
    {regions.length > 0 ? <g transform={regionTransform}>
      {regions.map((region, i) => <polygon key={i} points={region.points.map(p => p.join(',')).join(' ')} fill={region.shaded ? color : paper} stroke={ink} strokeWidth="0.8" vectorEffect="non-scaling-stroke" />)}
    </g> : style === 'set' ? SetFigure({ params, color }) : PieFigure({ params, color })}
    {showLabel && <text x="50" y="112" textAnchor="middle" fontSize="9" fill={ink}>{Number.isInteger(value * d) ? `${value * d}/${d}` : `${Math.round(value * 10000) / 100}% shaded`}</text>}
  </svg>
}

function arcPoint(radius, angle) { return [50 + radius * Math.cos(angle), 50 + radius * Math.sin(angle)] }
function sectorPath(inner, outer, start, end) {
  // Two half-arcs also handle a complete circle (one sector).
  const mid = (start + end) / 2
  const a = arcPoint(outer, start), b = arcPoint(outer, mid), c = arcPoint(outer, end)
  const outside = `M ${a} A ${outer} ${outer} 0 0 1 ${b} A ${outer} ${outer} 0 0 1 ${c}`
  if (!inner) return `${outside} L 50 50 Z`
  return `${outside} L ${arcPoint(inner, end)} A ${inner} ${inner} 0 0 0 ${arcPoint(inner, mid)} A ${inner} ${inner} 0 0 0 ${arcPoint(inner, start)} Z`
}

function PieFigure({ params, color }) {
  const weights = params.sectorWeights || Array(params.denominator).fill(1)
  const total = weights.reduce((a, b) => a + b, 0)
  const rings = params.rings || [{ innerRadius: 0, outerRadius: 1, shadedIndices: weights.map((_, i) => i).filter(i => isShaded(params, i)) }]
  return rings.map((ring, r) => {
    let angle = (Number(params.rotation ?? -90)) * Math.PI / 180
    return weights.map((weight, i) => {
      const start = angle
      angle += weight / total * 2 * Math.PI
      return <path key={`${r}-${i}`} d={sectorPath(ring.innerRadius * 47, ring.outerRadius * 47, start, angle)} fill={ring.shadedIndices.includes(i) ? color : paper} stroke={ink} strokeWidth="0.8" />
    })
  })
}

function SetFigure({ params, color }) {
  const items = params.items || Array.from({ length: params.denominator }, (_, i) => ({ shape: params.itemShape || 'circle', shaded: isShaded(params, i) }))
  if (items.length > 100) return null
  const necklace = params.layout === 'necklace'
  const cols = Math.max(1, Math.min(10, Number(params.cols) || Math.ceil(Math.sqrt(items.length))))
  const rows = Math.ceil(items.length / cols), step = Math.min(90 / cols, 85 / rows)
  const radius = necklace ? Math.min(7, 65 / items.length) : step * 0.3
  return <g>
    {necklace && <circle cx="50" cy="45" r="36" fill="none" stroke={ink} strokeWidth="1" />}
    {params.outline && !necklace && <rect x="1" y="1" width="98" height="98" rx="18" fill="none" stroke={ink} />}
    {items.map((item, i) => {
      const angle = Math.PI * (0.05 + 0.9 * i / Math.max(1, items.length - 1))
      const x = necklace ? 50 + 36 * Math.cos(angle) : 50 + (i % cols - (cols - 1) / 2) * step
      const y = necklace ? 45 + 36 * Math.sin(angle) : 50 + (Math.floor(i / cols) - (rows - 1) / 2) * step
      const props = { fill: item.shaded ? color : paper, stroke: ink, strokeWidth: 0.8 }
      return <g key={i} transform={`translate(${x} ${y})`}>
        {item.shape === 'square' ? <rect x={-radius} y={-radius} width={radius * 2} height={radius * 2} {...props} />
          : item.shape === 'triangle' ? <polygon points={`0,${-radius} ${radius},${radius} ${-radius},${radius}`} {...props} />
          : item.shape === 'star' ? <polygon points={Array.from({ length: 10 }, (_, j) => { const a = j * Math.PI / 5 - Math.PI / 2; const r = j % 2 ? radius * 0.45 : radius; return `${r * Math.cos(a)},${r * Math.sin(a)}` }).join(' ')} {...props} />
          : <circle r={radius} {...props} />}
      </g>
    })}
  </g>
}

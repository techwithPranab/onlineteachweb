/** Bar graph supporting vertical and horizontal textbook layouts. */
export default function BarGraphDiagram({ params = {}, size = 280 }) {
  const { data = [{ label: 'Mon', value: 5 }, { label: 'Tue', value: 8 }], xLabel = '', yLabel = '', title = '', color = '#475569', orientation = 'vertical', showValues = false } = params
  const cleanData = data.slice(0, 12).map(item => ({ label: String(item.label ?? ''), value: Math.max(0, Number(item.value) || 0) }))
  const dataMax = Math.max(...cleanData.map(item => item.value), 1)
  const tickStep = Number(params.tickStep) > 0 ? Number(params.tickStep) : Math.max(1, Math.ceil(dataMax / 5))
  const maxValue = Number(params.maxValue) >= dataMax ? Number(params.maxValue) : Math.ceil(dataMax / tickStep) * tickStep
  const ticks = Array.from({ length: Math.ceil(maxValue / tickStep) + 1 }, (_, index) => index * tickStep).filter(value => value <= maxValue)
  const horizontal = orientation === 'horizontal'
  const height = horizontal ? Math.max(size * 0.72, cleanData.length * 36 + 82) : size * 0.85
  const padL = horizontal ? Math.max(70, size * 0.27) : 46
  const padR = 18, padT = title ? 30 : 14, padB = xLabel ? 44 : 30
  const chartW = size - padL - padR, chartH = height - padT - padB

  if (horizontal) {
    const spacing = chartH / Math.max(cleanData.length, 1)
    const barH = Math.min(spacing - 8, 28)
    return <svg width={size} height={height} viewBox={`0 0 ${size} ${height}`} role="img" aria-label={title || 'Horizontal bar graph'}>
      {title && <text x={size / 2} y="18" textAnchor="middle" fontSize="13" fontWeight="700" fill="#334155">{title}</text>}
      <line x1={padL} y1={padT} x2={padL} y2={padT + chartH} stroke="#334155" strokeWidth="1.5" />
      <line x1={padL} y1={padT + chartH} x2={padL + chartW} y2={padT + chartH} stroke="#334155" strokeWidth="1.5" />
      {ticks.map(value => { const x = padL + (value / maxValue) * chartW; return <g key={value}><line x1={x} y1={padT} x2={x} y2={padT + chartH + 4} stroke="#e2e8f0" /><text x={x} y={padT + chartH + 16} textAnchor="middle" fontSize="9" fill="#64748b">{value}</text></g> })}
      {cleanData.map((item, index) => { const y = padT + index * spacing + (spacing - barH) / 2; const width = (item.value / maxValue) * chartW; return <g key={`${item.label}-${index}`}><text x={padL - 7} y={y + barH / 2} textAnchor="end" dominantBaseline="middle" fontSize="10" fill="#334155">{item.label}</text><rect x={padL} y={y} width={width} height={barH} fill={color} rx="2" opacity="0.88" />{showValues && <text x={padL + width + 4} y={y + barH / 2} dominantBaseline="middle" fontSize="9" fill="#334155">{item.value}</text>}</g> })}
      {xLabel && <text x={padL + chartW / 2} y={height - 4} textAnchor="middle" fontSize="11" fill="#64748b">{xLabel}</text>}
      {yLabel && <text x="10" y={padT + chartH / 2} textAnchor="middle" fontSize="11" fill="#64748b" transform={`rotate(-90, 10, ${padT + chartH / 2})`}>{yLabel}</text>}
    </svg>
  }

  const spacing = chartW / Math.max(cleanData.length, 1)
  const barW = Math.min(spacing - 8, 50)
  return <svg width={size} height={height} viewBox={`0 0 ${size} ${height}`} role="img" aria-label={title || 'Vertical bar graph'}>
    {title && <text x={size / 2} y="18" textAnchor="middle" fontSize="13" fontWeight="700" fill="#334155">{title}</text>}
    <line x1={padL} y1={padT} x2={padL} y2={padT + chartH} stroke="#334155" strokeWidth="1.5" />
    <line x1={padL} y1={padT + chartH} x2={padL + chartW} y2={padT + chartH} stroke="#334155" strokeWidth="1.5" />
    {ticks.map(value => { const y = padT + chartH - (value / maxValue) * chartH; return <g key={value}><line x1={padL - 4} y1={y} x2={padL + chartW} y2={y} stroke="#e2e8f0" /><text x={padL - 7} y={y} textAnchor="end" dominantBaseline="middle" fontSize="9" fill="#64748b">{value}</text></g> })}
    {cleanData.map((item, index) => { const x = padL + index * spacing + (spacing - barW) / 2; const barH = (item.value / maxValue) * chartH; const y = padT + chartH - barH; return <g key={`${item.label}-${index}`}><rect x={x} y={y} width={barW} height={barH} fill={color} rx="2" opacity="0.88" />{showValues && <text x={x + barW / 2} y={y - 5} textAnchor="middle" fontSize="9" fill="#334155">{item.value}</text>}<text x={x + barW / 2} y={padT + chartH + 14} textAnchor="middle" fontSize="9" fill="#64748b">{item.label}</text></g> })}
    {xLabel && <text x={padL + chartW / 2} y={height - 4} textAnchor="middle" fontSize="11" fill="#64748b">{xLabel}</text>}
    {yLabel && <text x="11" y={padT + chartH / 2} textAnchor="middle" fontSize="11" fill="#64748b" transform={`rotate(-90, 11, ${padT + chartH / 2})`}>{yLabel}</text>}
  </svg>
}

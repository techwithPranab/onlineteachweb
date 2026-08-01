/**
 * CommercialMathDiagram – visual flow cards for GST, banking interest,
 * and shares/dividends.
 * params: { mode, title, base, rate, extraRate, faceValue, shares }
 */
export default function CommercialMathDiagram({ params = {}, size = 260 }) {
  const {
    mode = 'gst',
    title = mode === 'gst' ? 'GST bill' : mode === 'shares' ? 'Shares and dividends' : 'Banking interest',
    base = 1000,
    rate = 9,
    extraRate = 9,
    faceValue = 100,
    shares = 20
  } = params

  const w = size
  const h = size
  const cx = w / 2
  const isGST = mode === 'gst'
  const isShares = mode === 'shares'
  const totalGST = Math.round(base * (rate + extraRate) / 100)
  const gstTotal = base + totalGST
  const interest = Math.round(base * rate / 100)
  const dividend = Math.round(shares * faceValue * rate / 100)

  const cards = isGST
    ? [
        { label: 'Price', value: `₹${base}`, fill: '#dbeafe', stroke: '#2563eb' },
        { label: `CGST ${rate}% + SGST ${extraRate}%`, value: `₹${totalGST}`, fill: '#fef3c7', stroke: '#f59e0b' },
        { label: 'Bill total', value: `₹${gstTotal}`, fill: '#dcfce7', stroke: '#16a34a' }
      ]
    : isShares
      ? [
          { label: 'Shares × Face value', value: `${shares} × ₹${faceValue}`, fill: '#ede9fe', stroke: '#7c3aed' },
          { label: `Dividend rate ${rate}%`, value: `${rate}/100`, fill: '#fef3c7', stroke: '#f59e0b' },
          { label: 'Dividend', value: `₹${dividend}`, fill: '#dcfce7', stroke: '#16a34a' }
        ]
      : [
          { label: 'Principal', value: `₹${base}`, fill: '#dbeafe', stroke: '#2563eb' },
          { label: `Interest ${rate}%`, value: `₹${interest}`, fill: '#fef3c7', stroke: '#f59e0b' },
          { label: 'Amount', value: `₹${base + interest}`, fill: '#dcfce7', stroke: '#16a34a' }
        ]

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={title}>
      <rect width={w} height={h} rx="16" fill="#f8fafc" />
      <text x={cx} y="22" textAnchor="middle" fontSize="13" fontWeight="700" fill="#334155">{title}</text>

      {cards.map((card, index) => {
        const y = 46 + index * 58
        return (
          <g key={card.label}>
            <rect x="32" y={y} width={w - 64} height="42" rx="12" fill={card.fill} stroke={card.stroke} strokeWidth="2" />
            <text x="46" y={y + 17} fontSize="11" fontWeight="700" fill="#334155">{card.label}</text>
            <text x={w - 46} y={y + 28} textAnchor="end" fontSize="16" fontWeight="800" fill={card.stroke}>{card.value}</text>
            {index < cards.length - 1 && (
              <g>
                <line x1={cx} y1={y + 42} x2={cx} y2={y + 56} stroke="#94a3b8" strokeWidth="2" />
                <path d={`M ${cx - 5} ${y + 51} L ${cx} ${y + 57} L ${cx + 5} ${y + 51}`} fill="none" stroke="#94a3b8" strokeWidth="2" />
              </g>
            )}
          </g>
        )
      })}

      <rect x="28" y={h - 36} width={w - 56} height="22" rx="11" fill="#ecfeff" stroke="#67e8f9" />
      <text x={cx} y={h - 21} textAnchor="middle" fontSize="10.5" fill="#0e7490">
        Use ₹, %, + and × carefully in each step.
      </text>
    </svg>
  )
}

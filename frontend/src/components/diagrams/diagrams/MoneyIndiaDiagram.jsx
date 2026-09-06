/**
 * MoneyIndiaDiagram – renders Indian currency notes and coins.
 * params: {
 *   amounts: [{ denomination: number, count: number }],
 *     denomination can be: 2000, 500, 200, 100, 50, 20, 10, 5, 2, 1 (rupees)
 *     or 0.50, 0.25 (paisa as fraction)
 *   totalLabel: boolean,
 *   style: "notes" | "coins" | "mixed"
 * }
 */

const NOTE_CONFIG = {
  2000: { color: '#ec4899', label: '₹2000', textColor: 'white' },
  500:  { color: '#7c3aed', label: '₹500',  textColor: 'white' },
  200:  { color: '#f59e0b', label: '₹200',  textColor: 'white' },
  100:  { color: '#3b82f6', label: '₹100',  textColor: 'white' },
  50:   { color: '#10b981', label: '₹50',   textColor: 'white' },
  20:   { color: '#f97316', label: '₹20',   textColor: 'white' },
  10:   { color: '#06b6d4', label: '₹10',   textColor: 'white' }
}

const COIN_CONFIG = {
  5:    { color: '#fbbf24', label: '₹5',   r: 18, type: 'coin' },
  2:    { color: '#d1d5db', label: '₹2',   r: 15, type: 'coin' },
  1:    { color: '#d1d5db', label: '₹1',   r: 12, type: 'coin' }
}

export default function MoneyIndiaDiagram({ params = {}, size = 300 }) {
  const {
    amounts = [
      { denomination: 100, count: 1 },
      { denomination: 50, count: 1 },
      { denomination: 10, count: 2 },
      { denomination: 5, count: 3 }
    ],
    totalLabel = true
  } = params

  const noteW = 72, noteH = 36, coinR = 18
  const padX = 14, padY = 12, gap = 8

  let curX = padX, curY = padY
  const elements = []

  let totalRs = 0

  for (const { denomination: denom, count } of amounts) {
    const d = Number(denom)
    totalRs += d * count

    const isNote = d >= 10 && NOTE_CONFIG[d]
    const isCoin = COIN_CONFIG[d]

    for (let i = 0; i < Math.min(count, 5); i++) {
      if (isNote) {
        const cfg = NOTE_CONFIG[d]
        if (curX + noteW > size - padX) { curX = padX; curY += noteH + gap }
        elements.push({ type: 'note', x: curX, y: curY, w: noteW, h: noteH, ...cfg, denomination: d, idx: i })
        curX += noteW + gap
      } else if (isCoin) {
        const cfg = COIN_CONFIG[d]
        if (curX + cfg.r * 2 > size - padX) { curX = padX; curY += cfg.r * 2 + gap + 4 }
        elements.push({ type: 'coin', x: curX + cfg.r, y: curY + cfg.r, ...cfg, denomination: d, idx: i })
        curX += cfg.r * 2 + gap
      }
    }
    // Move to next row for next denomination
    if (elements.length > 0) { curX = padX; curY += isNote ? noteH + gap : coinR * 2 + gap + 4 }
  }

  const svgH = Math.max(curY + (totalLabel ? 28 : 8), 80)

  return (
    <svg width={size} height={svgH} viewBox={`0 0 ${size} ${svgH}`}>
      {elements.map((el, i) => {
        if (el.type === 'note') {
          return (
            <g key={i}>
              <rect x={el.x} y={el.y} width={el.w} height={el.h}
                fill={el.color} rx="5" stroke="#334155" strokeWidth="1.2" />
              {/* Ashoka pillar symbol */}
              <text x={el.x + 8} y={el.y + el.h / 2 + 5} fontSize={14} fill={el.textColor} opacity="0.5">🏛</text>
              <text x={el.x + el.w / 2} y={el.y + el.h / 2 + 5}
                textAnchor="middle" fontSize={13} fontWeight="700" fill={el.textColor}>
                {el.label}
              </text>
              {/* RBI text */}
              <text x={el.x + el.w - 6} y={el.y + 10} textAnchor="end" fontSize={6} fill={el.textColor} opacity="0.7">
                RBI
              </text>
            </g>
          )
        }
        // Coin
        return (
          <g key={i}>
            <circle cx={el.x} cy={el.y} r={el.r} fill={el.color} stroke="#92400e" strokeWidth="1.5" />
            <circle cx={el.x} cy={el.y} r={el.r - 4} fill="none" stroke="#92400e" strokeWidth="0.8" opacity="0.5" />
            <text x={el.x} y={el.y + 4} textAnchor="middle" fontSize={10} fontWeight="700" fill="#334155">
              {el.label}
            </text>
          </g>
        )
      })}

      {totalLabel && (
        <text x={size / 2} y={svgH - 5} textAnchor="middle" fontSize={13} fontWeight="700" fill="#334155">
          Total = ₹{totalRs.toFixed(2)}
        </text>
      )}
    </svg>
  )
}

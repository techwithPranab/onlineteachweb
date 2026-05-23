/**
 * ComboStreakBanner — glowing banner that appears when answering 3+ questions correctly in a row.
 * Props:
 *   comboCount {number}  — current consecutive correct answers
 */
export default function ComboStreakBanner({ comboCount = 0 }) {
  if (comboCount < 2) return null

  const labels = {
    2: { text: '2× Combo!', sub: 'Keep it going!', color: 'from-blue-400 to-cyan-400' },
    3: { text: '3× Combo!', sub: "You're on fire!", color: 'from-orange-400 to-amber-400' },
    4: { text: '4× Combo!', sub: 'Unstoppable!', color: 'from-rose-500 to-pink-500' },
    5: { text: '5× COMBO!', sub: 'LEGENDARY!', color: 'from-purple-500 to-indigo-500' },
  }

  const clamp = Math.min(comboCount, 5)
  const info = labels[clamp] || labels[5]

  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-gradient-to-r ${info.color} text-white px-5 py-3 flex items-center gap-3 shadow-lg animate-bounce-once mb-4`}
      style={{ animation: 'comboSlideIn 0.35s cubic-bezier(0.34,1.56,0.64,1) both' }}
    >
      {/* Shine effect */}
      <div className="absolute inset-0 bg-white/10 backdrop-blur-sm rounded-xl pointer-events-none" />

      <div className="text-3xl relative z-10">🔥</div>
      <div className="relative z-10">
        <div className="text-lg font-black leading-none">{info.text}</div>
        <div className="text-xs font-semibold opacity-90">{info.sub}</div>
      </div>
      <div className="ml-auto text-4xl font-black opacity-20 relative z-0 select-none">
        {comboCount}×
      </div>
    </div>
  )
}

import { useEffect } from 'react'
import { useXPStore } from '@/store/xpStore'
import { LEVEL_GRADIENTS } from '@/utils/xpSystem'

/**
 * LevelUpCelebration — full-screen overlay that fires when a student levels up.
 * Auto-dismisses after 3 seconds. Also plays on manual dismiss.
 * Rendered once inside DashboardLayout so it covers the entire viewport.
 */
export default function LevelUpCelebration() {
  const { isLevelingUp, levelUpDetails, clearLevelUp } = useXPStore()

  useEffect(() => {
    if (!isLevelingUp) return
    const t = setTimeout(() => clearLevelUp(), 3200)
    return () => clearTimeout(t)
  }, [isLevelingUp, clearLevelUp])

  if (!isLevelingUp || !levelUpDetails) return null

  const { from, to } = levelUpDetails
  const gradientClass = LEVEL_GRADIENTS[to.level] || LEVEL_GRADIENTS[1]

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={clearLevelUp}
      role="dialog"
      aria-modal="true"
      aria-label="Level Up Celebration"
    >
      {/* Particle burst rings */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className={`levelup-ring bg-gradient-to-r ${gradientClass}`}
            style={{ animationDelay: `${i * 0.08}s` }}
          />
        ))}
      </div>

      {/* Central card */}
      <div className="relative z-10 text-center px-8 py-10 bg-white rounded-3xl shadow-2xl max-w-sm mx-4 animate-levelUpCard">
        {/* Emoji burst */}
        <div className="text-7xl mb-3 animate-bounce select-none">{to.emoji}</div>

        <p className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-1">
          Level Up!
        </p>
        <h2 className={`text-4xl font-extrabold bg-gradient-to-r ${gradientClass} bg-clip-text text-transparent mb-2`}>
          {to.title}
        </h2>
        <p className="text-gray-500 text-sm mb-6">
          You reached <span className="font-bold text-gray-800">Level {to.level}</span>{' '}
          from Level {from.level}. Keep going! 🚀
        </p>

        <button
          onClick={(e) => { e.stopPropagation(); clearLevelUp() }}
          className={`px-6 py-2.5 rounded-xl text-white font-semibold bg-gradient-to-r ${gradientClass} shadow-lg hover:opacity-90 transition-opacity`}
        >
          Let's Go! 🎮
        </button>

        <p className="mt-3 text-xs text-gray-400">tap anywhere to dismiss</p>
      </div>
    </div>
  )
}

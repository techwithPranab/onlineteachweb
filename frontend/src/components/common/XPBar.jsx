import { useEffect, useRef, useState } from 'react'
import { useXPStore } from '@/store/xpStore'
import { LEVEL_GRADIENTS, LEVEL_BADGE_BG } from '@/utils/xpSystem'

/**
 * XPBar — the persistent XP / level progress strip shown below the header
 * for student users. Displays:
 *   [Level Badge]  [Title + Emoji]  [Animated Progress Bar]  [XP / Next Level]
 *
 * Props:
 *   compact  {boolean}  — slim single-line variant for sidebar use
 */
export default function XPBar({ compact = false }) {
  const { totalXP, levelInfo } = useXPStore()
  const { currentLevel, nextLevel, xpIntoLevel, xpNeededForNext, progressPercent, isMaxLevel } = levelInfo

  // Animate fill on mount / when XP changes
  const [displayPercent, setDisplayPercent] = useState(0)
  const prevLevelRef = useRef(currentLevel.level)
  const [justLeveledUp, setJustLeveledUp] = useState(false)

  useEffect(() => {
    // Short delay so the CSS transition fires visually
    const t = setTimeout(() => setDisplayPercent(progressPercent), 120)
    return () => clearTimeout(t)
  }, [progressPercent])

  // Flash "Level Up!" when level increases
  useEffect(() => {
    if (currentLevel.level > prevLevelRef.current) {
      setJustLeveledUp(true)
      prevLevelRef.current = currentLevel.level
      const t = setTimeout(() => setJustLeveledUp(false), 2500)
      return () => clearTimeout(t)
    }
    prevLevelRef.current = currentLevel.level
  }, [currentLevel.level])

  const gradientClass = LEVEL_GRADIENTS[currentLevel.level] || LEVEL_GRADIENTS[1]
  const badgeBg = LEVEL_BADGE_BG[currentLevel.level] || LEVEL_BADGE_BG[1]

  if (compact) {
    return (
      <div className="xp-bar-compact px-3 py-2">
        {/* Level badge + title */}
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${badgeBg}`}>
              Lv.{currentLevel.level}
            </span>
            <span className="text-xs font-semibold text-gray-700">
              {currentLevel.emoji} {currentLevel.title}
            </span>
          </div>
          <span className="text-xs text-gray-500 font-medium">
            {totalXP.toLocaleString()} XP
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${gradientClass} transition-all duration-1000 ease-out`}
            style={{ width: `${displayPercent}%` }}
          />
        </div>

        {!isMaxLevel && (
          <p className="text-right text-[10px] text-gray-400 mt-0.5">
            {xpIntoLevel}/{xpNeededForNext} → Lv.{nextLevel.level}
          </p>
        )}
      </div>
    )
  }

  // ── Full horizontal strip ────────────────────────────────────────────────────
  return (
    <div className={`xp-bar-strip relative overflow-hidden bg-white border-b border-gray-100 px-4 sm:px-6 py-2 ${justLeveledUp ? 'xp-level-up-flash' : ''}`}>
      {/* Subtle gradient tint behind the bar */}
      <div className={`absolute inset-0 opacity-5 bg-gradient-to-r ${gradientClass} pointer-events-none`} />

      <div className="relative flex items-center gap-3 max-w-7xl mx-auto">
        {/* Level badge */}
        <div className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full border font-bold text-sm select-none transition-transform hover:scale-105 cursor-default ${badgeBg}`}>
          <span className="text-base leading-none">{currentLevel.emoji}</span>
          <span>Lv.{currentLevel.level}</span>
        </div>

        {/* Title */}
        <div className="hidden sm:flex flex-shrink-0 items-center gap-1">
          <span className="text-sm font-semibold text-gray-800">{currentLevel.title}</span>
          {justLeveledUp && (
            <span className="ml-1 text-xs font-bold text-white bg-gradient-to-r from-purple-500 to-pink-500 px-2 py-0.5 rounded-full animate-bounce">
              LEVEL UP! 🎉
            </span>
          )}
        </div>

        {/* Progress bar — takes remaining space */}
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden shadow-inner">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${gradientClass} transition-all duration-1000 ease-out shadow-sm`}
              style={{ width: `${displayPercent}%` }}
            />
          </div>
        </div>

        {/* XP text */}
        <div className="flex-shrink-0 text-right">
          {isMaxLevel ? (
            <span className="text-xs font-bold text-amber-600">MAX LEVEL 👑</span>
          ) : (
            <span className="text-xs font-medium text-gray-500 whitespace-nowrap">
              <span className="font-bold text-gray-800">{xpIntoLevel.toLocaleString()}</span>
              <span className="text-gray-400">/{xpNeededForNext.toLocaleString()} XP</span>
              <span className="ml-1.5 hidden sm:inline text-gray-400">→ Lv.{nextLevel?.level}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

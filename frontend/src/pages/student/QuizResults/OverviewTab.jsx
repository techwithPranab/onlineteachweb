import React, { useEffect, useRef, useState } from 'react';

function AnimatedNumber({ target, duration = 1200, suffix = '' }) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (target === 0) return
    let start = 0
    const step = Math.ceil(target / (duration / 16))
    const timer = setInterval(() => {
      start += step
      if (start >= target) { setValue(target); clearInterval(timer) }
      else setValue(start)
    }, 16)
    return () => clearInterval(timer)
  }, [target, duration])
  return <>{value}{suffix}</>
}

const STAT_CARDS = (ev, session, formatTime) => [
  { label: 'Total Questions', value: ev?.totalQuestions || 0,   color: 'from-indigo-500 to-purple-500',  emoji: '📋', suffix: '' },
  { label: 'Correct',         value: ev?.correct || 0,          color: 'from-emerald-500 to-teal-500',   emoji: '✅', suffix: '' },
  { label: 'Wrong',           value: ev?.wrong || 0,            color: 'from-rose-500 to-red-500',       emoji: '❌', suffix: '' },
  { label: 'Unattempted',     value: ev?.unattempted || 0,      color: 'from-gray-400 to-gray-500',      emoji: '⏭️', suffix: '' },
  { label: 'Accuracy',        value: Math.round(ev?.accuracy || 0), color: 'from-blue-500 to-cyan-500', emoji: '🎯', suffix: '%' },
  { label: 'Attempt #',       value: session?.attemptNumber || 1, color: 'from-amber-500 to-orange-500', emoji: '🔁', suffix: '' },
]

export default function OverviewTab({ session, evaluation, formatTime }) {
  const ev = evaluation?.overallAnalysis
  const score = Math.round(ev?.accuracy || 0)
  const isPassing = score >= 70

  const scoreRing = (score / 100) * 282 // circumference ≈ 2π×45

  return (
    <div className="space-y-6">
      {/* Big score hero */}
      <div className={`rounded-2xl p-6 text-white text-center bg-gradient-to-br ${isPassing ? 'from-emerald-500 to-teal-600' : 'from-rose-500 to-red-600'} shadow-lg`}>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          {/* SVG ring */}
          <div className="relative w-32 h-32 flex-shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="45"
                fill="none"
                stroke="white"
                strokeWidth="8"
                strokeDasharray="282"
                strokeDashoffset={282 - scoreRing}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1.2s ease-out' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black leading-none">
                <AnimatedNumber target={score} suffix="%" />
              </span>
              <span className="text-xs font-semibold opacity-80">Accuracy</span>
            </div>
          </div>
          {/* Labels */}
          <div className="text-left">
            <div className="text-4xl mb-1">{isPassing ? '🏆' : '💪'}</div>
            <div className="text-2xl font-black">{isPassing ? 'Great Work!' : 'Keep Pushing!'}</div>
            <div className="text-white/80 text-sm mt-1">
              {isPassing ? 'You passed — fantastic performance!' : 'Practice makes perfect. Try again!'}
            </div>
            <div className="mt-2 text-sm font-semibold bg-white/20 inline-block px-3 py-1 rounded-full">
              Time: {formatTime(session?.timeSpent)}
            </div>
          </div>
        </div>
      </div>

      {/* Stat cards grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {STAT_CARDS(ev, session, formatTime).map((card) => (
          <div key={card.label} className={`rounded-xl bg-gradient-to-br ${card.color} p-4 text-white shadow-md`}>
            <div className="text-2xl mb-1">{card.emoji}</div>
            <div className="text-2xl font-black leading-none">
              <AnimatedNumber target={card.value} suffix={card.suffix} />
            </div>
            <div className="text-xs font-semibold opacity-80 mt-0.5">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Time management badge */}
      {evaluation?.timeAnalysis?.timeManagementRating && (
        <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-200 rounded-xl p-4">
          <div className="text-2xl">⏱️</div>
          <div>
            <div className="text-xs text-indigo-500 font-semibold uppercase tracking-wide">Time Management</div>
            <div className={`text-lg font-bold capitalize ${
              evaluation.timeAnalysis.timeManagementRating === 'excellent' ? 'text-emerald-600' :
              evaluation.timeAnalysis.timeManagementRating === 'good'      ? 'text-blue-600' :
              evaluation.timeAnalysis.timeManagementRating === 'average'   ? 'text-amber-600' : 'text-red-600'
            }`}>
              {evaluation.timeAnalysis.timeManagementRating}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


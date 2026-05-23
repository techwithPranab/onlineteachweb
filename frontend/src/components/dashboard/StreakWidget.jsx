import { useStreakStore } from '@/store/streakStore'

/**
 * StreakWidget — shows the student's daily login streak + 30-day activity grid.
 */
export default function StreakWidget() {
  const { currentStreak, longestStreak, activityDates, loading } = useStreakStore()

  // Build last-30-days grid
  const today = new Date()
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() - (29 - i))
    return d.toISOString().split('T')[0]
  })

  const activeSet = new Set(activityDates)

  const streakMessage =
    currentStreak === 0 ? 'Start your streak today! 🌱' :
    currentStreak < 3   ? 'Keep going! 💪' :
    currentStreak < 7   ? 'On fire! 🔥' :
    currentStreak < 14  ? 'Unstoppable! 🌟' :
    currentStreak < 30  ? 'Legendary! 🏆' :
    'Absolute Legend! 👑'

  return (
    <div className="genz-card p-4 sm:p-5 relative overflow-hidden">
      {/* Ambient glow behind the fire */}
      <div className="absolute -top-6 -right-6 w-24 h-24 bg-orange-400/10 rounded-full blur-xl pointer-events-none" />

      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Daily Streak</h3>
          <div className="flex items-center gap-2">
            <span className="text-4xl sm:text-5xl font-extrabold text-gray-900 tabular-nums leading-none">
              {loading ? '—' : currentStreak}
            </span>
            <div>
              <div className="text-2xl leading-none">🔥</div>
              <div className="text-xs text-gray-500 mt-0.5">days</div>
            </div>
          </div>
          <p className="text-xs text-orange-600 font-semibold mt-1">{streakMessage}</p>
        </div>

        <div className="text-right">
          <div className="text-xs text-gray-500 mb-0.5">Best streak</div>
          <div className="text-lg font-bold text-amber-600">
            🏅 {loading ? '—' : longestStreak} days
          </div>
        </div>
      </div>

      {/* 30-day activity grid */}
      <div>
        <p className="text-xs text-gray-400 mb-2">Last 30 days</p>
        <div className="flex gap-1 flex-wrap">
          {days.map((day) => (
            <div
              key={day}
              title={day}
              className={`w-4 h-4 rounded-sm transition-all ${
                activeSet.has(day)
                  ? 'bg-emerald-500 shadow-sm shadow-emerald-300'
                  : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-gray-400 mt-1">
          <span>30 days ago</span>
          <span>Today</span>
        </div>
      </div>
    </div>
  )
}

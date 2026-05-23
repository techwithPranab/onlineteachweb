/**
 * DailyMissions — shows 3 daily quests computed from quiz history.
 * Props:
 *   quizHistory {Array}  — full quiz history array already fetched in the dashboard
 */

const MISSIONS = [
  {
    id: 'quiz_today',
    emoji: '🎯',
    title: 'Take a Quiz',
    desc: 'Complete any quiz today',
    xp: 10,
    completed: (history) => {
      const today = new Date().toDateString()
      return history.some(q => new Date(q.completedAt || q.createdAt).toDateString() === today)
    },
    progress: (history) => {
      const today = new Date().toDateString()
      const done = history.filter(q => new Date(q.completedAt || q.createdAt).toDateString() === today).length
      return Math.min(100, done * 100)
    },
  },
  {
    id: 'score_70',
    emoji: '⭐',
    title: 'Score 70%+',
    desc: 'Achieve 70% or higher on a quiz today',
    xp: 25,
    completed: (history) => {
      const today = new Date().toDateString()
      return history.some(q => {
        const isToday = new Date(q.completedAt || q.createdAt).toDateString() === today
        const score = q.score ?? q.percentage ?? 0
        return isToday && score >= 70
      })
    },
    progress: (history) => {
      const today = new Date().toDateString()
      const todayScores = history
        .filter(q => new Date(q.completedAt || q.createdAt).toDateString() === today)
        .map(q => q.score ?? q.percentage ?? 0)
      if (todayScores.length === 0) return 0
      return Math.min(100, Math.round((Math.max(...todayScores) / 70) * 100))
    },
  },
  {
    id: 'answer_10',
    emoji: '📝',
    title: 'Answer 10 Questions',
    desc: 'Answer at least 10 questions across quizzes today',
    xp: 15,
    completed: (history) => {
      const today = new Date().toDateString()
      const total = history
        .filter(q => new Date(q.completedAt || q.createdAt).toDateString() === today)
        .reduce((s, q) => s + (q.totalQuestions || 0), 0)
      return total >= 10
    },
    progress: (history) => {
      const today = new Date().toDateString()
      const total = history
        .filter(q => new Date(q.completedAt || q.createdAt).toDateString() === today)
        .reduce((s, q) => s + (q.totalQuestions || 0), 0)
      return Math.min(100, Math.round((total / 10) * 100))
    },
  },
]

export default function DailyMissions({ quizHistory = [] }) {
  const completedCount = MISSIONS.filter(m => m.completed(quizHistory)).length
  const totalXPAvailable = MISSIONS.reduce((s, m) => s + m.xp, 0)
  const earnedXP = MISSIONS.filter(m => m.completed(quizHistory)).reduce((s, m) => s + m.xp, 0)

  return (
    <div className="genz-card p-4 sm:p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Daily Quests</h3>
          <p className="text-xs text-gray-400 mt-0.5">Resets at midnight · {completedCount}/3 completed</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500">XP available</div>
          <div className="text-sm font-bold text-emerald-600">
            {earnedXP}/{totalXPAvailable} XP
          </div>
        </div>
      </div>

      {/* Missions */}
      <div className="space-y-3">
        {MISSIONS.map((mission) => {
          const done = mission.completed(quizHistory)
          const pct  = mission.progress(quizHistory)
          return (
            <div
              key={mission.id}
              className={`rounded-xl border-2 p-3 transition-all ${
                done
                  ? 'border-emerald-300 bg-emerald-50'
                  : 'border-gray-200 bg-white hover:border-indigo-200'
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Completion ring */}
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-lg flex-shrink-0 ${
                  done ? 'bg-emerald-500 text-white' : 'bg-gray-100'
                }`}>
                  {done ? '✓' : mission.emoji}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-sm font-semibold ${done ? 'text-emerald-700 line-through' : 'text-gray-800'}`}>
                      {mission.title}
                    </span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                      done ? 'bg-emerald-500 text-white' : 'bg-amber-100 text-amber-700'
                    }`}>
                      +{mission.xp} XP
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-1.5">{mission.desc}</p>
                  {/* Progress bar */}
                  {!done && (
                    <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-purple-500 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* All done message */}
      {completedCount === MISSIONS.length && (
        <div className="mt-3 p-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl text-center text-white">
          <div className="text-xl mb-1">🎉</div>
          <p className="text-sm font-bold">All quests complete!</p>
          <p className="text-xs opacity-90">Come back tomorrow for new quests</p>
        </div>
      )}
    </div>
  )
}

import { useQuery } from 'react-query'
import { useAuthStore } from '@/store/authStore'
import { leaderboardService } from '@/services/apiServices'
import { Trophy } from 'lucide-react'
import { Link } from 'react-router-dom'

const MEDALS = ['🥇', '🥈', '🥉']

export default function LeaderboardWidget() {
  const { user } = useAuthStore()

  const { data, isLoading } = useQuery(
    ['leaderboard-widget'],
    () => leaderboardService.getLeaderboard(5),
    { enabled: !!user, staleTime: 5 * 60 * 1000 }
  )

  const entries = data?.data?.leaderboard || []
  const myRank  = data?.data?.myRank

  return (
    <div className="genz-card p-4 sm:p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-bold text-gray-700 uppercase tracking-wider">Leaderboard</span>
        </div>
        {myRank && (
          <span className="text-xs font-semibold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
            Your rank: #{myRank}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry, i) => (
            <div
              key={entry.userId}
              className={`flex items-center gap-3 p-2 rounded-xl ${
                entry.isMe
                  ? 'bg-indigo-50 border-2 border-indigo-300'
                  : 'hover:bg-gray-50'
              }`}
            >
              <span className="text-lg w-7 text-center flex-shrink-0">{MEDALS[i] || `#${entry.rank}`}</span>
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-semibold truncate ${entry.isMe ? 'text-indigo-700' : 'text-gray-800'}`}>
                  {entry.name} {entry.isMe && '(You)'}
                </div>
                <div className="text-xs text-gray-400">{entry.title} · {entry.totalXP} XP</div>
              </div>
              <span className="text-sm font-bold text-amber-500 flex-shrink-0">{entry.emoji}</span>
            </div>
          ))}
        </div>
      )}

      <Link
        to="/student/leaderboard"
        className="block mt-4 text-center text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
      >
        View full leaderboard →
      </Link>
    </div>
  )
}

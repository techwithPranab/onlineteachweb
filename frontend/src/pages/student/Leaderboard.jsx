import { useQuery } from 'react-query'
import { useAuthStore } from '@/store/authStore'
import { leaderboardService } from '@/services/apiServices'
import { Trophy, Medal } from 'lucide-react'
import SEOHead from '@/components/SEO/SEOHead'

const MEDALS = ['🥇', '🥈', '🥉']
const PODIUM_HEIGHTS = ['h-28', 'h-20', 'h-16']
const PODIUM_ORDER = [1, 0, 2] // center = #1

export default function Leaderboard() {
  const { user } = useAuthStore()

  const { data, isLoading } = useQuery(
    ['leaderboard-full'],
    () => leaderboardService.getLeaderboard(20),
    { enabled: !!user, staleTime: 2 * 60 * 1000 }
  )

  const entries = data?.data?.leaderboard || []
  const myRank  = data?.data?.myRank
  const myXP    = data?.data?.myXP
  const top3    = entries.slice(0, 3)
  const rest    = entries.slice(3)

  return (
    <>
      <SEOHead title="Leaderboard" noIndex noFollow />
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-8">

        {/* Header */}
        <div className="text-center">
          <div className="text-4xl mb-2">🏆</div>
          <h1 className="text-2xl font-black text-gray-900">Top Learners</h1>
          <p className="text-gray-500 text-sm">Based on total XP earned</p>
          {myRank && (
            <div className="mt-3 inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 font-semibold px-4 py-1.5 rounded-full text-sm">
              <Trophy className="w-4 h-4" /> You are ranked #{myRank} · {myXP} XP
            </div>
          )}
        </div>

        {/* Podium */}
        {!isLoading && top3.length === 3 && (
          <div className="flex items-end justify-center gap-4 pt-4">
            {PODIUM_ORDER.map((idx) => {
              const entry = top3[idx]
              if (!entry) return null
              const isFirst = idx === 0
              return (
                <div key={entry.userId} className="flex flex-col items-center gap-2 flex-1 max-w-[120px]">
                  <div className="text-3xl">{entry.emoji}</div>
                  <div className="text-center">
                    <div className={`text-sm font-bold truncate ${entry.isMe ? 'text-indigo-700' : 'text-gray-800'}`}>
                      {entry.name}
                    </div>
                    <div className="text-xs text-gray-400">{entry.totalXP} XP</div>
                  </div>
                  <div className={`w-full ${PODIUM_HEIGHTS[idx]} rounded-t-xl flex items-start justify-center pt-2 font-black text-white text-xl
                    ${idx === 0 ? 'bg-gradient-to-b from-amber-400 to-amber-600'
                      : idx === 1 ? 'bg-gradient-to-b from-gray-300 to-gray-500'
                      : 'bg-gradient-to-b from-orange-400 to-orange-600'
                    }`}
                  >
                    {MEDALS[idx]}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Rest of leaderboard */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="genz-card overflow-hidden">
            {rest.map((entry) => (
              <div
                key={entry.userId}
                className={`flex items-center gap-4 px-4 py-3 border-b border-gray-100 last:border-0 ${
                  entry.isMe ? 'bg-indigo-50' : 'hover:bg-gray-50'
                }`}
              >
                <span className="w-8 text-center font-black text-gray-400">#{entry.rank}</span>
                <div className="text-xl">{entry.emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className={`font-semibold text-sm truncate ${entry.isMe ? 'text-indigo-700' : 'text-gray-800'}`}>
                    {entry.name} {entry.isMe && '← You'}
                  </div>
                  <div className="text-xs text-gray-400">{entry.title}</div>
                </div>
                <div className="text-sm font-bold text-amber-600">{entry.totalXP} XP</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

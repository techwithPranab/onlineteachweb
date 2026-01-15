import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import aiQuestionService from '../../services/aiQuestionService'

export default function AIQuestionsDashboardWidget() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [recentDrafts, setRecentDrafts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [statsResponse, draftsResponse] = await Promise.all([
        aiQuestionService.getStatistics(),
        aiQuestionService.getDrafts({ status: 'draft', limit: 5 })
      ])
      
      setStats(statsResponse.stats)
      setRecentDrafts(draftsResponse.drafts || [])
    } catch (err) {
      console.error('Failed to load AI questions data:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusCounts = () => {
    if (!stats?.byStatus) return { draft: 0, approved: 0, rejected: 0 }
    
    const counts = { draft: 0, approved: 0, rejected: 0 }
    stats.byStatus.forEach(s => {
      if (counts.hasOwnProperty(s._id)) {
        counts[s._id] = s.count
      }
    })
    return counts
  }

  const statusCounts = getStatusCounts()

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">AI Question Generation</h3>
        <button
          onClick={() => navigate('/tutor/ai-questions/generate')}
          className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
        >
          Generate New →
        </button>
      </div>
      
      <div className="p-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{statusCounts.draft}</div>
            <div className="text-xs text-yellow-700">Pending Review</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{statusCounts.approved}</div>
            <div className="text-xs text-green-700">Approved</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{statusCounts.rejected}</div>
            <div className="text-xs text-red-700">Rejected</div>
          </div>
        </div>

        {/* Recent Drafts */}
        {recentDrafts.length > 0 ? (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Recent Drafts Awaiting Review</h4>
            <div className="space-y-2">
              {recentDrafts.slice(0, 3).map(draft => (
                <div 
                  key={draft._id}
                  className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                  onClick={() => navigate('/tutor/ai-questions/review')}
                >
                  <p className="text-sm text-gray-900 line-clamp-1">
                    {draft.questionPayload?.text || 'No text available'}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">{draft.topic}</span>
                    <span className="text-xs px-2 py-0.5 bg-gray-200 rounded">
                      {draft.difficultyLevel}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            {statusCounts.draft > 3 && (
              <button
                onClick={() => navigate('/tutor/ai-questions/review')}
                className="mt-3 w-full py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              >
                View All {statusCounts.draft} Pending →
              </button>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-500 text-sm mb-3">No drafts pending review</p>
            <button
              onClick={() => navigate('/tutor/ai-questions/generate')}
              className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
            >
              Generate Questions
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

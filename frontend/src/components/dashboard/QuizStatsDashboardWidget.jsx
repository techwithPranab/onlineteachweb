import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { quizService, quizEvaluationService } from '../../services/apiServices'

export default function QuizStatsDashboardWidget() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [pendingEvaluations, setPendingEvaluations] = useState(0)
  const [recentQuizzes, setRecentQuizzes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [quizzesResponse, evaluationsResponse] = await Promise.all([
        quizService.getQuizzes({ limit: 5, sort: '-createdAt' }),
        quizEvaluationService.getPendingEvaluations({ limit: 1 })
      ])
      
      setRecentQuizzes(quizzesResponse.quizzes || [])
      setPendingEvaluations(evaluationsResponse.pagination?.total || 0)
      
      // Calculate aggregate stats
      const quizzes = quizzesResponse.quizzes || []
      const aggregateStats = {
        total: quizzesResponse.pagination?.total || quizzes.length,
        published: quizzes.filter(q => q.status === 'published').length,
        draft: quizzes.filter(q => q.status === 'draft').length,
        totalAttempts: quizzes.reduce((sum, q) => sum + (q.stats?.totalAttempts || 0), 0)
      }
      setStats(aggregateStats)
    } catch (err) {
      console.error('Failed to load quiz stats:', err)
    } finally {
      setLoading(false)
    }
  }

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
        <h3 className="text-lg font-semibold text-gray-900">Quiz Overview</h3>
        <button
          onClick={() => navigate('/tutor/quizzes')}
          className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
        >
          Manage Quizzes →
        </button>
      </div>
      
      <div className="p-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats?.total || 0}</div>
            <div className="text-xs text-blue-700">Total Quizzes</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats?.published || 0}</div>
            <div className="text-xs text-green-700">Published</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{stats?.totalAttempts || 0}</div>
            <div className="text-xs text-purple-700">Total Attempts</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{pendingEvaluations}</div>
            <div className="text-xs text-orange-700">Pending Evaluation</div>
          </div>
        </div>

        {/* Pending Evaluations Alert */}
        {pendingEvaluations > 0 && (
          <div 
            className="mb-4 p-3 bg-orange-100 border border-orange-300 rounded-lg cursor-pointer hover:bg-orange-200 transition-colors"
            onClick={() => navigate('/tutor/evaluate')}
          >
            <div className="flex items-center gap-2">
              <span className="text-orange-600">⚠️</span>
              <span className="text-orange-800 font-medium">
                {pendingEvaluations} quiz{pendingEvaluations !== 1 ? 'zes' : ''} require manual evaluation
              </span>
              <span className="text-orange-600 ml-auto">→</span>
            </div>
          </div>
        )}

        {/* Recent Quizzes */}
        {recentQuizzes.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Recent Quizzes</h4>
            <div className="space-y-2">
              {recentQuizzes.slice(0, 3).map(quiz => (
                <div 
                  key={quiz._id}
                  className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer flex items-center justify-between"
                  onClick={() => navigate(`/tutor/analytics/${quiz._id}`)}
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{quiz.title}</p>
                    <p className="text-xs text-gray-500">
                      {quiz.stats?.totalAttempts || 0} attempts • 
                      {quiz.stats?.passRate ? ` ${Math.round(quiz.stats.passRate)}% pass rate` : ' No attempts yet'}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    quiz.status === 'published' ? 'bg-green-100 text-green-700' :
                    quiz.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {quiz.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-4 pt-4 border-t flex gap-2">
          <button
            onClick={() => navigate('/tutor/quizzes/new')}
            className="flex-1 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            + Create Quiz
          </button>
          <button
            onClick={() => navigate('/tutor/questions')}
            className="flex-1 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Question Bank
          </button>
        </div>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { quizService } from '../../services/apiServices'

export default function UpcomingQuizzesWidget({ courseId }) {
  const navigate = useNavigate()
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchQuizzes()
  }, [courseId])

  const fetchQuizzes = async () => {
    try {
      const response = courseId 
        ? await quizService.getAvailableQuizzes(courseId)
        : await quizService.getQuizzes({ status: 'published', limit: 5 })
      
      // Filter to show only quizzes with attempts remaining
      const available = (response.quizzes || response || []).filter(q => q.canAttempt !== false)
      setQuizzes(available.slice(0, 5))
    } catch (err) {
      console.error('Failed to load quizzes:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (minutes) => {
    const hrs = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hrs > 0) return `${hrs}h ${mins}m`
    return `${mins}m`
  }

  const getDifficultyBadge = (level) => {
    const styles = {
      easy: 'bg-green-100 text-green-700',
      medium: 'bg-yellow-100 text-yellow-700',
      hard: 'bg-red-100 text-red-700'
    }
    return styles[level] || 'bg-gray-100 text-gray-700'
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
        <h3 className="text-lg font-semibold text-gray-900">Available Quizzes</h3>
        <button
          onClick={() => navigate('/student/quizzes')}
          className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
        >
          View All →
        </button>
      </div>
      
      <div className="divide-y">
        {quizzes.length > 0 ? (
          quizzes.map(quiz => (
            <div 
              key={quiz._id}
              className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => navigate(`/student/quiz/${quiz._id}/attempt`)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{quiz.title}</h4>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {formatTime(quiz.duration)}
                    </span>
                    <span>{quiz.questionConfig?.totalQuestions || '?'} questions</span>
                    <span>{quiz.totalMarks} marks</span>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs ${getDifficultyBadge(quiz.difficultyLevel)}`}>
                    {quiz.difficultyLevel}
                  </span>
                  {quiz.attemptsRemaining !== undefined && (
                    <span className="text-xs text-gray-500">
                      {quiz.attemptsRemaining} attempt{quiz.attemptsRemaining !== 1 ? 's' : ''} left
                    </span>
                  )}
                </div>
              </div>
              
              {/* Scheduling info if applicable */}
              {quiz.scheduling?.isScheduled && quiz.scheduling?.endTime && (
                <div className="mt-2 text-xs text-orange-600">
                  ⏰ Ends: {new Date(quiz.scheduling.endTime).toLocaleString()}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="p-8 text-center">
            <div className="text-gray-400 mb-2">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-500">No quizzes available right now</p>
            <p className="text-sm text-gray-400 mt-1">Check back later for new quizzes</p>
          </div>
        )}
      </div>
    </div>
  )
}

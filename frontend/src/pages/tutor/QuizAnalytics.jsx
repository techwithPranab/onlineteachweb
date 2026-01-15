import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { quizService, quizEvaluationService, courseService } from '../../services/apiServices'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import ErrorMessage from '../../components/common/ErrorMessage'

export default function QuizAnalytics() {
  const { quizId } = useParams()
  const navigate = useNavigate()

  // If quizId is provided, show specific quiz analytics
  if (quizId) {
    return <SingleQuizAnalytics quizId={quizId} />
  }

  return <OverallAnalytics />
}

// Overall Analytics Dashboard
function OverallAnalytics() {
  const navigate = useNavigate()
  const [courses, setCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState('')
  const [quizzes, setQuizzes] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchCourses()
    fetchOverallStats()
  }, [])

  useEffect(() => {
    if (selectedCourse) {
      fetchCourseQuizzes()
    }
  }, [selectedCourse])

  const fetchCourses = async () => {
    try {
      const response = await courseService.getCourses()
      setCourses(response.courses || [])
    } catch (err) {
      console.error(err)
    }
  }

  const fetchOverallStats = async () => {
    try {
      setLoading(true)
      // This would be a custom endpoint for overall stats
      // For now, we'll simulate with quiz list data
      const response = await quizService.getQuizzes()
      const allQuizzes = response.quizzes || []
      
      // Calculate mock stats
      const totalQuizzes = allQuizzes.length
      const publishedQuizzes = allQuizzes.filter(q => q.status === 'published').length
      
      setStats({
        totalQuizzes,
        publishedQuizzes,
        totalAttempts: 0, // Would come from backend
        avgScore: 0,
        passRate: 0
      })
      setQuizzes(allQuizzes)
    } catch (err) {
      setError('Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  const fetchCourseQuizzes = async () => {
    try {
      const response = await quizService.getQuizzes({ courseId: selectedCourse })
      setQuizzes(response.quizzes || [])
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quiz Analytics</h1>
          <p className="mt-2 text-gray-600">Performance insights and trends</p>
        </div>
        <button
          onClick={() => navigate('/tutor/quizzes')}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Back to Quizzes
        </button>
      </div>

      {error && <ErrorMessage message={error} />}

      {/* Overall Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Quizzes"
          value={stats?.totalQuizzes || 0}
          icon={
            <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
          color="indigo"
        />
        <StatCard
          title="Published"
          value={stats?.publishedQuizzes || 0}
          icon={
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="green"
        />
        <StatCard
          title="Total Attempts"
          value={stats?.totalAttempts || 0}
          icon={
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
          color="blue"
        />
        <StatCard
          title="Avg Pass Rate"
          value={`${stats?.passRate || 0}%`}
          icon={
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
          color="yellow"
        />
      </div>

      {/* Course Filter */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Filter by Course:</label>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2"
          >
            <option value="">All Courses</option>
            {courses.map(course => (
              <option key={course._id} value={course._id}>{course.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Quiz Performance Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Quiz Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quiz</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attempts</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pass Rate</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {quizzes.map(quiz => (
                <tr key={quiz._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{quiz.title}</div>
                    <div className="text-sm text-gray-500">{quiz.questionConfig?.totalQuestions} questions</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {quiz.courseId?.title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      quiz.status === 'published' ? 'bg-green-100 text-green-800' :
                      quiz.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {quiz.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {quiz.attemptCount || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {quiz.avgScore ? `${quiz.avgScore.toFixed(1)}%` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {quiz.passRate !== undefined ? (
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${quiz.passRate}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">{quiz.passRate.toFixed(0)}%</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <button
                      onClick={() => navigate(`/tutor/analytics/${quiz._id}`)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// Single Quiz Analytics
function SingleQuizAnalytics({ quizId }) {
  const navigate = useNavigate()
  const [quiz, setQuiz] = useState(null)
  const [attempts, setAttempts] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchQuizDetails()
    fetchAttempts()
  }, [quizId])

  const fetchQuizDetails = async () => {
    try {
      const response = await quizService.getQuizById(quizId)
      setQuiz(response.quiz)
    } catch (err) {
      setError('Failed to load quiz details')
    }
  }

  const fetchAttempts = async () => {
    try {
      setLoading(true)
      const response = await quizService.getQuizAttempts(quizId)
      const attemptsList = response.attempts || []
      setAttempts(attemptsList)
      
      // Calculate stats
      if (attemptsList.length > 0) {
        const completedAttempts = attemptsList.filter(a => a.status === 'submitted' || a.status === 'evaluated')
        const scores = completedAttempts.map(a => a.evaluationResult?.finalScore || a.autoScore || 0)
        const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
        const passingScore = quiz?.passingPercentage || 40
        const passCount = completedAttempts.filter(a => {
          const score = ((a.evaluationResult?.finalScore || a.autoScore || 0) / (quiz?.totalMarks || 100)) * 100
          return score >= passingScore
        }).length
        
        // Topic analysis
        const topicStats = {}
        completedAttempts.forEach(attempt => {
          if (attempt.evaluationResult?.topicAnalysis) {
            attempt.evaluationResult.topicAnalysis.forEach(ta => {
              if (!topicStats[ta.topic]) {
                topicStats[ta.topic] = { total: 0, correct: 0, count: 0 }
              }
              topicStats[ta.topic].total += ta.totalQuestions
              topicStats[ta.topic].correct += ta.correctAnswers
              topicStats[ta.topic].count++
            })
          }
        })
        
        setStats({
          totalAttempts: attemptsList.length,
          completedAttempts: completedAttempts.length,
          inProgress: attemptsList.filter(a => a.status === 'in-progress').length,
          avgScore,
          highestScore: Math.max(...scores, 0),
          lowestScore: Math.min(...scores, 0),
          passRate: completedAttempts.length > 0 ? (passCount / completedAttempts.length) * 100 : 0,
          topicStats
        })
      } else {
        setStats({
          totalAttempts: 0,
          completedAttempts: 0,
          inProgress: 0,
          avgScore: 0,
          highestScore: 0,
          lowestScore: 0,
          passRate: 0,
          topicStats: {}
        })
      }
    } catch (err) {
      setError('Failed to load attempts')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <LoadingSpinner />
  if (!quiz) return <ErrorMessage message="Quiz not found" />

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{quiz.title}</h1>
          <p className="mt-2 text-gray-600">{quiz.courseId?.title} • Detailed Analytics</p>
        </div>
        <button
          onClick={() => navigate('/tutor/analytics')}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Back to Analytics
        </button>
      </div>

      {error && <ErrorMessage message={error} />}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Attempts" value={stats?.totalAttempts || 0} color="indigo" />
        <StatCard title="Completed" value={stats?.completedAttempts || 0} color="green" />
        <StatCard title="Avg Score" value={`${(stats?.avgScore || 0).toFixed(1)}`} color="blue" />
        <StatCard title="Pass Rate" value={`${(stats?.passRate || 0).toFixed(0)}%`} color="yellow" />
      </div>

      {/* Score Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Score Summary</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Highest Score</span>
              <span className="text-2xl font-bold text-green-600">{stats?.highestScore || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Average Score</span>
              <span className="text-2xl font-bold text-blue-600">{(stats?.avgScore || 0).toFixed(1)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Lowest Score</span>
              <span className="text-2xl font-bold text-red-600">{stats?.lowestScore || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Passing Percentage</span>
              <span className="text-lg font-medium">{quiz.passingPercentage}%</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Attempt Status</h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Completed & Passed</span>
                <span className="font-medium text-green-600">
                  {Math.round((stats?.passRate || 0) * (stats?.completedAttempts || 0) / 100)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-500 h-3 rounded-full"
                  style={{ width: `${stats?.passRate || 0}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Completed & Failed</span>
                <span className="font-medium text-red-600">
                  {(stats?.completedAttempts || 0) - Math.round((stats?.passRate || 0) * (stats?.completedAttempts || 0) / 100)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-red-500 h-3 rounded-full"
                  style={{ width: `${100 - (stats?.passRate || 0)}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>In Progress</span>
                <span className="font-medium text-yellow-600">{stats?.inProgress || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Topic Analysis */}
      {stats?.topicStats && Object.keys(stats.topicStats).length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Topic-wise Performance</h3>
          <div className="space-y-4">
            {Object.entries(stats.topicStats).map(([topic, data]) => {
              const accuracy = data.total > 0 ? (data.correct / data.total) * 100 : 0
              return (
                <div key={topic}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{topic}</span>
                    <span className={accuracy >= 60 ? 'text-green-600' : 'text-red-600'}>
                      {accuracy.toFixed(0)}% accuracy
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${accuracy >= 60 ? 'bg-green-500' : 'bg-red-500'}`}
                      style={{ width: `${accuracy}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Student Attempts Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Student Attempts</h3>
        </div>
        {attempts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No attempts yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Started</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Result</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attempts.map(attempt => {
                  const score = attempt.evaluationResult?.finalScore || attempt.autoScore || 0
                  const percentage = quiz.totalMarks > 0 ? (score / quiz.totalMarks) * 100 : 0
                  const passed = percentage >= (quiz.passingPercentage || 40)
                  
                  return (
                    <tr key={attempt._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
                            <span className="text-indigo-600 text-sm font-medium">
                              {attempt.studentId?.name?.charAt(0) || 'S'}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {attempt.studentId?.name || 'Unknown'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {attempt.studentId?.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(attempt.startedAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          attempt.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                          attempt.status === 'evaluated' ? 'bg-green-100 text-green-800' :
                          attempt.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {attempt.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {attempt.status !== 'in-progress' ? (
                          <span className="font-medium">{score} / {quiz.totalMarks}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {attempt.status !== 'in-progress' && (
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {passed ? 'Passed' : 'Failed'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        {(attempt.status === 'submitted' || attempt.status === 'pending-evaluation') && (
                          <button
                            onClick={() => navigate(`/tutor/evaluate/${attempt._id}`)}
                            className="text-indigo-600 hover:text-indigo-900 mr-3"
                          >
                            Evaluate
                          </button>
                        )}
                        <button
                          onClick={() => navigate(`/tutor/attempts/${attempt._id}`)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// Stat Card Component
function StatCard({ title, value, icon, color = 'indigo' }) {
  const bgColors = {
    indigo: 'bg-indigo-50',
    green: 'bg-green-50',
    blue: 'bg-blue-50',
    yellow: 'bg-yellow-50',
    red: 'bg-red-50'
  }
  
  return (
    <div className={`${bgColors[color]} rounded-lg p-6`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
        </div>
        {icon && <div className="opacity-75">{icon}</div>}
      </div>
    </div>
  )
}

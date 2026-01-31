import { useState } from 'react'
import { useQuery } from 'react-query'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'
import { TrendingUp, Award, Target, Calendar, Clock, BarChart3 } from 'lucide-react'
import { reportService, evaluationService, algorithmQuizService } from '@/services/apiServices'
import { useAuthStore } from '@/store/authStore'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import ErrorMessage from '@/components/common/ErrorMessage'

export default function ProgressReports() {
  const { user } = useAuthStore()
  const [selectedPeriod, setSelectedPeriod] = useState('month')

  const { data: reportData, isLoading, error } = useQuery(
    ['studentReport', user?._id, selectedPeriod],
    () => reportService.getStudentReport(user._id, { period: selectedPeriod })
  )

  const { data: evaluationsData } = useQuery(
    ['evaluations', user?._id],
    () => evaluationService.getStudentEvaluations(user._id)
  )

  const { data: quizHistoryData } = useQuery(
    ['quizHistory', user?._id],
    () => algorithmQuizService.getQuizHistory({ limit: 1000 }) // Get all quiz history for statistics
  )

  if (isLoading) return <LoadingSpinner fullScreen />
  if (error) return <ErrorMessage message={error.message || 'Failed to load reports'} />

  const report = reportData?.data || {}
  const evaluations = Array.isArray(evaluationsData?.data) ? evaluationsData.data : []
  const quizHistory = Array.isArray(quizHistoryData?.data) ? quizHistoryData.data : []

  // Calculate quiz statistics
  const quizStats = Array.isArray(quizHistory) && quizHistory.length > 0 ? {
    totalQuizzes: quizHistory.length,
    passedQuizzes: quizHistory.filter(q => q.accuracy >= 60).length,
    passRate: ((quizHistory.filter(q => q.accuracy >= 60).length / quizHistory.length) * 100).toFixed(1),
    avgAccuracy: (quizHistory.reduce((sum, q) => sum + q.accuracy, 0) / quizHistory.length).toFixed(1),
    avgScore: (quizHistory.reduce((sum, q) => sum + q.score, 0) / quizHistory.length).toFixed(1),
    totalTime: Math.floor(quizHistory.reduce((sum, q) => sum + q.timeTaken, 0) / 60) // minutes
  } : null

  // Use actual data from backend instead of hardcoded values
  const stats = [
    {
      label: 'Overall Progress',
      value: `${report.averageGrade || 0}%`,
      change: '',
      icon: TrendingUp,
      color: 'primary',
    },
    {
      label: 'Attendance Rate',
      value: `${report.attendanceRate || 0}%`,
      change: '',
      icon: Calendar,
      color: 'green',
    },
    {
      label: 'Total Sessions',
      value: report.totalSessions || 0,
      change: '',
      icon: Award,
      color: 'yellow',
    },
    {
      label: 'Hours Learned',
      value: report.totalHours || 0,
      change: '',
      icon: Target,
      color: 'blue',
    },
    {
      label: 'Quiz Pass Rate',
      value: `${quizStats?.passRate || 0}%`,
      change: '',
      icon: Award,
      color: 'emerald',
    },
    {
      label: 'Average Quiz Score',
      value: `${quizStats?.avgAccuracy || 0}%`,
      change: '',
      icon: Target,
      color: 'indigo',
    },
    {
      label: 'Total Quizzes',
      value: quizStats?.totalQuizzes || 0,
      change: '',
      icon: BarChart3,
      color: 'orange',
    },
    {
      label: 'Study Time (min)',
      value: quizStats?.totalTime || 0,
      change: '',
      icon: Clock,
      color: 'teal',
    },
  ]

  // Map evaluations to performance data by subject
  const performanceBySubject = {}
  evaluations.forEach(evaluation => {
    const subject = evaluation.course?.subject || 'Other'
    if (!performanceBySubject[subject]) {
      performanceBySubject[subject] = { total: 0, count: 0 }
    }
    performanceBySubject[subject].total += evaluation.grade || 0
    performanceBySubject[subject].count += 1
  })

  const performanceData = Object.keys(performanceBySubject).map(subject => ({
    subject,
    score: Math.round(performanceBySubject[subject].total / performanceBySubject[subject].count)
  }))

  // Prepare quiz performance data for chart
  const quizPerformanceData = Array.isArray(quizHistory) && quizHistory.length > 0 ?
    quizHistory.slice(-10).map((quiz, index) => ({
      quiz: `Quiz ${index + 1}`,
      score: quiz.score,
      accuracy: quiz.accuracy,
      timeTaken: Math.floor(quiz.timeTaken / 60) // minutes
    })) : []

  // Use attendance data from report
  const attendanceData = report.progress || []

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Header */}
      <div className="genz-card mb-4 sm:mb-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
        <div className="p-4 sm:p-5 lg:p-6">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent animate-shimmer mb-2">
            📊 Progress & Reports
          </h1>
          <p className="text-gray-600 text-sm sm:text-base lg:text-lg">Track your learning journey and achievements 🚀</p>
        </div>
      </div>

      {/* Controls */}
      <div className="genz-card mb-4 sm:mb-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-400 to-indigo-500"></div>
        <div className="p-3 sm:p-4 lg:p-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">📅 Time Period</label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="genz-card p-2.5 sm:p-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all w-full text-sm sm:text-base bg-white"
              >
                <option value="week">📅 This Week</option>
                <option value="month">📆 This Month</option>
                <option value="quarter">🗓️ This Quarter</option>
                <option value="year">📈 This Year</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        {stats.map((stat, index) => (
          <div key={index} className="genz-card hover:scale-105 transition-all relative overflow-hidden group">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
            <div className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg group-hover:animate-bounce">
                  <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                {stat.change && (
                  <span className="text-xs sm:text-sm font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full">
                    {stat.change} 📈
                  </span>
                )}
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 group-hover:text-emerald-600 transition-colors">
                {stat.value}
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 font-medium">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6">
        {/* Attendance Trend */}
        <div className="genz-card relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500"></div>
          <div className="p-3 sm:p-4 lg:p-6">
            <h3 className="text-base sm:text-lg lg:text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-3 sm:mb-4 flex items-center gap-2">
              📅 Attendance Trend
            </h3>
            {attendanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180} className="min-h-[140px] sm:min-h-[160px] lg:min-h-[180px]">
                <LineChart data={attendanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 9, fill: '#6b7280' }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 9, fill: '#6b7280' }}
                    domain={[0, 100]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#f8fafc',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                      fontSize: '11px'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '9px', color: '#374151' }} />
                  <Line type="monotone" dataKey="attendance" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', strokeWidth: 2, r: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-28 sm:h-32 lg:h-40 text-gray-500 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center mx-auto mb-2 text-lg sm:text-xl lg:text-2xl">
                    📊
                  </div>
                  <p className="text-xs sm:text-sm font-medium">No attendance data available</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Performance by Subject */}
        <div className="genz-card relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500"></div>
          <div className="p-3 sm:p-4 lg:p-6">
            <h3 className="text-base sm:text-lg lg:text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-3 sm:mb-4 flex items-center gap-2">
              📚 Performance by Subject
            </h3>
            {performanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180} className="min-h-[140px] sm:min-h-[160px] lg:min-h-[180px]">
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="subject"
                    tick={{ fontSize: 9, fill: '#6b7280' }}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    tick={{ fontSize: 9, fill: '#6b7280' }}
                    domain={[0, 100]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#f8fafc',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                      fontSize: '11px'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '9px', color: '#374151' }} />
                  <Bar dataKey="score" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-28 sm:h-32 lg:h-40 text-gray-500 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center mx-auto mb-2 text-lg sm:text-xl lg:text-2xl">
                    📈
                  </div>
                  <p className="text-xs sm:text-sm font-medium">No performance data available</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quiz Performance Trend */}
        <div className="genz-card relative overflow-hidden md:col-span-2 lg:col-span-1">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
          <div className="p-3 sm:p-4 lg:p-6">
            <h3 className="text-base sm:text-lg lg:text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-3 sm:mb-4 flex items-center gap-2">
              🎯 Quiz Performance Trend
            </h3>
            {quizPerformanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180} className="min-h-[140px] sm:min-h-[160px] lg:min-h-[180px]">
                <LineChart data={quizPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="quiz"
                    tick={{ fontSize: 9, fill: '#6b7280' }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 9, fill: '#6b7280' }}
                    domain={[0, 100]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#f8fafc',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                      fontSize: '11px'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '9px', color: '#374151' }} />
                  <Line type="monotone" dataKey="accuracy" stroke="#10b981" strokeWidth={2} name="Accuracy %" dot={{ fill: '#10b981', strokeWidth: 2, r: 2 }} />
                  <Line type="monotone" dataKey="score" stroke="#14b8a6" strokeWidth={2} name="Score %" dot={{ fill: '#14b8a6', strokeWidth: 2, r: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-28 sm:h-32 lg:h-40 text-gray-500 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center mx-auto mb-2 text-lg sm:text-xl lg:text-2xl">
                    📊
                  </div>
                  <p className="text-xs sm:text-sm font-medium">No quiz data available</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Evaluations */}
      <div className="genz-card relative overflow-hidden mt-4 sm:mt-6">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-yellow-500 to-red-500"></div>
        <div className="p-3 sm:p-4 lg:p-6">
          <h3 className="text-base sm:text-lg lg:text-xl font-bold bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent mb-3 sm:mb-4 flex items-center gap-2">
            📝 Recent Evaluations
          </h3>

          {/* Mobile Card View */}
          <div className="block sm:hidden space-y-3">
            {evaluations.length > 0 ? (
              evaluations.slice(0, 5).map((evaluation, index) => (
                <div key={index} className="genz-card p-4 hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 mb-1">{evaluation.course?.title || 'N/A'}</p>
                      <p className="text-xs text-gray-600">{new Date(evaluation.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                      evaluation.grade >= 80 ? 'bg-green-100 text-green-800' :
                      evaluation.grade >= 60 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {evaluation.grade || 0}% {
                        evaluation.grade >= 80 ? '🌟' :
                        evaluation.grade >= 60 ? '👍' :
                        '💪'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                      {evaluation.type || 'Assessment'} 📝
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2">{evaluation.feedback || 'No feedback available'}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">
                  📝
                </div>
                <p className="text-sm font-medium text-gray-500">No evaluations available</p>
              </div>
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto -mx-4 sm:-mx-5 lg:-mx-6">
            <div className="inline-block min-w-full align-middle px-4 sm:px-5 lg:px-6">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 sm:py-4 px-2 sm:px-4 text-xs sm:text-sm font-bold text-gray-700 whitespace-nowrap">📅 Date</th>
                    <th className="text-left py-3 sm:py-4 px-2 sm:px-4 text-xs sm:text-sm font-bold text-gray-700 whitespace-nowrap">📚 Course</th>
                    <th className="text-left py-3 sm:py-4 px-2 sm:px-4 text-xs sm:text-sm font-bold text-gray-700 whitespace-nowrap">📋 Type</th>
                    <th className="text-left py-3 sm:py-4 px-2 sm:px-4 text-xs sm:text-sm font-bold text-gray-700 whitespace-nowrap">🎯 Grade</th>
                    <th className="text-left py-3 sm:py-4 px-2 sm:px-4 text-xs sm:text-sm font-bold text-gray-700 whitespace-nowrap">💬 Feedback</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {evaluations.length > 0 ? (
                    evaluations.slice(0, 5).map((evaluation, index) => (
                      <tr key={index} className="hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 transition-all">
                        <td className="py-3 sm:py-4 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-900 whitespace-nowrap">
                          {new Date(evaluation.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 sm:py-4 px-2 sm:px-4 text-xs sm:text-sm text-gray-900">
                          <span className="line-clamp-1 font-medium">{evaluation.course?.title || 'N/A'}</span>
                        </td>
                        <td className="py-3 sm:py-4 px-2 sm:px-4 text-xs sm:text-sm text-gray-600 whitespace-nowrap">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                            {evaluation.type || 'Assessment'} 📝
                          </span>
                        </td>
                        <td className="py-3 sm:py-4 px-2 sm:px-4 whitespace-nowrap">
                          <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-bold ${
                            evaluation.grade >= 80 ? 'bg-green-100 text-green-800' :
                            evaluation.grade >= 60 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {evaluation.grade || 0}% {
                              evaluation.grade >= 80 ? '🌟' :
                              evaluation.grade >= 60 ? '👍' :
                              '💪'
                            }
                          </span>
                        </td>
                        <td className="py-3 sm:py-4 px-2 sm:px-4 text-xs sm:text-sm text-gray-600">
                          <span className="line-clamp-1">{evaluation.feedback || 'No feedback available'}</span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="py-6 sm:py-8 px-4 text-center text-gray-500">
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 text-2xl sm:text-3xl">
                            📝
                          </div>
                          <p className="text-sm sm:text-base font-medium">No evaluations available</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Quiz Attempts */}
      <div className="genz-card relative overflow-hidden mt-4 sm:mt-6">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
        <div className="p-3 sm:p-4 lg:p-6">
          <h3 className="text-base sm:text-lg lg:text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-3 sm:mb-4 flex items-center gap-2">
            🎯 Recent Quiz Attempts
          </h3>

          {/* Mobile Card View */}
          <div className="block sm:hidden space-y-3">
            {quizHistory.length > 0 ? (
              quizHistory.slice(0, 5).map((quiz, index) => (
                <div key={index} className="genz-card p-4 hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 mb-1">{quiz.courseName || 'N/A'}</p>
                      <p className="text-xs text-gray-600">{new Date(quiz.completedAt).toLocaleDateString()}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                      quiz.accuracy >= 60 ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {quiz.accuracy >= 60 ? '✅ Passed' : '❌ Failed'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div className="text-center">
                      <p className="text-xs text-gray-600">Score</p>
                      <p className="text-sm font-bold text-emerald-600">{quiz.score}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-600">Accuracy</p>
                      <p className="text-sm font-bold text-blue-600">{quiz.accuracy}%</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">
                      {Math.floor(quiz.timeTaken / 60)}m {quiz.timeTaken % 60}s ⏱️
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">
                  🎯
                </div>
                <p className="text-sm font-medium text-gray-500">No quiz attempts yet</p>
              </div>
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto -mx-4 sm:-mx-5 lg:-mx-6">
            <div className="inline-block min-w-full align-middle px-4 sm:px-5 lg:px-6">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 sm:py-4 px-2 sm:px-4 text-xs sm:text-sm font-bold text-gray-700 whitespace-nowrap">📅 Date</th>
                    <th className="text-left py-3 sm:py-4 px-2 sm:px-4 text-xs sm:text-sm font-bold text-gray-700 whitespace-nowrap">📚 Course</th>
                    <th className="text-left py-3 sm:py-4 px-2 sm:px-4 text-xs sm:text-sm font-bold text-gray-700 whitespace-nowrap">🎯 Score</th>
                    <th className="text-left py-3 sm:py-4 px-2 sm:px-4 text-xs sm:text-sm font-bold text-gray-700 whitespace-nowrap">📊 Accuracy</th>
                    <th className="text-left py-3 sm:py-4 px-2 sm:px-4 text-xs sm:text-sm font-bold text-gray-700 whitespace-nowrap">⏱️ Time</th>
                    <th className="text-left py-3 sm:py-4 px-2 sm:px-4 text-xs sm:text-sm font-bold text-gray-700 whitespace-nowrap">📈 Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {quizHistory.length > 0 ? (
                    quizHistory.slice(0, 5).map((quiz, index) => (
                      <tr key={index} className="hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 transition-all">
                        <td className="py-3 sm:py-4 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-900 whitespace-nowrap">
                          {new Date(quiz.completedAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 sm:py-4 px-2 sm:px-4 text-xs sm:text-sm text-gray-900">
                          <span className="line-clamp-1 font-medium">{quiz.courseName || 'N/A'}</span>
                        </td>
                        <td className="py-3 sm:py-4 px-2 sm:px-4 text-xs sm:text-sm font-bold text-gray-900 whitespace-nowrap">
                          <span className="text-emerald-600">{quiz.score}%</span>
                        </td>
                        <td className="py-3 sm:py-4 px-2 sm:px-4 text-xs sm:text-sm font-bold text-gray-900 whitespace-nowrap">
                          <span className="text-blue-600">{quiz.accuracy}%</span>
                        </td>
                        <td className="py-3 sm:py-4 px-2 sm:px-4 text-xs sm:text-sm text-gray-600 whitespace-nowrap">
                          <span className="bg-gray-100 px-2 py-1 rounded-full text-xs font-medium">
                            {Math.floor(quiz.timeTaken / 60)}m {quiz.timeTaken % 60}s ⏱️
                          </span>
                        </td>
                        <td className="py-3 sm:py-4 px-2 sm:px-4 whitespace-nowrap">
                          <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-bold ${
                            quiz.accuracy >= 60
                              ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white'
                              : 'bg-gradient-to-r from-red-400 to-pink-500 text-white'
                          }`}>
                            {quiz.accuracy >= 60 ? '✅ Passed' : '❌ Failed'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="py-6 sm:py-8 px-4 text-center text-gray-500">
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 text-2xl sm:text-3xl">
                            🎯
                          </div>
                          <p className="text-sm sm:text-base font-medium">No quiz attempts yet</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="genz-card relative overflow-hidden mt-4 sm:mt-6">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500"></div>
        <div className="p-4 sm:p-5 lg:p-6">
          <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent mb-3 sm:mb-4 flex items-center gap-2">
            🏆 Achievements & Badges
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
            {[
              { name: 'Perfect Attendance', icon: '🎯', earned: true },
              { name: 'Top Performer', icon: '⭐', earned: true },
              { name: 'Quick Learner', icon: '🚀', earned: true },
              { name: 'Team Player', icon: '🤝', earned: false },
              { name: 'Problem Solver', icon: '🧩', earned: true },
              { name: 'Excellence Award', icon: '🏆', earned: false },
            ].map((badge, index) => (
              <div
                key={index}
                className={`text-center p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border-2 transition-all hover:scale-105 ${
                  badge.earned
                    ? 'genz-card border-yellow-300 bg-gradient-to-br from-yellow-50 to-orange-50 shadow-lg'
                    : 'bg-gray-50 border-gray-200 opacity-60'
                }`}
              >
                <div className={`text-xl sm:text-2xl md:text-3xl mb-1 sm:mb-2 ${badge.earned ? 'animate-bounce-slow' : ''}`}>
                  {badge.icon}
                </div>
                <p className={`text-xs sm:text-sm font-bold break-words leading-tight ${
                  badge.earned ? 'text-gray-800' : 'text-gray-500'
                }`}>
                  {badge.name}
                </p>
                {badge.earned && (
                  <div className="mt-1">
                    <span className="text-xs bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-1 sm:px-2 py-0.5 sm:py-1 rounded-full font-bold">
                      ✅ Earned
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

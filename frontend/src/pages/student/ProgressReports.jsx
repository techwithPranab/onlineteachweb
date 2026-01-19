import { useState } from 'react'
import { useQuery } from 'react-query'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'
import { TrendingUp, Award, Target, Calendar, Download } from 'lucide-react'
import { reportService, evaluationService } from '@/services/apiServices'
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

  if (isLoading) return <LoadingSpinner fullScreen />
  if (error) return <ErrorMessage message={error.message || 'Failed to load reports'} />

  const report = reportData?.data || {}
  const evaluations = evaluationsData?.data || []

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

  // Use attendance data from report
  const attendanceData = report.progress || []

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">Progress & Reports</h1>
          <p className="text-sm sm:text-base text-gray-600">Track your learning journey and achievements</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="input-field w-full sm:w-auto"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
          <button className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto min-h-[44px] sm:min-h-0">
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="card">
            <div className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className={`w-12 h-12 sm:w-10 sm:h-10 bg-${stat.color}-100 rounded-lg flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 sm:w-5 sm:h-5 text-${stat.color}-600`} />
                </div>
                {stat.change && (
                  <span className="text-sm font-medium text-green-600">{stat.change}</span>
                )}
              </div>
              <h3 className="text-2xl sm:text-xl font-bold text-gray-900 mb-1">{stat.value}</h3>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Attendance Trend */}
        <div className="card">
          <div className="p-4 sm:p-5 md:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Attendance Trend</h3>
            {attendanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250} className="min-h-[200px]">
                <LineChart data={attendanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line type="monotone" dataKey="attendance" stroke="#6366f1" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-56 text-gray-500">
                <p className="text-sm sm:text-base">No attendance data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Performance by Subject */}
        <div className="card">
          <div className="p-4 sm:p-5 md:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Performance by Subject</h3>
            {performanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250} className="min-h-[200px]">
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="subject" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="score" fill="#6366f1" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-56 text-gray-500">
                <p className="text-sm sm:text-base">No performance data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Evaluations */}
      <div className="card">
        <div className="p-4 sm:p-5 md:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Recent Evaluations</h3>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle px-4 sm:px-0">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-2 sm:px-3 text-xs sm:text-sm font-medium text-gray-600 whitespace-nowrap">Date</th>
                    <th className="text-left py-2 px-2 sm:px-3 text-xs sm:text-sm font-medium text-gray-600 whitespace-nowrap">Course</th>
                    <th className="text-left py-2 px-2 sm:px-3 text-xs sm:text-sm font-medium text-gray-600 whitespace-nowrap">Type</th>
                    <th className="text-left py-2 px-2 sm:px-3 text-xs sm:text-sm font-medium text-gray-600 whitespace-nowrap">Grade</th>
                    <th className="text-left py-2 px-2 sm:px-3 text-xs sm:text-sm font-medium text-gray-600 whitespace-nowrap">Feedback</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {evaluations.length > 0 ? (
                    evaluations.slice(0, 5).map((evaluation, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="py-2 px-2 sm:px-3 text-xs sm:text-sm text-gray-900 whitespace-nowrap">
                          {new Date(evaluation.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-2 px-2 sm:px-3 text-xs sm:text-sm text-gray-900">
                          <span className="line-clamp-1">{evaluation.course?.title || 'N/A'}</span>
                        </td>
                        <td className="py-2 px-2 sm:px-3 text-xs sm:text-sm text-gray-600 whitespace-nowrap">
                          {evaluation.type || 'Assessment'}
                        </td>
                        <td className="py-2 px-2 sm:px-3 whitespace-nowrap">
                          <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs sm:text-sm font-medium">
                            {evaluation.grade || 'A'}
                          </span>
                        </td>
                        <td className="py-2 px-2 sm:px-3 text-xs sm:text-sm text-gray-600">
                          <span className="line-clamp-1">{evaluation.feedback || 'Excellent work!'}</span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="py-6 sm:py-8 text-center text-gray-500 text-sm">
                        No evaluations yet
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
      <div className="card mt-4 sm:mt-6">
        <div className="p-4 sm:p-5 md:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Achievements & Badges</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
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
                className={`text-center p-3 sm:p-4 rounded-lg border ${
                  badge.earned
                    ? 'bg-primary-50 border-primary-200'
                    : 'bg-gray-50 border-gray-200 opacity-50'
                }`}
              >
                <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">{badge.icon}</div>
                <p className="text-xs font-medium text-gray-700 break-words">{badge.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

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

  // Sample data for charts
  const attendanceData = [
    { month: 'Jan', attendance: 85 },
    { month: 'Feb', attendance: 90 },
    { month: 'Mar', attendance: 88 },
    { month: 'Apr', attendance: 92 },
    { month: 'May', attendance: 95 },
    { month: 'Jun', attendance: 91 },
  ]

  const performanceData = [
    { subject: 'Math', score: 85 },
    { subject: 'Science', score: 78 },
    { subject: 'English', score: 92 },
    { subject: 'History', score: 88 },
    { subject: 'Physics', score: 82 },
  ]

  const stats = [
    {
      label: 'Overall Progress',
      value: '87%',
      change: '+5%',
      icon: TrendingUp,
      color: 'primary',
    },
    {
      label: 'Attendance Rate',
      value: '92%',
      change: '+3%',
      icon: Calendar,
      color: 'green',
    },
    {
      label: 'Achievements',
      value: '12',
      change: '+2',
      icon: Award,
      color: 'yellow',
    },
    {
      label: 'Goals Completed',
      value: '8/10',
      change: '',
      icon: Target,
      color: 'blue',
    },
  ]

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Progress & Reports</h1>
          <p className="text-gray-600">Track your learning journey and achievements</p>
        </div>
        <div className="flex gap-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="input-field"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
          <button className="btn-primary flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="card">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 bg-${stat.color}-100 rounded-lg flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
                {stat.change && (
                  <span className="text-sm font-medium text-green-600">{stat.change}</span>
                )}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Attendance Trend */}
        <div className="card">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="attendance" stroke="#6366f1" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Performance by Subject */}
        <div className="card">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance by Subject</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="subject" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="score" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Evaluations */}
      <div className="card">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Evaluations</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Course</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Grade</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Feedback</th>
                </tr>
              </thead>
              <tbody>
                {evaluations.length > 0 ? (
                  evaluations.slice(0, 5).map((evaluation, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {new Date(evaluation.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {evaluation.course?.title || 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {evaluation.type || 'Assessment'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded text-sm font-medium">
                          {evaluation.grade || 'A'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {evaluation.feedback || 'Excellent work!'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-gray-500">
                      No evaluations yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="card mt-6">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Achievements & Badges</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
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
                className={`text-center p-4 rounded-lg border ${
                  badge.earned
                    ? 'bg-primary-50 border-primary-200'
                    : 'bg-gray-50 border-gray-200 opacity-50'
                }`}
              >
                <div className="text-4xl mb-2">{badge.icon}</div>
                <p className="text-xs font-medium text-gray-700">{badge.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

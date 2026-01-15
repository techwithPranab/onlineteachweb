import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import aiQuestionService from '../../services/aiQuestionService'
import { courseService } from '../../services/apiServices'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import ErrorMessage from '../../components/common/ErrorMessage'

export default function AdminAIQuestionsDashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState(null)
  const [providerStatus, setProviderStatus] = useState(null)
  const [courses, setCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (selectedCourse !== undefined) {
      fetchStats()
    }
  }, [selectedCourse])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [coursesRes, providerRes] = await Promise.all([
        courseService.getCourses(),
        aiQuestionService.getProviderStatus()
      ])
      setCourses(coursesRes.courses || [])
      setProviderStatus(providerRes.providers)
      await fetchStats()
    } catch (err) {
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await aiQuestionService.getStatistics(selectedCourse || undefined)
      setStats(response.stats)
    } catch (err) {
      console.error('Failed to load stats:', err)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <span className="text-4xl">🤖</span>
          AI Question Generation Dashboard
        </h1>
        <p className="mt-2 text-gray-600">
          Monitor and manage AI-generated questions across the platform
        </p>
      </div>

      {error && <ErrorMessage message={error} onClose={() => setError(null)} />}

      {/* Provider Status */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">AI Provider Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {providerStatus && Object.entries(providerStatus).map(([name, available]) => (
            <div 
              key={name}
              className={`p-4 rounded-lg border-2 ${
                available 
                  ? 'border-green-300 bg-green-50' 
                  : 'border-red-300 bg-red-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`text-2xl ${available ? 'text-green-500' : 'text-red-500'}`}>
                  {available ? '✓' : '✕'}
                </span>
                <div>
                  <div className="font-medium capitalize">{name}</div>
                  <div className={`text-sm ${available ? 'text-green-600' : 'text-red-600'}`}>
                    {available ? 'Available' : 'Unavailable'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Course Filter */}
      <div className="mb-6">
        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Courses</option>
          {courses.map(course => (
            <option key={course._id} value={course._id}>{course.title}</option>
          ))}
        </select>
      </div>

      {/* Stats Overview */}
      {stats && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <StatCard 
              title="Total Drafts" 
              value={stats.totalDrafts} 
              icon="📝" 
              color="blue"
            />
            <StatCard 
              title="Pending Review" 
              value={stats.approvalRate?.pending || 0} 
              icon="⏳" 
              color="yellow"
            />
            <StatCard 
              title="Approved" 
              value={stats.approvalRate?.approved || 0} 
              icon="✓" 
              color="green"
            />
            <StatCard 
              title="Approval Rate" 
              value={`${(stats.approvalRate?.approvalRate || 0).toFixed(1)}%`} 
              icon="📊" 
              color="purple"
            />
          </div>

          {/* By Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">By Status</h3>
              <div className="space-y-3">
                {stats.byStatus?.map(item => (
                  <div key={item._id} className="flex items-center justify-between">
                    <span className="capitalize">{item._id}</span>
                    <div className="flex items-center gap-4">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            item._id === 'approved' ? 'bg-green-500' : 
                            item._id === 'rejected' ? 'bg-red-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${(item.count / stats.totalDrafts) * 100}%` }}
                        />
                      </div>
                      <span className="font-medium w-16 text-right">{item.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">By AI Model</h3>
              <div className="space-y-3">
                {stats.byModel?.map(item => (
                  <div key={item._id} className="flex items-center justify-between">
                    <span className="text-sm">{item._id}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-500">
                        {item.approvedCount}/{item.count} approved
                      </span>
                      <span className="font-medium">{item.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => navigate('/admin/ai-questions/generate')}
          className="p-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 text-left"
        >
          <span className="text-3xl mb-2 block">🚀</span>
          <div className="font-semibold">Generate Questions</div>
          <div className="text-sm opacity-80">Create new AI-generated questions</div>
        </button>
        
        <button
          onClick={() => navigate('/admin/ai-questions/review')}
          className="p-6 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-500 text-left"
        >
          <span className="text-3xl mb-2 block">📋</span>
          <div className="font-semibold text-gray-900">Review Drafts</div>
          <div className="text-sm text-gray-600">Approve or reject pending questions</div>
        </button>
        
        <button
          onClick={() => navigate('/admin/questions')}
          className="p-6 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-500 text-left"
        >
          <span className="text-3xl mb-2 block">📚</span>
          <div className="font-semibold text-gray-900">Question Bank</div>
          <div className="text-sm text-gray-600">View all approved questions</div>
        </button>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon, color }) {
  const colors = {
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
    green: 'bg-green-50 border-green-200 text-green-600',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-600',
    purple: 'bg-purple-50 border-purple-200 text-purple-600'
  }

  return (
    <div className={`p-6 rounded-lg border-2 ${colors[color]}`}>
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">{icon}</span>
        <span className="text-sm font-medium">{title}</span>
      </div>
      <div className="text-3xl font-bold">{value}</div>
    </div>
  )
}

import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useState } from 'react'
import { Video, Users, Calendar, Clock, Play, Pause, Stop, Eye, Download } from 'lucide-react'
import { sessionService, adminService } from '@/services/apiServices'
import { useAuthStore } from '@/store/authStore'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import ErrorMessage from '@/components/common/ErrorMessage'
import { format } from 'date-fns'

export default function SessionManagement() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState({
    status: '',
    dateRange: '30',
    search: '',
    grade: '',
    subject: ''
  })
  const [selectedSession, setSelectedSession] = useState(null)

  // Redirect if not admin
  if (user?.role !== 'admin') {
    return <ErrorMessage message="Access denied. Admin role required." />
  }

  // Fetch sessions data
  const { data: sessionsData, isLoading, error } = useQuery(
    ['adminSessions', filters],
    () => sessionService.getAllSessions(filters)
  )

  // Fetch session statistics
  const { data: statsData } = useQuery(
    'sessionStats',
    () => sessionService.getSessionStats()
  )

  const sessions = sessionsData?.data || []
  const stats = statsData?.data || {}

  // End session mutation
  const endSessionMutation = useMutation(
    (sessionId) => sessionService.endSession(sessionId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['adminSessions'])
      }
    }
  )

  const handleEndSession = async (sessionId) => {
    if (confirm('Are you sure you want to end this session?')) {
      await endSessionMutation.mutateAsync(sessionId)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      'scheduled': 'bg-blue-100 text-blue-800',
      'live': 'bg-green-100 text-green-800',
      'completed': 'bg-gray-100 text-gray-800',
      'cancelled': 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusIcon = (status) => {
    const icons = {
      'scheduled': Calendar,
      'live': Play,
      'completed': Stop,
      'cancelled': Pause
    }
    const Icon = icons[status] || Clock
    return Icon
  }

  if (isLoading) return <LoadingSpinner fullScreen />
  if (error) return <ErrorMessage message={error.message || 'Failed to load sessions'} />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Session Management</h1>
          <p className="text-gray-600">Monitor live sessions, manage recordings, and view attendance</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sessions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalSessions || 0}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Video className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-blue-600 text-sm font-medium">+{stats.sessionGrowth || 0}%</span>
            <span className="text-gray-500 text-sm ml-2">vs last month</span>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Live Sessions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.liveSessions || 0}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Play className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg. Attendance</p>
              <p className="text-2xl font-bold text-gray-900">{stats.avgAttendance || 0}%</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-purple-600 text-sm font-medium">+{stats.attendanceChange || 0}%</span>
            <span className="text-gray-500 text-sm ml-2">vs last month</span>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg. Duration</p>
              <p className="text-2xl font-bold text-gray-900">{stats.avgDuration || 0}min</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <input
              type="text"
              placeholder="Search sessions, tutors, courses..."
              className="input-field"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          
          <select
            className="input-field w-auto"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="live">Live</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            className="input-field w-auto"
            value={filters.grade}
            onChange={(e) => setFilters({ ...filters, grade: e.target.value })}
          >
            <option value="">All Grades</option>
            {[5, 6, 7, 8, 9, 10, 11, 12].map(grade => (
              <option key={grade} value={grade}>Class {grade}</option>
            ))}
          </select>

          <select
            className="input-field w-auto"
            value={filters.subject}
            onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
          >
            <option value="">All Subjects</option>
            <option value="Mathematics">Mathematics</option>
            <option value="Physics">Physics</option>
            <option value="Chemistry">Chemistry</option>
            <option value="English">English</option>
            <option value="Computer Science">Computer Science</option>
          </select>

          <select
            className="input-field w-auto"
            value={filters.dateRange}
            onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Session Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tutor & Course
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Schedule
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Attendance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sessions.map((session) => {
                const StatusIcon = getStatusIcon(session.status)
                return (
                  <tr key={session._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {session.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          {session.description}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {session.tutor?.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {session.course?.title} - Class {session.course?.grade}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {format(new Date(session.scheduledAt), 'MMM dd, yyyy')}
                      </div>
                      <div className="text-sm text-gray-500">
                        {format(new Date(session.scheduledAt), 'hh:mm a')} ({session.duration}min)
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {session.attendanceCount || 0}/{session.maxStudents}
                      </div>
                      <div className="text-sm text-gray-500">
                        {Math.round(((session.attendanceCount || 0) / session.maxStudents) * 100)}% attendance
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {session.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => setSelectedSession(session)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      
                      {session.status === 'live' && (
                        <button
                          onClick={() => handleEndSession(session._id)}
                          disabled={endSessionMutation.isLoading}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          title="End Session"
                        >
                          <Stop className="h-4 w-4" />
                        </button>
                      )}
                      
                      {session.recordingUrl && (
                        <a
                          href={session.recordingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:text-green-900"
                          title="Download Recording"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          
          {sessions.length === 0 && (
            <div className="text-center py-12">
              <Video className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No sessions found</h3>
              <p className="mt-1 text-sm text-gray-500">
                No sessions match your current filters.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Session Detail Modal */}
      {selectedSession && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 shadow-lg rounded-lg bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Session Details</h3>
              <button
                onClick={() => setSelectedSession(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Title</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedSession.title}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedSession.status)}`}>
                    {selectedSession.status}
                  </span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <p className="mt-1 text-sm text-gray-900">{selectedSession.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tutor</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedSession.tutor?.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Course</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedSession.course?.title}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Scheduled</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {format(new Date(selectedSession.scheduledAt), 'MMM dd, yyyy hh:mm a')}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Duration</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedSession.duration} minutes</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Capacity</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedSession.maxStudents} students</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Attendance ({selectedSession.attendanceCount || 0})</label>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {/* Placeholder for attendee list */}
                  <div className="text-sm text-gray-500 col-span-3">
                    Attendee list would be loaded here...
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setSelectedSession(null)}
                className="btn-secondary"
              >
                Close
              </button>
              {selectedSession.status === 'live' && (
                <button
                  onClick={() => handleEndSession(selectedSession._id)}
                  disabled={endSessionMutation.isLoading}
                  className="btn-danger"
                >
                  {endSessionMutation.isLoading ? 'Ending...' : 'End Session'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

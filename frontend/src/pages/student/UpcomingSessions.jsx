import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from 'react-query'
import { Calendar, Clock, Video, Users, BookOpen, Filter, Search } from 'lucide-react'
import { sessionService } from '@/services/apiServices'
import { useAuthStore } from '@/store/authStore'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import ErrorMessage from '@/components/common/ErrorMessage'

export default function UpcomingSessions() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('scheduled')

  const { data: sessionsData, isLoading, error } = useQuery(
    ['upcomingSessions', user?.grade, statusFilter],
    () => sessionService.getSessions({ 
      upcoming: true,
      status: statusFilter,
      grade: user?.grade 
    }),
    { enabled: !!user }
  )

  const sessions = sessionsData?.sessions || []
  console.log('Sessions data 456:', sessions);
  console.log('User grade:', user?.grade);
  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         session.course?.title?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesGrade = !user?.grade || session.course?.grade === user.grade
    return matchesSearch && matchesGrade
  })

  if (isLoading) return <LoadingSpinner fullScreen />
  if (error) return <ErrorMessage message={error.message || 'Failed to load sessions'} />

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Upcoming Sessions</h1>
        <p className="text-gray-600">Browse and enroll in upcoming live sessions for Grade {user?.grade}</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 md:flex-[2] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search sessions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10 w-full"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field md:w-48"
          >
            <option value="scheduled">Scheduled</option>
            <option value="ongoing">Live Now</option>
            <option value="">All Sessions</option>
          </select>
        </div>
      </div>

      {/* Sessions List */}
      {filteredSessions.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No sessions found</h3>
          <p className="text-gray-600">Check back later for upcoming sessions</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSessions.map((session) => (
            <SessionCard key={session._id} session={session} onClick={() => navigate(`/student/sessions/${session._id}`)} />
          ))}
        </div>
      )}
    </div>
  )
}

function SessionCard({ session, onClick }) {
  const scheduledDate = new Date(session.scheduledAt)
  const now = new Date()
  const isToday = scheduledDate.toDateString() === now.toDateString()
  const isTomorrow = scheduledDate.toDateString() === new Date(now.getTime() + 86400000).toDateString()
  
  let dateText
  if (isToday) {
    dateText = `Today at ${scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
  } else if (isTomorrow) {
    dateText = `Tomorrow at ${scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
  } else {
    dateText = scheduledDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const attendeesCount = session.attendees?.length || 0
  const isFull = attendeesCount >= session.maxStudents

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-primary-300 transition-all cursor-pointer"
    >
      {/* Status Badge */}
      <div className="flex items-center justify-between mb-4">
        {session.status === 'ongoing' ? (
          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full animate-pulse">
            LIVE NOW
          </span>
        ) : (
          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
            SCHEDULED
          </span>
        )}
        {isFull && (
          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
            FULL
          </span>
        )}
      </div>

      {/* Session Title */}
      <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{session.title}</h3>
      
      {/* Course Info */}
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="w-4 h-4 text-gray-400" />
        <p className="text-sm text-gray-600 line-clamp-1">{session.course?.title}</p>
      </div>

      {/* Session Details */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span>{dateText}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="w-4 h-4 text-gray-400" />
          <span>{session.duration} minutes</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Users className="w-4 h-4 text-gray-400" />
          <span>{attendeesCount}/{session.maxStudents} enrolled</span>
        </div>
      </div>

      {/* Tutor */}
      <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
          <span className="text-sm font-semibold text-primary-600">
            {session.tutor?.name?.charAt(0) || 'T'}
          </span>
        </div>
        <div>
          <p className="text-xs text-gray-500">Instructor</p>
          <p className="text-sm font-medium text-gray-900">{session.tutor?.name}</p>
        </div>
      </div>
    </div>
  )
}

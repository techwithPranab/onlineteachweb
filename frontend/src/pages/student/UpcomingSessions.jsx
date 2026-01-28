import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from 'react-query'
import { Calendar, Clock, Video, Users, BookOpen, Filter, Search } from 'lucide-react'
import { sessionService } from '@/services/apiServices'
import { useAuthStore } from '@/store/authStore'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import ErrorMessage from '@/components/common/ErrorMessage'
import MeritaiCard from '@/components/ui/MeritaiCard'

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <MeritaiCard className="mb-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-600 to-teal-600"></div>
        <div className="p-6">
          <h2 className="text-xl font-bold">Upcoming Sessions</h2>
          <p className="text-sm text-gray-500">Stay on track — your next live sessions.</p>
        </div>
      </MeritaiCard>

      {/* Filters */}
      <MeritaiCard className="mb-6 relative overflow-hidden">
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="flex-1 md:flex-[2] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="🔍 Search sessions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="meritai-card p-3 pl-10 w-full border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="meritai-card p-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all md:w-48"
          >
            <option value="scheduled">📅 Scheduled</option>
            <option value="ongoing">🔴 Live Now</option>
            <option value="">📚 All Sessions</option>
          </select>
        </div>
      </MeritaiCard>

      {/* Sessions List */}
      {filteredSessions.length === 0 ? (
        <div className="genz-card text-center py-12 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gray-400 to-gray-500"></div>
          <Calendar className="w-20 h-20 mx-auto mb-4 text-gray-400 animate-bounce-slow" />
          <h3 className="text-2xl font-bold text-gray-900 mb-2">😔 No sessions found</h3>
          <p className="text-gray-600 text-lg">Check back later for upcoming sessions! 📚</p>
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
    <MeritaiCard
      onClick={onClick}
      className="hover:scale-105 transition-all cursor-pointer relative overflow-hidden group"
    >
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-600 to-teal-600"></div>

      {/* Status Badge */}
      <div className="flex items-center justify-between mb-4">
        {session.status === 'ongoing' ? (
          <span className="px-3 py-1 bg-gradient-to-r from-green-400 to-emerald-500 text-white text-xs font-bold rounded-full animate-pulse shadow-lg">
            🔴 LIVE NOW
          </span>
        ) : (
          <span className="px-3 py-1 bg-gradient-to-r from-blue-400 to-cyan-500 text-white text-xs font-bold rounded-full shadow-lg">
            📅 SCHEDULED
          </span>
        )}
        {isFull && (
          <span className="px-3 py-1 bg-gradient-to-r from-red-400 to-pink-500 text-white text-xs font-bold rounded-full shadow-lg">
            ❌ FULL
          </span>
        )}
      </div>

      {/* Session Title */}
      <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-emerald-600 transition-colors">
        {session.title} 📚
      </h3>

      {/* Course Info */}
      <div className="genz-card p-3 mb-4 hover:scale-105 transition-all">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-emerald-500" />
          <p className="text-sm text-gray-700 font-medium line-clamp-1">{session.course?.title}</p>
        </div>
      </div>

      {/* Session Details */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-indigo-500 rounded-lg flex items-center justify-center shadow-md">
            <Calendar className="w-4 h-4 text-white" />
          </div>
          <span className="font-medium">{dateText}</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center shadow-md">
            <Clock className="w-4 h-4 text-white" />
          </div>
          <span className="font-medium">{session.duration} minutes ⏰</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center shadow-md">
            <Users className="w-4 h-4 text-white" />
          </div>
          <span className="font-medium">{attendeesCount}/{session.maxStudents} enrolled 👥</span>
        </div>
      </div>

      {/* Tutor */}
      <div className="genz-card p-3 pt-4 border-t border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-yellow-500 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-sm font-bold text-white">
              {session.tutor?.name?.charAt(0) || 'T'}
            </span>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">👨‍🏫 Instructor</p>
            <p className="text-sm font-bold text-gray-900">{session.tutor?.name}</p>
          </div>
        </div>
      </div>
    </MeritaiCard>
  )
}

import { useQuery, useMutation, useQueryClient } from 'react-query'
import { BookOpen, Calendar, TrendingUp, Video, FileText, Play, UserPlus } from 'lucide-react'
import { courseService, sessionService, materialService, reportService } from '@/services/apiServices'
import { useAuthStore } from '@/store/authStore'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import ErrorMessage from '@/components/common/ErrorMessage'

export default function StudentDashboard() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  // Fetch enrolled courses
  const { data: coursesData, isLoading: coursesLoading, error: coursesError } = useQuery(
    ['studentCourses', user?._id],
    () => courseService.getCourses({ enrolled: true }),
    { enabled: !!user }
  )

  // Fetch upcoming sessions
  const { data: sessionsData, isLoading: sessionsLoading } = useQuery(
    ['upcomingSessions', user?._id],
    () => sessionService.getSessions({ upcoming: true, limit: 5 }),
    { enabled: !!user }
  )

  // Fetch recent materials
  const { data: materialsData, isLoading: materialsLoading } = useQuery(
    ['recentMaterials', user?._id],
    () => materialService.getRecentMaterials({ limit: 6 }),
    { enabled: !!user }
  )

  // Fetch student report for stats
  const { data: reportData } = useQuery(
    ['studentReport', user?._id],
    () => reportService.getStudentReport(user._id),
    { enabled: !!user }
  )

  const courses = coursesData?.data || []
  const sessions = sessionsData?.data || []
  const materials = materialsData?.data || []
  const report = reportData?.data || {}

  const isLoading = coursesLoading || sessionsLoading || materialsLoading

  // Enrollment mutation
  const enrollMutation = useMutation(
    (sessionId) => sessionService.enrollInSession(sessionId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['upcomingSessions'])
        alert('Successfully enrolled in session!')
      },
      onError: (error) => {
        alert(error.response?.data?.message || 'Failed to enroll in session')
      }
    }
  )

  const handleEnroll = (sessionId) => {
    if (window.confirm('Do you want to enroll in this session?')) {
      enrollMutation.mutate(sessionId)
    }
  }

  if (coursesError) {
    return <ErrorMessage message={coursesError.message || 'Failed to load dashboard'} />
  }

  if (isLoading && !courses.length) {
    return <LoadingSpinner fullScreen />
  }

  // Calculate stats
  const enrolledCoursesCount = courses.length
  const upcomingClassesCount = sessions.length
  const attendanceRate = report.attendanceRate || 0
  const hoursLearned = report.totalHours || 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Track your learning progress</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          icon={<BookOpen className="h-8 w-8 text-blue-600" />}
          label="Enrolled Courses"
          value={enrolledCoursesCount}
          bgColor="bg-blue-50"
        />
        <StatCard
          icon={<Calendar className="h-8 w-8 text-green-600" />}
          label="Upcoming Classes"
          value={upcomingClassesCount}
          bgColor="bg-green-50"
        />
        <StatCard
          icon={<TrendingUp className="h-8 w-8 text-purple-600" />}
          label="Attendance Rate"
          value={`${attendanceRate}%`}
          bgColor="bg-purple-50"
        />
        <StatCard
          icon={<Video className="h-8 w-8 text-orange-600" />}
          label="Hours Learned"
          value={hoursLearned}
          bgColor="bg-orange-50"
        />
      </div>

      {/* Upcoming Classes */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Upcoming Classes</h2>
        {sessionsLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : sessions.length > 0 ? (
          <div className="space-y-4">
            {sessions.map((session) => (
              <ClassItem
                key={session._id}
                session={session}
                onEnroll={handleEnroll}
                isEnrolling={enrollMutation.isLoading}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>No upcoming classes scheduled</p>
          </div>
        )}
      </div>

      {/* Recent Materials */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Materials</h2>
        {materialsLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : materials.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {materials.slice(0, 6).map((material) => (
              <MaterialCard
                key={material._id}
                material={material}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>No materials available yet</p>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, bgColor }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`${bgColor} p-3 rounded-lg`}>{icon}</div>
      </div>
    </div>
  )
}

function ClassItem({ session, onEnroll, isEnrolling }) {
  const scheduledDate = new Date(session.scheduledAt)
  const now = new Date()
  const isToday = scheduledDate.toDateString() === now.toDateString()
  const isTomorrow = scheduledDate.toDateString() === new Date(now.getTime() + 86400000).toDateString()
  
  let timeText
  if (isToday) {
    timeText = `Today at ${scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
  } else if (isTomorrow) {
    timeText = `Tomorrow at ${scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
  } else {
    timeText = scheduledDate.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isEnrolled = session.attendees?.some(a => a.student === session.userId)

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
      <div className="flex items-center space-x-4 flex-1">
        <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center">
          <Video className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{session.title}</h3>
          <p className="text-sm text-gray-600">
            {session.course?.title || 'Course'} • {session.tutor?.name || 'Tutor'}
          </p>
          <p className="text-sm text-gray-900 mt-1">{timeText}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm text-gray-600">{session.duration} min</p>
          <p className="text-xs text-gray-500">
            {session.attendees?.length || 0}/{session.maxStudents} enrolled
          </p>
        </div>
        {!isEnrolled && (
          <button
            onClick={() => onEnroll(session._id)}
            disabled={isEnrolling}
            className="btn-primary text-sm flex items-center gap-1 whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4" />
            Enroll
          </button>
        )}
        {isEnrolled && (
          <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded">
            Enrolled
          </span>
        )}
      </div>
    </div>
  )
}

function MaterialCard({ material }) {
  const getTypeIcon = () => {
    switch (material.type) {
      case 'video':
        return <Play className="w-4 h-4" />
      case 'pdf':
      case 'document':
        return <FileText className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const getTypeColor = () => {
    switch (material.type) {
      case 'video':
        return 'text-red-600 bg-red-50'
      case 'pdf':
        return 'text-blue-600 bg-blue-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <a
      href={material.fileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="p-4 border border-gray-200 rounded-lg hover:border-primary-600 transition cursor-pointer block"
    >
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold mb-2 ${getTypeColor()}`}>
        {getTypeIcon()}
        <span className="uppercase">{material.type}</span>
      </div>
      <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{material.title}</h3>
      <p className="text-sm text-gray-600 line-clamp-1">{material.course?.title || 'Course'}</p>
    </a>
  )
}

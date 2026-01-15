import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { 
  Calendar, Clock, Video, Users, BookOpen, FileText, 
  UserPlus, ArrowLeft, MapPin, CheckCircle 
} from 'lucide-react'
import { sessionService, materialService } from '@/services/apiServices'
import { useAuthStore } from '@/store/authStore'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import ErrorMessage from '@/components/common/ErrorMessage'

export default function SessionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  const { data: sessionData, isLoading, error } = useQuery(
    ['session', id],
    () => sessionService.getSessionById(id),
    { enabled: !!id }
  )

  const { data: materialsData } = useQuery(
    ['sessionMaterials', id],
    () => materialService.getMaterialsByCourse(sessionData?.session?.course?._id),
    { enabled: !!sessionData?.session?.course?._id }
  )

  const enrollMutation = useMutation(
    () => sessionService.enrollInSession(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['session', id])
        alert('Successfully enrolled in session!')
      },
      onError: (error) => {
        alert(error.response?.data?.message || 'Failed to enroll in session')
      }
    }
  )

  if (isLoading) return <LoadingSpinner fullScreen />
  if (error) return <ErrorMessage message={error.message || 'Failed to load session'} />

  const session = sessionData?.session || {}
  const materials = materialsData?.materials || materialsData?.data || []
  const attendees = session.attendees || []
  
  const isEnrolled = attendees.some(a => a.student?._id === user?._id || a.student === user?._id)
  const isFull = attendees.length >= session.maxStudents
  const scheduledDate = new Date(session.scheduledAt)
  const isPast = scheduledDate < new Date()

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long', 
      day: 'numeric'
    })
  }

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit'
    })
  }

  const getStatusBadge = () => {
    if (isPast) {
      return <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-full">Completed</span>
    }
    if (session.status === 'ongoing') {
      return <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full animate-pulse">Live Now</span>
    }
    if (session.status === 'scheduled') {
      return <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">Scheduled</span>
    }
    return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-sm font-medium rounded-full">{session.status}</span>
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back</span>
      </button>

      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{session.title}</h1>
              {getStatusBadge()}
            </div>
            <p className="text-gray-600">{session.description}</p>
          </div>
        </div>

        {/* Session Meta Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Date</p>
              <p className="font-semibold text-gray-900">{formatDate(scheduledDate)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Time</p>
              <p className="font-semibold text-gray-900">{formatTime(scheduledDate)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Video className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Duration</p>
              <p className="font-semibold text-gray-900">{session.duration} min</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Enrolled</p>
              <p className="font-semibold text-gray-900">{attendees.length}/{session.maxStudents}</p>
            </div>
          </div>
        </div>

        {/* Enrollment Action */}
        {!isPast && session.status === 'scheduled' && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            {isEnrolled ? (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="font-semibold">You are enrolled in this session</span>
              </div>
            ) : (
              <button
                onClick={() => enrollMutation.mutate()}
                disabled={isFull || enrollMutation.isLoading}
                className={`btn-primary flex items-center gap-2 ${
                  isFull ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <UserPlus className="w-4 h-4" />
                {isFull ? 'Session Full' : 'Enroll in Session'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="space-y-6">
          {/* Course Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary-600" />
              Course Information
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Course Title</p>
                <p className="font-semibold text-gray-900">{session.course?.title}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Grade</p>
                  <p className="font-semibold text-gray-900">Grade {session.course?.grade}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Subject</p>
                  <p className="font-semibold text-gray-900">{session.course?.subject}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tutor Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Instructor</h2>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                {session.tutor?.avatar ? (
                  <img src={session.tutor.avatar} alt={session.tutor.name} className="w-16 h-16 rounded-full" />
                ) : (
                  <span className="text-2xl font-bold text-primary-600">
                    {session.tutor?.name?.charAt(0) || 'T'}
                  </span>
                )}
              </div>
              <div>
                <h3 className="font-bold text-gray-900">{session.tutor?.name}</h3>
                {session.tutor?.bio && (
                  <p className="text-sm text-gray-600 mt-1">{session.tutor.bio}</p>
                )}
              </div>
            </div>
          </div>

          {/* Materials */}
          {materials.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary-600" />
                Course Materials
              </h2>
              <div className="space-y-3">
                {materials.map((material) => (
                  <a
                    key={material._id}
                    href={material.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-primary-600 hover:bg-primary-50 transition"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">{material.title}</p>
                        <p className="text-xs text-gray-500 uppercase">{material.type}</p>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
      </div>
    </div>
  )
}

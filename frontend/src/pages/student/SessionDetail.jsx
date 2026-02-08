import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { 
  Calendar, Clock, Video, Users, BookOpen, FileText, 
  UserPlus, ArrowLeft, MapPin, CheckCircle 
} from 'lucide-react'
import { sessionService, materialService } from '@/services/apiServices'
import { useAuthStore } from '@/store/authStore'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import SEOHead from '@/components/SEO/SEOHead';
import ErrorMessage from '@/components/common/ErrorMessage'
import MeritaiCard from '@/components/ui/MeritaiCard'
import MeritaiButton from '@/components/ui/MeritaiButton'

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
    <>

    <SEOHead title="Session Detail - Student" noIndex={true} noFollow={true} />

    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="genz-btn-secondary inline-flex items-center gap-2 mb-6 hover:scale-105 transition-all"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Sessions ↩️
      </button>

      {/* Header */}
      <div className="genz-card mb-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-600 to-teal-600"></div>
        <div className="flex items-start justify-between mb-4 p-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent animate-shimmer">
                {session.title} 📅
              </h1>
              {getStatusBadge()}
            </div>
            <p className="text-gray-600 text-lg">{session.description}</p>
          </div>
        </div>

        {/* Session Meta Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 px-6 pb-6">
          <MeritaiCard className="p-4 hover:scale-105 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-indigo-500 rounded-xl flex items-center justify-center shadow-md">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">📅 Date</p>
                <p className="font-bold text-gray-900">{formatDate(scheduledDate)}</p>
              </div>
            </div>
          </MeritaiCard>

          <MeritaiCard className="p-4 hover:scale-105 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-md">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">⏰ Time</p>
                <p className="font-bold text-gray-900">{formatTime(scheduledDate)}</p>
              </div>
            </div>
          </MeritaiCard>

          <MeritaiCard className="p-4 hover:scale-105 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center shadow-md">
                <Video className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">🎥 Duration</p>
                <p className="font-bold text-gray-900">{session.duration} min</p>
              </div>
            </div>
          </MeritaiCard>

          <MeritaiCard className="p-4 hover:scale-105 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-yellow-500 rounded-xl flex items-center justify-center shadow-md">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">👥 Enrolled</p>
                <p className="font-bold text-gray-900">{attendees.length}/{session.maxStudents}</p>
              </div>
            </div>
          </MeritaiCard>
        </div>

        {/* Enrollment Action */}
        {!isPast && session.status === 'scheduled' && (
          <div className="mt-6 pt-6 border-t border-gray-200 px-6 pb-6">
            {isEnrolled ? (
              <div className="flex items-center gap-2 text-green-600 bg-green-50 p-4 rounded-lg">
                <CheckCircle className="w-6 h-6 animate-bounce-slow" />
                <span className="font-bold text-lg">✅ You are enrolled in this session!</span>
              </div>
            ) : (
              <MeritaiButton
                onClick={() => enrollMutation.mutate()}
                disabled={isFull || enrollMutation.isLoading}
                className={`${isFull ? 'opacity-50 cursor-not-allowed' : ''} flex items-center gap-2 text-lg`}
              >
                <UserPlus className="w-5 h-5" />
                {isFull ? '❌ Session Full' : '🚀 Enroll in Session'}
              </MeritaiButton>
            )}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="space-y-6">
          {/* Course Info */}
          <div className="genz-card relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
            <div className="p-6">
              <h2 className="text-xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent mb-4 flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-cyan-500" />
                📚 Course Information
              </h2>
              <div className="space-y-4">
                <div className="genz-card p-4 hover:scale-105 transition-all">
                  <p className="text-sm text-gray-500 font-medium mb-1">📖 Course Title</p>
                  <p className="font-bold text-gray-900 text-lg">{session.course?.title}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="genz-card p-4 hover:scale-105 transition-all">
                    <p className="text-sm text-gray-500 font-medium mb-1">🎓 Grade</p>
                    <p className="font-bold text-gray-900 text-lg">Grade {session.course?.grade}</p>
                  </div>
                  <div className="genz-card p-4 hover:scale-105 transition-all">
                    <p className="text-sm text-gray-500 font-medium mb-1">📚 Subject</p>
                    <p className="font-bold text-gray-900 text-lg">{session.course?.subject}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tutor Info */}
          <div className="genz-card relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
            <div className="p-6">
              <h2 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-4 flex items-center gap-2">
                👨‍🏫 Instructor
              </h2>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all">
                  {session.tutor?.avatar ? (
                    <img src={session.tutor.avatar} alt={session.tutor.name} className="w-20 h-20 rounded-full border-4 border-white shadow-lg" />
                  ) : (
                    <span className="text-3xl font-bold text-white">
                      {session.tutor?.name?.charAt(0) || 'T'}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-xl mb-2">{session.tutor?.name}</h3>
                  {session.tutor?.bio && (
                    <p className="text-gray-600 bg-gray-50 p-3 rounded-lg border-l-4 border-pink-500">{session.tutor.bio}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Materials */}
          {materials.length > 0 && (
            <div className="genz-card relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500"></div>
              <div className="p-6">
                <h2 className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-4 flex items-center gap-2">
                  <FileText className="w-6 h-6 text-green-500" />
                  📄 Course Materials
                </h2>
                <div className="space-y-3">
                  {materials.map((material) => (
                    <a
                      key={material._id}
                      href={material.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="genz-card p-4 hover:scale-105 transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg group-hover:animate-bounce">
                          <FileText className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-lg">{material.title}</p>
                          <p className="text-sm text-gray-500 uppercase font-medium bg-gray-100 px-2 py-1 rounded-full inline-block">
                            {material.type} 📎
                          </p>
                        </div>
                      </div>
                      <div className="text-emerald-500 group-hover:text-teal-500 transition-colors">
                        <ExternalLink className="w-5 h-5" />
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}
      </div>
    </div>


    </>)
}

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from 'react-query'
import {
  ArrowLeft,
  BookOpen,
  Star,
  Clock,
  Calendar,
  Video,
  FileText,
  CheckCircle,
} from 'lucide-react'
import { courseService, materialService, sessionService } from '@/services/apiServices'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import SEOHead from '@/components/SEO/SEOHead';
import ErrorMessage from '@/components/common/ErrorMessage'

export default function CourseDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const { data: courseData, isLoading, error } = useQuery(
    ['course', id, 'v2'], // Added version to force refetch
    () => courseService.getCourseById(id)
  )

  const { data: materialsData } = useQuery(
    ['materials', id],
    () => materialService.getMaterialsByCourse(id),
    { enabled: !!id }
  )

  const { data: sessionsData } = useQuery(
    ['sessions', id],
    () => sessionService.getSessions({ courseId: id }),
    { enabled: !!id }
  )

  const course = courseData?.course

  if (isLoading) return <LoadingSpinner fullScreen />
  if (error) return <ErrorMessage message={error.message || 'Failed to load course'} />
  if (!course) return <ErrorMessage message="Course not found" />

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BookOpen },
    { id: 'syllabus', label: 'Syllabus', icon: FileText },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'materials', label: 'Materials', icon: Video },
    { id: 'reviews', label: 'Reviews', icon: Star },
  ]

  return (
    <>

    <SEOHead title="Course Detail - Student" noIndex={true} noFollow={true} />

    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Back Button */}
        <button
          onClick={() => navigate('/student/courses')}
          className="genz-btn-secondary inline-flex items-center gap-2 mb-4 sm:mb-6 min-h-[44px] px-3 sm:px-4 py-2 rounded-lg transition-all hover:scale-105 w-full sm:w-auto justify-center sm:justify-start"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-sm sm:text-base">Back to Courses 📚</span>
        </button>

      {/* Course Header */}
      <div className="genz-card mb-4 sm:mb-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
        <div className="p-3 sm:p-4 lg:p-6">
          <div className="flex flex-col gap-4 sm:gap-6">
            {/* Course Title and Basic Info */}
            <div className="text-center sm:text-left">
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2 break-words animate-shimmer leading-tight">
                {course.title} ✨
              </h1>
              <p className="text-gray-600 text-sm sm:text-base mb-3">
                Grade {course.grade} • {course.subject} • {course.level || 'Intermediate'} Level 🎯
              </p>
              <p className="text-gray-700 text-sm sm:text-base leading-relaxed max-w-4xl mx-auto sm:mx-0">{course.description}</p>
            </div>

            {/* Stats Grid - Mobile Optimized */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="genz-card p-3 sm:p-4 hover:scale-105 transition-all text-center sm:text-left">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <Star className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400 fill-current mx-auto sm:mx-0 animate-pulse flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="font-bold text-sm sm:text-base text-emerald-600">{course.averageRating?.toFixed(1) || 'N/A'}</div>
                    <div className="text-xs text-gray-600">Rating</div>
                  </div>
                </div>
              </div>

              <div className="genz-card p-3 sm:p-4 hover:scale-105 transition-all text-center sm:text-left">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500 mx-auto sm:mx-0 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="font-bold text-sm sm:text-base text-gray-900">{course.duration || '12'} weeks</div>
                    <div className="text-xs text-gray-600">Duration</div>
                  </div>
                </div>
              </div>

              <div className="genz-card p-3 sm:p-4 hover:scale-105 transition-all text-center sm:text-left">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 mx-auto sm:mx-0 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="font-bold text-sm sm:text-base text-gray-900">{course.questionCount || 0}</div>
                    <div className="text-xs text-gray-600">Questions</div>
                  </div>
                </div>
              </div>

              <div className="genz-card p-3 sm:p-4 hover:scale-105 transition-all text-center sm:text-left">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-pink-500 mx-auto sm:mx-0 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="font-bold text-sm sm:text-base text-gray-900 capitalize">{course.level || 'Intermediate'}</div>
                    <div className="text-xs text-gray-600">Level</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="genz-card mb-4 sm:mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex overflow-x-auto scrollbar-hide px-2 sm:px-4 lg:px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 lg:px-6 py-3 border-b-2 transition-all whitespace-nowrap min-h-[48px] text-sm sm:text-base flex-shrink-0 hover:scale-105 rounded-t-lg ${
                  activeTab === tab.id
                    ? 'border-emerald-500 text-emerald-600 bg-gradient-to-r from-emerald-50 to-teal-50 font-semibold'
                    : 'border-transparent text-gray-600 hover:text-emerald-600 hover:bg-emerald-50'
                }`}
              >
                <tab.icon className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${activeTab === tab.id ? 'animate-bounce-slow' : ''}`} />
                <span className="hidden xs:inline sm:inline">{tab.label}</span>
                <span className="xs:hidden sm:hidden text-xs">{tab.label.slice(0, 4)}{tab.label.length > 4 ? '...' : ''}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-3 sm:p-4 lg:p-6">
          {activeTab === 'overview' && (
            <div className="space-y-4 sm:space-y-6">
              <div>
                <h3 className="text-base sm:text-lg lg:text-xl font-semibold mb-3 sm:mb-4 text-gray-900 flex items-center gap-2">
                  🎯 What you'll learn
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:gap-4">
                  <div className="genz-card p-3 sm:p-4 hover:scale-105 transition-all">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0 mt-0.5 animate-pulse" />
                      <span className="text-gray-700 text-sm sm:text-base leading-relaxed">Master core concepts and fundamentals 💡</span>
                    </div>
                  </div>
                  <div className="genz-card p-3 sm:p-4 hover:scale-105 transition-all">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0 mt-0.5 animate-pulse" />
                      <span className="text-gray-700 text-sm sm:text-base leading-relaxed">Apply knowledge through practical exercises 🛠️</span>
                    </div>
                  </div>
                  <div className="genz-card p-3 sm:p-4 hover:scale-105 transition-all">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0 mt-0.5 animate-pulse" />
                      <span className="text-gray-700 text-sm sm:text-base leading-relaxed">Prepare for exams and assessments 📝</span>
                    </div>
                  </div>
                  <div className="genz-card p-3 sm:p-4 hover:scale-105 transition-all">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0 mt-0.5 animate-pulse" />
                      <span className="text-gray-700 text-sm sm:text-base leading-relaxed">Develop critical thinking skills 🧠</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'syllabus' && (
            <div>
              <h3 className="text-base sm:text-lg lg:text-xl font-semibold mb-3 sm:mb-4 text-gray-900 flex items-center gap-2">
                📚 Course Syllabus
              </h3>
              <div className="prose max-w-none">
                {course.syllabus && course.syllabus.length > 0 ? (
                  <div className="space-y-2 sm:space-y-3">
                    {course.syllabus.map((item, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 sm:p-4 genz-card hover:scale-105 transition-all">
                        <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0 mt-0.5 animate-pulse" />
                        <span className="text-gray-700 text-sm sm:text-base leading-relaxed">{item}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 sm:py-12">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl sm:text-3xl">
                      📝
                    </div>
                    <p className="text-gray-600 text-sm sm:text-base font-medium">Detailed syllabus will be provided after enrollment.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'schedule' && (
            <div>
              <h3 className="text-base sm:text-lg lg:text-xl font-semibold mb-3 sm:mb-4 text-gray-900 flex items-center gap-2">
                📅 Upcoming Sessions
              </h3>
              {sessionsData?.sessions?.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {sessionsData.sessions.map((session) => (
                    <div key={session._id} className="genz-card p-3 sm:p-4 hover:scale-105 transition-all">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                          <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 text-sm sm:text-base mb-1">{session.title}</h4>
                          <p className="text-xs sm:text-sm text-gray-600 mb-2">
                            {new Date(session.scheduledAt).toLocaleString()}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <span className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap ${
                              session.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                              session.status === 'ongoing' ? 'bg-green-100 text-green-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {session.status} 📅
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 sm:py-12">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl sm:text-3xl">
                    📅
                  </div>
                  <p className="text-gray-600 text-sm sm:text-base font-medium">No scheduled sessions yet.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'materials' && (
            <div>
              <h3 className="text-base sm:text-lg lg:text-xl font-semibold mb-3 sm:mb-4 text-gray-900 flex items-center gap-2">
                📚 Course Materials
              </h3>
              {materialsData?.data?.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {materialsData.data.map((material) => (
                    <div key={material._id} className="genz-card p-3 sm:p-4 hover:scale-105 transition-all">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                          {material.type === 'video' ? <Video className="w-5 h-5 sm:w-6 sm:h-6 text-white" /> : <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 text-sm sm:text-base mb-1">{material.title}</h4>
                          <p className="text-xs sm:text-sm text-gray-600 capitalize mb-2">{material.type} 📄</p>
                          <div className="flex flex-wrap gap-2">
                            {material.isFree ? (
                              <button className="genz-btn-secondary text-xs sm:text-sm min-h-[36px] px-3 py-1.5">
                                View Material 👁️
                              </button>
                            ) : (
                              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-medium">
                                🔒 Locked
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 sm:py-12">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl sm:text-3xl">
                    📚
                  </div>
                  <p className="text-gray-600 text-sm sm:text-base font-medium">No materials available yet.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div>
              <h3 className="text-base sm:text-lg lg:text-xl font-semibold mb-3 sm:mb-4 text-gray-900 flex items-center gap-2">
                ⭐ Student Reviews
              </h3>
              {course.reviews?.length > 0 ? (
                <div className="space-y-4 sm:space-y-6">
                  {course.reviews.map((review, index) => (
                    <div key={index} className="genz-card p-3 sm:p-4 hover:scale-105 transition-all">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                            <span className="text-white font-bold text-sm sm:text-base">
                              {(review.student?.name || 'Anonymous').charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-2">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-gray-900 text-sm sm:text-base">
                                {review.student?.name || 'Anonymous'}
                              </h4>
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-3 h-3 sm:w-4 sm:h-4 ${
                                      i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            <span className="text-xs text-gray-500 self-start sm:self-center">
                              {new Date(review.createdAt || Date.now()).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-gray-700 text-sm sm:text-base leading-relaxed">{review.comment}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 sm:py-12">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl sm:text-3xl">
                    ⭐
                  </div>
                  <p className="text-gray-600 text-sm sm:text-base font-medium">No reviews yet. Be the first to review!</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
    </div>


    </>)
}

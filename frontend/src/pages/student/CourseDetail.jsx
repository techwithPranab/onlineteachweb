import { useState } from 'react'
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
import ErrorMessage from '@/components/common/ErrorMessage'

export default function CourseDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/student/courses')}
        className="genz-btn-secondary inline-flex items-center gap-2 mb-4 sm:mb-6 min-h-[44px] px-4 py-2 rounded-lg transition-all hover:scale-105"
      >
        <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        Back to Courses 📚
      </button>

      {/* Course Header */}
      <div className="genz-card mb-4 sm:mb-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-indigo-500"></div>
        <div className="flex flex-col xl:flex-row gap-4 sm:gap-6 p-4 sm:p-6 lg:p-8">
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 gap-2">
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2 break-words animate-shimmer">
                  {course.title} ✨
                </h1>
                <p className="text-gray-600 text-sm sm:text-base">
                  Grade {course.grade} • {course.subject} • {course.level || 'Intermediate'} Level 🎯
                </p>
              </div>
            </div>

            <p className="text-gray-700 mb-4 sm:mb-6 text-sm sm:text-base leading-relaxed">{course.description}</p>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              <div className="flex items-center gap-2 text-gray-600">
                <Star className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 fill-current flex-shrink-0 animate-pulse" />
                <span className="font-bold text-sm sm:text-base text-purple-600">{course.averageRating?.toFixed(1) || 'N/A'}</span>
                <span className="text-xs sm:text-sm">({course.reviews?.length || 0} reviews)</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 text-blue-500" />
                <span className="text-sm sm:text-base font-medium">{course.duration || '12'} weeks duration ⏰</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 text-green-500" />
                <span className="text-sm sm:text-base font-medium">{course.questionCount || 0} questions available 📝</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 text-pink-500" />
                <span className="capitalize text-sm sm:text-base font-medium">{course.level || 'Intermediate'} level 🚀</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Tabs */}
      <div className="genz-card mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex overflow-x-auto scrollbar-hide px-2 sm:px-4 lg:px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 lg:px-4 py-3 border-b-2 transition-all whitespace-nowrap min-h-[44px] text-sm sm:text-base flex-shrink-0 hover:scale-105 ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-600 bg-gradient-to-r from-purple-50 to-indigo-50'
                    : 'border-transparent text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                }`}
              >
                <tab.icon className={`w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 ${activeTab === tab.id ? 'animate-bounce-slow' : ''}`} />
                <span className="hidden xs:inline sm:inline">{tab.label}</span>
                <span className="xs:hidden sm:hidden">{tab.label.slice(0, 4)}{tab.label.length > 4 ? '...' : ''}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 sm:p-6 lg:p-8">
          {activeTab === 'overview' && (
            <div className="space-y-6 sm:space-y-8">
              <div>
                <h3 className="text-base sm:text-lg lg:text-xl font-semibold mb-3 sm:mb-4 text-gray-900 flex items-center gap-2">
                  🎯 What you'll learn
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="genz-card p-4 hover:scale-105 transition-all">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0 mt-0.5 animate-pulse" />
                      <span className="text-gray-700 text-sm sm:text-base leading-relaxed">Master core concepts and fundamentals 💡</span>
                    </div>
                  </div>
                  <div className="genz-card p-4 hover:scale-105 transition-all">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0 mt-0.5 animate-pulse" />
                      <span className="text-gray-700 text-sm sm:text-base leading-relaxed">Apply knowledge through practical exercises 🛠️</span>
                    </div>
                  </div>
                  <div className="genz-card p-4 hover:scale-105 transition-all">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0 mt-0.5 animate-pulse" />
                      <span className="text-gray-700 text-sm sm:text-base leading-relaxed">Prepare for exams and assessments 📝</span>
                    </div>
                  </div>
                  <div className="genz-card p-4 hover:scale-105 transition-all">
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
              <h3 className="text-lg font-semibold mb-4">Course Syllabus</h3>
              <div className="prose max-w-none">
                {course.syllabus && course.syllabus.length > 0 ? (
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    {course.syllabus.map((item, index) => (
                      <li key={index} className="text-sm sm:text-base">{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-700">Detailed syllabus will be provided after enrollment.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'schedule' && (
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-4">Upcoming Sessions</h3>
              {sessionsData?.sessions?.length > 0 ? (
                <div className="space-y-3">
                  {sessionsData.sessions.map((session) => (
                    <div key={session._id} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 border border-gray-200 rounded-lg">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 text-sm sm:text-base">{session.title}</h4>
                        <p className="text-xs sm:text-sm text-gray-600">
                          {new Date(session.scheduledAt).toLocaleString()}
                        </p>
                      </div>
                      <span className={`px-2 py-1 sm:px-3 rounded-full text-xs sm:text-sm w-fit ${
                        session.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                        session.status === 'ongoing' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {session.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-sm sm:text-base">No scheduled sessions yet.</p>
              )}
            </div>
          )}

          {activeTab === 'materials' && (
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-4">Course Materials</h3>
              {materialsData?.data?.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {materialsData.data.map((material) => (
                    <div key={material._id} className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 border border-gray-200 rounded-lg">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        {material.type === 'video' ? <Video className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600" /> : <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 text-sm sm:text-base truncate">{material.title}</h4>
                        <p className="text-xs sm:text-sm text-gray-600 capitalize">{material.type}</p>
                      </div>
                      {material.isFree ? (
                        <button className="text-primary-600 hover:text-primary-700 text-xs sm:text-sm font-medium min-h-[44px] px-2 py-1">
                          View
                        </button>
                      ) : (
                        <span className="text-gray-400 text-xs sm:text-sm">Locked</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-sm sm:text-base">No materials available yet.</p>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-4">Student Reviews</h3>
              {course.reviews?.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {course.reviews.map((review, index) => (
                    <div key={index} className="border-b border-gray-200 pb-3 sm:pb-4 last:border-0">
                      <div className="flex items-center gap-2 mb-2">
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
                        <span className="text-xs sm:text-sm text-gray-600">
                          {review.student?.name || 'Anonymous'}
                        </span>
                      </div>
                      <p className="text-gray-700 text-sm sm:text-base">{review.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-sm sm:text-base">No reviews yet. Be the first to review!</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from 'react-query'
import {
  ArrowLeft,
  BookOpen,
  Star,
  Clock,
  Users,
  Calendar,
  Video,
  FileText,
  CheckCircle,
  DollarSign,
} from 'lucide-react'
import { courseService, materialService, sessionService } from '@/services/apiServices'
import { useAuthStore } from '@/store/authStore'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import ErrorMessage from '@/components/common/ErrorMessage'
import Modal from '@/components/common/Modal'

export default function CourseDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState('overview')
  const [showEnrollModal, setShowEnrollModal] = useState(false)

  const { data: courseData, isLoading, error } = useQuery(
    ['course', id],
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

  const course = courseData?.data
  const isEnrolled = course?.enrolledStudents?.includes(user?._id)

  const handleEnroll = () => {
    setShowEnrollModal(true)
  }

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
    <div className="max-w-7xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => navigate('/student/courses')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Courses
      </button>

      {/* Course Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{course.title}</h1>
                <p className="text-gray-600">
                  Grade {course.grade} • {course.subject}
                </p>
              </div>
              {isEnrolled && (
                <span className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                  <CheckCircle className="w-4 h-4" />
                  Enrolled
                </span>
              )}
            </div>

            <p className="text-gray-700 mb-6">{course.description}</p>

            {/* Stats */}
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2 text-gray-600">
                <Star className="w-5 h-5 text-yellow-400 fill-current" />
                <span className="font-medium">{course.averageRating?.toFixed(1) || 'N/A'}</span>
                <span className="text-sm">({course.reviews?.length || 0} reviews)</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Users className="w-5 h-5" />
                <span>{course.enrolledStudents?.length || 0} students enrolled</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="w-5 h-5" />
                <span>12 weeks duration</span>
              </div>
            </div>
          </div>

          {/* Enrollment Card */}
          <div className="lg:w-80 bg-gray-50 rounded-lg p-6 border border-gray-200">
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-1 text-3xl font-bold text-primary-600 mb-2">
                <DollarSign className="w-8 h-8" />
                <span>{course.price || 'Free'}</span>
              </div>
              <p className="text-sm text-gray-600">One-time payment</p>
            </div>

            {isEnrolled ? (
              <button
                onClick={() => navigate(`/student/live-class`)}
                className="btn-primary w-full mb-3"
              >
                Go to Classroom
              </button>
            ) : (
              <button onClick={handleEnroll} className="btn-primary w-full mb-3">
                Enroll Now
              </button>
            )}

            {/* Instructor Info */}
            <div className="pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-3">Instructor</p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-semibold text-lg">
                    {course.tutor?.name?.charAt(0) || 'T'}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{course.tutor?.name}</p>
                  <p className="text-sm text-gray-500">{course.tutor?.email}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex gap-4 px-6 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">What you'll learn</h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Master core concepts and fundamentals</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Apply knowledge through practical exercises</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Prepare for exams and assessments</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Develop critical thinking skills</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'syllabus' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Course Syllabus</h3>
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-line">
                  {course.syllabus || 'Detailed syllabus will be provided after enrollment.'}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'schedule' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Upcoming Sessions</h3>
              {sessionsData?.data?.length > 0 ? (
                <div className="space-y-3">
                  {sessionsData.data.map((session) => (
                    <div key={session._id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                      <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-primary-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{session.title}</h4>
                        <p className="text-sm text-gray-600">
                          {new Date(session.scheduledAt).toLocaleString()}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm ${
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
                <p className="text-gray-600">No scheduled sessions yet.</p>
              )}
            </div>
          )}

          {activeTab === 'materials' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Course Materials</h3>
              {materialsData?.data?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {materialsData.data.map((material) => (
                    <div key={material._id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                      <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                        {material.type === 'video' ? <Video className="w-5 h-5 text-primary-600" /> : <FileText className="w-5 h-5 text-primary-600" />}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{material.title}</h4>
                        <p className="text-sm text-gray-600 capitalize">{material.type}</p>
                      </div>
                      {material.isFree || isEnrolled ? (
                        <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                          View
                        </button>
                      ) : (
                        <span className="text-gray-400 text-sm">Locked</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No materials available yet.</p>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Student Reviews</h3>
              {course.reviews?.length > 0 ? (
                <div className="space-y-4">
                  {course.reviews.map((review, index) => (
                    <div key={index} className="border-b border-gray-200 pb-4 last:border-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-600">
                          {review.student?.name || 'Anonymous'}
                        </span>
                      </div>
                      <p className="text-gray-700">{review.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No reviews yet. Be the first to review!</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Enrollment Modal */}
      <Modal
        isOpen={showEnrollModal}
        onClose={() => setShowEnrollModal(false)}
        title="Enroll in Course"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            You are about to enroll in <strong>{course.title}</strong>
          </p>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Course Price:</span>
              <span className="font-semibold">${course.price || 0}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowEnrollModal(false)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setShowEnrollModal(false)
                navigate('/student/subscription')
              }}
              className="flex-1 btn-primary"
            >
              Proceed to Payment
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

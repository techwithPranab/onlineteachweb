import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import {
  ArrowLeft,
  BookOpen,
  Star,
  Clock,
  Calendar,
  Video,
  FileText,
  CheckCircle,
  PlusCircle,
  Trophy,
} from 'lucide-react'
import { courseService, materialService, sessionService, reviewService } from '@/services/apiServices'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import SEOHead from '@/components/SEO/SEOHead';
import ErrorMessage from '@/components/common/ErrorMessage'
import MaterialViewer from '@/components/course/MaterialViewer'
import Modal from '@/components/common/Modal'
import ReviewForm from '@/components/course/ReviewForm'
import ReviewList from '@/components/course/ReviewList'
import StarRating from '@/components/course/StarRating'
import toast from '@/utils/toast'
import { useAuthStore } from '@/store/authStore'

export default function CourseDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedMaterial, setSelectedMaterial] = useState(null)
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [reviewToEdit, setReviewToEdit] = useState(null)
  const [reviewPage, setReviewPage] = useState(1)
  const [reviewSort, setReviewSort] = useState('createdAt')

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const { data: courseData, isLoading, error } = useQuery(
    ['course', id, 'v2'], // Added version to force refetch
    () => courseService.getCourseById(id)
  )

  const { data: materialsData, isLoading: materialsLoading, error: materialsError } = useQuery(
    ['materials', id],
    () => materialService.getMaterialsByCourse(id),
    { enabled: !!id, retry: false }
  )

  const { data: sessionsData } = useQuery(
    ['sessions', id],
    () => sessionService.getSessions({ courseId: id }),
    { enabled: !!id }
  )

  const { data: quizCountData } = useQuery(
    ['courseQuizCount', id],
    () => courseService.getCourseQuizCount(id),
    { enabled: !!id && !!user }
  )

  // Reviews queries
  const { data: myReviewData } = useQuery(
    ['myReview', id],
    () => reviewService.getMyReview(id),
    { 
      enabled: !!id && !!user,
      retry: false,
      onError: () => {} // Silent fail if no review exists
    }
  )

  const { data: reviewsData, isLoading: reviewsLoading } = useQuery(
    ['courseReviews', id, reviewPage, reviewSort],
    () => reviewService.getCourseReviews(id, {
      page: reviewPage,
      limit: 10,
      sortBy: reviewSort,
      sortOrder: 'desc'
    }),
    { enabled: !!id && activeTab === 'reviews' }
  )

  // Review mutations
  const submitReviewMutation = useMutation(
    (reviewData) => reviewService.submitReview({ ...reviewData, courseId: id }),
    {
      onSuccess: () => {
        toast.success('Review submitted successfully! It will be published after admin approval. 🎉')
        queryClient.invalidateQueries(['myReview', id])
        queryClient.invalidateQueries(['courseReviews', id])
        queryClient.invalidateQueries(['course', id])
        setIsReviewModalOpen(false)
        setReviewToEdit(null)
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to submit review')
      }
    }
  )

  const updateReviewMutation = useMutation(
    ({ reviewId, reviewData }) => reviewService.updateMyReview(reviewId, reviewData),
    {
      onSuccess: () => {
        toast.success('Review updated successfully! It will be re-reviewed by admin. ✨')
        queryClient.invalidateQueries(['myReview', id])
        queryClient.invalidateQueries(['courseReviews', id])
        setIsReviewModalOpen(false)
        setReviewToEdit(null)
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update review')
      }
    }
  )

  const deleteReviewMutation = useMutation(
    (reviewId) => reviewService.deleteMyReview(reviewId),
    {
      onSuccess: () => {
        toast.success('Review deleted successfully')
        queryClient.invalidateQueries(['myReview', id])
        queryClient.invalidateQueries(['courseReviews', id])
        queryClient.invalidateQueries(['course', id])
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete review')
      }
    }
  )

  const course = courseData?.course
  const materials = materialsData?.data || []
  const materialsErrorMessage = materialsError?.response?.data?.message || materialsError?.message
  const myReview = myReviewData?.review
  const reviews = reviewsData?.reviews || []
  const reviewsPagination = reviewsData?.pagination

  const openMaterialModal = (material) => {
    setSelectedMaterial(material)
    setIsMaterialModalOpen(true)
  }

  const closeMaterialModal = () => {
    setIsMaterialModalOpen(false)
    setSelectedMaterial(null)
  }

  // Review handlers
  const openReviewModal = (review = null) => {
    if (!user) {
      toast.error('Please login to write a review')
      return
    }
    setReviewToEdit(review)
    setIsReviewModalOpen(true)
  }

  const closeReviewModal = () => {
    setIsReviewModalOpen(false)
    setReviewToEdit(null)
  }

  const handleSubmitReview = (reviewData) => {
    if (reviewToEdit) {
      updateReviewMutation.mutate({
        reviewId: reviewToEdit._id,
        reviewData
      })
    } else {
      submitReviewMutation.mutate(reviewData)
    }
  }

  const handleEditReview = (review) => {
    openReviewModal(review)
  }

  const handleDeleteReview = (review) => {
    if (window.confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
      deleteReviewMutation.mutate(review._id)
    }
  }

  const handleReviewPageChange = (page) => {
    setReviewPage(page)
  }

  const handleReviewSortChange = (sort) => {
    setReviewSort(sort)
    setReviewPage(1) // Reset to first page on sort change
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
    <>

    <SEOHead 
      title="Course Detail - Student" 
      description={(course.description && course.description.trim()) || "Learn and excel in your studies with our comprehensive online courses"}
      noIndex={true} 
      noFollow={true} 
    />

    <div className="min-h-screen bg-gray-50">
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-6 relative">
        {/* Back Button - Positioned above Header */}
        <button
          onClick={() => navigate('/student/courses')}
          className="absolute top-0 right-0 md:relative md:top-auto md:right-auto md:ml-auto md:mb-4 z-10 genz-btn-secondary inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-lg transition-all active:scale-95 sm:hover:scale-105 text-sm sm:text-base font-medium shadow-lg"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
          <span className="hidden xs:inline">Back to Courses 📚</span>
          <span className="xs:hidden">Back 📚</span>
        </button>

        {/* Course Header */}
        <div className="genz-card mb-3 sm:mb-4 md:mb-6 shadow-sm mt-0 md:mt-0">
          <div className="p-3 sm:p-4 md:p-6 lg:p-8">
          <div className="flex flex-col gap-3 sm:gap-4 md:gap-5 lg:gap-6">
            {/* Course Title and Basic Info */}
            <div className="text-center sm:text-left space-y-2 sm:space-y-3">
              <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent break-words animate-shimmer leading-tight px-1">
                {course.title} ✨
              </h1>
              <p className="text-xs sm:text-sm md:text-base font-medium text-gray-600">
                Grade {course.grade} • {course.subject} • {course.level || 'Intermediate'} Level 🎯
              </p>
              <p className="text-xs sm:text-sm md:text-base leading-relaxed max-w-4xl mx-auto sm:mx-0 text-gray-700">{course.description}</p>
            </div>

            {/* Stats Grid - Mobile Optimized */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
              <div className="genz-card p-2.5 sm:p-3 md:p-4 lg:p-5 active:scale-[0.98] sm:hover:scale-105 transition-all">
                <div className="flex flex-col items-center gap-1.5 sm:gap-2">
                  <Star className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-yellow-400 fill-current animate-pulse flex-shrink-0" />
                  <div className="text-center min-w-0">
                    <div className="font-bold text-base sm:text-lg md:text-xl text-emerald-600">{course.averageRating?.toFixed(1) || 'N/A'}</div>
                    <div className="text-[10px] sm:text-xs md:text-sm text-gray-600 font-medium">Rating</div>
                  </div>
                </div>
              </div>

              <div className="genz-card p-2.5 sm:p-3 md:p-4 lg:p-5 active:scale-[0.98] sm:hover:scale-105 transition-all">
                <div className="flex flex-col items-center gap-1.5 sm:gap-2">
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-blue-500 flex-shrink-0" />
                  <div className="text-center min-w-0">
                    <div className="font-bold text-base sm:text-lg md:text-xl text-gray-900">{course.duration || '12'} </div>
                    <div className="text-[10px] sm:text-xs md:text-sm text-gray-600 font-medium">Duration</div>
                  </div>
                </div>
              </div>

              <div className="genz-card p-2.5 sm:p-3 md:p-4 lg:p-5 active:scale-[0.98] sm:hover:scale-105 transition-all">
                <div className="flex flex-col items-center gap-1.5 sm:gap-2">
                  <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-green-500 flex-shrink-0" />
                  <div className="text-center min-w-0">
                    <div className="font-bold text-base sm:text-lg md:text-xl text-gray-900">{course.questionCount || 0}</div>
                    <div className="text-[10px] sm:text-xs md:text-sm text-gray-600 font-medium">Questions</div>
                  </div>
                </div>
              </div>

              <div className="genz-card p-2.5 sm:p-3 md:p-4 lg:p-5 active:scale-[0.98] sm:hover:scale-105 transition-all">
                <div className="flex flex-col items-center gap-1.5 sm:gap-2">
                  <FileText className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-pink-500 flex-shrink-0" />
                  <div className="text-center min-w-0">
                    <div className="font-bold text-base sm:text-lg md:text-xl text-gray-900 capitalize truncate">{course.level || 'Intermediate'}</div>
                    <div className="text-[10px] sm:text-xs md:text-sm text-gray-600 font-medium">Level</div>
                  </div>
                </div>
              </div>

              <div className="genz-card p-2.5 sm:p-3 md:p-4 lg:p-5 active:scale-[0.98] sm:hover:scale-105 transition-all col-span-2 sm:col-span-1">
                <div className="flex flex-col items-center gap-1.5 sm:gap-2">
                  <Trophy className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-indigo-500 flex-shrink-0" />
                  <div className="text-center min-w-0">
                    <div className="font-bold text-base sm:text-lg md:text-xl text-indigo-600">
                      {quizCountData?.count ?? course.completedQuizCount ?? 0}
                    </div>
                    <div className="text-[10px] sm:text-xs md:text-sm text-gray-600 font-medium">Quizzes Done</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="genz-card mb-3 sm:mb-4 md:mb-6 shadow-sm overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex overflow-x-auto scrollbar-hide touch-pan-x -mb-px" style={{WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-center gap-1 sm:gap-1.5 md:gap-2 px-3 sm:px-4 md:px-6 lg:px-8 py-2.5 sm:py-3 md:py-3.5 border-b-2 transition-all whitespace-nowrap min-h-[44px] sm:min-h-[48px] text-[11px] sm:text-xs md:text-sm flex-shrink-0 active:scale-95 sm:hover:scale-105 rounded-t-lg font-medium ${
                  activeTab === tab.id
                    ? 'border-emerald-500 text-emerald-600 bg-gradient-to-r from-emerald-50 to-teal-50 font-semibold'
                    : 'border-transparent text-gray-600 hover:text-emerald-600 hover:bg-emerald-50'
                }`}
              >
                <tab.icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 flex-shrink-0 ${activeTab === tab.id ? 'animate-bounce-slow' : ''}`} />
                <span className="hidden md:inline">{tab.label}</span>
                <span className="md:hidden">{tab.label.slice(0, 3)}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-3 sm:p-4 md:p-5 lg:p-6 xl:p-8">
          {activeTab === 'overview' && (
            <div className="space-y-3 sm:space-y-4 lg:space-y-6">
              <div>
                <h3 className="text-sm sm:text-base lg:text-lg font-semibold mb-2 sm:mb-3 lg:mb-4 text-gray-900 flex items-center gap-2">
                  🎯 What you'll learn
                </h3>
                <div className="grid grid-cols-1 gap-2 sm:gap-3 lg:gap-4">
                  <div className="genz-card p-2.5 sm:p-3 lg:p-4 active:scale-95 sm:hover:scale-105 transition-all">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-green-500 flex-shrink-0 mt-0.5 animate-pulse" />
                      <span className="text-gray-700 text-xs sm:text-sm lg:text-base leading-relaxed">Master core concepts and fundamentals 💡</span>
                    </div>
                  </div>
                  <div className="genz-card p-2.5 sm:p-3 lg:p-4 active:scale-95 sm:hover:scale-105 transition-all">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-green-500 flex-shrink-0 mt-0.5 animate-pulse" />
                      <span className="text-gray-700 text-xs sm:text-sm lg:text-base leading-relaxed">Apply knowledge through practical exercises 🛠️</span>
                    </div>
                  </div>
                  <div className="genz-card p-2.5 sm:p-3 lg:p-4 active:scale-95 sm:hover:scale-105 transition-all">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-green-500 flex-shrink-0 mt-0.5 animate-pulse" />
                      <span className="text-gray-700 text-xs sm:text-sm lg:text-base leading-relaxed">Prepare for exams and assessments 📝</span>
                    </div>
                  </div>
                  <div className="genz-card p-2.5 sm:p-3 lg:p-4 active:scale-95 sm:hover:scale-105 transition-all">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-green-500 flex-shrink-0 mt-0.5 animate-pulse" />
                      <span className="text-gray-700 text-xs sm:text-sm lg:text-base leading-relaxed">Develop critical thinking skills 🧠</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'syllabus' && (
            <div>
              <h3 className="text-sm sm:text-base lg:text-lg font-semibold mb-2 sm:mb-3 lg:mb-4 text-gray-900 flex items-center gap-2">
                📚 Course Syllabus
              </h3>
              <div className="prose prose-sm sm:prose max-w-none">
                {course.syllabus && course.syllabus.length > 0 ? (
                  <div className="space-y-2 sm:space-y-3">
                    {course.syllabus.map((item, index) => (
                      <div key={index} className="flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3 lg:p-4 genz-card active:scale-95 sm:hover:scale-105 transition-all">
                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-green-500 flex-shrink-0 mt-0.5 animate-pulse" />
                        <span className="text-gray-700 text-xs sm:text-sm lg:text-base leading-relaxed">{item}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 sm:py-8 lg:py-12">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl sm:text-3xl">
                      📝
                    </div>
                    <p className="text-gray-600 text-xs sm:text-sm lg:text-base font-medium">Detailed syllabus will be provided after enrollment.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'schedule' && (
            <div>
              <h3 className="text-sm sm:text-base lg:text-lg font-semibold mb-3 sm:mb-4 text-gray-900 flex items-center gap-2">
                📅 Upcoming Sessions
              </h3>
              {sessionsData?.sessions?.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {sessionsData.sessions.map((session) => (
                    <div key={session._id} className="genz-card p-3 sm:p-4 active:scale-95 sm:hover:scale-105 transition-all">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg self-center sm:self-start">
                          <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0 text-center sm:text-left">
                          <h4 className="font-semibold text-gray-900 text-sm sm:text-base mb-1 break-words">{session.title}</h4>
                          <p className="text-xs sm:text-sm text-gray-600 mb-2">
                            {new Date(session.scheduledAt).toLocaleString()}
                          </p>
                          <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
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
              <h3 className="text-sm sm:text-base md:text-lg font-semibold mb-3 sm:mb-4 text-gray-900 flex items-center gap-2">
                📚 Course Materials
              </h3>
              {materialsLoading ? (
                <div className="flex justify-center py-8 sm:py-12">
                  <LoadingSpinner size="md" />
                </div>
              ) : materialsError ? (
                <div className="text-center py-8 sm:py-12">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl sm:text-4xl">
                    🔒
                  </div>
                  <p className="text-gray-900 text-sm sm:text-base md:text-lg font-semibold mb-2">Materials are not available for this account.</p>
                  <p className="text-gray-600 text-xs sm:text-sm max-w-md mx-auto">
                    {materialsErrorMessage || 'Please check your subscription access or try again later.'}
                  </p>
                </div>
              ) : materials.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {materials.map((material) => (
                    <div key={material._id} className="genz-card p-3 sm:p-4 md:p-5 active:scale-[0.98] sm:hover:scale-105 transition-all">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg self-center sm:self-start">
                          {material.type === 'video' ? <Video className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" /> : <FileText className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0 text-center sm:text-left w-full sm:w-auto">
                          <h4 className="font-semibold text-gray-900 text-sm sm:text-base md:text-lg mb-1 break-words">{material.title}</h4>
                          <p className="text-xs sm:text-sm text-gray-600 capitalize mb-2">{material.type} 📄</p>
                          <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                            {material.isFree ? (
                              <button 
                                onClick={() => openMaterialModal(material)}
                                className="genz-btn-secondary text-xs sm:text-sm md:text-base min-h-[40px] sm:min-h-[44px] px-4 sm:px-5 py-2 sm:py-2.5 font-medium active:scale-95 sm:hover:scale-105"
                              >
                                View Material 👁️
                              </button>
                            ) : (
                              <span className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium">
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
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl sm:text-4xl">
                    📚
                  </div>
                  <p className="text-gray-600 text-sm sm:text-base md:text-lg font-medium">No materials available yet.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-4 sm:space-y-5 md:space-y-6">
              {/* Reviews Header with Stats */}
              <div className="genz-card p-4 sm:p-5 md:p-6 bg-gradient-to-br from-emerald-50 to-teal-50">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="text-center md:text-left">
                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-2 flex items-center justify-center md:justify-start gap-2">
                      ⭐ Course Reviews
                    </h3>
                    <div className="flex items-center justify-center md:justify-start gap-3">
                      <div className="flex items-center gap-2">
                        <StarRating rating={course.averageRating || 0} readOnly size="lg" />
                      </div>
                      {course.reviewCount > 0 && (
                        <span className="text-sm text-gray-600">
                          ({course.reviewCount} {course.reviewCount === 1 ? 'review' : 'reviews'})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Write Review Button */}
                  {user && (
                    <button
                      onClick={() => openReviewModal(myReview)}
                      className="
                        genz-btn-primary inline-flex items-center justify-center gap-2 
                        min-h-[44px] px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg 
                        text-sm sm:text-base font-medium
                        transition-all active:scale-95 sm:hover:scale-105
                        shadow-lg
                      "
                    >
                      <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>{myReview ? 'Edit Your Review' : 'Write a Review'}</span>
                    </button>
                  )}
                </div>

                {/* Pending Review Notice */}
                {myReview && myReview.status === 'pending' && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-xs sm:text-sm text-yellow-800">
                      ⏳ Your review is pending admin approval. You can edit or delete it anytime.
                    </p>
                  </div>
                )}

                {/* Rejected Review Notice */}
                {myReview && myReview.status === 'rejected' && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-xs sm:text-sm text-red-800 mb-2">
                      ❌ Your review was not approved. {myReview.adminNotes && `Reason: ${myReview.adminNotes}`}
                    </p>
                    <p className="text-xs text-red-700">You can edit and resubmit your review.</p>
                  </div>
                )}
              </div>

              {/* Reviews List */}
              <ReviewList
                reviews={reviews}
                isLoading={reviewsLoading}
                pagination={reviewsPagination}
                onPageChange={handleReviewPageChange}
                onSortChange={handleReviewSortChange}
                currentSort={reviewSort}
                ownReviewId={myReview?._id}
                onEditReview={handleEditReview}
                onDeleteReview={handleDeleteReview}
              />
            </div>
          )}
        </div>
      </div>
    </div>
    </div>

    {/* Material Viewer Modal */}
    <Modal 
      isOpen={isMaterialModalOpen} 
      onClose={closeMaterialModal} 
      title={selectedMaterial?.title || 'Material'} 
      size="lg"
    >
      {selectedMaterial && <MaterialViewer material={selectedMaterial} showPreview={false} />}
    </Modal>

    {/* Review Form Modal */}
    <Modal
      isOpen={isReviewModalOpen}
      onClose={closeReviewModal}
      title={reviewToEdit ? 'Edit Your Review' : 'Write a Review'}
      size="lg"
    >
      <ReviewForm
        onSubmit={handleSubmitReview}
        initialData={reviewToEdit}
        isLoading={submitReviewMutation.isLoading || updateReviewMutation.isLoading}
        onCancel={closeReviewModal}
      />
    </Modal>

    </>)
}

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { ArrowLeft, Star, CheckCircle, Users, BookOpen, ClipboardList } from 'lucide-react'
import { courseService, materialService, reviewService } from '../../services/apiServices'
import { useAuthStore } from '../../store/authStore'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import ErrorMessage from '../../components/common/ErrorMessage'
import MaterialList from '@/components/course/MaterialList'

export default function CourseDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, isAuthenticated } = useAuthStore()
  
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [fullMaterials, setFullMaterials] = useState(null)
  const [previewMaterials, setPreviewMaterials] = useState(null)
  const [isFetchingMaterials, setIsFetchingMaterials] = useState(false)
  const [isFetchingPreviews, setIsFetchingPreviews] = useState(false)

  // Fetch course details
  const { data: courseData, isLoading, error } = useQuery(
    ['course', id],
    () => courseService.getCourseById(id)
  )

  const course = courseData?.course

  // Fetch approved reviews for this course
  const { data: reviewsData } = useQuery(
    ['courseReviews', id],
    () => reviewService.getCourseReviews(id, { limit: 50 }),
    { enabled: !!id }
  )
  const approvedReviews = reviewsData?.reviews || []

  // Fetch material previews on component mount
  useEffect(() => {
    if (course) {
      fetchMaterialPreviews()
      // Also fetch full materials for authenticated users
      if (isAuthenticated) {
        fetchFullMaterials()
      }
    }
  }, [course, isAuthenticated])

  // Submit review mutation
  const submitReviewMutation = useMutation(
    (reviewData) => courseService.submitReview(id, reviewData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['course', id])
        setRating(0)
        setComment('')
        setShowReviewForm(false)
        alert('Review submitted successfully!')
      },
      onError: (error) => {
        alert(error.response?.data?.message || 'Failed to submit review')
      },
    }
  )

  const handleSubmitReview = (e) => {
    e.preventDefault()
    if (!isAuthenticated) {
      alert('Please login to submit a review')
      navigate('/login')
      return
    }
    if (rating === 0) {
      alert('Please select a rating')
      return
    }
    submitReviewMutation.mutate({ rating, comment })
  }

  const fetchMaterialPreviews = async () => {
    setIsFetchingPreviews(true)
    try {
      const res = await materialService.getMaterialPreviewsByCourse(id)
      setPreviewMaterials(res.materials || res.data || [])
    } catch (err) {
      console.error('Failed to load material previews:', err)
      // Don't show error to user for previews
    } finally {
      setIsFetchingPreviews(false)
    }
  }

  const fetchFullMaterials = async () => {
    if (!isAuthenticated) {
      alert('Please login to access all materials')
      return
    }
    setIsFetchingMaterials(true)
    try {
      const res = await materialService.getMaterialsByCourse(id)
      setFullMaterials(res.materials || res.data || [])
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to load materials')
    } finally {
      setIsFetchingMaterials(false)
    }
  }

  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorMessage message="Failed to load course details" />
  if (!course) return <ErrorMessage message="Course not found" />

  const renderStars = (currentRating, interactive = false) => {
    return [...Array(5)].map((_, index) => {
      const starValue = index + 1
      return (
        <svg
          key={index}
          className={`h-5 w-5 sm:h-6 sm:w-6 ${
            interactive ? 'cursor-pointer' : ''
          } ${
            starValue <= (interactive ? (hoverRating || rating) : currentRating)
              ? 'text-yellow-400 fill-current'
              : 'text-gray-300'
          }`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          onClick={interactive ? () => setRating(starValue) : undefined}
          onMouseEnter={interactive ? () => setHoverRating(starValue) : undefined}
          onMouseLeave={interactive ? () => setHoverRating(0) : undefined}
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      )
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-primary-600 hover:text-primary-700 mb-4"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </button>

        {/* Course Header */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
          <div className="p-4 sm:p-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-3">
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{course.title}</h1>
                <p className="text-base sm:text-lg text-gray-600 mb-3">{course.description}</p>
                
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {renderStars(course.rating || course.averageRating || 0)}
                    </div>
                    <span className="text-sm sm:text-base text-gray-600">
                      {course.rating || course.averageRating ? (course.rating || course.averageRating).toFixed(1) : 'No ratings'} ({course.reviewCount || course.reviews?.length || 0} reviews)
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-blue-100 text-blue-800">
                    Grade {course.grade}
                  </span>
                  <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-green-100 text-green-800">
                    {course.subject}
                  </span>
                  <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-purple-100 text-purple-800">
                    {course.level || 'Intermediate'}
                  </span>
                  {course.board && course.board.map((b, idx) => (
                    <span key={idx} className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-yellow-100 text-yellow-800">
                      {b}
                    </span>
                  ))}
                </div>

                <p className="text-sm text-gray-500">
                  {course.enrollmentCount || course.enrolledStudents?.length || 0} students enrolled
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4 lg:space-y-6 order-2 lg:order-1">
            {/* ── Ratings & Stats Summary ── */}
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Ratings &amp; Activity</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Average Rating */}
                <div className="flex flex-col items-center justify-center bg-yellow-50 rounded-xl p-4 border border-yellow-100">
                  <div className="flex items-end gap-2 mb-1">
                    <span className="text-4xl font-extrabold text-yellow-500">
                      {course.averageRating ? course.averageRating.toFixed(1) : (course.rating ? Number(course.rating).toFixed(1) : '—')}
                    </span>
                    <span className="text-gray-400 text-sm mb-1">/ 5</span>
                  </div>
                  <div className="flex gap-0.5 mb-1">
                    {renderStars(course.averageRating || course.rating || 0)}
                  </div>
                  <span className="text-xs text-gray-500">Average Rating</span>
                </div>

                {/* Total Reviews */}
                <div className="flex flex-col items-center justify-center bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mb-2">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-2xl font-bold text-blue-700">
                    {course.reviewCount ?? approvedReviews.length}
                  </span>
                  <span className="text-xs text-gray-500 mt-1">Student Reviews</span>
                </div>

                {/* Total Quizzes Completed */}
                <div className="flex flex-col items-center justify-center bg-green-50 rounded-xl p-4 border border-green-100">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mb-2">
                    <ClipboardList className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="text-2xl font-bold text-green-700">
                    {course.completedQuizCount ?? 0}
                  </span>
                  <span className="text-xs text-gray-500 mt-1">Quizzes Completed</span>
                </div>
              </div>
            </div>

            {/* Syllabus */}
            {course.syllabus && course.syllabus.length > 0 && (
              <div className="bg-white rounded-lg shadow p-4">
                <h2 className="text-xl font-bold text-gray-900 mb-3">Syllabus</h2>
                <ul className="space-y-2">
                  {course.syllabus.map((item, index) => (
                    <li key={index} className="flex items-start">
                      <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Chapters */}
            {course.chapters && course.chapters.length > 0 && (
              <div className="bg-white rounded-lg shadow p-4">
                <h2 className="text-xl font-bold text-gray-900 mb-3">Course Chapters</h2>
                <div className="space-y-3">
                  {course.chapters.map((chapter, index) => (
                    <div key={index} className="border-l-4 border-primary-500 pl-4 py-2">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{chapter.name}</h3>
                      {chapter.topics && chapter.topics.length > 0 && (
                        <ul className="space-y-1 mb-2">
                          {chapter.topics.map((topic, idx) => (
                            <li key={idx} className="text-sm text-gray-600">• {topic}</li>
                          ))}
                        </ul>
                      )}
                      {chapter.learningObjectives && chapter.learningObjectives.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-gray-700">Learning Objectives:</p>
                          <ul className="space-y-1">
                            {chapter.learningObjectives.map((objective, idx) => (
                              <li key={idx} className="text-sm text-gray-600">→ {objective}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {chapter.estimatedHours && (
                        <p className="text-sm text-gray-500 mt-2">
                          ⏱️ Estimated: {chapter.estimatedHours} hours
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Materials */}
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-bold text-gray-900 mb-3">Materials</h2>
                <div>
                  {isAuthenticated && fullMaterials && (
                    <button onClick={fetchFullMaterials} disabled={isFetchingMaterials} className="text-sm bg-gray-600 text-white px-3 py-1 rounded">
                      {isFetchingMaterials ? 'Refreshing...' : 'Refresh materials'}
                    </button>
                  )}
                </div>
              </div>

              {isAuthenticated ? (
                fullMaterials ? (
                  fullMaterials.length > 0 ? (
                    <MaterialList materials={fullMaterials} />
                  ) : (
                    <p className="text-gray-500">No materials available for this course.</p>
                  )
                ) : (
                  <p className="text-gray-500">Loading materials...</p>
                )
              ) : (
                previewMaterials ? (
                  previewMaterials.length > 0 ? (
                    <div>
                      <p className="text-sm text-gray-600 mb-4">Preview available materials. Login for full access to all content.</p>
                      <MaterialList materials={previewMaterials} showPreview={true} />
                    </div>
                  ) : (
                    <p className="text-gray-500">No preview materials available. Please login to view materials.</p>
                  )
                ) : (
                  <p className="text-gray-500">Loading material previews...</p>
                )
              )}
            </div>

            {/* Learning Outcomes */}
            {course.learningOutcomes && course.learningOutcomes.length > 0 && (
              <div className="bg-white rounded-lg shadow p-4">
                <h2 className="text-xl font-bold text-gray-900 mb-3">What You'll Learn</h2>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {course.learningOutcomes.map((outcome, index) => (
                    <li key={index} className="flex items-start">
                      <svg className="h-5 w-5 text-primary-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-gray-700">{outcome}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* ── Approved Student Reviews ── */}
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Student Reviews</h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {approvedReviews.length} approved review{approvedReviews.length !== 1 ? 's' : ''}
                  </p>
                </div>
                {isAuthenticated && !showReviewForm && (
                  <button
                    onClick={() => setShowReviewForm(true)}
                    className="bg-primary-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors text-sm sm:text-base w-full sm:w-auto"
                  >
                    Write a Review
                  </button>
                )}
              </div>

              {/* Review Form */}
              {showReviewForm && (
                <form onSubmit={handleSubmitReview} className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Write Your Review</h3>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Your Rating</label>
                    <div className="flex gap-1">
                      {renderStars(rating, true)}
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Your Review</label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows="4"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Share your experience with this course..."
                      required
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="submit"
                      disabled={submitReviewMutation.isLoading}
                      className="bg-primary-600 text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 text-sm sm:text-base w-full sm:w-auto"
                    >
                      {submitReviewMutation.isLoading ? 'Submitting...' : 'Submit Review'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowReviewForm(false); setRating(0); setComment('') }}
                      className="bg-gray-300 text-gray-700 px-4 sm:px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors text-sm sm:text-base w-full sm:w-auto"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Approved Reviews List */}
              <div className="space-y-5">
                {approvedReviews.length > 0 ? (
                  approvedReviews.map((review, index) => (
                    <div key={review._id || index} className="border-b border-gray-100 pb-5 last:border-b-0 last:pb-0">
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-primary-700 font-semibold text-sm">
                            {(review.student?.name || review.studentName || 'A').charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1">
                            <p className="font-semibold text-gray-900 text-sm">
                              {review.student?.name || review.studentName || 'Anonymous Student'}
                            </p>
                            <span className="text-xs text-gray-400">
                              {new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                          {/* Star Rating */}
                          <div className="flex items-center gap-1 mb-2">
                            {renderStars(review.rating)}
                            <span className="text-xs text-gray-500 ml-1">{review.rating}/5</span>
                          </div>
                          {/* Comment */}
                          {review.comment && (
                            <p className="text-gray-700 text-sm leading-relaxed">{review.comment}</p>
                          )}
                          {/* Featured badge */}
                          {review.isFeatured && (
                            <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
                              <Star className="w-3 h-3 fill-current" /> Featured Review
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10">
                    <Star className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No reviews yet</p>
                    <p className="text-gray-400 text-sm mt-1">Be the first to review this course!</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 order-1 lg:order-2">
            {/* Prerequisites */}
            {course.prerequisites && course.prerequisites.length > 0 && (
              <div className="bg-white rounded-lg shadow p-4 mb-4">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Prerequisites</h3>
                <ul className="space-y-2">
                  {course.prerequisites.map((prereq, index) => (
                    <li key={index} className="text-sm text-gray-700">
                      • {prereq}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Tags */}
            {course.tags && course.tags.length > 0 && (
              <div className="bg-white rounded-lg shadow p-4 mb-4">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {course.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 sm:px-3 py-1 bg-gray-100 text-gray-700 text-xs sm:text-sm rounded-full hover:bg-gray-200 cursor-pointer"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Topics */}
            {course.topics && course.topics.length > 0 && (
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Topics Covered</h3>
                <ul className="space-y-2">
                  {course.topics.map((topic, index) => (
                    <li key={index} className="text-sm text-gray-700">
                      • {topic}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { ArrowLeft } from 'lucide-react'
import { courseService } from '../../services/apiServices'
import { useAuthStore } from '../../store/authStore'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import ErrorMessage from '../../components/common/ErrorMessage'

export default function CourseDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, isAuthenticated } = useAuthStore()
  
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [showReviewForm, setShowReviewForm] = useState(false)

  // Fetch course details
  const { data: courseData, isLoading, error } = useQuery(
    ['course', id],
    () => courseService.getCourseById(id)
  )

  const course = courseData?.course

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

  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorMessage message="Failed to load course details" />
  if (!course) return <ErrorMessage message="Course not found" />

  const renderStars = (currentRating, interactive = false) => {
    return [...Array(5)].map((_, index) => {
      const starValue = index + 1
      return (
        <svg
          key={index}
          className={`h-6 w-6 ${
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
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
          <div className="p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{course.title}</h1>
                <p className="text-lg text-gray-600 mb-3">{course.description}</p>
                
                <div className="flex items-center gap-6 mb-3">
                  <div className="flex items-center gap-2">
                    {renderStars(course.rating || course.averageRating || 0)}
                    <span className="text-gray-600">
                      {course.rating || course.averageRating ? (course.rating || course.averageRating).toFixed(1) : 'No ratings'} ({course.reviewCount || course.reviews?.length || 0} reviews)
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    Grade {course.grade}
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    {course.subject}
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                    {course.level || 'Intermediate'}
                  </span>
                  {course.board && course.board.map((b, idx) => (
                    <span key={idx} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Course Info */}
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-xl font-bold text-gray-900 mb-3">Course Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Duration</p>
                  <p className="font-semibold">{course.duration || 'Self-paced'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Estimated Hours</p>
                  <p className="font-semibold">{course.estimatedHours || 'N/A'} hours</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Language</p>
                  <p className="font-semibold">{course.language || 'English'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Certificate</p>
                  <p className="font-semibold">{course.certificate ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Difficulty</p>
                  <p className="font-semibold">
                    {'⭐'.repeat(course.difficulty || 1)} ({course.difficulty || 1}/5)
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Max Students</p>
                  <p className="font-semibold">{course.maxStudents || 'Unlimited'}</p>
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

            {/* Reviews Section */}
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Student Reviews</h2>
                {isAuthenticated && !showReviewForm && (
                  <button
                    onClick={() => setShowReviewForm(true)}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Rating
                    </label>
                    <div className="flex gap-1">
                      {renderStars(rating, true)}
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Review
                    </label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows="4"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Share your experience with this course..."
                      required
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={submitReviewMutation.isLoading}
                      className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                    >
                      {submitReviewMutation.isLoading ? 'Submitting...' : 'Submit Review'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowReviewForm(false)
                        setRating(0)
                        setComment('')
                      }}
                      className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Reviews List */}
              <div className="space-y-4">
                {course.reviews && course.reviews.length > 0 ? (
                  course.reviews.map((review, index) => (
                    <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {review.student?.name || 'Anonymous Student'}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex">
                              {renderStars(review.rating)}
                            </div>
                            <span className="text-sm text-gray-500">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-gray-700 mt-2">{review.comment}</p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    No reviews yet. Be the first to review this course!
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
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
                      className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full hover:bg-gray-200 cursor-pointer"
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

import { useRouter } from 'next/router'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { ArrowLeft, Star, Clock, Users, BookOpen } from 'lucide-react'
import { courseService } from '../../../services/apiServices'
import { useAuthStore } from '../../../store/authStore'
import LoadingSpinner from '../../../components/common/LoadingSpinner'
import ErrorMessage from '../../../components/common/ErrorMessage'
import MeritaiCard from '../../../components/ui/MeritaiCard'
import SEOHead from '../../../components/SEO/SEOHead'
import CourseSchema from '../../../components/Schema/CourseSchema'
import BreadcrumbSchema from '../../../components/Schema/BreadcrumbSchema'

export default function CourseDetails() {
  const router = useRouter()
  const { id } = router.query
  const queryClient = useQueryClient()
  const { user, isAuthenticated } = useAuthStore()

  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [showReviewForm, setShowReviewForm] = useState(false)

  // Fetch course details
  const { data: courseData, isLoading, error } = useQuery(
    ['course', id],
    () => courseService.getCourseById(id),
    {
      enabled: !!id,
    }
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
      router.push('/login')
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

  // SEO Data
  const seoData = {
    title: `${course.title} | Grade ${course.grade} ${course.subject} | MeritAI`,
    description: course.description?.substring(0, 160) || `Learn ${course.subject} for Grade ${course.grade} with AI-powered personalized education. Master concepts with MeritAI.`,
    keywords: `Grade ${course.grade} ${course.subject}, ${course.title}, online courses, CBSE, ICSE, personalized learning`,
    canonical: `/courses/${course._id}`,
    ogImage: course.thumbnail || '/images/course-default.jpg',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'Course',
      name: course.title,
      description: course.description,
      provider: {
        '@type': 'Organization',
        name: 'MeritAI'
      },
      educationalLevel: `Grade ${course.grade}`,
      about: course.subject,
      inLanguage: 'en'
    }
  }

  // Breadcrumb data
  const breadcrumbData = [
    { name: 'Home', url: '/' },
    { name: 'Courses', url: '/courses' },
    { name: `Grade ${course.grade}`, url: `/courses?grade=${course.grade}` },
    { name: course.subject, url: `/courses?grade=${course.grade}&subject=${course.subject}` },
    { name: course.title, url: `/courses/${course._id}` }
  ]

  return (
    <>
      <SEOHead {...seoData} />
      <CourseSchema course={course} />
      <BreadcrumbSchema breadcrumbs={breadcrumbData} />

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <button
              onClick={() => router.back()}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Courses
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Course Header */}
              <MeritaiCard>
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        Grade {course.grade}
                      </span>
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                        {course.subject}
                      </span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">{course.title}</h1>
                    <p className="text-gray-600 mb-6">{course.description}</p>

                    {/* Course Stats */}
                    <div className="flex flex-wrap gap-4 mb-6">
                      <div className="flex items-center text-gray-600">
                        <Clock className="w-5 h-5 mr-2" />
                        <span>{course.duration || 'Self-paced'}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Users className="w-5 h-5 mr-2" />
                        <span>{course.enrolledCount || 0} enrolled</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <BookOpen className="w-5 h-5 mr-2" />
                        <span>{course.chapters?.length || 0} chapters</span>
                      </div>
                    </div>
                  </div>

                  {/* Course Image */}
                  {course.thumbnail && (
                    <div className="md:w-80">
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    </div>
                  )}
                </div>
              </MeritaiCard>

              {/* Course Content */}
              {course.chapters && course.chapters.length > 0 && (
                <MeritaiCard title="Course Content">
                  <div className="space-y-4">
                    {course.chapters.map((chapter, index) => (
                      <div key={chapter._id || index} className="border-b border-gray-200 pb-4 last:border-b-0">
                        <h3 className="font-semibold text-gray-900 mb-2">
                          Chapter {index + 1}: {chapter.title}
                        </h3>
                        <p className="text-gray-600 text-sm">{chapter.description}</p>
                        {chapter.topics && (
                          <ul className="mt-2 text-sm text-gray-500">
                            {chapter.topics.map((topic, topicIndex) => (
                              <li key={topicIndex} className="flex items-center">
                                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                                {topic}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </MeritaiCard>
              )}

              {/* Reviews Section */}
              <MeritaiCard title="Reviews & Ratings">
                <div className="space-y-6">
                  {/* Average Rating */}
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-gray-900">
                        {course.averageRating?.toFixed(1) || '0.0'}
                      </div>
                      <div className="flex items-center justify-center mt-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-5 h-5 ${
                              star <= (course.averageRating || 0)
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {course.reviews?.length || 0} reviews
                      </div>
                    </div>
                  </div>

                  {/* Reviews List */}
                  {course.reviews && course.reviews.length > 0 && (
                    <div className="space-y-4">
                      {course.reviews.map((review) => (
                        <div key={review._id} className="border-b border-gray-200 pb-4 last:border-b-0">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex items-center">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${
                                    star <= review.rating
                                      ? 'text-yellow-400 fill-current'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm text-gray-600">
                              by {review.user?.name || 'Anonymous'}
                            </span>
                          </div>
                          {review.comment && (
                            <p className="text-gray-700">{review.comment}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Review Form */}
                  {isAuthenticated && (
                    <div className="border-t pt-6">
                      <button
                        onClick={() => setShowReviewForm(!showReviewForm)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {showReviewForm ? 'Cancel Review' : 'Write a Review'}
                      </button>

                      {showReviewForm && (
                        <form onSubmit={handleSubmitReview} className="mt-4 space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Rating *
                            </label>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setRating(star)}
                                  onMouseEnter={() => setHoverRating(star)}
                                  onMouseLeave={() => setHoverRating(0)}
                                  className="focus:outline-none"
                                >
                                  <Star
                                    className={`w-6 h-6 ${
                                      star <= (hoverRating || rating)
                                        ? 'text-yellow-400 fill-current'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Comment (Optional)
                            </label>
                            <textarea
                              value={comment}
                              onChange={(e) => setComment(e.target.value)}
                              rows={4}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Share your experience with this course..."
                            />
                          </div>

                          <button
                            type="submit"
                            disabled={submitReviewMutation.isLoading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                          >
                            {submitReviewMutation.isLoading ? 'Submitting...' : 'Submit Review'}
                          </button>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              </MeritaiCard>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Enrollment Card */}
              <MeritaiCard>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {course.price === 0 ? 'Free' : `₹${course.price}`}
                  </div>
                  {course.price > 0 && course.originalPrice && (
                    <div className="text-lg text-gray-500 line-through">
                      ₹{course.originalPrice}
                    </div>
                  )}

                  {isAuthenticated ? (
                    <button
                      onClick={() => {
                        // Handle enrollment
                        alert('Enrollment functionality to be implemented')
                      }}
                      className="w-full mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                    >
                      {course.enrolled ? 'Continue Learning' : 'Enroll Now'}
                    </button>
                  ) : (
                    <button
                      onClick={() => router.push('/login')}
                      className="w-full mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                    >
                      Login to Enroll
                    </button>
                  )}
                </div>
              </MeritaiCard>

              {/* Course Info */}
              <MeritaiCard title="Course Information">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Grade</span>
                    <span className="font-medium">{course.grade}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subject</span>
                    <span className="font-medium">{course.subject}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Language</span>
                    <span className="font-medium">English</span>
                  </div>
                  {course.duration && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duration</span>
                      <span className="font-medium">{course.duration}</span>
                    </div>
                  )}
                </div>
              </MeritaiCard>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

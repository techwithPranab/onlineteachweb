import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { quizService, courseService } from '../../services/apiServices'
import { useAuthStore } from '../../store/authStore'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import ErrorMessage from '../../components/common/ErrorMessage'
import EmptyState from '../../components/common/EmptyState'

export default function QuizListing() {
  const [courses, setCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingQuizzes, setLoadingQuizzes] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const { user } = useAuthStore()

  useEffect(() => {
    fetchEnrolledCourses()
  }, [])

  const fetchEnrolledCourses = async () => {
    try {
      setLoading(true)
      // Get user's enrolled courses
      const response = await courseService.getCourses()
      const enrolledCourses = response.courses?.filter(course => 
        user?.enrolledCourses?.includes(course._id)
      ) || response.courses || []
      setCourses(enrolledCourses)
    } catch (err) {
      setError('Failed to load courses')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchQuizzesForCourse = async (courseId) => {
    try {
      setLoadingQuizzes(true)
      const response = await quizService.getAvailableQuizzes(courseId)
      setQuizzes(response.quizzes || [])
    } catch (err) {
      setError('Failed to load quizzes')
      console.error(err)
    } finally {
      setLoadingQuizzes(false)
    }
  }

  const handleCourseSelect = (course) => {
    setSelectedCourse(course)
    fetchQuizzesForCourse(course._id)
  }

  const handleStartQuiz = (quiz) => {
    navigate(`/student/quiz/${quiz._id}/start`, { state: { quiz } })
  }

  const getDifficultyColor = (level) => {
    switch (level) {
      case 'easy': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'hard': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} />

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Quizzes</h1>
        <p className="mt-2 text-gray-600">Select a course to view available quizzes</p>
      </div>

      {/* Course Selection */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Courses</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.length === 0 ? (
            <EmptyState
              title="No courses enrolled"
              message="Please enroll in a course to access quizzes"
            />
          ) : (
            courses.map((course) => (
              <div
                key={course._id}
                onClick={() => handleCourseSelect(course)}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedCourse?._id === course._id
                    ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500'
                    : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                }`}
              >
                <h3 className="font-medium text-gray-900">{course.title}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Grade {course.grade} • {course.subject}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quizzes List */}
      {selectedCourse && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Available Quizzes for {selectedCourse.title}
          </h2>
          
          {loadingQuizzes ? (
            <LoadingSpinner />
          ) : quizzes.length === 0 ? (
            <EmptyState
              title="No quizzes available"
              message="There are no quizzes available for this course yet"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quizzes.map((quiz) => (
                <div
                  key={quiz._id}
                  className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">{quiz.title}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(quiz.difficultyLevel)}`}>
                        {quiz.difficultyLevel}
                      </span>
                    </div>
                    
                    {quiz.description && (
                      <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                        {quiz.description}
                      </p>
                    )}

                    <div className="mt-4 space-y-2">
                      <div className="flex items-center text-sm text-gray-500">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Duration: {quiz.duration} minutes
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Questions: {quiz.questionConfig?.totalQuestions}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                        Total Marks: {quiz.totalMarks}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Attempts: {quiz.attemptsTaken || 0} / {quiz.attemptsAllowed}
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100">
                      {quiz.canAttempt ? (
                        <button
                          onClick={() => handleStartQuiz(quiz)}
                          className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                        >
                          {quiz.attemptsTaken > 0 ? 'Reattempt Quiz' : 'Start Quiz'}
                        </button>
                      ) : (
                        <button
                          disabled
                          className="w-full px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed font-medium"
                        >
                          No Attempts Remaining
                        </button>
                      )}
                      
                      {quiz.attemptsTaken > 0 && (
                        <button
                          onClick={() => navigate(`/student/quiz/${quiz._id}/results`)}
                          className="w-full mt-2 px-4 py-2 border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors font-medium"
                        >
                          View Results
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

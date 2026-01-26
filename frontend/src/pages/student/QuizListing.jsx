import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { quizService, courseService } from '../../services/apiServices'
import { useAuthStore } from '../../store/authStore'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import ErrorMessage from '../../components/common/ErrorMessage'
import EmptyState from '../../components/common/EmptyState'
import MeritaiButton from '../../components/ui/MeritaiButton'

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
    fetchAllCourses()
  }, [])

  const fetchAllCourses = async () => {
    try {
      setLoading(true)
      // Get all available courses
      const response = await courseService.getCourses()
      setCourses(response.courses || [])
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
    navigate(`/student/quiz/${quiz._id}/setup`, { state: { quiz } })
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
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-3 animate-shimmer">
          🎯 Available Quizzes
        </h1>
        <p className="text-gray-600 text-lg">Choose your course and start challenging yourself! 🚀</p>
      </div>

      {/* Course Selection */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
          📚 Select a Course
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.length === 0 ? (
            <EmptyState
              title="No courses available"
              description="No courses are currently available for quizzes"
            />
          ) : (
            courses.map((course) => (
              <div
                key={course._id}
                onClick={() => handleCourseSelect(course)}
                className={`genz-card cursor-pointer transition-all hover:scale-105 ${
                  selectedCourse?._id === course._id
                    ? 'ring-2 ring-purple-500 bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-300'
                    : 'hover:shadow-lg'
                }`}
              >
                <h3 className="font-bold text-gray-900 text-lg">{course.title} 📖</h3>
                <p className="text-sm text-gray-600 mt-2 font-medium">
                  Grade {course.grade} • {course.subject} • {course.level || 'All Levels'} 🎓
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quizzes List */}
      {selectedCourse && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            🎯 Quizzes for {selectedCourse.title}
          </h2>
          
          {loadingQuizzes ? (
            <LoadingSpinner />
          ) : quizzes.length === 0 ? (
            <EmptyState
              title="No quizzes available"
              description="There are no quizzes available for this course yet"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quizzes.map((quiz) => (
                <div
                  key={quiz._id}
                  className="genz-card group hover:scale-105 transition-all duration-300 relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-indigo-500"></div>
                  
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                        {quiz.title} 📝
                      </h3>
                      <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                        quiz.difficultyLevel === 'easy' ? 'bg-green-100 text-green-800 border border-green-300' :
                        quiz.difficultyLevel === 'medium' ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' :
                        'bg-red-100 text-red-800 border border-red-300'
                      }`}>
                        {quiz.difficultyLevel} {quiz.difficultyLevel === 'easy' ? '🟢' : quiz.difficultyLevel === 'medium' ? '🟡' : '🔴'}
                      </span>
                    </div>
                    
                    {quiz.description && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                        {quiz.description}
                      </p>
                    )}

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="text-blue-500 mr-2">⏱️</span>
                        Duration: {quiz.duration} minutes
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="text-green-500 mr-2">❓</span>
                        Questions: {quiz.questionConfig?.totalQuestions}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="text-yellow-500 mr-2">⭐</span>
                        Total Marks: {quiz.totalMarks}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="text-purple-500 mr-2">🔄</span>
                        Attempts: {quiz.attemptsTaken || 0} / {quiz.attemptsAllowed}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 space-y-2">
                      {quiz.canAttempt ? (
                        <MeritaiButton
                          onClick={() => handleStartQuiz(quiz)}
                          className="w-full hover:scale-105 transition-all"
                        >
                          {quiz.attemptsTaken > 0 ? '🔄 Reattempt Quiz' : '🚀 Start Quiz'}
                        </MeritaiButton>
                      ) : (
                        <button
                          disabled
                          className="w-full px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed font-medium"
                        >
                          ❌ No Attempts Remaining
                        </button>
                      )}
                      
                      {quiz.attemptsTaken > 0 && (
                        <button
                          onClick={() => navigate(`/student/quiz/${quiz._id}/results`)}
                          className="genz-btn-secondary w-full hover:scale-105 transition-all"
                        >
                          📊 View Results
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

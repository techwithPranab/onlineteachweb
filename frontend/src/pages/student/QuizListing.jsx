import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { quizService, courseService } from '../../services/apiServices'
import { useAuthStore } from '../../store/authStore'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import SEOHead from '../../components/SEO/SEOHead';
import ErrorMessage from '../../components/common/ErrorMessage'
import EmptyState from '../../components/common/EmptyState'
import MeritaiButton from '../../components/ui/MeritaiButton'
import { FeatureButton, UsageIndicator } from '../../components/common'

export default function QuizListing() {
  const [courses, setCourses] = useState([])
  const [subjects, setSubjects] = useState([])
  const [quizzes, setQuizzes] = useState([])
  const [filteredQuizzes, setFilteredQuizzes] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingQuizzes, setLoadingQuizzes] = useState(false)
  const [error, setError] = useState(null)
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedCourse, setSelectedCourse] = useState('')
  const navigate = useNavigate()
  const { user } = useAuthStore()

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    filterQuizzes()
  }, [selectedSubject, selectedCourse])

  const fetchInitialData = async () => {
    try {
      setLoading(true)
      // Fetch subjects and courses
      const [subjectsResponse, coursesResponse, quizzesResponse] = await Promise.all([
        courseService.getSubjects(),
        courseService.getCourses(),
        quizService.getAllAvailableQuizzes() // Get all published quizzes for students
      ])

      setSubjects(subjectsResponse.subjects || [])
      setCourses(coursesResponse.courses || [])
      setQuizzes(quizzesResponse.quizzes || [])
    } catch (err) {
      setError('Failed to load data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const filterQuizzes = async () => {
    try {
      setLoadingQuizzes(true);
      const params = {};

      if (selectedSubject) {
        params.subject = selectedSubject;
      }

      if (selectedCourse) {
        params.courseId = selectedCourse;
      }

      const response = await quizService.getAllAvailableQuizzes(params);
      setFilteredQuizzes(response.quizzes || []);
    } catch (error) {
      console.error('Error filtering quizzes:', error);
      setError('Failed to filter quizzes');
    } finally {
      setLoadingQuizzes(false);
    }
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

  const resetFilters = () => {
    setSelectedSubject('')
    setSelectedCourse('')
  }

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} />

  return (
    <>

    <SEOHead title="Quiz Listing - Student" noIndex={true} noFollow={true} />

    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-3 animate-shimmer">
          🎯 Available Quizzes
        </h1>
        <p className="text-gray-600 text-lg">Browse and attempt custom quizzes created by our expert tutors! 🚀</p>
        {/* Usage Indicator for quiz attempts */}
        <div className="mt-4 flex justify-center">
          <div className="inline-block">
            <UsageIndicator 
              feature="quiz.take" 
              variant="badge"
              showLabel={true}
            />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="genz-card mb-8">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📚 Filter by Subject
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="genz-input w-full"
              >
                <option value="">All Subjects</option>
                {subjects.map((subject) => (
                  <option key={subject.name} value={subject.name}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🎓 Filter by Course
              </label>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="genz-input w-full"
              >
                <option value="">All Courses</option>
                {courses.map((course) => (
                  <option key={course._id} value={course._id}>
                    {course.title} (Grade {course.grade})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={resetFilters}
                className="genz-btn-secondary px-4 py-2"
              >
                🔄 Reset
              </button>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredQuizzes.length} of {quizzes.length} quizzes
          </div>
        </div>
      </div>

      {/* Quizzes Table */}
      <div className="genz-card">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            📋 Available Quizzes
          </h2>
        </div>

        {loadingQuizzes ? (
          <div className="p-8">
            <LoadingSpinner />
          </div>
        ) : filteredQuizzes.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No quizzes found"
              description="No quizzes match your current filters. Try adjusting your search criteria."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quiz Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Course & Subject
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Difficulty
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration & Questions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Attempts
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredQuizzes.map((quiz) => (
                  <tr key={quiz._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                          {quiz.title} 📝
                        </div>
                        {quiz.description && (
                          <div className="text-sm text-gray-500 mt-1 line-clamp-2 max-w-xs">
                            {quiz.description}
                          </div>
                        )}
                        <div className="text-xs text-gray-500 mt-1">
                          Created by: {quiz.createdBy?.name || 'Admin'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {quiz.course?.title}
                      </div>
                      <div className="text-sm text-gray-500">
                        {quiz.course?.subject} • Grade {quiz.course?.grade}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(quiz.difficultyLevel)}`}>
                        {quiz.difficultyLevel} {quiz.difficultyLevel === 'easy' ? '🟢' : quiz.difficultyLevel === 'medium' ? '🟡' : '🔴'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <span className="text-blue-500">⏱️</span>
                        {quiz.duration} min
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-green-500">❓</span>
                        {quiz.questionConfig?.totalQuestions} questions
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-yellow-500">⭐</span>
                        {quiz.totalMarks} marks
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <span className="text-emerald-500">🔄</span>
                        {quiz.attemptsTaken || 0} / {quiz.attemptsAllowed}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex flex-col gap-2">
                        {quiz.canAttempt ? (
                          <FeatureButton
                            feature="quiz.take"
                            onClick={() => handleStartQuiz(quiz)}
                            variant="primary"
                            size="sm"
                            className="text-xs px-3 py-1"
                          >
                            {quiz.attemptsTaken > 0 ? '🔄 Reattempt' : '🚀 Start'}
                          </FeatureButton>
                        ) : (
                          <button
                            disabled
                            className="px-3 py-1 bg-gray-300 text-gray-500 rounded text-xs cursor-not-allowed"
                          >
                            ❌ No Attempts
                          </button>
                        )}

                        {quiz.attemptsTaken > 0 && (
                          <button
                            onClick={() => navigate(`/student/quiz/${quiz._id}/results`)}
                            className="genz-btn-secondary text-xs px-3 py-1"
                          >
                            📊 Results
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>


    </>)
}

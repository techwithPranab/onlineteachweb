import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { quizService, courseService } from '../../services/apiServices'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import ErrorMessage from '../../components/common/ErrorMessage'
import EmptyState from '../../components/common/EmptyState'
import ConfirmDialog from '../../components/common/ConfirmDialog'

export default function QuizManagement() {
  const [quizzes, setQuizzes] = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({
    courseId: '',
    status: '',
    difficultyLevel: ''
  })
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [deleteQuiz, setDeleteQuiz] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetchCourses()
    fetchQuizzes()
  }, [filters])

  const fetchCourses = async () => {
    try {
      const response = await courseService.getCourses()
      setCourses(response.courses || [])
    } catch (err) {
      console.error('Failed to load courses:', err)
    }
  }

  const fetchQuizzes = async (page = 1) => {
    try {
      setLoading(true)
      const params = {
        page,
        limit: 10,
        ...filters
      }
      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '') delete params[key]
      })
      
      const response = await quizService.getQuizzes(params)
      setQuizzes(response.quizzes || [])
      setPagination(response.pagination || { page: 1, pages: 1, total: 0 })
    } catch (err) {
      setError('Failed to load quizzes')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handlePublish = async (quizId) => {
    try {
      await quizService.publishQuiz(quizId)
      fetchQuizzes(pagination.page)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to publish quiz')
    }
  }

  const handleDelete = async () => {
    if (!deleteQuiz) return
    try {
      await quizService.deleteQuiz(deleteQuiz._id)
      setDeleteQuiz(null)
      fetchQuizzes(pagination.page)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete quiz')
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      case 'published':
        return 'bg-green-100 text-green-800'
      case 'archived':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getDifficultyBadge = (level) => {
    switch (level) {
      case 'easy':
        return 'bg-green-100 text-green-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'hard':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (error) return <ErrorMessage message={error} />

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quiz Management</h1>
          <p className="mt-2 text-gray-600">Create and manage quizzes for your courses</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => navigate('/tutor/questions')}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Question Bank
          </button>
          <button
            onClick={() => navigate('/tutor/quizzes/create')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Create Quiz
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
            <select
              value={filters.courseId}
              onChange={(e) => setFilters({ ...filters, courseId: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">All Courses</option>
              {courses.map(course => (
                <option key={course._id} value={course._id}>{course.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
            <select
              value={filters.difficultyLevel}
              onChange={(e) => setFilters({ ...filters, difficultyLevel: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">All Levels</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ courseId: '', status: '', difficultyLevel: '' })}
              className="px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Quiz List */}
      {loading ? (
        <LoadingSpinner />
      ) : quizzes.length === 0 ? (
        <EmptyState
          title="No quizzes found"
          message="Create your first quiz to get started"
          action={
            <button
              onClick={() => navigate('/tutor/quizzes/create')}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Create Quiz
            </button>
          }
        />
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quiz
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Course
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Difficulty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Attempts
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {quizzes.map((quiz) => (
                <tr key={quiz._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{quiz.title}</div>
                      <div className="text-sm text-gray-500">
                        {quiz.questionConfig?.totalQuestions} questions • {quiz.totalMarks} marks
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{quiz.courseId?.title}</div>
                    <div className="text-sm text-gray-500">
                      Grade {quiz.courseId?.grade}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getDifficultyBadge(quiz.difficultyLevel)}`}>
                      {quiz.difficultyLevel}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {quiz.duration} min
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getStatusBadge(quiz.status)}`}>
                      {quiz.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {quiz.stats?.totalAttempts || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      {quiz.status === 'draft' && (
                        <button
                          onClick={() => handlePublish(quiz._id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Publish
                        </button>
                      )}
                      <button
                        onClick={() => navigate(`/tutor/quizzes/${quiz._id}`)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        View
                      </button>
                      {quiz.status === 'draft' && (
                        <button
                          onClick={() => navigate(`/tutor/quizzes/${quiz._id}/edit`)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          Edit
                        </button>
                      )}
                      {quiz.stats?.totalAttempts === 0 && (
                        <button
                          onClick={() => setDeleteQuiz(quiz)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {(pagination.page - 1) * 10 + 1} to {Math.min(pagination.page * 10, pagination.total)} of {pagination.total} quizzes
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => fetchQuizzes(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => fetchQuizzes(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                    className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteQuiz}
        onClose={() => setDeleteQuiz(null)}
        onConfirm={handleDelete}
        title="Delete Quiz"
        message={`Are you sure you want to delete "${deleteQuiz?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
      />
    </div>
  )
}

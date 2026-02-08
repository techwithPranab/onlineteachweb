import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { questionService, courseService } from '../../services/apiServices'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import SEOHead from '../../components/SEO/SEOHead';
import ErrorMessage from '../../components/common/ErrorMessage'
import EmptyState from '../../components/common/EmptyState'
import Modal from '../../components/common/Modal'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import QuestionFormModal from '../../components/questions/QuestionFormModal'

export default function QuestionBank() {
  const navigate = useNavigate()
  const [questions, setQuestions] = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({
    grade: '',
    subject: '',
    courseId: '',
    difficultyLevel: '',
    type: '',
    search: ''
  })
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editQuestion, setEditQuestion] = useState(null)
  const [deleteQuestion, setDeleteQuestion] = useState(null)
  const [grades, setGrades] = useState([])
  const [subjects, setSubjects] = useState([])
  const [filteredCourses, setFilteredCourses] = useState([])

  useEffect(() => {
    fetchGrades()
    fetchCourses()
    // Reset to first page when filters change
    fetchQuestions(1)
  }, [filters])

  useEffect(() => {
    if (filters.grade) {
      fetchSubjects()
    }
  }, [filters.grade])

  useEffect(() => {
    if (filters.grade && filters.subject) {
      fetchCoursesByGradeAndSubject()
    }
  }, [filters.grade, filters.subject])

  const fetchGrades = async () => {
    try {
      const response = await courseService.getGrades()
      setGrades(response.grades || [])
    } catch (err) {
      console.error('Failed to load grades:', err)
    }
  }

  const fetchSubjects = async () => {
    try {
      const response = await courseService.getSubjectsByGrade(filters.grade)
      setSubjects(response.subjects || [])
    } catch (err) {
      console.error('Failed to load subjects:', err)
    }
  }

  const fetchCoursesByGradeAndSubject = async () => {
    try {
      const response = await courseService.getCoursesByGradeAndSubject(filters.grade, filters.subject)
      setFilteredCourses(response.courses || [])
    } catch (err) {
      console.error('Failed to load courses:', err)
    }
  }

  const fetchCourses = async () => {
    try {
      const response = await courseService.getCourses()
      setCourses(response.courses || [])
    } catch (err) {
      console.error('Failed to load courses:', err)
    }
  }

  const fetchQuestions = async (page = 1) => {
    try {
      setLoading(true)
      const params = {
        page,
        limit: 10,
        ...filters
      }
      Object.keys(params).forEach(key => {
        if (params[key] === '') delete params[key]
      })
      
      const response = await questionService.getQuestions(params)
      setQuestions(response.questions || [])
      setPagination(response.pagination || { page: 1, pages: 1, total: 0 })
    } catch (err) {
      setError('Failed to load questions')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteQuestion) return
    try {
      await questionService.deleteQuestion(deleteQuestion._id)
      setDeleteQuestion(null)
      fetchQuestions(pagination.page)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete question')
    }
  }

  const getTypeBadge = (type) => {
    const types = {
      'mcq-single': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'MCQ (Single)' },
      'mcq-multiple': { bg: 'bg-purple-100', text: 'text-purple-800', label: 'MCQ (Multiple)' },
      'true-false': { bg: 'bg-green-100', text: 'text-green-800', label: 'True/False' },
      'numerical': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Numerical' },
      'short-answer': { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Short Answer' },
      'long-answer': { bg: 'bg-pink-100', text: 'text-pink-800', label: 'Long Answer' },
      'case-based': { bg: 'bg-indigo-100', text: 'text-indigo-800', label: 'Case Based' }
    }
    const style = types[type] || { bg: 'bg-gray-100', text: 'text-gray-800', label: type }
    return `${style.bg} ${style.text}`
  }

  const getTypeLabel = (type) => {
    const labels = {
      'mcq-single': 'MCQ (Single)',
      'mcq-multiple': 'MCQ (Multiple)',
      'true-false': 'True/False',
      'numerical': 'Numerical',
      'short-answer': 'Short Answer',
      'long-answer': 'Long Answer',
      'case-based': 'Case Based'
    }
    return labels[type] || type
  }

  const getDifficultyBadge = (level) => {
    switch (level) {
      case 'easy': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'hard': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <>

    <SEOHead title="Question Bank - Admin" noIndex={true} noFollow={true} />

    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Question Bank</h1>
          <p className="mt-2 text-gray-600">Manage your quiz questions</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => navigate('/tutor/quizzes')}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Back to Quizzes
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Add Question
          </button>
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
            <select
              value={filters.grade}
              onChange={(e) => setFilters({ ...filters, grade: e.target.value, subject: '' })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">All Grades</option>
              {grades.map(grade => (
                <option key={grade} value={grade}>Grade {grade}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <select
              value={filters.subject}
              onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              disabled={!filters.grade}
            >
              <option value="">All Subjects</option>
              {subjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
            <select
              value={filters.courseId}
              onChange={(e) => setFilters({ ...filters, courseId: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              disabled={!filters.subject}
            >
              <option value="">All Courses</option>
              {filteredCourses.map(course => (
                <option key={course._id} value={course._id}>{course.title}</option>
              ))}
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">All Types</option>
              <option value="mcq-single">MCQ (Single)</option>
              <option value="mcq-multiple">MCQ (Multiple)</option>
              <option value="true-false">True/False</option>
              <option value="numerical">Numerical</option>
              <option value="short-answer">Short Answer</option>
              <option value="long-answer">Long Answer</option>
              <option value="case-based">Case Based</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Search..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ courseId: '', difficultyLevel: '', type: '', search: '' })}
              className="px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Questions List */}
      {loading ? (
        <LoadingSpinner />
      ) : questions.length === 0 ? (
        <EmptyState
          title="No questions found"
          message="Create your first question to build your quiz bank"
          action={
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Add Question
            </button>
          }
        />
      ) : (
        <div className="space-y-4">
          {questions.map((question, index) => (
            <div key={question._id} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getTypeBadge(question.type)}`}>
                      {getTypeLabel(question.type)}
                    </span>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full capitalize ${getDifficultyBadge(question.difficultyLevel)}`}>
                      {question.difficultyLevel}
                    </span>
                    <span className="text-xs text-gray-500">{question.marks} mark(s)</span>
                  </div>
                  
                  <p className="text-gray-900 font-medium mb-2">{question.text}</p>
                  
                  {question.options && question.options.length > 0 && (
                    <div className="ml-4 space-y-1">
                      {question.options.map((opt, i) => (
                        <div key={i} className={`text-sm ${opt.isCorrect ? 'text-green-600 font-medium' : 'text-gray-600'}`}>
                          {String.fromCharCode(65 + i)}. {opt.text} {opt.isCorrect && '✓'}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="mt-3 flex items-center space-x-4 text-sm text-gray-500">
                    <span>Course: {question.courseId?.title}</span>
                    {question.usageCount > 0 && (
                      <span>Used: {question.usageCount} times</span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => setEditQuestion(question)}
                    className="p-2 text-gray-500 hover:text-indigo-600"
                    title="Edit"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setDeleteQuestion(question)}
                    className="p-2 text-gray-500 hover:text-red-600"
                    title="Delete"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <div className="text-sm text-gray-700">
                Showing {(pagination.page - 1) * (pagination.limit || 10) + 1} to {Math.min(pagination.page * (pagination.limit || 10), pagination.total)} of {pagination.total}
              </div>
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600">Page {pagination.page} of {pagination.pages}</div>
                <div className="flex gap-2">
                  <button
                    onClick={() => fetchQuestions(Math.max(1, pagination.page - 1))}
                    disabled={pagination.page === 1}
                    className="px-3 py-1 border rounded-md disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => fetchQuestions(Math.min(pagination.pages, pagination.page + 1))}
                    disabled={pagination.page === pagination.pages}
                    className="px-3 py-1 border rounded-md disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Question Modal */}
      {(showCreateModal || editQuestion) && (
        <QuestionFormModal
          isOpen={true}
          question={editQuestion}
          courses={courses}
          onClose={() => {
            setShowCreateModal(false)
            setEditQuestion(null)
          }}
          onSave={() => {
            setShowCreateModal(false)
            setEditQuestion(null)
            fetchQuestions(pagination.page)
          }}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteQuestion}
        onClose={() => setDeleteQuestion(null)}
        onConfirm={handleDelete}
        title="Delete Question"
        message="Are you sure you want to delete this question? This action cannot be undone."
        confirmText="Delete"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
      />
    </div>


    </>)
}



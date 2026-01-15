import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { questionService, courseService } from '../../services/apiServices'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import ErrorMessage from '../../components/common/ErrorMessage'
import EmptyState from '../../components/common/EmptyState'
import Modal from '../../components/common/Modal'
import ConfirmDialog from '../../components/common/ConfirmDialog'

export default function QuestionBank() {
  const navigate = useNavigate()
  const [questions, setQuestions] = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({
    courseId: '',
    topic: '',
    difficultyLevel: '',
    type: '',
    search: ''
  })
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editQuestion, setEditQuestion] = useState(null)
  const [deleteQuestion, setDeleteQuestion] = useState(null)
  const [topics, setTopics] = useState([])

  useEffect(() => {
    fetchCourses()
    fetchQuestions()
  }, [filters])

  useEffect(() => {
    if (filters.courseId) {
      fetchTopics()
    }
  }, [filters.courseId])

  const fetchCourses = async () => {
    try {
      const response = await courseService.getCourses()
      setCourses(response.courses || [])
    } catch (err) {
      console.error('Failed to load courses:', err)
    }
  }

  const fetchTopics = async () => {
    try {
      const response = await questionService.getTopicsForCourse(filters.courseId)
      setTopics(response.topics || [])
    } catch (err) {
      console.error('Failed to load topics:', err)
    }
  }

  const fetchQuestions = async (page = 1) => {
    try {
      setLoading(true)
      const params = {
        page,
        limit: 20,
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
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
            <select
              value={filters.courseId}
              onChange={(e) => setFilters({ ...filters, courseId: e.target.value, topic: '' })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">All Courses</option>
              {courses.map(course => (
                <option key={course._id} value={course._id}>{course.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
            <select
              value={filters.topic}
              onChange={(e) => setFilters({ ...filters, topic: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              disabled={!filters.courseId}
            >
              <option value="">All Topics</option>
              {topics.map(t => (
                <option key={t.topic} value={t.topic}>{t.topic}</option>
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
          <div>
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
              onClick={() => setFilters({ courseId: '', topic: '', difficultyLevel: '', type: '', search: '' })}
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
                    <span>Topic: {question.topic}</span>
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
              <span className="text-sm text-gray-700">
                Showing {(pagination.page - 1) * 20 + 1} to {Math.min(pagination.page * 20, pagination.total)} of {pagination.total}
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={() => fetchQuestions(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 border rounded-md disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => fetchQuestions(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className="px-3 py-1 border rounded-md disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Question Modal */}
      {(showCreateModal || editQuestion) && (
        <QuestionFormModal
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
  )
}

// Question Form Modal Component
function QuestionFormModal({ question, courses, onClose, onSave }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [topics, setTopics] = useState([])
  
  const [formData, setFormData] = useState({
    courseId: question?.courseId?._id || question?.courseId || '',
    topic: question?.topic || '',
    difficultyLevel: question?.difficultyLevel || 'medium',
    type: question?.type || 'mcq-single',
    text: question?.text || '',
    caseStudy: question?.caseStudy || '',
    options: question?.options || [
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false }
    ],
    numericalAnswer: question?.numericalAnswer || { value: '', tolerance: 0 },
    expectedAnswer: question?.expectedAnswer || '',
    keywords: question?.keywords || [],
    explanation: question?.explanation || '',
    marks: question?.marks || 1,
    negativeMarks: question?.negativeMarks || 0,
    recommendedTime: question?.recommendedTime || 60,
    tags: question?.tags || []
  })

  useEffect(() => {
    if (formData.courseId) {
      fetchTopics()
    }
  }, [formData.courseId])

  const fetchTopics = async () => {
    try {
      const response = await questionService.getTopicsForCourse(formData.courseId)
      setTopics(response.topics?.map(t => t.topic) || [])
    } catch (err) {
      console.error(err)
    }
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleOptionChange = (index, field, value) => {
    const newOptions = [...formData.options]
    newOptions[index] = { ...newOptions[index], [field]: value }
    
    // For single MCQ, ensure only one correct answer
    if (field === 'isCorrect' && value && formData.type === 'mcq-single') {
      newOptions.forEach((opt, i) => {
        if (i !== index) opt.isCorrect = false
      })
    }
    
    setFormData(prev => ({ ...prev, options: newOptions }))
  }

  const addOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, { text: '', isCorrect: false }]
    }))
  }

  const removeOption = (index) => {
    if (formData.options.length > 2) {
      setFormData(prev => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index)
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      setError(null)
      
      const submitData = { ...formData }
      
      // Clean up based on type
      if (!['mcq-single', 'mcq-multiple'].includes(submitData.type)) {
        delete submitData.options
      }
      if (submitData.type !== 'numerical') {
        delete submitData.numericalAnswer
      }
      if (!['short-answer', 'long-answer', 'case-based'].includes(submitData.type)) {
        delete submitData.expectedAnswer
        delete submitData.keywords
      }
      
      if (question) {
        await questionService.updateQuestion(question._id, submitData)
      } else {
        await questionService.createQuestion(submitData)
      }
      
      onSave()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save question')
    } finally {
      setLoading(false)
    }
  }

  const needsOptions = ['mcq-single', 'mcq-multiple'].includes(formData.type)
  const needsNumerical = formData.type === 'numerical'
  const needsExpectedAnswer = ['short-answer', 'long-answer', 'case-based'].includes(formData.type)

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={question ? 'Edit Question' : 'Create Question'}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <ErrorMessage message={error} />}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Course *</label>
            <select
              value={formData.courseId}
              onChange={(e) => handleChange('courseId', e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">Select Course</option>
              {courses.map(course => (
                <option key={course._id} value={course._id}>{course.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Topic *</label>
            <input
              type="text"
              value={formData.topic}
              onChange={(e) => handleChange('topic', e.target.value)}
              required
              list="topics"
              placeholder="Enter or select topic"
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
            <datalist id="topics">
              {topics.map(t => <option key={t} value={t} />)}
            </datalist>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
            <select
              value={formData.type}
              onChange={(e) => handleChange('type', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="mcq-single">MCQ (Single Answer)</option>
              <option value="mcq-multiple">MCQ (Multiple Answers)</option>
              <option value="true-false">True/False</option>
              <option value="numerical">Numerical</option>
              <option value="short-answer">Short Answer</option>
              <option value="long-answer">Long Answer</option>
              <option value="case-based">Case Based</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty *</label>
            <select
              value={formData.difficultyLevel}
              onChange={(e) => handleChange('difficultyLevel', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Marks *</label>
            <input
              type="number"
              min={0.5}
              step={0.5}
              value={formData.marks}
              onChange={(e) => handleChange('marks', parseFloat(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
        </div>

        {formData.type === 'case-based' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Case Study</label>
            <textarea
              value={formData.caseStudy}
              onChange={(e) => handleChange('caseStudy', e.target.value)}
              rows={4}
              placeholder="Enter the case study or passage"
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Question Text *</label>
          <textarea
            value={formData.text}
            onChange={(e) => handleChange('text', e.target.value)}
            required
            rows={3}
            placeholder="Enter your question"
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          />
        </div>

        {/* MCQ Options */}
        {needsOptions && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Options *</label>
            <div className="space-y-2">
              {formData.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type={formData.type === 'mcq-single' ? 'radio' : 'checkbox'}
                    name="correctAnswer"
                    checked={option.isCorrect}
                    onChange={(e) => handleOptionChange(index, 'isCorrect', e.target.checked)}
                    className="h-4 w-4 text-indigo-600"
                  />
                  <input
                    type="text"
                    value={option.text}
                    onChange={(e) => handleOptionChange(index, 'text', e.target.value)}
                    placeholder={`Option ${String.fromCharCode(65 + index)}`}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
                  />
                  {formData.options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="p-2 text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addOption}
              className="mt-2 text-sm text-indigo-600 hover:text-indigo-800"
            >
              + Add Option
            </button>
          </div>
        )}

        {/* Numerical Answer */}
        {needsNumerical && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Correct Answer *</label>
              <input
                type="number"
                step="any"
                value={formData.numericalAnswer.value}
                onChange={(e) => handleChange('numericalAnswer', { ...formData.numericalAnswer, value: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tolerance</label>
              <input
                type="number"
                step="any"
                min={0}
                value={formData.numericalAnswer.tolerance}
                onChange={(e) => handleChange('numericalAnswer', { ...formData.numericalAnswer, tolerance: parseFloat(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
          </div>
        )}

        {/* Expected Answer & Keywords for text-based */}
        {needsExpectedAnswer && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expected Answer (for grading reference)</label>
              <textarea
                value={formData.expectedAnswer}
                onChange={(e) => handleChange('expectedAnswer', e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Keywords (comma-separated)</label>
              <input
                type="text"
                value={formData.keywords.join(', ')}
                onChange={(e) => handleChange('keywords', e.target.value.split(',').map(k => k.trim()).filter(k => k))}
                placeholder="keyword1, keyword2, keyword3"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Explanation</label>
          <textarea
            value={formData.explanation}
            onChange={(e) => handleChange('explanation', e.target.value)}
            rows={2}
            placeholder="Explanation shown after quiz submission"
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : (question ? 'Update' : 'Create')}
          </button>
        </div>
      </form>
    </Modal>
  )
}

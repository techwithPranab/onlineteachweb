import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import QuizTable from '@/components/quiz/QuizTable'
import FilterBar from '@/components/quiz/FilterBar'
import StatusBadge from '@/components/quiz/StatusBadge'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import ErrorMessage from '@/components/common/ErrorMessage'
import { Play, RotateCcw, Clock, Target, BookOpen, Trash2, AlertCircle } from 'lucide-react'

/**
 * Active Quiz Management Page
 * 
 * Purpose: Central hub for managing all created but not completed quizzes
 * 
 * Features:
 * - Table view of active quizzes
 * - Filter by subject, course, status
 * - Start/Resume quiz actions
 * - One IN_PROGRESS quiz at a time enforcement
 * - Delete unwanted quizzes
 * - Responsive design
 */
export default function ActiveQuizzes() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  
  // State management
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  // Filter state
  const [filters, setFilters] = useState({
    subject: 'all',
    course: 'all',
    status: 'all',
    difficulty: 'all'
  })

  // Load active quizzes on mount
  useEffect(() => {
    loadActiveQuizzes()
  }, [user])

  /**
   * Load active quizzes from localStorage (or API)
   */
  const loadActiveQuizzes = () => {
    try {
      setLoading(true)
      
      // TODO: Replace with API call
      const storageKey = `active_quizzes_${user?.id || 'demo'}`
      const stored = localStorage.getItem(storageKey)
      const activeQuizzes = stored ? JSON.parse(stored) : []
      
      setQuizzes(activeQuizzes)
      setError(null)
    } catch (err) {
      console.error('Failed to load active quizzes:', err)
      setError('Failed to load quizzes. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Filter configuration for FilterBar component
   */
  const filterConfig = [
    {
      field: 'subject',
      label: 'Subject',
      type: 'select',
      defaultValue: 'all',
      options: [
        { value: 'all', label: 'All Subjects' },
        ...getUniqueValues(quizzes, 'subject').map(s => ({
          value: s,
          label: s
        }))
      ]
    },
    {
      field: 'course',
      label: 'Course',
      type: 'select',
      defaultValue: 'all',
      options: [
        { value: 'all', label: 'All Courses' },
        ...getUniqueValues(quizzes, 'courseName').map(c => ({
          value: c,
          label: c
        }))
      ]
    },
    {
      field: 'status',
      label: 'Status',
      type: 'select',
      defaultValue: 'all',
      options: [
        { value: 'all', label: 'All Status' },
        { value: 'ACTIVE', label: 'Active' },
        { value: 'IN_PROGRESS', label: 'In Progress' }
      ]
    },
    {
      field: 'difficulty',
      label: 'Difficulty',
      type: 'select',
      defaultValue: 'all',
      options: [
        { value: 'all', label: 'All Difficulties' },
        { value: 'easy', label: 'Easy' },
        { value: 'medium', label: 'Medium' },
        { value: 'hard', label: 'Hard' }
      ]
    }
  ]

  /**
   * Apply filters to quizzes
   */
  const filteredQuizzes = useMemo(() => {
    return quizzes.filter(quiz => {
      if (filters.subject !== 'all' && quiz.subject !== filters.subject) return false
      if (filters.course !== 'all' && quiz.courseName !== filters.course) return false
      if (filters.status !== 'all' && quiz.status !== filters.status) return false
      if (filters.difficulty !== 'all' && quiz.difficulty !== filters.difficulty) return false
      return true
    })
  }, [quizzes, filters])

  /**
   * Paginate filtered quizzes
   */
  const paginatedQuizzes = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    const end = start + itemsPerPage
    return filteredQuizzes.slice(start, end)
  }, [filteredQuizzes, currentPage, itemsPerPage])

  /**
   * Pagination data
   */
  const pagination = useMemo(() => ({
    currentPage,
    totalPages: Math.ceil(filteredQuizzes.length / itemsPerPage),
    from: ((currentPage - 1) * itemsPerPage) + 1,
    to: Math.min(currentPage * itemsPerPage, filteredQuizzes.length),
    total: filteredQuizzes.length
  }), [currentPage, filteredQuizzes.length, itemsPerPage])

  /**
   * Handle starting/resuming a quiz
   */
  const handleStartQuiz = (quiz) => {
    // Check if another quiz is in progress
    const inProgressQuiz = quizzes.find(q => q.status === 'IN_PROGRESS' && q.id !== quiz.id)
    
    if (inProgressQuiz) {
      if (!window.confirm(
        `You have another quiz in progress: "${inProgressQuiz.subject} - ${inProgressQuiz.courseName}". ` +
        `Starting this quiz will mark the other as abandoned. Continue?`
      )) {
        return
      }
      
      // Mark other quiz as abandoned
      updateQuizStatus(inProgressQuiz.id, 'ACTIVE')
    }

    // Mark current quiz as in progress
    updateQuizStatus(quiz.id, 'IN_PROGRESS')
    
    // Navigate to quiz attempt page
    navigate(`/student/quiz/${quiz.id}/attempt`, {
      state: {
        quiz,
        sessionId: quiz.sessionId
      }
    })
  }

  /**
   * Handle deleting a quiz
   */
  const handleDeleteQuiz = (quiz) => {
    if (!window.confirm(`Are you sure you want to delete this quiz? This action cannot be undone.`)) {
      return
    }

    const storageKey = `active_quizzes_${user?.id || 'demo'}`
    const updatedQuizzes = quizzes.filter(q => q.id !== quiz.id)
    
    setQuizzes(updatedQuizzes)
    localStorage.setItem(storageKey, JSON.stringify(updatedQuizzes))
  }

  /**
   * Update quiz status
   */
  const updateQuizStatus = (quizId, newStatus) => {
    const storageKey = `active_quizzes_${user?.id || 'demo'}`
    const updatedQuizzes = quizzes.map(q =>
      q.id === quizId ? { ...q, status: newStatus, lastUpdated: new Date().toISOString() } : q
    )
    
    setQuizzes(updatedQuizzes)
    localStorage.setItem(storageKey, JSON.stringify(updatedQuizzes))
  }

  /**
   * Table column configuration
   */
  const columns = [
    {
      header: 'Quiz ID',
      accessor: 'id',
      width: '10%',
      render: (quiz) => (
        <span className="font-mono text-xs text-gray-600">
          {quiz.id.slice(0, 8)}...
        </span>
      )
    },
    {
      header: 'Subject',
      accessor: 'subject',
      width: '15%',
      render: (quiz) => (
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-gray-400" />
          <span className="font-medium text-gray-900">{quiz.subject}</span>
        </div>
      )
    },
    {
      header: 'Course',
      accessor: 'courseName',
      width: '20%',
      render: (quiz) => (
        <span className="text-gray-700">{quiz.courseName}</span>
      )
    },
    {
      header: 'Difficulty',
      accessor: 'difficulty',
      width: '10%',
      render: (quiz) => (
        <span className={`
          inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
          ${quiz.difficulty === 'easy' ? 'bg-green-100 text-green-800' : ''}
          ${quiz.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' : ''}
          ${quiz.difficulty === 'hard' ? 'bg-red-100 text-red-800' : ''}
        `}>
          <Target className="w-3 h-3 mr-1" />
          {quiz.difficulty.charAt(0).toUpperCase() + quiz.difficulty.slice(1)}
        </span>
      )
    },
    {
      header: 'Questions',
      accessor: 'questionCount',
      width: '10%',
      render: (quiz) => (
        <span className="text-gray-700 font-medium">{quiz.questionCount}</span>
      )
    },
    {
      header: 'Duration',
      accessor: 'duration',
      width: '10%',
      render: (quiz) => (
        <div className="flex items-center gap-1 text-gray-700">
          <Clock className="w-4 h-4 text-gray-400" />
          {quiz.duration} min
        </div>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      width: '10%',
      render: (quiz) => <StatusBadge status={quiz.status} showIcon />
    },
    {
      header: 'Actions',
      width: '15%',
      render: (quiz, _, onAction) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => onAction('start', quiz)}
            className={`
              inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
              ${quiz.status === 'IN_PROGRESS'
                ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }
            `}
          >
            {quiz.status === 'IN_PROGRESS' ? (
              <>
                <RotateCcw className="w-4 h-4" />
                Resume
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Start
              </>
            )}
          </button>
          
          <button
            onClick={() => onAction('delete', quiz)}
            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete quiz"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ]

  /**
   * Handle row actions
   */
  const handleRowAction = (action, quiz) => {
    switch (action) {
      case 'start':
        handleStartQuiz(quiz)
        break
      case 'delete':
        handleDeleteQuiz(quiz)
        break
      default:
        console.warn('Unknown action:', action)
    }
  }

  if (loading) return <LoadingSpinner fullScreen />
  if (error) return <ErrorMessage message={error} />

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Active Quizzes
        </h1>
        <p className="text-gray-600">
          Manage your created quizzes. Start when you're ready!
        </p>
      </div>

      {/* Info Alert */}
      {quizzes.some(q => q.status === 'IN_PROGRESS') && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-yellow-800 mb-1">
              Quiz in Progress
            </h3>
            <p className="text-sm text-yellow-700">
              You have a quiz in progress. Only one quiz can be active at a time.
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <FilterBar
        filters={filters}
        setFilters={setFilters}
        filterConfig={filterConfig}
      />

      {/* Quiz Table */}
      <QuizTable
        data={paginatedQuizzes}
        columns={columns}
        onRowAction={handleRowAction}
        loading={loading}
        emptyState={{
          title: 'No Active Quizzes',
          description: 'Create a quiz from Quiz Setup to get started',
          action: {
            label: 'Create Quiz',
            onClick: () => navigate('/student/quiz-setup')
          }
        }}
        pagination={pagination}
        onPageChange={setCurrentPage}
      />
    </div>
  )
}

/**
 * Helper: Get unique values from array of objects
 */
function getUniqueValues(array, key) {
  return [...new Set(array.map(item => item[key]))].filter(Boolean)
}

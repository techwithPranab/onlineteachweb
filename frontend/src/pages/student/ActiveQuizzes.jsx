import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import QuizTable from '@/components/quiz/QuizTable'
import FilterBar from '@/components/quiz/FilterBar'
import StatusBadge from '@/components/quiz/StatusBadge'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import ErrorMessage from '@/components/common/ErrorMessage'
import { algorithmQuizService } from '@/services/apiServices'
import { Play, RotateCcw, Clock, Target, BookOpen, Trash2, AlertCircle } from 'lucide-react'
import MeritaiCard from '@/components/ui/MeritaiCard'

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
   * Load active quizzes from API
   */
  const loadActiveQuizzes = async () => {
    try {
      setLoading(true)

      // Use the correct backend endpoint for active quizzes
      const response = await algorithmQuizService.getActiveQuizzesFromBackend()
      setQuizzes(response.data || [])
      setError(null)
    } catch (err) {
      console.error('Failed to load active quizzes:', err)
      setError(err.response?.data?.message || 'Failed to load quizzes. Please try again.')
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
  const handleStartQuiz = async (quiz) => {
    try {
      // Check if another quiz is in progress via API
      const activeQuizzes = await algorithmQuizService.getActiveQuizzesFromBackend()
      const inProgressQuiz = activeQuizzes.data?.find(q => q.status === 'IN_PROGRESS' && q.quizId !== quiz.quizId)

      if (inProgressQuiz) {
        if (!window.confirm(
          `You have another quiz in progress: "${inProgressQuiz.subject} - ${inProgressQuiz.courseName}". ` +
          `Starting this quiz will mark the other as abandoned. Continue?`
        )) {
          return
        }

        // Abandon the other quiz
        await algorithmQuizService.abandonQuiz(inProgressQuiz.quizId)
      }

      // Start this quiz (only if not already in progress)
      if (quiz.status === 'ACTIVE') {
        await algorithmQuizService.startQuiz(quiz.quizId)
      }

      // Navigate to quiz attempt page
      navigate(`/student/quiz/${quiz.quizId}/attempt`, {
        state: {
          quiz,
          sessionId: quiz.sessionId
        }
      })
    } catch (err) {
      console.error('Failed to start quiz:', err)
      setError(err.response?.data?.message || 'Failed to start quiz. Please try again.')
      // Reload quizzes to reflect current state
      loadActiveQuizzes()
    }
  }

  /**
   * Handle deleting a quiz
   */
  const handleDeleteQuiz = async (quiz) => {
    if (!window.confirm(`Are you sure you want to delete this quiz? This action cannot be undone.`)) {
      return
    }

    try {
      await algorithmQuizService.deleteActiveQuiz(quiz.quizId)
      // Reload quizzes after deletion
      await loadActiveQuizzes()
    } catch (err) {
      console.error('Failed to delete quiz:', err)
      setError(err.response?.data?.message || 'Failed to delete quiz. Please try again.')
    }
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
      header: 'Details',
      accessor: 'subject',
      width: '40%',
      className: 'sm:hidden',
      render: (quiz) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="font-medium text-gray-900 text-sm">{quiz.subject}</span>
          </div>
          <div className="text-xs text-gray-600 truncate">{quiz.courseName}</div>
          <div className="flex items-center gap-2 text-xs">
            <span className={`
              inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium
              ${quiz.difficulty === 'easy' ? 'bg-green-100 text-green-800' : ''}
              ${quiz.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' : ''}
              ${quiz.difficulty === 'hard' ? 'bg-red-100 text-red-800' : ''}
            `}>
              <Target className="w-3 h-3 mr-1" />
              {quiz.difficulty}
            </span>
            <span className="text-gray-500">{quiz.questionCount}Q</span>
            <div className="flex items-center gap-1 text-gray-500">
              <Clock className="w-3 h-3" />
              {quiz.duration}m
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <StatusBadge status={quiz.status} showIcon />
          </div>
        </div>
      )
    },
    {
      header: 'Subject',
      accessor: 'subject',
      width: '15%',
      className: 'hidden sm:table-cell',
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
      className: 'hidden md:table-cell',
      render: (quiz) => (
        <span className="text-gray-700 text-sm">{quiz.courseName}</span>
      )
    },
    {
      header: 'Difficulty',
      accessor: 'difficulty',
      width: '10%',
      className: 'hidden md:table-cell',
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
      className: 'hidden lg:table-cell',
      render: (quiz) => (
        <span className="text-gray-700 font-medium">{quiz.questionCount}</span>
      )
    },
    {
      header: 'Duration',
      accessor: 'duration',
      width: '10%',
      className: 'hidden lg:table-cell',
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
      className: 'hidden sm:table-cell',
      render: (quiz) => <StatusBadge status={quiz.status} showIcon />
    },
    {
      header: 'Actions',
      width: '15%',
      className: 'sm:w-20',
      render: (quiz, _, onAction) => (
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => onAction('start', quiz)}
            className={`
              inline-flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors
              ${quiz.status === 'IN_PROGRESS'
                ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }
            `}
          >
            {quiz.status === 'IN_PROGRESS' ? (
              <>
                <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Resume</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Start</span>
              </>
            )}
          </button>

          <button
            onClick={() => onAction('delete', quiz)}
            className="p-1 sm:p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete quiz"
          >
            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header with MeriTai styling */}
        <div className="mb-6 sm:mb-8 text-center">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black mb-2 sm:mb-3">
            <span className="meritai-title-gradient">
              🎯 Active Quizzes
            </span>
          </h1>
          <p className="text-base sm:text-lg text-gray-600 font-medium px-4">
            Let's ace those quizzes! 🚀 Start when you're ready!
          </p>
        </div>

        {/* Info Alert */}
        {quizzes.some(q => q.status === 'IN_PROGRESS') && (
          <MeritaiCard className="mb-4 sm:mb-6 bg-orange-50 border-2 border-orange-200 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-md">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 mt-0.5 animate-pulse text-orange-500" />
              <div>
                <h3 className="text-sm sm:text-base font-bold mb-1 flex items-center">
                  ⚡ Quiz in Progress
                </h3>
                <p className="text-xs sm:text-sm opacity-90">
                  You have a quiz in progress. Finish it to unlock more quizzes! 💪
                </p>
              </div>
            </div>
          </MeritaiCard>
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
    </div>
  )
}

/**
 * Helper: Get unique values from array of objects
 */
function getUniqueValues(array, key) {
  return [...new Set(array.map(item => item[key]))].filter(Boolean)
}

import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { algorithmQuizService } from '@/services/apiServices'
import QuizTable from '@/components/quiz/QuizTable'
import FilterBar from '@/components/quiz/FilterBar'
import StatusBadge from '@/components/quiz/StatusBadge'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import ErrorMessage from '@/components/common/ErrorMessage'
import { 
  Calendar, 
  Clock, 
  Target, 
  TrendingUp, 
  Award,
  Eye,
  BookOpen,
  CheckCircle,
  XCircle,
  BarChart3
} from 'lucide-react'

/**
 * Enhanced Quiz History Page
 * 
 * Purpose: Track and analyze completed quiz performance
 * 
 * Features:
 * - Table view of completed quizzes
 * - Advanced filtering (Subject, Course, Date, Status)
 * - Performance metrics and analytics
 * - Detailed results viewing
 * - Progress tracking over time
 * - Responsive design
 */
export default function QuizHistory() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  
  // State management
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  // Filter state
  const [filters, setFilters] = useState({
    subject: 'all',
    course: 'all',
    dateRange: 'all',
    status: 'all'
  })

  // Load quiz history on mount
  useEffect(() => {
    loadQuizHistory()
  }, [user, currentPage, filters])

  /**
   * Load quiz history from backend API
   */
  const loadQuizHistory = async () => {
    try {
      setLoading(true)

      // Get quiz history from backend API
      const response = await algorithmQuizService.getQuizHistory({
        page: currentPage,
        limit: itemsPerPage,
        ...filters
      })

      // Ensure we always set history to an array
      const historyData = response.data || response || []
      setHistory(Array.isArray(historyData) ? historyData : [])
      setError(null)
    } catch (err) {
      console.error('Failed to load quiz history:', err)
      setError('Failed to load quiz history. Please try again.')
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
        ...getUniqueValues(history, 'subject').map(s => ({
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
        ...getUniqueValues(history, 'courseName').map(c => ({
          value: c,
          label: c
        }))
      ]
    },
    {
      field: 'dateRange',
      label: 'Date Range',
      type: 'select',
      defaultValue: 'all',
      options: [
        { value: 'all', label: 'All Time' },
        { value: 'week', label: 'Last 7 Days' },
        { value: 'month', label: 'Last 30 Days' },
        { value: 'year', label: 'Last Year' }
      ]
    },
    {
      field: 'status',
      label: 'Performance',
      type: 'select',
      defaultValue: 'all',
      options: [
        { value: 'all', label: 'All Results' },
        { value: 'passed', label: 'Passed' },
        { value: 'failed', label: 'Failed' }
      ]
    }
  ]

  /**
   * Apply filters to history
   */
  const filteredHistory = useMemo(() => {
    if (!Array.isArray(history)) return []
    return history.filter(entry => {
      // Filter by subject
      if (filters.subject !== 'all' && entry.subject !== filters.subject) return false
      
      // Filter by course
      if (filters.course !== 'all' && entry.courseName !== filters.course) return false
      
      // Filter by status
      if (filters.status !== 'all') {
        const passed = entry.accuracy >= 60 // Passing threshold
        if (filters.status === 'passed' && !passed) return false
        if (filters.status === 'failed' && passed) return false
      }
      
      // Filter by date range
      if (filters.dateRange !== 'all') {
        const entryDate = new Date(entry.completedAt)
        const now = new Date()
        const daysDiff = Math.floor((now - entryDate) / (1000 * 60 * 60 * 24))
        
        if (filters.dateRange === 'week' && daysDiff > 7) return false
        if (filters.dateRange === 'month' && daysDiff > 30) return false
        if (filters.dateRange === 'year' && daysDiff > 365) return false
      }
      
      return true
    })
  }, [history, filters])

  /**
   * Paginate filtered history
   */
  const paginatedHistory = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    const end = start + itemsPerPage
    return filteredHistory.slice(start, end)
  }, [filteredHistory, currentPage, itemsPerPage])

  /**
   * Pagination data
   */
  const pagination = useMemo(() => ({
    currentPage,
    totalPages: Math.ceil(filteredHistory.length / itemsPerPage),
    from: ((currentPage - 1) * itemsPerPage) + 1,
    to: Math.min(currentPage * itemsPerPage, filteredHistory.length),
    total: filteredHistory.length
  }), [currentPage, filteredHistory.length, itemsPerPage])

  /**
   * Calculate overall statistics
   */
  const statistics = useMemo(() => {
    if (!Array.isArray(history) || history.length === 0) return null
    
    const totalQuizzes = history.length
    const passedQuizzes = history.filter(h => h.accuracy >= 60).length
    const avgAccuracy = history.reduce((sum, h) => sum + h.accuracy, 0) / totalQuizzes
    const avgScore = history.reduce((sum, h) => sum + h.score, 0) / totalQuizzes
    const totalTimeTaken = history.reduce((sum, h) => sum + h.timeTaken, 0)
    
    return {
      totalQuizzes,
      passedQuizzes,
      passRate: ((passedQuizzes / totalQuizzes) * 100).toFixed(1),
      avgAccuracy: avgAccuracy.toFixed(1),
      avgScore: avgScore.toFixed(1),
      totalTime: Math.floor(totalTimeTaken / 60) // minutes
    }
  }, [history])

  /**
   * Handle viewing detailed results
   */
  const handleViewDetails = (entry) => {
    navigate(`/student/quiz/${entry.quizId}/results`, {
      state: {
        result: {
          score: entry.score,
          totalScore: entry.totalScore,
          accuracy: entry.accuracy,
          timeTaken: entry.timeTaken,
          timeUtilization: entry.timeUtilization,
          performanceByTopic: entry.performanceByTopic,
          weakTopics: entry.weakTopics,
          recommendations: entry.recommendations
        },
        quiz: {
          subject: entry.subject,
          courseName: entry.courseName,
          difficulty: entry.difficulty,
          questionCount: entry.questionCount
        },
        fromHistory: true
      }
    })
  }

  /**
   * Table column configuration
   */
  const columns = [
    {
      header: 'Date',
      accessor: 'completedAt',
      width: '15%',
      render: (entry) => (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <div>
            <div className="font-medium text-gray-900">
              {new Date(entry.completedAt).toLocaleDateString()}
            </div>
            <div className="text-xs text-gray-500">
              {new Date(entry.completedAt).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'Subject',
      accessor: 'subject',
      width: '12%',
      render: (entry) => (
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-gray-400" />
          <span className="font-medium text-gray-900">{entry.subject}</span>
        </div>
      )
    },
    {
      header: 'Course',
      accessor: 'courseName',
      width: '18%',
      render: (entry) => (
        <span className="text-gray-700">{entry.courseName}</span>
      )
    },
    {
      header: 'Difficulty',
      accessor: 'difficulty',
      width: '10%',
      render: (entry) => (
        <span className={`
          inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
          ${entry.difficulty === 'easy' ? 'bg-green-100 text-green-800' : ''}
          ${entry.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' : ''}
          ${entry.difficulty === 'hard' ? 'bg-red-100 text-red-800' : ''}
        `}>
          <Target className="w-3 h-3 mr-1" />
          {entry.difficulty.charAt(0).toUpperCase() + entry.difficulty.slice(1)}
        </span>
      )
    },
    {
      header: 'Score',
      accessor: 'score',
      width: '10%',
      render: (entry) => (
        <div className="text-center">
          <div className="font-bold text-gray-900">
            {entry.score}/{entry.totalScore}
          </div>
          <div className="text-xs text-gray-500">
            {entry.questionCount} Qs
          </div>
        </div>
      )
    },
    {
      header: 'Accuracy',
      accessor: 'accuracy',
      width: '10%',
      render: (entry) => (
        <div className="text-center">
          <div className={`font-bold ${
            entry.accuracy >= 80 ? 'text-green-600' :
            entry.accuracy >= 60 ? 'text-yellow-600' :
            'text-red-600'
          }`}>
            {entry.accuracy.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500">
            {entry.accuracy >= 60 ? (
              <CheckCircle className="w-3 h-3 text-green-600 inline" />
            ) : (
              <XCircle className="w-3 h-3 text-red-600 inline" />
            )}
          </div>
        </div>
      )
    },
    {
      header: 'Time',
      accessor: 'timeTaken',
      width: '10%',
      render: (entry) => (
        <div className="flex items-center gap-1 text-gray-700">
          <Clock className="w-4 h-4 text-gray-400" />
          <div>
            <div className="font-medium">{Math.floor(entry.timeTaken / 60)}m</div>
            <div className="text-xs text-gray-500">
              {entry.timeUtilization?.toFixed(0)}%
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'Actions',
      width: '15%',
      render: (entry, _, onAction) => (
        <button
          onClick={() => onAction('view', entry)}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-indigo-100 text-indigo-800 hover:bg-indigo-200 transition-colors"
        >
          <Eye className="w-4 h-4" />
          View Details
        </button>
      )
    }
  ]

  /**
   * Handle row actions
   */
  const handleRowAction = (action, entry) => {
    if (action === 'view') {
      handleViewDetails(entry)
    }
  }

  if (loading) return <LoadingSpinner fullScreen />
  if (error) return <ErrorMessage message={error} />

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Quiz History
        </h1>
        <p className="text-gray-600">
          Track your performance and progress over time
        </p>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <StatCard
            icon={<BarChart3 className="w-5 h-5" />}
            label="Total Quizzes"
            value={statistics.totalQuizzes}
            color="blue"
          />
          <StatCard
            icon={<CheckCircle className="w-5 h-5" />}
            label="Passed"
            value={statistics.passedQuizzes}
            color="green"
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5" />}
            label="Pass Rate"
            value={`${statistics.passRate}%`}
            color="purple"
          />
          <StatCard
            icon={<Award className="w-5 h-5" />}
            label="Avg Accuracy"
            value={`${statistics.avgAccuracy}%`}
            color="yellow"
          />
          <StatCard
            icon={<Target className="w-5 h-5" />}
            label="Avg Score"
            value={statistics.avgScore}
            color="indigo"
          />
          <StatCard
            icon={<Clock className="w-5 h-5" />}
            label="Total Time"
            value={`${statistics.totalTime}m`}
            color="gray"
          />
        </div>
      )}

      {/* Filters */}
      <FilterBar
        filters={filters}
        setFilters={setFilters}
        filterConfig={filterConfig}
      />

      {/* Quiz History Table */}
      <QuizTable
        data={paginatedHistory}
        columns={columns}
        onRowAction={handleRowAction}
        loading={loading}
        emptyState={{
          title: 'No Quiz History',
          description: 'Complete quizzes to see your history here',
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
 * Statistic Card Component
 */
function StatCard({ icon, label, value, color = 'blue' }) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    indigo: 'bg-indigo-100 text-indigo-600',
    gray: 'bg-gray-100 text-gray-600',
    red: 'bg-red-100 text-red-600'
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg mb-2 ${colorClasses[color]}`}>
        {icon}
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  )
}

/**
 * Helper: Get unique values from array of objects
 */
function getUniqueValues(array, key) {
  if (!Array.isArray(array)) return []
  return [...new Set(array.map(item => item[key]))].filter(Boolean)
}

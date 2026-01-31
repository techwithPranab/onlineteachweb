import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { algorithmQuizService, courseService } from '@/services/apiServices'
import QuizTable from '@/components/quiz/QuizTable'
import FilterBar from '@/components/quiz/FilterBar'
import StatusBadge from '@/components/quiz/StatusBadge'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import ErrorMessage from '@/components/common/ErrorMessage'
import MeritaiButton from '@/components/ui/MeritaiButton'
import { 
  Calendar, 
  Clock, 
  Target, 
  TrendingUp, 
  Award,
  Eye,
  BookOpen,
  CheckCircle,
  XCircle
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

  // Available subjects and courses
  const [availableSubjects, setAvailableSubjects] = useState([])
  const [availableCourses, setAvailableCourses] = useState([])
  const [loadingSubjects, setLoadingSubjects] = useState(false)

  // Filter state
  const [filters, setFilters] = useState({
    subject: 'all',
    course: 'all',
    dateRange: 'all',
    status: 'all'
  })

  // Load subjects and courses on mount
  useEffect(() => {
    loadSubjectsAndCourses()
  }, [])

  // Load quiz history on mount and when filters change
  useEffect(() => {
    loadQuizHistory()
  }, [user, currentPage, filters])

  // Load courses when subject changes
  useEffect(() => {
    if (filters.subject !== 'all') {
      loadCoursesForSubject(filters.subject)
    } else {
      setAvailableCourses([])
      setFilters(prev => ({ ...prev, course: 'all' }))
    }
  }, [filters.subject])

  /**
   * Load available subjects and courses from API
   */
  const loadSubjectsAndCourses = async () => {
    try {
      setLoadingSubjects(true)
      
      // Get all subjects
      const subjectsResponse = await courseService.getSubjects()
      const subjects = subjectsResponse.subjects || subjectsResponse || []
      console.log('Fetched subjects:', subjectsResponse)
      // Filter subjects that have courses
      const subjectsWithCourses = subjects.filter(subject => 
        subject.courses && subject.courses.length > 0
      )
      
      setAvailableSubjects(subjectsWithCourses)
      
      console.log('Loaded subjects:', subjectsWithCourses.length)
    } catch (err) {
      console.error('Failed to load subjects:', err)
    } finally {
      setLoadingSubjects(false)
    }
  }

  /**
   * Load courses for a specific subject
   */
  const loadCoursesForSubject = async (subjectName) => {
    try {
      const subject = availableSubjects.find(s => s.name === subjectName)
      if (subject && subject.courses) {
        setAvailableCourses(subject.courses)
        console.log(`Loaded ${subject.courses.length} courses for ${subjectName}`)
      } else {
        setAvailableCourses([])
      }
    } catch (err) {
      console.error('Failed to load courses for subject:', err)
      setAvailableCourses([])
    }
  }

  /**
   * Load quiz history from backend API
   */
  const loadQuizHistory = async () => {
    try {
      setLoading(true)

      // Prepare query parameters for backend
      const queryParams = {
        page: currentPage,
        limit: itemsPerPage
      }

      // Only pass subject and dateRange filters to backend
      if (filters.subject !== 'all') {
        queryParams.subject = filters.subject
      }
      
      if (filters.dateRange !== 'all') {
        queryParams.dateRange = filters.dateRange
      }

      console.log('Loading quiz history with params:', queryParams)

      // Get quiz history from backend API
      const response = await algorithmQuizService.getQuizHistory(queryParams)

      console.log('Quiz history response:', response)

      // Ensure we always set history to an array
      const historyData = response.data || response || []
      const historyArray = Array.isArray(historyData) ? historyData : []
      
      console.log('Quiz history data:', historyArray.length, 'records')
      
      // ✅ PHASE 2: Validate and fix entries
      const validatedSessions = historyArray.map(session => {
        // Ensure quizId exists (use _id as fallback)
        if (!session.quizId && session._id) {
          console.warn(`Session ${session._id} missing quizId, using _id as fallback`);
          session.quizId = session._id;
        }
        
        // Ensure sessionId is accessible
        session.sessionId = session._id;
        
        return session;
      });
      
      console.log('Validated sessions:', {
        count: validatedSessions.length,
        allHaveQuizId: validatedSessions.every(s => s.quizId)
      });
      
      setHistory(validatedSessions)
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
        // Add dynamic options from available subjects
        ...availableSubjects.map(subject => ({
          value: subject.name,
          label: subject.name
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
        // Add dynamic options from available courses (filtered by subject)
        ...availableCourses.map(course => ({
          value: course.title || course.name,
          label: course.title || course.name
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
        const accuracy = entry.accuracy || 0;
        const passed = accuracy >= 60; // Passing threshold
        if (filters.status === 'passed' && !passed) return false;
        if (filters.status === 'failed' && passed) return false;
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
   * Handle viewing detailed results
   */
  const handleViewDetails = (entry) => {
    console.log('Viewing quiz details:', {
      quizId: entry.quizId,
      hasQuizId: !!entry.quizId,
      sessionId: entry._id || entry.sessionId,
      entryKeys: Object.keys(entry)
    });
    console.log('Viewing quiz details:', entry);
    // ✅ PHASE 2: Validate quizId exists
    if (!entry.quizId) {
      console.error('Cannot view details: quizId is missing from entry');
      // TODO: Show error toast or alert
      return;
    }
    
    navigate(`/student/quiz/${entry.quizId}/results`, {
      state: {
        result: {
          score: entry.score || 0,
          totalScore: entry.totalScore || 0,
          accuracy: entry.accuracy || 0,
          timeTaken: entry.timeTaken || 0,
          timeUtilization: entry.timeUtilization,
          performanceByTopic: entry.performanceByTopic,
          weakTopics: entry.weakTopics,
          recommendations: entry.recommendations
        },
        quiz: {
          subject: entry.subject,
          courseName: entry.courseName,
          difficulty: entry.difficulty || 'medium',
          questionCount: entry.questionCount
        },
        fromHistory: true,
        // ✅ Also pass sessionId for direct lookup if quizId fails
        sessionId: entry._id || entry.sessionId
      }
    })
    
    console.log('🚀 Navigation details:', {
      targetUrl: `/student/quiz/${entry.quizId}/results`,
      entryQuizId: entry.quizId,
      entryId: entry._id,
      stateKeys: Object.keys({
        result: { score: entry.score || 0 },
        quiz: { subject: entry.subject },
        fromHistory: true,
        sessionId: entry._id || entry.sessionId
      })
    });
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
      render: (entry) => (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="font-medium text-gray-900 text-sm">{entry.subject}</span>
          </div>
          <div className="text-xs text-gray-600">{entry.courseName}</div>
          <div className="flex items-center gap-2 text-xs">
            <Calendar className="w-3 h-3 text-gray-400" />
            <span>{new Date(entry.completedAt).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className={`
              inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium
              ${entry.difficulty === 'easy' ? 'bg-green-100 text-green-800' : ''}
              ${entry.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' : ''}
              ${entry.difficulty === 'hard' ? 'bg-red-100 text-red-800' : ''}
            `}>
              <Target className="w-3 h-3 mr-1" />
              {entry.difficulty ? (entry.difficulty.charAt(0).toUpperCase() + entry.difficulty.slice(1)) : 'Medium'}
            </span>
            <span className="text-gray-500">{entry.questionCount} Qs</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-sm font-bold text-gray-900">
              {entry.score}/{entry.totalScore}
            </div>
            <div className={`text-sm font-bold ${
              (entry.accuracy || 0) >= 80 ? 'text-green-600' :
              (entry.accuracy || 0) >= 60 ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {(entry.accuracy || 0).toFixed(1)}%
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'Date',
      accessor: 'completedAt',
      width: '15%',
      className: 'hidden sm:table-cell',
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
      className: 'hidden sm:table-cell',
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
      className: 'hidden md:table-cell',
      render: (entry) => (
        <span className="text-gray-700">{entry.courseName}</span>
      )
    },
    {
      header: 'Difficulty',
      accessor: 'difficulty',
      width: '10%',
      className: 'hidden md:table-cell',
      render: (entry) => (
        <span className={`
          inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
          ${entry.difficulty === 'easy' ? 'bg-green-100 text-green-800' : ''}
          ${entry.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' : ''}
          ${entry.difficulty === 'hard' ? 'bg-red-100 text-red-800' : ''}
        `}>
          <Target className="w-3 h-3 mr-1" />
          {entry.difficulty ? (entry.difficulty.charAt(0).toUpperCase() + entry.difficulty.slice(1)) : 'Medium'}
        </span>
      )
    },
    {
      header: 'Score',
      accessor: 'score',
      width: '10%',
      className: 'hidden sm:table-cell',
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
      className: 'hidden sm:table-cell',
      render: (entry) => {
        const accuracy = entry.accuracy || 0;
        return (
          <div className="text-center">
            <div className={`font-bold ${
              accuracy >= 80 ? 'text-green-600' :
              accuracy >= 60 ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {accuracy.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500">
              {accuracy >= 60 ? (
                <CheckCircle className="w-3 h-3 text-green-600 inline" />
              ) : (
                <XCircle className="w-3 h-3 text-red-600 inline" />
              )}
            </div>
          </div>
        );
      }
    },
    {
      header: 'Time',
      accessor: 'timeTaken',
      width: '10%',
      className: 'hidden lg:table-cell',
      render: (entry) => (
        <div className="flex items-center gap-1 text-gray-700">
          <Clock className="w-4 h-4 text-gray-400" />
          <div>
            <div className="font-medium">{Math.floor(entry.timeTaken / 60)}m</div>
            <div className="text-xs text-gray-500">
              {Number(entry.timeUtilization || 0).toFixed(0)}%
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'Actions',
      width: '15%',
      render: (entry, _, onAction) => (
        <MeritaiButton
          onClick={() => onAction('view', entry)}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:scale-105"
        >
          <Eye className="w-4 h-4" />
          View Details 👀
        </MeritaiButton>
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
      <div className="mb-6 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-3">
          📊 Quiz History
        </h1>
        <p className="text-gray-600 text-lg">
          Track your performance and level up! 🚀
        </p>
      </div>

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
          title: '📭 No Quiz History Yet',
          description: 'Complete quizzes to track your progress and see your awesome stats! 🚀',
          action: {
            label: 'Start Your First Quiz ✨',
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
  if (!Array.isArray(array)) return []
  return [...new Set(array.map(item => item[key]))].filter(Boolean)
}

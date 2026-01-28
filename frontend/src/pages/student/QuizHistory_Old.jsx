import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { quizService } from '@/services/apiServices'
import { useAuthStore } from '@/store/authStore'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import ErrorMessage from '@/components/common/ErrorMessage'
import EmptyState from '@/components/common/EmptyState'
import { 
  Calendar, 
  Clock, 
  Target, 
  TrendingUp, 
  Award,
  Eye,
  Filter,
  ChevronDown,
  CheckCircle,
  XCircle
} from 'lucide-react'

/**
 * Quiz History Page
 * 
 * Purpose: Enable continuous learning through repeated evaluation
 * 
 * Features:
 * - Display list of past quiz attempts
 * - Show comprehensive attempt details
 * - Filter by subject and date
 * - View detailed results of each attempt
 * - Track progress over time
 * - Empty state messaging
 */
export default function QuizHistory() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  
  // State management
  const [attempts, setAttempts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Filter state
  const [filters, setFilters] = useState({
    subject: 'all',
    dateRange: 'all', // all, week, month, year
    difficulty: 'all',
    status: 'all' // all, passed, failed
  })
  
  const [showFilters, setShowFilters] = useState(false)

  // Load quiz history on mount
  useEffect(() => {
    loadQuizHistory()
  }, [])

  /**
   * Load quiz attempt history
   */
  const loadQuizHistory = async () => {
    try {
      setLoading(true)
      
      // This would typically fetch from an API endpoint
      // For now, using mock data structure
      const historyData = JSON.parse(localStorage.getItem('quizHistory') || '[]')
      
      // Sort by date (most recent first)
      const sortedAttempts = historyData.sort((a, b) => 
        new Date(b.completedAt) - new Date(a.completedAt)
      )
      
      setAttempts(sortedAttempts)
      
    } catch (err) {
      setError(err.message || 'Failed to load quiz history')
      console.error('Quiz history error:', err)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Filter attempts based on current filters
   */
  const filteredAttempts = useMemo(() => {
    return attempts.filter(attempt => {
      // Filter by subject
      if (filters.subject !== 'all' && attempt.subject !== filters.subject) {
        return false
      }
      
      // Filter by difficulty
      if (filters.difficulty !== 'all' && attempt.difficulty !== filters.difficulty) {
        return false
      }
      
      // Filter by status
      if (filters.status !== 'all') {
        const passed = attempt.passed || (attempt.accuracy >= (attempt.passingPercentage || 60))
        if (filters.status === 'passed' && !passed) return false
        if (filters.status === 'failed' && passed) return false
      }
      
      // Filter by date range
      if (filters.dateRange !== 'all') {
        const attemptDate = new Date(attempt.completedAt)
        const now = new Date()
        const daysDiff = Math.floor((now - attemptDate) / (1000 * 60 * 60 * 24))
        
        if (filters.dateRange === 'week' && daysDiff > 7) return false
        if (filters.dateRange === 'month' && daysDiff > 30) return false
        if (filters.dateRange === 'year' && daysDiff > 365) return false
      }
      
      return true
    })
  }, [attempts, filters])

  /**
   * Calculate statistics from history
   */
  const statistics = useMemo(() => {
    if (attempts.length === 0) return null
    
    const totalAttempts = attempts.length
    const passedAttempts = attempts.filter(a => a.passed || a.accuracy >= (a.passingPercentage || 60)).length
    const avgAccuracy = attempts.reduce((sum, a) => sum + (a.accuracy || 0), 0) / totalAttempts
    const avgScore = attempts.reduce((sum, a) => sum + (a.score || 0), 0) / totalAttempts
    const totalTimeSpent = attempts.reduce((sum, a) => sum + (a.timeSpent || 0), 0)
    
    return {
      totalAttempts,
      passedAttempts,
      passRate: ((passedAttempts / totalAttempts) * 100).toFixed(1),
      avgAccuracy: avgAccuracy.toFixed(1),
      avgScore: avgScore.toFixed(1),
      totalTimeSpent: Math.floor(totalTimeSpent / 60) // convert to minutes
    }
  }, [attempts])

  /**
   * Get unique subjects from attempts
   */
  const subjects = useMemo(() => {
    const uniqueSubjects = [...new Set(attempts.map(a => a.subject))].filter(Boolean)
    return uniqueSubjects
  }, [attempts])

  /**
   * Format date for display
   */
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const daysDiff = Math.floor((now - date) / (1000 * 60 * 60 * 24))
    
    if (daysDiff === 0) return 'Today'
    if (daysDiff === 1) return 'Yesterday'
    if (daysDiff < 7) return `${daysDiff} days ago`
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }

  /**
   * Format duration for display
   */
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  /**
   * Get difficulty badge color
   */
  const getDifficultyColor = (level) => {
    const colors = {
      easy: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      hard: 'bg-red-100 text-red-800'
    }
    return colors[level] || colors.medium
  }

  /**
   * Get accuracy color
   */
  const getAccuracyColor = (accuracy) => {
    if (accuracy >= 80) return 'text-green-600'
    if (accuracy >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  /**
   * View attempt details
   */
  const handleViewDetails = (attempt) => {
    navigate(`/student/quiz/${attempt.quizId}/results`, {
      state: { sessionId: attempt.sessionId, attempt }
    })
  }

  /**
   * Retry quiz
   */
  const handleRetryQuiz = (attempt) => {
    navigate(`/student/quiz/${attempt.quizId}/setup`)
  }

  if (loading) return <LoadingSpinner fullScreen />
  if (error) return <ErrorMessage message={error} />

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold mb-2"><span className="meritai-title-gradient">Quiz History</span></h1>
          <p className="text-sm sm:text-base text-gray-600">
            Track your progress and review past attempts
          </p>
        </div>

        {attempts.length === 0 ? (
          <EmptyState
            icon={Award}
            title="No quiz attempts yet"
            description="Start taking quizzes to track your progress and performance"
            action={
              <button
                onClick={() => navigate('/student/quizzes')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Browse Quizzes
              </button>
            }
          />
        ) : (
          <>
            {/* Statistics Overview */}
            {statistics && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6 sm:mb-8">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <p className="text-xs sm:text-sm text-gray-500 mb-1">Total Attempts</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{statistics.totalAttempts}</p>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <p className="text-xs sm:text-sm text-gray-500 mb-1">Passed</p>
                  <p className="text-xl sm:text-2xl font-bold text-green-600">{statistics.passedAttempts}</p>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <p className="text-xs sm:text-sm text-gray-500 mb-1">Pass Rate</p>
                  <p className="text-xl sm:text-2xl font-bold text-indigo-600">{statistics.passRate}%</p>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <p className="text-xs sm:text-sm text-gray-500 mb-1">Avg Accuracy</p>
                  <p className={`text-xl sm:text-2xl font-bold ${getAccuracyColor(parseFloat(statistics.avgAccuracy))}`}>
                    {statistics.avgAccuracy}%
                  </p>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <p className="text-xs sm:text-sm text-gray-500 mb-1">Avg Score</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{statistics.avgScore}</p>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <p className="text-xs sm:text-sm text-gray-500 mb-1">Time Spent</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{statistics.totalTimeSpent}m</p>
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center justify-between w-full text-left"
              >
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-gray-600" />
                  <span className="text-base sm:text-lg font-semibold text-gray-900">Filters</span>
                </div>
                <ChevronDown className={`w-5 h-5 text-gray-600 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
              
              {showFilters && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                  {/* Subject Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                    <select
                      value={filters.subject}
                      onChange={(e) => setFilters(prev => ({ ...prev, subject: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                    >
                      <option value="all">All Subjects</option>
                      {subjects.map(subject => (
                        <option key={subject} value={subject}>{subject}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Difficulty Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
                    <select
                      value={filters.difficulty}
                      onChange={(e) => setFilters(prev => ({ ...prev, difficulty: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                    >
                      <option value="all">All Levels</option>
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                  
                  {/* Date Range Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                    <select
                      value={filters.dateRange}
                      onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                    >
                      <option value="all">All Time</option>
                      <option value="week">Last Week</option>
                      <option value="month">Last Month</option>
                      <option value="year">Last Year</option>
                    </select>
                  </div>
                  
                  {/* Status Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                    >
                      <option value="all">All Attempts</option>
                      <option value="passed">Passed Only</option>
                      <option value="failed">Failed Only</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Attempts List */}
            <div className="space-y-4">
              {filteredAttempts.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                  <p className="text-gray-600">No attempts match your filters</p>
                </div>
              ) : (
                filteredAttempts.map((attempt) => (
                  <div
                    key={attempt.sessionId || attempt.id}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      
                      {/* Main Info */}
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-0">
                            {attempt.quizTitle || 'Quiz Attempt'}
                          </h3>
                          
                          {attempt.passed || attempt.accuracy >= (attempt.passingPercentage || 60) ? (
                            <div className="flex items-center gap-2 text-green-600 text-sm">
                              <CheckCircle className="w-4 h-4" />
                              <span className="font-medium">Passed</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-red-600 text-sm">
                              <XCircle className="w-4 h-4" />
                              <span className="font-medium">Failed</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4 flex-shrink-0" />
                            <span>{formatDate(attempt.completedAt)}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Target className="w-4 h-4 flex-shrink-0" />
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getDifficultyColor(attempt.difficulty)}`}>
                              {attempt.difficulty}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="w-4 h-4 flex-shrink-0" />
                            <span>{formatDuration(attempt.timeSpent || 0)}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <TrendingUp className="w-4 h-4 flex-shrink-0" />
                            <span className={`font-semibold ${getAccuracyColor(attempt.accuracy || 0)}`}>
                              {(attempt.accuracy || 0).toFixed(1)}% accuracy
                            </span>
                          </div>
                        </div>
                        
                        <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                          <span className="text-gray-600">
                            Score: <span className="font-semibold text-gray-900">
                              {attempt.score || 0} / {attempt.totalMarks || 0}
                            </span>
                          </span>
                          
                          {attempt.subject && (
                            <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs font-medium">
                              {attempt.subject}
                            </span>
                          )}
                          
                          <span className="text-gray-600">
                            {attempt.totalQuestions || 0} questions
                          </span>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex flex-col sm:flex-row gap-2 lg:flex-col">
                        <button
                          onClick={() => handleViewDetails(attempt)}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 min-h-[44px] text-sm"
                        >
                          <Eye className="w-4 h-4" />
                          View Details
                        </button>
                        
                        <button
                          onClick={() => handleRetryQuiz(attempt)}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors min-h-[44px] text-sm"
                        >
                          Retry Quiz
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

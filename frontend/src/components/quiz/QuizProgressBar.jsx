import { CheckCircle, Circle } from 'lucide-react'

/**
 * Progress Bar Component
 * 
 * Purpose: Display quiz progress and navigation
 * 
 * Features:
 * - Visual progress indicator
 * - Question status (answered, unanswered, marked for review)
 * - Current question highlighting
 * - Click to navigate
 * 
 * Props:
 * @param {number} current - Current question index (0-based)
 * @param {number} total - Total number of questions
 * @param {object} answers - Map of answered questions (keyed by questionId)
 * @param {object} markedForReview - Map of questions marked for review (keyed by questionId)
 * @param {array} questions - Array of question objects
 * @param {function} onNavigate - Callback when clicking a question
 * @param {boolean} compact - Show compact version (for mobile)
 */
export default function QuizProgressBar({ 
  current, 
  total, 
  answers = {}, 
  markedForReview = {},
  questions = [],
  onNavigate = null,
  compact = false
}) {
  
  /**
   * Get question status
   */
  const getQuestionStatus = (index) => {
    const question = questions[index]
    if (!question) return 'unanswered'
    
    const questionId = question.questionId || question.id
    
    if (markedForReview[questionId]) {
      return 'review'
    }
    
    if (answers[questionId] !== undefined && answers[questionId] !== null && answers[questionId] !== '') {
      return 'answered'
    }
    
    return 'unanswered'
  }

  /**
   * Get status color
   */
  const getStatusColor = (index) => {
    const status = getQuestionStatus(index)
    const isCurrent = index === current
    
    if (isCurrent) {
      return 'bg-indigo-600 text-white border-indigo-600'
    }
    
    switch (status) {
      case 'answered':
        return 'bg-green-100 text-green-700 border-green-300'
      case 'review':
        return 'bg-amber-100 text-amber-700 border-amber-300'
      default:
        return 'bg-white text-gray-700 border-gray-300'
    }
  }

  /**
   * Calculate progress percentage
   */
  const calculateProgress = () => {
    const answeredCount = Object.keys(answers).filter(
      key => answers[key] !== undefined && answers[key] !== null && answers[key] !== ''
    ).length
    return (answeredCount / total) * 100
  }

  /**
   * Get statistics
   */
  const getStats = () => {
    const answeredCount = Object.keys(answers).filter(
      key => answers[key] !== undefined && answers[key] !== null && answers[key] !== ''
    ).length
    const reviewCount = Object.keys(markedForReview).filter(key => markedForReview[key]).length
    const unansweredCount = total - answeredCount
    
    return {
      answered: answeredCount,
      review: reviewCount,
      unanswered: unansweredCount
    }
  }

  const progress = calculateProgress()
  const stats = getStats()

  if (compact) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Question {current + 1} of {total}
          </span>
          <span className="text-sm font-medium text-indigo-600">
            {progress.toFixed(0)}% Complete
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <div className="flex items-center gap-4 mt-3 text-xs sm:text-sm">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-100 border border-green-300 rounded" />
            <span className="text-gray-600">{stats.answered} Answered</span>
          </div>
          
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-amber-100 border border-amber-300 rounded" />
            <span className="text-gray-600">{stats.review} Review</span>
          </div>
          
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-white border border-gray-300 rounded" />
            <span className="text-gray-600">{stats.unanswered} Left</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Progress</h3>
          <span className="text-sm font-medium text-indigo-600">
            {progress.toFixed(0)}% Complete
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-indigo-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">
          Question {current + 1} of {total}
        </p>
        
        <div className="flex flex-wrap gap-2 text-sm">
          <div className="flex items-center gap-1">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-gray-700">{stats.answered} Answered</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Circle className="w-4 h-4 text-amber-600" />
            <span className="text-gray-700">{stats.review} Marked for Review</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Circle className="w-4 h-4 text-gray-400" />
            <span className="text-gray-700">{stats.unanswered} Unanswered</span>
          </div>
        </div>
      </div>
      
      {/* Question Navigator Grid */}
      {onNavigate && (
        <div className="pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Navigate to Question</h4>
          <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-0.5">
            {Array.from({ length: total }, (_, index) => (
              <button
                key={index}
                onClick={() => onNavigate(index)}
                className={`
                  w-full aspect-[5/2] rounded border 
                  text-xs font-medium transition-all
                  hover:scale-105 active:scale-95
                  ${getStatusColor(index)}
                `}
                title={`Question ${index + 1} - ${getQuestionStatus(index)}`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

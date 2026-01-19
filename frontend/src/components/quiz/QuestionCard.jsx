import { useState } from 'react'
import { Circle, CheckCircle, Flag } from 'lucide-react'

/**
 * Question Card Component
 * 
 * Purpose: Display quiz question with answer options
 * 
 * Features:
 * - Multiple question types (MCQ, Multiple Select, True/False, Short Answer)
 * - Visual feedback for selected answers
 * - Mark for review functionality
 * - Question metadata display
 * 
 * Props:
 * @param {object} question - Question data
 * @param {number} questionNumber - Display number
 * @param {any} selectedAnswer - Current selected answer
 * @param {function} onAnswerChange - Callback when answer changes
 * @param {boolean} isMarkedForReview - Review flag
 * @param {function} onToggleReview - Toggle review callback
 * @param {boolean} showCorrectAnswer - Show correct answer (for results)
 * @param {boolean} disabled - Disable interactions
 */
export default function QuestionCard({
  question,
  questionNumber,
  selectedAnswer,
  onAnswerChange,
  isMarkedForReview = false,
  onToggleReview,
  showCorrectAnswer = false,
  disabled = false
}) {
  
  /**
   * Handle answer selection for MCQ
   */
  const handleMCQAnswer = (optionId) => {
    if (disabled) return
    onAnswerChange(optionId)
  }

  /**
   * Handle answer selection for Multiple Select
   */
  const handleMultiSelectAnswer = (optionId) => {
    if (disabled) return
    
    const currentAnswers = Array.isArray(selectedAnswer) ? selectedAnswer : []
    const newAnswers = currentAnswers.includes(optionId)
      ? currentAnswers.filter(id => id !== optionId)
      : [...currentAnswers, optionId]
    
    onAnswerChange(newAnswers)
  }

  /**
   * Handle text input for short answer
   */
  const handleTextAnswer = (text) => {
    if (disabled) return
    onAnswerChange(text)
  }

  /**
   * Check if option is selected
   */
  const isOptionSelected = (optionId) => {
    if (question.type === 'multiple-select') {
      return Array.isArray(selectedAnswer) && selectedAnswer.includes(optionId)
    }
    return selectedAnswer === optionId
  }

  /**
   * Check if option is correct (for results view)
   */
  const isOptionCorrect = (option) => {
    if (!showCorrectAnswer) return false
    
    if (question.type === 'mcq' || question.type === 'true-false') {
      return option.isCorrect
    }
    
    if (question.type === 'multiple-select') {
      return question.correctAnswers?.options?.some(ca => ca._id === option._id) || option.isCorrect
    }
    
    return false
  }

  /**
   * Get option border color
   */
  const getOptionBorderColor = (option) => {
    const optionId = option._id || option.id
    const isSelected = isOptionSelected(optionId)
    const isCorrect = isOptionCorrect(option)
    
    if (showCorrectAnswer) {
      if (isCorrect) return 'border-green-500 bg-green-50'
      if (isSelected && !isCorrect) return 'border-red-500 bg-red-50'
      return 'border-gray-200'
    }
    
    if (isSelected) return 'border-indigo-500 bg-indigo-50'
    return 'border-gray-200 hover:border-indigo-300'
  }

  /**
   * Render question based on type
   */
  const renderQuestionContent = () => {
    switch (question.type) {
      case 'mcq':
      case 'true-false':
        return (
          <div className="space-y-3">
            {question.options?.map((option) => {
              const optionId = option._id || option.id
              const isSelected = isOptionSelected(optionId)
              const isCorrect = isOptionCorrect(option)
              
              return (
                <button
                  key={optionId}
                  onClick={() => handleMCQAnswer(optionId)}
                  disabled={disabled}
                  className={`
                    w-full p-3 sm:p-4 rounded-lg border-2 text-left transition-all
                    ${getOptionBorderColor(option)}
                    ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:shadow-sm'}
                  `}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {isSelected ? (
                        <CheckCircle className={`w-5 h-5 ${showCorrectAnswer && !isCorrect ? 'text-red-500' : 'text-indigo-600'}`} />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <span className="text-sm sm:text-base text-gray-900">
                        {option.text}
                      </span>
                      
                      {showCorrectAnswer && isCorrect && (
                        <span className="ml-2 text-xs font-medium text-green-600">
                          ✓ Correct Answer
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )
      
      case 'multiple-select':
        return (
          <div className="space-y-3">
            <p className="text-sm text-amber-600 mb-3">
              Select all that apply
            </p>
            {question.options?.map((option) => {
              const optionId = option._id || option.id
              const isSelected = isOptionSelected(optionId)
              const isCorrect = isOptionCorrect(option)
              
              return (
                <button
                  key={optionId}
                  onClick={() => handleMultiSelectAnswer(optionId)}
                  disabled={disabled}
                  className={`
                    w-full p-3 sm:p-4 rounded-lg border-2 text-left transition-all
                    ${getOptionBorderColor(option)}
                    ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:shadow-sm'}
                  `}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        disabled={disabled}
                      />
                    </div>
                    
                    <div className="flex-1">
                      <span className="text-sm sm:text-base text-gray-900">
                        {option.text}
                      </span>
                      
                      {showCorrectAnswer && isCorrect && (
                        <span className="ml-2 text-xs font-medium text-green-600">
                          ✓ Correct
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )
      
      case 'short-answer':
        return (
          <div>
            <textarea
              value={selectedAnswer || ''}
              onChange={(e) => handleTextAnswer(e.target.value)}
              disabled={disabled}
              placeholder="Type your answer here..."
              className="w-full p-3 sm:p-4 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none min-h-[120px] resize-y text-sm sm:text-base"
            />
            
            {showCorrectAnswer && question.expectedAnswer && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-medium text-green-800 mb-1">Expected Answer:</p>
                <p className="text-sm text-green-700">{question.expectedAnswer}</p>
              </div>
            )}
          </div>
        )
      
      case 'numerical':
        return (
          <div>
            <input
              type="number"
              value={selectedAnswer || ''}
              onChange={(e) => handleTextAnswer(e.target.value)}
              disabled={disabled}
              placeholder="Enter numerical answer"
              className="w-full p-3 sm:p-4 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none text-sm sm:text-base"
            />
            
            {showCorrectAnswer && question.numericalAnswer && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-medium text-green-800 mb-1">Correct Answer:</p>
                <p className="text-sm text-green-700">
                  {question.numericalAnswer.value}
                  {question.numericalAnswer.unit && ` ${question.numericalAnswer.unit}`}
                </p>
              </div>
            )}
          </div>
        )
      
      default:
        return (
          <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-600">
            Unsupported question type
          </div>
        )
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
      {/* Question Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-block px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs sm:text-sm font-medium">
              Question {questionNumber}
            </span>
            
            {question.difficulty && (
              <span className={`inline-block px-2 py-1 rounded text-xs sm:text-sm font-medium capitalize ${
                question.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {question.difficulty}
              </span>
            )}
            
            {question.marks && (
              <span className="text-xs sm:text-sm text-gray-600">
                {question.marks} {question.marks === 1 ? 'mark' : 'marks'}
              </span>
            )}
          </div>
          
          <h3 className="text-base sm:text-lg font-medium text-gray-900 leading-relaxed">
            {question.text || question.question}
          </h3>
        </div>
        
        {onToggleReview && !showCorrectAnswer && (
          <button
            onClick={onToggleReview}
            className={`ml-4 p-2 rounded-lg transition-all flex-shrink-0 ${
              isMarkedForReview
                ? 'bg-amber-100 text-amber-600 hover:bg-amber-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title={isMarkedForReview ? 'Remove from review' : 'Mark for review'}
          >
            <Flag className={`w-5 h-5 ${isMarkedForReview ? 'fill-current' : ''}`} />
          </button>
        )}
      </div>
      
      {/* Question Description */}
      {question.description && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">{question.description}</p>
        </div>
      )}
      
      {/* Question Content */}
      <div className="mt-4">
        {renderQuestionContent()}
      </div>
      
      {/* Explanation (shown in results view) */}
      {showCorrectAnswer && question.explanation && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm font-medium text-blue-800 mb-2">📚 Explanation:</p>
          <p className="text-sm text-blue-700">{question.explanation}</p>
        </div>
      )}
    </div>
  )
}

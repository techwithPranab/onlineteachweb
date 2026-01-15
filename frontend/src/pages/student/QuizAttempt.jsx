import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { quizService } from '../../services/apiServices'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import ConfirmDialog from '../../components/common/ConfirmDialog'

export default function QuizAttempt() {
  const { quizId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  
  const [session, setSession] = useState(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [markedForReview, setMarkedForReview] = useState({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [remainingTime, setRemainingTime] = useState(0)
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)
  const [showNavigator, setShowNavigator] = useState(false)
  const [autoSaveStatus, setAutoSaveStatus] = useState('saved')
  
  const timerRef = useRef(null)
  const autoSaveRef = useRef(null)
  const questionStartTime = useRef(Date.now())

  // Start quiz on mount
  useEffect(() => {
    startOrResumeQuiz()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (autoSaveRef.current) clearInterval(autoSaveRef.current)
    }
  }, [])

  // Timer effect
  useEffect(() => {
    if (session && remainingTime > 0) {
      timerRef.current = setInterval(() => {
        setRemainingTime(prev => {
          if (prev <= 1) {
            handleAutoSubmit()
            return 0
          }
          return prev - 1
        })
      }, 1000)
      
      return () => clearInterval(timerRef.current)
    }
  }, [session])

  // Auto-save effect
  useEffect(() => {
    if (session) {
      autoSaveRef.current = setInterval(() => {
        autoSaveAnswers()
      }, 30000) // Auto-save every 30 seconds
      
      return () => clearInterval(autoSaveRef.current)
    }
  }, [session, answers])

  const startOrResumeQuiz = async () => {
    try {
      setLoading(true)
      const response = await quizService.startQuiz(quizId)
      setSession(response.session)
      setRemainingTime(response.session.remainingTime)
      
      // Restore answers if resuming
      if (response.session.answers && response.session.answers.length > 0) {
        const restoredAnswers = {}
        const restoredMarked = {}
        response.session.answers.forEach(ans => {
          restoredAnswers[ans.questionId] = ans.answer
          if (ans.isMarkedForReview) {
            restoredMarked[ans.questionId] = true
          }
        })
        setAnswers(restoredAnswers)
        setMarkedForReview(restoredMarked)
      }
      
      if (response.session.currentQuestionIndex) {
        setCurrentQuestionIndex(response.session.currentQuestionIndex)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start quiz')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const autoSaveAnswers = async () => {
    if (!session) return
    
    try {
      setAutoSaveStatus('saving')
      const currentQuestion = session.questions[currentQuestionIndex]
      const currentAnswer = answers[currentQuestion.questionId]
      const timeSpent = Math.floor((Date.now() - questionStartTime.current) / 1000)
      
      if (currentAnswer !== undefined) {
        await quizService.saveAnswer(
          session._id,
          currentQuestion.questionId,
          currentAnswer,
          timeSpent
        )
      }
      setAutoSaveStatus('saved')
    } catch (err) {
      setAutoSaveStatus('error')
      console.error('Auto-save failed:', err)
    }
  }

  const handleAnswerChange = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }))
    setAutoSaveStatus('unsaved')
  }

  const handleMCQAnswer = (questionId, optionId, isMultiple = false) => {
    if (isMultiple) {
      setAnswers(prev => {
        const current = prev[questionId] || []
        const updated = current.includes(optionId)
          ? current.filter(id => id !== optionId)
          : [...current, optionId]
        return { ...prev, [questionId]: updated }
      })
    } else {
      handleAnswerChange(questionId, optionId)
    }
    setAutoSaveStatus('unsaved')
  }

  const handleToggleReview = async () => {
    const question = session.questions[currentQuestionIndex]
    const newMarked = !markedForReview[question.questionId]
    
    setMarkedForReview(prev => ({
      ...prev,
      [question.questionId]: newMarked
    }))
    
    try {
      await quizService.markForReview(session._id, question.questionId, newMarked)
    } catch (err) {
      console.error('Failed to mark for review:', err)
    }
  }

  const navigateToQuestion = (index) => {
    // Save current answer first
    autoSaveAnswers()
    questionStartTime.current = Date.now()
    setCurrentQuestionIndex(index)
    setShowNavigator(false)
  }

  const handleNext = () => {
    if (currentQuestionIndex < session.questions.length - 1) {
      navigateToQuestion(currentQuestionIndex + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      navigateToQuestion(currentQuestionIndex - 1)
    }
  }

  const handleAutoSubmit = async () => {
    await handleSubmit(true)
  }

  const handleSubmit = async (isAutoSubmit = false) => {
    try {
      setSubmitting(true)
      
      // Prepare all answers for final submission
      const answersArray = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        answer,
        timeSpent: 0 // Time already tracked
      }))
      
      const response = await quizService.submitQuiz(quizId, session._id, answersArray)
      
      // Navigate to results
      navigate(`/student/quiz/${quizId}/results`, {
        state: { result: response.result, isAutoSubmit }
      })
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit quiz')
      console.error(err)
    } finally {
      setSubmitting(false)
      setShowSubmitConfirm(false)
    }
  }

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const getQuestionStatus = (index) => {
    const question = session.questions[index]
    const isAnswered = answers[question.questionId] !== undefined && answers[question.questionId] !== null
    const isMarked = markedForReview[question.questionId]
    const isCurrent = index === currentQuestionIndex
    
    if (isCurrent) return 'current'
    if (isMarked && isAnswered) return 'marked-answered'
    if (isMarked) return 'marked'
    if (isAnswered) return 'answered'
    return 'not-visited'
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'current': return 'bg-indigo-600 text-white'
      case 'answered': return 'bg-green-500 text-white'
      case 'marked': return 'bg-purple-500 text-white'
      case 'marked-answered': return 'bg-purple-500 text-white ring-2 ring-green-500'
      default: return 'bg-gray-200 text-gray-700'
    }
  }

  const renderQuestion = () => {
    if (!session?.questions?.[currentQuestionIndex]) return null
    
    const question = session.questions[currentQuestionIndex]
    const answer = answers[question.questionId]
    
    return (
      <div className="space-y-6">
        {/* Question Header */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-500">
            Question {currentQuestionIndex + 1} of {session.questions.length}
          </span>
          <div className="flex items-center space-x-4">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              question.difficultyLevel === 'easy' ? 'bg-green-100 text-green-800' :
              question.difficultyLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {question.difficultyLevel}
            </span>
            <span className="text-sm text-gray-500">
              {question.marks} mark{question.marks > 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Case Study if present */}
        {question.caseStudy && (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-2">Case Study</h4>
            <p className="text-gray-700 whitespace-pre-wrap">{question.caseStudy}</p>
          </div>
        )}

        {/* Question Text */}
        <div className="text-lg font-medium text-gray-900">
          {question.text}
        </div>

        {/* Answer Input based on type */}
        {question.type === 'mcq-single' && (
          <div className="space-y-3">
            {question.options?.map((option, idx) => (
              <label
                key={option._id}
                className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${
                  answer === option._id
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-indigo-300'
                }`}
              >
                <input
                  type="radio"
                  name={`question-${question.questionId}`}
                  value={option._id}
                  checked={answer === option._id}
                  onChange={() => handleMCQAnswer(question.questionId, option._id, false)}
                  className="h-4 w-4 text-indigo-600"
                />
                <span className="ml-3 text-gray-900">{option.text}</span>
              </label>
            ))}
          </div>
        )}

        {question.type === 'mcq-multiple' && (
          <div className="space-y-3">
            <p className="text-sm text-gray-500 italic">Select all that apply</p>
            {question.options?.map((option) => (
              <label
                key={option._id}
                className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${
                  (answer || []).includes(option._id)
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-indigo-300'
                }`}
              >
                <input
                  type="checkbox"
                  value={option._id}
                  checked={(answer || []).includes(option._id)}
                  onChange={() => handleMCQAnswer(question.questionId, option._id, true)}
                  className="h-4 w-4 text-indigo-600 rounded"
                />
                <span className="ml-3 text-gray-900">{option.text}</span>
              </label>
            ))}
          </div>
        )}

        {question.type === 'true-false' && (
          <div className="space-y-3">
            {['True', 'False'].map((option) => (
              <label
                key={option}
                className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${
                  answer === option
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-indigo-300'
                }`}
              >
                <input
                  type="radio"
                  name={`question-${question.questionId}`}
                  value={option}
                  checked={answer === option}
                  onChange={() => handleAnswerChange(question.questionId, option)}
                  className="h-4 w-4 text-indigo-600"
                />
                <span className="ml-3 text-gray-900">{option}</span>
              </label>
            ))}
          </div>
        )}

        {question.type === 'numerical' && (
          <div>
            <input
              type="number"
              step="any"
              value={answer || ''}
              onChange={(e) => handleAnswerChange(question.questionId, e.target.value)}
              placeholder="Enter your answer"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        )}

        {(question.type === 'short-answer' || question.type === 'long-answer' || question.type === 'case-based') && (
          <div>
            <textarea
              value={answer || ''}
              onChange={(e) => handleAnswerChange(question.questionId, e.target.value)}
              placeholder="Enter your answer"
              rows={question.type === 'short-answer' ? 3 : 8}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
          </div>
        )}
      </div>
    )
  }

  if (loading) return <LoadingSpinner />
  
  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-red-800">Error</h2>
          <p className="mt-2 text-red-600">{error}</p>
          <button
            onClick={() => navigate('/student/quizzes')}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Back to Quizzes
          </button>
        </div>
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Timer */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Quiz in Progress</h1>
              <p className="text-sm text-gray-500">{session.questions?.length} Questions</p>
            </div>
            
            <div className="flex items-center space-x-6">
              {/* Auto-save Status */}
              <div className="flex items-center text-sm">
                {autoSaveStatus === 'saving' && (
                  <span className="text-yellow-600">Saving...</span>
                )}
                {autoSaveStatus === 'saved' && (
                  <span className="text-green-600">✓ Saved</span>
                )}
                {autoSaveStatus === 'error' && (
                  <span className="text-red-600">⚠ Save failed</span>
                )}
              </div>
              
              {/* Timer */}
              <div className={`text-2xl font-bold ${remainingTime < 300 ? 'text-red-600' : 'text-gray-900'}`}>
                {formatTime(remainingTime)}
              </div>
              
              {/* Question Navigator Toggle */}
              <button
                onClick={() => setShowNavigator(!showNavigator)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Main Question Area */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-sm p-6">
              {renderQuestion()}

              {/* Navigation and Actions */}
              <div className="mt-8 pt-6 border-t flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handlePrevious}
                    disabled={currentQuestionIndex === 0}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={currentQuestionIndex === session.questions.length - 1}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>

                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleToggleReview}
                    className={`px-4 py-2 border rounded-lg transition-colors ${
                      markedForReview[session.questions[currentQuestionIndex].questionId]
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {markedForReview[session.questions[currentQuestionIndex].questionId] 
                      ? '✓ Marked for Review' 
                      : 'Mark for Review'}
                  </button>
                  
                  <button
                    onClick={() => setShowSubmitConfirm(true)}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                  >
                    Submit Quiz
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Question Navigator Sidebar */}
          {showNavigator && (
            <div className="w-80 bg-white rounded-lg shadow-sm p-4 h-fit sticky top-24">
              <h3 className="font-semibold text-gray-900 mb-4">Question Navigator</h3>
              
              {/* Legend */}
              <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                <div className="flex items-center">
                  <span className="w-4 h-4 rounded bg-green-500 mr-2"></span>
                  <span>Answered</span>
                </div>
                <div className="flex items-center">
                  <span className="w-4 h-4 rounded bg-gray-200 mr-2"></span>
                  <span>Not Visited</span>
                </div>
                <div className="flex items-center">
                  <span className="w-4 h-4 rounded bg-purple-500 mr-2"></span>
                  <span>Marked</span>
                </div>
                <div className="flex items-center">
                  <span className="w-4 h-4 rounded bg-indigo-600 mr-2"></span>
                  <span>Current</span>
                </div>
              </div>
              
              {/* Question Grid */}
              <div className="grid grid-cols-5 gap-2">
                {session.questions.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => navigateToQuestion(index)}
                    className={`w-10 h-10 rounded-lg font-medium text-sm ${getStatusColor(getQuestionStatus(index))}`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>

              {/* Summary */}
              <div className="mt-4 pt-4 border-t text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Answered:</span>
                  <span className="font-medium text-green-600">
                    {Object.keys(answers).filter(k => answers[k] !== undefined && answers[k] !== null).length}
                  </span>
                </div>
                <div className="flex justify-between mt-1">
                  <span>Marked for Review:</span>
                  <span className="font-medium text-purple-600">
                    {Object.keys(markedForReview).filter(k => markedForReview[k]).length}
                  </span>
                </div>
                <div className="flex justify-between mt-1">
                  <span>Not Answered:</span>
                  <span className="font-medium text-gray-600">
                    {session.questions.length - Object.keys(answers).filter(k => answers[k] !== undefined && answers[k] !== null).length}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Submit Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showSubmitConfirm}
        onClose={() => setShowSubmitConfirm(false)}
        onConfirm={() => handleSubmit(false)}
        title="Submit Quiz?"
        message={`Are you sure you want to submit the quiz? You have answered ${Object.keys(answers).filter(k => answers[k] !== undefined).length} out of ${session.questions.length} questions.`}
        confirmText={submitting ? 'Submitting...' : 'Submit Quiz'}
        confirmButtonClass="bg-green-600 hover:bg-green-700"
        disabled={submitting}
      />
    </div>
  )
}

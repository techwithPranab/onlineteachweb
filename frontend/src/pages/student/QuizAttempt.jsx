import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { quizService, algorithmQuizService } from '../../services/apiServices'
import { analyzeQuizResults, updateStudentPerformance } from '@/utils/quizAlgorithm'
import { useAuthStore } from '@/store/authStore'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import { QuizTimer, QuizProgressBar, QuestionCard } from '../../components/quiz'

export default function QuizAttempt() {
  const { quizId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuthStore()
  
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
  const [quizData, setQuizData] = useState(null)
  
  const timerRef = useRef(null)
  const autoSaveRef = useRef(null)
  const questionStartTime = useRef(Date.now())
  const quizStartTime = useRef(Date.now())

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
      
      // Check if we have an existing session from navigation state (from QuizSetup or ActiveQuizzes)
      const locationState = location.state
      if (locationState?.quiz) {
        // Load from localStorage (for algorithm-generated quizzes)
        const quiz = locationState.quiz
        setQuizData(quiz)
        setSession({
          _id: quiz.sessionId,
          quizId: quiz.id,
          questions: quiz.questions,
          duration: quiz.duration,
          remainingTime: quiz.duration * 60
        })
        setRemainingTime(quiz.duration * 60)
        quizStartTime.current = Date.now()
      } else if (locationState?.sessionId) {
        // Get existing session from API
        const response = await quizService.getSessionById(locationState.sessionId)
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
      } else {
        // Start new quiz session via API
        const response = await quizService.startQuiz(quizId)
        setSession(response.session)
        setRemainingTime(response.session.remainingTime)
        quizStartTime.current = Date.now()
        
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
      
      // Calculate time taken
      const timeTaken = Math.floor((Date.now() - quizStartTime.current) / 1000)
      
      // Prepare all answers for final submission
      const answersArray = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        answer,
        timeSpent: 0 // Time already tracked
      }))
      
      // For algorithm-generated quizzes
      if (quizData) {
        // Calculate results locally
        const results = {
          answers: answersArray,
          timeTaken,
          totalTime: quizData.duration * 60,
          score: 0, // Will be calculated by algorithm
          accuracy: 0, // Will be calculated by algorithm
          performanceData: {} // Will be populated by algorithm
        }

        // Use algorithm to analyze results
        const analysis = analyzeQuizResults(results, quizData, quizData.questions)

        // Update results with analysis data
        results.score = analysis.score
        results.accuracy = analysis.accuracy
        results.performanceData = analysis

        // Complete quiz in backend (replaces localStorage operations)
        await algorithmQuizService.completeQuiz(quizData.id, results)

        // Update student performance
        await updateStudentPerformance(user?.id || 'demo', analysis)

        // Navigate to results with analysis
        navigate(`/student/quiz/${quizData.id}/results`, {
          state: {
            result: analysis,
            isAutoSubmit,
            quiz: quizData
          }
        })
      } else {
        // For API-based quizzes
        const response = await quizService.submitQuiz(quizId, session._id, answersArray)
        
        // Navigate to results
        navigate(`/student/quiz/${quizId}/results`, {
          state: { result: response.result, isAutoSubmit }
        })
      }
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
    
    // For QuestionCard component, we need to handle answer differently based on type
    const handleQuestionAnswer = (newAnswer) => {
      if (question.type === 'mcq-single') {
        handleMCQAnswer(question.questionId, newAnswer, false)
      } else if (question.type === 'mcq-multiple') {
        // Toggle the option in the array
        const current = answer || []
        const updated = current.includes(newAnswer)
          ? current.filter(id => id !== newAnswer)
          : [...current, newAnswer]
        handleAnswerChange(question.questionId, updated)
      } else {
        handleAnswerChange(question.questionId, newAnswer)
      }
    }
    
    return (
      <QuestionCard
        question={question}
        questionNumber={currentQuestionIndex + 1}
        selectedAnswer={answer}
        onAnswerChange={handleQuestionAnswer}
        isMarkedForReview={markedForReview[question.questionId]}
        onToggleReview={handleToggleReview}
        showCorrectAnswer={false}
        disabled={false}
      />
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Quiz in Progress</h1>
              <p className="text-sm text-gray-500">{session.questions?.length} Questions</p>
            </div>

            <div className="flex items-center justify-between sm:justify-end space-x-3 sm:space-x-6">
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

              {/* Quiz Timer Component */}
              <QuizTimer
                duration={remainingTime}
                onTimeUp={handleAutoSubmit}
                isPaused={false}
                onTick={(remaining) => setRemainingTime(remaining)}
              />

              {/* Question Navigator Toggle */}
              <button
                onClick={() => setShowNavigator(!showNavigator)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Progress Bar */}
        <div className="mb-4 sm:mb-6">
          <QuizProgressBar
            current={currentQuestionIndex}
            total={session.questions.length}
            answers={answers}
            markedForReview={markedForReview}
            onNavigate={navigateToQuestion}
            compact={false}
          />
        </div>

        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
          {/* Main Question Area */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
              {renderQuestion()}

              {/* Navigation and Actions */}
              <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex items-center space-x-3 sm:space-x-4 flex-1">
                    <button
                      onClick={handlePrevious}
                      disabled={currentQuestionIndex === 0}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] flex-1 sm:flex-none"
                    >
                      ← Previous
                    </button>
                    <button
                      onClick={handleNext}
                      disabled={currentQuestionIndex === session.questions.length - 1}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] flex-1 sm:flex-none"
                    >
                      Next →
                    </button>
                  </div>

                  <div className="flex items-center justify-end">
                    <button
                      onClick={() => setShowSubmitConfirm(true)}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium min-h-[44px] w-full sm:w-auto"
                    >
                      Submit Quiz
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Question Navigator Sidebar */}
          {showNavigator && (
            <div className="w-full lg:w-80 bg-white rounded-lg shadow-sm p-4 sm:p-6 h-fit lg:sticky lg:top-24">
              <h3 className="font-semibold text-gray-900 mb-4 text-sm sm:text-base">Question Navigator</h3>

              {/* Legend */}
              <div className="grid grid-cols-2 gap-2 mb-4 sm:mb-6 text-xs">
                <div className="flex items-center">
                  <span className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-green-500 mr-2 flex-shrink-0"></span>
                  <span className="text-xs sm:text-sm">Answered</span>
                </div>
                <div className="flex items-center">
                  <span className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-gray-200 mr-2 flex-shrink-0"></span>
                  <span className="text-xs sm:text-sm">Not Visited</span>
                </div>
                <div className="flex items-center">
                  <span className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-purple-500 mr-2 flex-shrink-0"></span>
                  <span className="text-xs sm:text-sm">Marked</span>
                </div>
                <div className="flex items-center">
                  <span className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-indigo-600 mr-2 flex-shrink-0"></span>
                  <span className="text-xs sm:text-sm">Current</span>
                </div>
              </div>

              {/* Question Grid */}
              <div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-5 gap-2 mb-4">
                {session.questions.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => navigateToQuestion(index)}
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg font-medium text-xs sm:text-sm ${getStatusColor(getQuestionStatus(index))} min-h-[32px] sm:min-h-[40px] flex items-center justify-center`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>

              {/* Summary */}
              <div className="pt-4 border-t text-xs sm:text-sm text-gray-600 space-y-2">
                <div className="flex justify-between">
                  <span>Answered:</span>
                  <span className="font-medium text-green-600">
                    {Object.keys(answers).filter(k => answers[k] !== undefined && answers[k] !== null).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Marked for Review:</span>
                  <span className="font-medium text-purple-600">
                    {Object.keys(markedForReview).filter(k => markedForReview[k]).length}
                  </span>
                </div>
                <div className="flex justify-between">
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

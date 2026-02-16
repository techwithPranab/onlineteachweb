import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { quizService, algorithmQuizService } from '../../services/apiServices'
import { analyzeQuizResults } from '@/utils/quiz/quizAnalysis'
import { updateStudentPerformance } from '@/utils/quizAlgorithm'
import { useAuthStore } from '@/store/authStore'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import SEOHead from '../../components/SEO/SEOHead';
import ConfirmDialog from '../../components/common/ConfirmDialog'
import { QuizTimer, QuizProgressBar, QuestionCard } from '../../components/quiz'
import MeritaiCard from '../../components/ui/MeritaiCard'

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
  const [showNavigator, setShowNavigator] = useState(true)
  const [autoSaveStatus, setAutoSaveStatus] = useState('saved')
  const [quizData, setQuizData] = useState(null)
  const [questionTimeTracking, setQuestionTimeTracking] = useState({}) // Track time per question
  const [savingAnswer, setSavingAnswer] = useState(false)
  
  const timerRef = useRef(null)
  const questionStartTime = useRef(Date.now())
  const quizStartTime = useRef(Date.now())

  // Start quiz on mount
  useEffect(() => {
    startOrResumeQuiz()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
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

  // Track time spent on current question
  useEffect(() => {
    questionStartTime.current = Date.now()
  }, [currentQuestionIndex])

  const startOrResumeQuiz = async () => {
    try {
      setLoading(true)

      // Check if we have an existing session from navigation state (from QuizSetup or ActiveQuizzes)
      const locationState = location.state
      if (locationState?.quiz) {
        // First, check if quiz is already completed
        try {
          const statusCheck = await algorithmQuizService.checkQuizStatus(quizId)
          if (statusCheck.isCompleted) {
            console.log('🔒 Quiz already completed, redirecting to results')
            // Redirect to results page for completed quiz
            navigate(`/student/quiz/${quizId}/results`, {
              state: {
                fromCompletedQuiz: true,
                quiz: statusCheck.quizData
              },
              replace: true
            })
            return
          }
        } catch (statusError) {
          console.log('Status check failed, proceeding:', statusError)
        }
        
        // For resuming active quizzes, we need to fetch the full quiz data from backend
        // because the quiz data from navigation state doesn't include answers
        try {
          const fullQuizResponse = await algorithmQuizService.getActiveQuiz(quizId)
          if (fullQuizResponse.success && fullQuizResponse.data) {
            const fullQuiz = fullQuizResponse.data
            
            console.log('📥 Frontend received quiz data:', {
              quizId: fullQuiz.quizId,
              questionCount: fullQuiz.questions?.length,
              sampleQuestion: fullQuiz.questions?.[0] ? {
                id: fullQuiz.questions[0].id,
                question: fullQuiz.questions[0].question?.substring(0, 50),
                options: fullQuiz.questions[0].options?.map(o => ({
                  _id: o._id,
                  id: o.id,
                  text: o.text?.substring(0, 30)
                }))
              } : null
            })
            
            // Transform questions to match expected format for QuestionCard
            const transformedQuestions = fullQuiz.questions.map(q => {
              console.log('🔍 Transforming question:', {
                questionId: q.questionId || q.id,
                originalOptions: q.options,
                hasCorrectAnswer: !!q.correctAnswer
              })
              
              return {
                ...q,
                questionId: q.questionId || q.id, // Preserve existing questionId or use id
                text: q.question, // Map question field to text for QuestionCard
                type: q.type || 'mcq-single', // Explicitly preserve type with fallback
                options: q.options.map((option, index) => {
                  const optionId = option._id?.toString() || option.id?.toString() || `option_${index}`
                  console.log('🔍 Transforming option:', {
                    index,
                    originalOption: option,
                    has_id: !!option._id,
                    has_id_field: !!option.id,
                    transformedId: optionId,
                    text: option.text
                  })
                  return {
                    _id: optionId,
                    text: option.text,
                    id: optionId
                  }
                })
              }
            })
            
            // Restore saved answers from backend
            const restoredAnswers = {}
            const restoredMarked = {}
            const restoredTimeTracking = {}
            
            if (fullQuiz.answers && fullQuiz.answers.length > 0) {
              fullQuiz.answers.forEach(ans => {
                if (ans.answer !== null && ans.answer !== undefined) {
                  restoredAnswers[ans.questionId] = ans.answer
                }
                if (ans.markedForReview) {
                  restoredMarked[ans.questionId] = true
                }
                if (ans.timeSpent) {
                  restoredTimeTracking[ans.questionId] = ans.timeSpent
                }
              })
            }
            
            setAnswers(restoredAnswers)
            setMarkedForReview(restoredMarked)
            setQuestionTimeTracking(restoredTimeTracking)
            
            setQuizData({
              ...fullQuiz,
              questions: transformedQuestions
            })
            setSession({
              _id: fullQuiz.sessionId,
              quizId: fullQuiz.quizId,
              questions: transformedQuestions,
              duration: fullQuiz.duration,
              remainingTime: fullQuiz.remainingTime || fullQuiz.duration * 60
            })
            // Use remainingTime from backend instead of calculating from duration
            setRemainingTime(fullQuiz.remainingTime || fullQuiz.duration * 60)
            quizStartTime.current = Date.now()
            
            // Only try to start the quiz if it's not already in progress
            if (fullQuiz.status === 'active') {
              try {
                await algorithmQuizService.startQuiz(quizId)
                console.log('▶️ Quiz started successfully')
              } catch (startError) {
                console.warn('⚠️ Failed to start quiz (might already be started):', startError)
              }
            } else {
              console.log('⏯️ Resuming quiz (already in progress)')
            }
          } else {
            throw new Error('Failed to fetch full quiz data')
          }
        } catch (error) {
          console.error('Failed to fetch full quiz data, falling back to navigation state:', error)
          // Fallback to navigation state if API fails
          const quiz = locationState.quiz
          
          // Transform questions to match expected format for QuestionCard
          const transformedQuestions = quiz.questions.map(q => ({
            ...q,
            questionId: q.id || q.questionId, // Ensure questionId exists
            options: q.options.map((option, index) => {
              const optionId = option._id?.toString() || option.id?.toString() || `option_${index}`
              return {
                _id: optionId,
                text: option.text || option,
                id: optionId
              }
            })
          }))
          
          setQuizData({
            ...quiz,
            questions: transformedQuestions
          })
          setSession({
            _id: quiz.sessionId,
            quizId: quiz.id,
            questions: transformedQuestions,
            duration: quiz.duration,
            remainingTime: quiz.remainingTime || quiz.duration * 60
          })
          setRemainingTime(quiz.remainingTime || quiz.duration * 60)
          quizStartTime.current = Date.now()
        }
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
        const response = await algorithmQuizService.startQuiz(quizId)
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

  // DISABLED: Auto-save not supported by backend
  // const autoSaveAnswers = async () => {
  //   if (!session) return
    
  //   try {
  //     setAutoSaveStatus('saving')
  //     const currentQuestion = session.questions[currentQuestionIndex]
  //     const currentAnswer = answers[currentQuestion.questionId]
  //     const timeSpent = Math.floor((Date.now() - questionStartTime.current) / 1000)
      
  //     if (currentAnswer !== undefined) {
  //       await quizService.saveAnswer(
  //         session._id,
  //         currentQuestion.questionId,
  //         currentAnswer,
  //         timeSpent
  //       )
  //     }
  //     setAutoSaveStatus('saved')
  //   } catch (err) {
  //     setAutoSaveStatus('error')
  //     console.error('Auto-save failed:', err)
  //   }
  // }

  const handleAnswerChange = (questionId, answer) => {
    if (!questionId) {
      console.error('handleAnswerChange called with undefined questionId')
      return
    }
    
    // Only update local state, don't save to backend yet
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }))
  }

  // New function to save answer to backend
  const saveAnswerToBackend = async (questionId) => {
    if (!quizData || !quizData.quizId || !questionId) {
      console.log('⚠️ Cannot save answer - missing data:', { 
        hasQuizData: !!quizData, 
        quizId: quizData?.quizId, 
        questionId 
      })
      return
    }

    const answer = answers[questionId]
    if (answer === undefined || answer === null) {
      console.log('⚠️ No answer to save for question:', questionId)
      return
    }

    setSavingAnswer(true)
    setAutoSaveStatus('saving')
    
    try {
      const timeSpent = Math.floor((Date.now() - questionStartTime.current) / 1000)
      console.log('💾 Saving answer:', { 
        questionId, 
        answer, 
        timeSpent, 
        markedForReview: markedForReview[questionId] || false,
        questionStartTime: questionStartTime.current,
        currentTime: Date.now()
      })
      
      const response = await algorithmQuizService.saveAnswer(
        quizData.quizId,
        questionId,
        answer,
        markedForReview[questionId] || false,
        timeSpent
      )
      
      console.log('✅ Answer saved successfully:', response)
      setAutoSaveStatus('saved')
      
      // Update time tracking
      setQuestionTimeTracking(prev => ({
        ...prev,
        [questionId]: (prev[questionId] || 0) + timeSpent
      }))
    } catch (err) {
      console.error('❌ Failed to save answer:', err)
      setAutoSaveStatus('error')
    } finally {
      setSavingAnswer(false)
    }
  }

  const handleMCQAnswer = (questionId, optionId, isMultiple = false) => {
    if (isMultiple) {
      const current = answers[questionId] || []
      const updated = current.includes(optionId)
        ? current.filter(id => id !== optionId)
        : [...current, optionId]
      handleAnswerChange(questionId, updated)
    } else {
      handleAnswerChange(questionId, optionId)
    }
  }

  const handleToggleReview = async () => {
    const question = session.questions[currentQuestionIndex]
    const newMarked = !markedForReview[question.questionId]
    
    setMarkedForReview(prev => ({
      ...prev,
      [question.questionId]: newMarked
    }))
    
    // Save to backend
    if (quizData && quizData.quizId) {
      try {
        await algorithmQuizService.toggleReviewMark(quizData.quizId, question.questionId)
      } catch (err) {
        console.error('Failed to mark for review:', err)
        // Revert on error
        setMarkedForReview(prev => ({
          ...prev,
          [question.questionId]: !newMarked
        }))
      }
    }
  }

  const handleSkipQuestion = async () => {
    const question = session.questions[currentQuestionIndex]
    const timeSpent = Math.floor((Date.now() - questionStartTime.current) / 1000)
    
    // Save skip status to backend
    if (quizData && quizData.quizId) {
      try {
        await algorithmQuizService.skipQuestion(quizData.quizId, question.questionId, timeSpent)
        
        // Update time tracking
        setQuestionTimeTracking(prev => ({
          ...prev,
          [question.questionId]: (prev[question.questionId] || 0) + timeSpent
        }))
      } catch (err) {
        console.error('Failed to skip question:', err)
      }
    }
    
    // Move to next question (skip saving since we already saved via skipQuestion)
    navigateToQuestion(currentQuestionIndex + 1, false)
  }

  const navigateToQuestion = async (index, shouldSaveCurrentAnswer = true) => {
    // Save current answer before navigating (unless already saved by caller)
    if (shouldSaveCurrentAnswer && session && session.questions[currentQuestionIndex]) {
      const currentQuestion = session.questions[currentQuestionIndex]
      await saveAnswerToBackend(currentQuestion.questionId)
    }
    
    setCurrentQuestionIndex(index)
    setShowNavigator(false)
    // Note: questionStartTime.current is reset via useEffect when currentQuestionIndex changes
  }

  const handleNext = async () => {
    // Save current answer before moving to next question
    const currentQuestion = session.questions[currentQuestionIndex]
    await saveAnswerToBackend(currentQuestion.questionId)
    
    if (currentQuestionIndex < session.questions.length - 1) {
      // Don't save again in navigateToQuestion since we just saved
      navigateToQuestion(currentQuestionIndex + 1, false)
    }
  }

  const handlePrevious = async () => {
    // Save current answer before moving to previous question
    const currentQuestion = session.questions[currentQuestionIndex]
    await saveAnswerToBackend(currentQuestion.questionId)
    
    if (currentQuestionIndex > 0) {
      // Don't save again in navigateToQuestion since we just saved
      navigateToQuestion(currentQuestionIndex - 1, false)
    }
  }

  const handleAutoSubmit = async () => {
    await handleSubmit(true)
  }

  const handleSubmit = async (isAutoSubmit = false) => {
    try {
      setSubmitting(true)
      
      // Save the current question's answer before submitting (especially important for the last question)
      if (session?.questions?.[currentQuestionIndex]) {
        const currentQuestion = session.questions[currentQuestionIndex]
        await saveAnswerToBackend(currentQuestion.questionId)
      }
      
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

        // Add answers object for detailed results display
        if (analysis.overallAnalysis) {
          analysis.overallAnalysis.answersObject = answers
        } else {
          analysis.overallAnalysis = { answersObject: answers }
        }

        // Update results with analysis data
        results.score = analysis.score
        results.accuracy = analysis.accuracy
        results.performanceData = analysis

        // Complete quiz in backend (replaces localStorage operations)
        const quizIdForApi = quizData.quizId || quizData._id || quizId
        const completionData = {
          score: Number(analysis.score) || 0,
          totalMarks: Number(analysis.totalMarks) || 0,
          timeSpent: Number(timeTaken) || 0,
          performanceData: {
            accuracy: analysis.accuracy || 0,
            totalQuestions: analysis.totalQuestions || 0,
            weakTopics: analysis.improvementAreas?.weakTopics || [],
            recommendations: analysis.nextActions || []
          }
        }
        await algorithmQuizService.completeQuiz(quizIdForApi, completionData)

        // Update student performance
        await updateStudentPerformance(user?.id || 'demo', analysis)

        // Navigate to results with analysis
        navigate(`/student/quiz/${quizIdForApi}/results`, {
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
          state: { 
            result: response.result, 
            isAutoSubmit,
            newBadges: response.newBadges 
          }
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
    if (!question) return 'not-visited'
    
    const questionId = question.questionId || question.id
    if (!questionId) return 'not-visited'
    
    const answer = answers[questionId]
    const isAnswered = answer !== undefined && answer !== null && answer !== ''
    const isMarked = markedForReview[questionId]
    const isCurrent = index === currentQuestionIndex
    
    if (isCurrent) return 'current'
    if (isMarked && isAnswered) return 'marked-answered'
    if (isMarked) return 'marked'
    if (isAnswered) return 'answered'
    return 'not-visited'
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'current': return 'bg-indigo-600 text-white border-2 border-indigo-400 shadow-lg'
      case 'answered': return 'bg-green-500 text-white hover:bg-green-600'
      case 'marked-answered': return 'bg-yellow-500 text-white hover:bg-yellow-600'
      case 'marked': return 'bg-orange-400 text-white hover:bg-orange-500'
      case 'not-visited': return 'bg-gray-200 text-gray-700 hover:bg-gray-300'
      default: return 'bg-gray-200 text-gray-700 hover:bg-gray-300'
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'current': return 'Current'
      case 'answered': return 'Answered'
      case 'marked-answered': return 'Marked & Answered'
      case 'marked': return 'Marked for Review'
      case 'not-visited': return 'Not Visited'
      default: return 'Not Visited'
    }
  }

  const renderQuestion = () => {
    if (!session?.questions?.[currentQuestionIndex]) return null
    
    const question = session.questions[currentQuestionIndex]
    const answer = answers[question.questionId]
    
    // For QuestionCard component, we need to handle answer differently based on type
    const handleQuestionAnswer = (newAnswer) => {
      if (question.type === 'mcq-single' || question.type === 'mcq') {
        handleMCQAnswer(question.questionId, newAnswer, false)
      } else if (question.type === 'mcq-multiple' || question.type === 'multiple-select') {
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
    <>
    <SEOHead title="Quiz Attempt - Student" noIndex={true} noFollow={true} />
    <div className="min-h-screen bg-white">
      {/* Header with Timer */}
      <MeritaiCard className="border-b sticky top-0 z-10 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent animate-shimmer">
                🎯 Quiz in Progress
              </h1>
              <p className="text-sm text-gray-600 font-medium">{session.questions?.length} Questions • Good luck! 🚀</p>
            </div>

            <div className="flex items-center justify-between sm:justify-end space-x-3 sm:space-x-6">
              {/* Auto-save Status */}
              <div className="flex items-center text-sm font-medium">
                {autoSaveStatus === 'saving' && (
                  <span className="text-yellow-600 animate-pulse">💾 Saving...</span>
                )}
                {autoSaveStatus === 'saved' && (
                  <span className="text-green-600">✅ Saved</span>
                )}
                {autoSaveStatus === 'error' && (
                  <span className="text-red-600">⚠️ Save failed</span>
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
                className="genz-btn-secondary p-2 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center hover:scale-105 transition-all"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </MeritaiCard>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Progress Bar */}
        <div className="mb-4 sm:mb-6">
          <QuizProgressBar
            current={currentQuestionIndex}
            total={session.questions.length}
            answers={answers}
            markedForReview={markedForReview}
            questions={session.questions}
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
                      onClick={handleSkipQuestion}
                      className="px-4 py-2 border-2 border-orange-400 text-orange-600 rounded-lg hover:bg-orange-50 min-h-[44px] flex-1 sm:flex-none font-medium"
                    >
                      ⏭️ Skip
                    </button>
                    <button
                      onClick={handleNext}
                      disabled={currentQuestionIndex === session.questions.length - 1}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] flex-1 sm:flex-none"
                    >
                      Next →
                    </button>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      onClick={handleToggleReview}
                      className={`px-4 py-2 rounded-lg min-h-[44px] font-medium transition-colors ${
                        markedForReview[session.questions[currentQuestionIndex]?.questionId]
                          ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                          : 'border-2 border-yellow-400 text-yellow-600 hover:bg-yellow-50'
                      }`}
                    >
                      {markedForReview[session.questions[currentQuestionIndex]?.questionId] ? '⭐ Marked' : '🚩 Mark'}
                    </button>
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
                  <span className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-indigo-600 mr-2 flex-shrink-0 border-2 border-indigo-400"></span>
                  <span className="text-xs sm:text-sm">Current</span>
                </div>
                <div className="flex items-center">
                  <span className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-green-500 mr-2 flex-shrink-0"></span>
                  <span className="text-xs sm:text-sm">Answered</span>
                </div>
                <div className="flex items-center">
                  <span className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-yellow-500 mr-2 flex-shrink-0"></span>
                  <span className="text-xs sm:text-sm">Marked + Answered</span>
                </div>
                <div className="flex items-center">
                  <span className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-orange-400 mr-2 flex-shrink-0"></span>
                  <span className="text-xs sm:text-sm">Marked</span>
                </div>
                <div className="flex items-center">
                  <span className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-gray-200 mr-2 flex-shrink-0"></span>
                  <span className="text-xs sm:text-sm">Not Visited</span>
                </div>
              </div>

              {/* Question Grid */}
                {session.questions.map((question, index) => {
                  const questionId = question.questionId || question.id
                  const status = getQuestionStatus(index)
                  const answer = answers[questionId]
                  const isAnswered = answer !== undefined && answer !== null && answer !== ''
                  const isMarked = markedForReview[questionId]
                  const isCurrent = index === currentQuestionIndex

                  // Determine status based on current state
                  let currentStatus = 'not-visited'
                  if (isCurrent) currentStatus = 'current'
                  else if (isMarked && isAnswered) currentStatus = 'marked-answered'
                  else if (isMarked) currentStatus = 'marked'
                  else if (isAnswered) currentStatus = 'answered'

                  return (
                    <button
                      key={`question-${index}-${currentStatus}-${isAnswered}-${isMarked}-${isCurrent}`}
                      onClick={() => navigateToQuestion(index)}
                      className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg font-medium text-xs sm:text-sm ${getStatusColor(currentStatus)} min-h-[32px] sm:min-h-[40px] flex items-center justify-center`}
                    >
                      {index + 1}
                    </button>
                  )
                })}

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
                  <span className="font-medium text-emerald-600">
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
    </>
  )
}

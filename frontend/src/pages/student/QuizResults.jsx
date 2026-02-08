import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { quizService, quizEvaluationService, algorithmQuizService } from '../../services/apiServices'
import { useAuthStore } from '../../store/authStore'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import SEOHead from '../../components/SEO/SEOHead';
import ErrorMessage from '../../components/common/ErrorMessage'
import {
  calculateQuizScore,
  analyzeByTopic,
  analyzeByDifficulty,
  analyzeTimeManagement,
  identifyImprovementAreas,
  generateNextActions,
  storeQuizAttempt,
  checkAnswer
} from '../../utils/quiz'

export default function QuizResults() {
  const { quizId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuthStore()
  
  console.log('🎯 QuizResults component mounted:', {
    urlParams: useParams(),
    pathname: location.pathname,
    search: location.search,
    hash: location.hash,
    quizIdFromParams: quizId,
    fullLocation: location
  });
  
  const [result, setResult] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  
  // Check if coming from submission
  const submissionResult = location.state?.result
  const isAutoSubmit = location.state?.isAutoSubmit
  const quizData = location.state?.quiz
  const newBadges = location.state?.newBadges || []

  useEffect(() => {
    console.log('🔍 QuizResults useEffect triggered:', {
      quizId,
      hasSubmissionResult: !!submissionResult,
      hasQuizData: !!quizData,
      locationState: location.state,
      fromHistory: location.state?.fromHistory,
      hasLocationState: !!location.state
    });
    
    // ✅ PRIORITY 1: Check if coming from history FIRST
    if (location.state?.fromHistory) {
      // Fetch data from history (QuizSession)
      console.log('Fetching results from history due to location state');
      fetchResultsFromHistory()
    } else if (submissionResult && quizData) {
      // If we have algorithm quiz results in location state, use them directly
      handleAlgorithmQuizResults()
    } else {
      // Otherwise fetch from API (for regular quizzes)
      fetchResults()
    }
    fetchAnalytics()
  }, [quizId, submissionResult])

  const handleAlgorithmQuizResults = () => {
    try {
      setLoading(true)
      
      // Get answers from QuizAttempt page navigation state
      const answersObject = {}
      if (submissionResult.overallAnalysis?.answersObject) {
        Object.assign(answersObject, submissionResult.overallAnalysis.answersObject)
      }
      
      // Transform algorithm quiz results to match expected format
      const transformedResult = {
        quiz: {
          _id: quizData.quizId || quizData._id,
          title: `${quizData.subject} - ${quizData.courseName}`,
          subject: quizData.subject,
          difficulty: quizData.difficulty,
          passingPercentage: 60,
          duration: quizData.duration
        },
        session: {
          _id: quizData.quizId,
          score: submissionResult.score || 0,
          totalMarks: submissionResult.totalMarks || 0,
          percentage: submissionResult.percentage || 0,
          passed: submissionResult.passed || false,
          timeSpent: submissionResult.timeTaken || submissionResult.totalTime || 0,
          completedAt: new Date().toISOString(),
          pendingManualEvaluation: false,
          attemptNumber: 1
        },
        evaluation: {
          overallAnalysis: submissionResult.overallAnalysis || {
            totalQuestions: submissionResult.totalQuestions || 0,
            correct: submissionResult.overallAnalysis?.correct || 0,
            wrong: submissionResult.overallAnalysis?.wrong || 0,
            unattempted: submissionResult.overallAnalysis?.unattempted || 0,
            accuracy: submissionResult.accuracy || 0
          },
          topicAnalysis: submissionResult.topicAnalysis || [],
          difficultyAnalysis: submissionResult.difficultyAnalysis || {},
          timeAnalysis: submissionResult.timeAnalysis || {}
        },
        detailedAnswers: quizData.questions?.map((q, index) => {
          const userAnswer = answersObject[index.toString()] || answersObject[q.id] || null
          const isCorrect = checkAnswer(q, userAnswer)
          
          return {
            questionId: q.id,
            questionText: q.question,
            type: q.type,
            options: q.options,
            correctAnswer: getCorrectAnswerDisplay(q),
            yourAnswer: userAnswer,
            isCorrect: isCorrect,
            marks: q.marks || 1,
            scoredMarks: isCorrect ? (q.marks || 1) : 0,
            topic: q.topic,
            difficulty: q.difficulty,
            explanation: q.explanation || ''
          }
        }) || []
      }
      
      setResult(transformedResult)
      setLoading(false)
    } catch (err) {
      console.error('Error handling algorithm quiz results:', err)
      setError('Failed to process quiz results')
      setLoading(false)
    }
  }

  const getCorrectAnswerDisplay = (question) => {
    if (!question) return 'N/A'
    
    switch (question.type) {
      case 'mcq-single':
      case 'mcq':
      case 'true-false':
        // Find the option that matches the correct answer text
        const correctOption = question.options?.find(opt => opt.text === question.correctAnswer)
        // Return the text if found, otherwise return the stored correct answer
        return correctOption ? correctOption.text : question.correctAnswer
      
      case 'mcq-multiple':
      case 'multiple-select':
        // Handle multiple correct answers (comma-separated text)
        if (typeof question.correctAnswer === 'string') {
          const correctAnswerTexts = question.correctAnswer.split(',').map(text => text.trim())
          return correctAnswerTexts.join(', ')
        }
        return question.correctAnswer
      
      case 'numerical':
        return question.correctAnswer
      
      case 'short-answer':
      case 'long-answer':
        return question.expectedAnswer || question.correctAnswer
      
      default:
        return question.correctAnswer
    }
  }

  /**
   * Get user answer display text (convert IDs to readable text)
   */
  const getUserAnswerDisplay = (question, userAnswer) => {
    if (!userAnswer || userAnswer === '') return 'Not Answered'
    
    switch (question.type) {
      case 'mcq-single':
      case 'mcq':
      case 'true-false':
        // Find the option that matches the user's answer ID
        const selectedOption = question.options?.find(opt => 
          opt.id === userAnswer || opt._id === userAnswer
        )
        return selectedOption ? selectedOption.text : userAnswer
      
      case 'mcq-multiple':
      case 'multiple-select':
        if (!Array.isArray(userAnswer)) return userAnswer
        
        // Find all options that match the user's answer IDs
        const selectedOptions = question.options?.filter(opt => 
          userAnswer.includes(opt.id) || userAnswer.includes(opt._id)
        )
        
        return selectedOptions && selectedOptions.length > 0
          ? selectedOptions.map(opt => opt.text).join(', ')
          : userAnswer.join(', ')
      
      case 'numerical':
      case 'short-answer':
      case 'long-answer':
        return userAnswer
      
      default:
        return userAnswer
    }
  }

  // Enhanced analysis using quiz utilities
  const enhancedAnalysis = useMemo(() => {
    console.log('🔬 Enhanced Analysis Starting:', {
      hasResult: !!result,
      hasSession: !!result?.session,
      hasQuiz: !!result?.quiz,
      hasDetailedAnswers: !!result?.detailedAnswers,
      detailedAnswersLength: result?.detailedAnswers?.length
    });

    if (!result || !result.session || !result.quiz) return null

    try {
      const { session, quiz, detailedAnswers } = result
      
      // Prepare questions and answers for analysis
      const questions = detailedAnswers || []
      
      console.log('🔬 Questions array for analysis:', {
        questionsLength: questions.length,
        firstQuestion: questions[0],
        questionsSample: questions.slice(0, 2)
      });
      
      // ✅ PHASE 2: Check for empty questions
      if (questions.length === 0) {
        console.warn('No questions available for analysis')
        return {
          scoreAnalysis: { totalQuestions: 0, correct: 0, wrong: 0, percentage: 0 },
          topicAnalysis: [],
          difficultyAnalysis: { easy: { total: 0, correct: 0 }, medium: {}, hard: {} },
          timeAnalysis: {},
          improvementAreas: [],
          nextActions: []
        }
      }
      
      // ✅ Build answers map with BOTH questionId and index
      const answers = {}
      questions.forEach((q, index) => {
        answers[q.questionId] = q.yourAnswer           // For questionId lookup
        answers[index.toString()] = q.yourAnswer       // For index lookup
      })
      
      console.log('Enhanced Analysis Input:', {
        questionsCount: questions.length,
        answersCount: Object.keys(answers).length,
        sampleQuestion: questions[0],
        hasEvaluation: !!result.evaluation
      })

      // Calculate comprehensive score
      const scoreAnalysis = calculateQuizScore(questions, answers, result.evaluation)
      
      // Use pre-calculated analysis from history if available, otherwise calculate
      let topicAnalysis, difficultyAnalysis;
      
      if (result.evaluation && result.evaluation.topicAnalysis && result.evaluation.topicAnalysis.length > 0) {
        // Use pre-calculated topic analysis from quiz history
        topicAnalysis = result.evaluation.topicAnalysis;
        console.log('Using pre-calculated topic analysis from history:', topicAnalysis);
      } else {
        // Calculate topic analysis from questions
        topicAnalysis = analyzeByTopic(questions, answers);
      }
      
      if (result.evaluation && result.evaluation.difficultyAnalysis && Object.keys(result.evaluation.difficultyAnalysis).length > 0) {
        // Use pre-calculated difficulty analysis from quiz history
        difficultyAnalysis = result.evaluation.difficultyAnalysis;
        console.log('Using pre-calculated difficulty analysis from history:', difficultyAnalysis);
      } else {
        // Calculate difficulty analysis from questions
        difficultyAnalysis = analyzeByDifficulty(questions, answers);
      }
      
      // ✅ PHASE 2 FIX: Build timeSpentPerQuestion object from answers
      const timeSpentPerQuestion = {}
      if (Array.isArray(detailedAnswers)) {
        detailedAnswers.forEach((ans, index) => {
          // Use answer's timeSpent if available, otherwise distribute total time evenly
          timeSpentPerQuestion[index.toString()] = ans.timeSpent || 
            (session.timeSpent / detailedAnswers.length) || 0
        })
      }
      
      // Analyze time management with proper data structure
      const timeAnalysis = analyzeTimeManagement(
        questions,
        timeSpentPerQuestion,
        (quiz.duration || 30) * 60
      )
      
      // Identify improvement areas
      const improvementAreas = identifyImprovementAreas(
        scoreAnalysis,
        topicAnalysis,
        difficultyAnalysis,
        timeAnalysis
      )
      
      // Generate next action suggestions
      const nextActions = generateNextActions(improvementAreas, scoreAnalysis)
      
      console.log('Enhanced Analysis Output:', {
        scoreAnalysis,
        topicsCount: topicAnalysis.length,
        difficultyLevels: Object.keys(difficultyAnalysis).length,
        timeAnalysis
      })
      
      // Store attempt in quiz history
      storeQuizAttempt({
        id: session._id,
        sessionId: session._id,
        quizId: quiz._id,
        quizTitle: quiz.title,
        subject: quiz.subject || 'General',
        difficulty: quiz.difficulty || 'medium',
        score: session.score || 0,
        totalMarks: session.totalMarks || 0,
        accuracy: scoreAnalysis.accuracy,
        percentage: session.percentage || 0,
        passed: session.passed || false,
        totalQuestions: scoreAnalysis.totalQuestions,
        correct: scoreAnalysis.correct,
        wrong: scoreAnalysis.wrong,
        unattempted: scoreAnalysis.unattempted,
        timeSpent: session.timeSpent || 0,
        completedAt: session.completedAt || new Date().toISOString(),
        passingPercentage: quiz.passingPercentage || 60
      })
      
      return {
        scoreAnalysis,
        topicAnalysis,
        difficultyAnalysis,
        timeAnalysis,
        improvementAreas,
        nextActions
      }
    } catch (error) {
      console.error('Error calculating enhanced analysis:', error)
      return null
    }
  }, [result])

  const fetchResults = async () => {
    try {
      setLoading(true)
      const response = await quizService.getQuizResult(quizId)
      setResult(response.result)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load results')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchResultsFromHistory = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔍 Fetching results from history:', {
        quizId,
        quizIdType: typeof quizId,
        hasLocationState: !!location.state,
        sessionId: location.state?.sessionId,
        locationState: location.state,
        willUseSessionIdFallback: !quizId && location.state?.sessionId
      });
      
      // If quizId is not available from URL, try to use sessionId from state
      const searchId = quizId || location.state?.sessionId;
      
      if (!searchId) {
        console.error('❌ No quizId or sessionId available for search');
        setError('Missing quiz identifier');
        setLoading(false);
        return;
      }
      
      // Fetch quiz session data from history
      const response = await algorithmQuizService.getQuizHistory({ limit: 1000 })
      const historyData = response.data || response || []
      
      console.log('📦 History data received:', {
        totalRecords: historyData.length,
        firstRecord: historyData[0] ? {
          id: historyData[0].id,
          quizId: historyData[0].quizId,
          idType: typeof historyData[0].id,
          quizIdType: typeof historyData[0].quizId
        } : null
      });
      
      // Try to find session by matching quizId (convert both to strings for comparison)
      const sessionData = historyData.find(h => 
        String(h.quizId) === String(searchId) || 
        String(h.id) === String(searchId) ||
        String(h._id) === String(searchId)
      )
      
      if (!sessionData) {
        console.error('❌ Quiz session not found in history for searchId:', searchId);
        console.error('Available IDs:', historyData.map(h => ({
          id: h.id,
          quizId: h.quizId,
          subject: h.subject
        })));
        setError('Quiz results not found in history')
        setLoading(false)
        return
      }

      console.log('✅ Session data loaded:', {
        id: sessionData.id,
        quizId: sessionData.quizId,
        subject: sessionData.subject,
        hasQuestions: !!sessionData.questions,
        questionsCount: sessionData.questions?.length || 0,
        hasAnswers: !!sessionData.answers,
        answersCount: sessionData.answers?.length || 0,
        sampleQuestion: sessionData.questions?.[0],
        sampleAnswer: sessionData.answers?.[0],
        questionsType: typeof sessionData.questions,
        answersType: typeof sessionData.answers
      });
      
      // ✅ PHASE 2: Validate session has required data
      if (!sessionData.questions || sessionData.questions.length === 0) {
        console.error('Session found but has no questions');
        setError('Quiz session data is incomplete');
        setLoading(false);
        return;
      }

      // Transform session data to result format
      const transformedResult = {
        quiz: {
          _id: sessionData.quizId,
          title: `${sessionData.subject} - ${sessionData.courseName}`,
          subject: sessionData.subject,
          difficulty: sessionData.difficulty,
          passingPercentage: 60,
          duration: sessionData.duration
        },
        session: {
          _id: sessionData.id,
          score: sessionData.score || 0,
          totalMarks: sessionData.totalScore || 0,
          percentage: sessionData.accuracy || 0,
          passed: (sessionData.accuracy || 0) >= 60,
          timeSpent: sessionData.timeTaken || 0,
          completedAt: sessionData.completedAt,
          pendingManualEvaluation: false,
          attemptNumber: 1
        },
        evaluation: {
          overallAnalysis: {
            totalQuestions: sessionData.questionCount || 0,
            correct: Math.round((sessionData.accuracy || 0) * (sessionData.questionCount || 0) / 100),
            wrong: (sessionData.questionCount || 0) - Math.round((sessionData.accuracy || 0) * (sessionData.questionCount || 0) / 100),
            unattempted: 0,
            accuracy: sessionData.accuracy || 0
          },
          topicAnalysis: sessionData.performanceByTopic || [],
          difficultyAnalysis: sessionData.performanceByDifficulty || {},
          timeAnalysis: {
            totalTimeUsed: sessionData.timeTaken || 0,
            totalTimeAllowed: (sessionData.duration || 0) * 60,
            timeUtilization: sessionData.timeUtilization || 0
          }
        },
        detailedAnswers: sessionData.questions?.map((q, index) => {
          console.log('🔧 Processing question:', {
            index,
            questionId: q.questionId,
            questionIdType: typeof q.questionId,
            hasSnapshot: !!q.snapshot,
            snapshotType: typeof q.snapshot,
            answersCount: sessionData.answers?.length || 0
          });
          
          const answer = sessionData.answers?.find(a => {
            const match = a.questionId?.toString() === q.questionId?.toString();
            console.log('🔧 Answer matching:', {
              answerQuestionId: a.questionId,
              questionQuestionId: q.questionId,
              match,
              answerQuestionIdType: typeof a.questionId
            });
            return match;
          });
          
          // ✅ Snapshots are now already parsed by backend
          const questionData = q.snapshot || q;
          
          // ✅ PHASE 2: Add debug logging
          console.log('Processing question for analysis:', {
            index,
            questionId: q.questionId,
            hasAnswer: !!answer,
            topic: questionData.topic,
            difficulty: questionData.difficulty,
            snapshotType: typeof q.snapshot
          });
          
          return {
            questionId: q.questionId,
            questionText: questionData.text || q.text,
            type: questionData.type || 'mcq-single',
            options: questionData.options || [],
            correctAnswer: questionData.correctAnswer,      // ✅ Now available
            expectedAnswer: questionData.expectedAnswer,    // ✅ Now available
            numericalAnswer: questionData.numericalAnswer,  // ✅ Now available
            yourAnswer: answer?.answer,
            isCorrect: answer?.isCorrect,                   // ✅ Now evaluated
            marks: questionData.marks || 1,
            marksAwarded: answer?.marksAwarded || 0,        // ✅ Now calculated
            timeSpent: answer?.timeSpent || 0,              // ✅ PHASE 2 FIX: Include time spent
            topic: questionData.topic,
            difficulty: questionData.difficultyLevel || questionData.difficulty,
            explanation: questionData.explanation || ''     // ✅ Now available
          }
        }) || []
      }

      console.log('🔧 Detailed answers mapping complete:', {
        inputQuestionsCount: sessionData.questions?.length || 0,
        inputAnswersCount: sessionData.answers?.length || 0,
        outputDetailedAnswersCount: transformedResult.detailedAnswers?.length || 0,
        sampleOutput: transformedResult.detailedAnswers?.[0]
      });

      console.log('🎯 Transformed result:', {
        hasQuiz: !!transformedResult.quiz,
        hasSession: !!transformedResult.session,
        hasEvaluation: !!transformedResult.evaluation,
        detailedAnswersCount: transformedResult.detailedAnswers?.length || 0,
        quizTitle: transformedResult.quiz?.title,
        sessionScore: transformedResult.session?.score,
        totalQuestions: transformedResult.evaluation?.overallAnalysis?.totalQuestions,
        firstDetailedAnswer: transformedResult.detailedAnswers?.[0],
        detailedAnswersPreview: transformedResult.detailedAnswers?.slice(0, 2),
        hasTopicAnalysis: !!transformedResult.evaluation?.topicAnalysis,
        topicAnalysisLength: transformedResult.evaluation?.topicAnalysis?.length || 0,
        hasDifficultyAnalysis: !!transformedResult.evaluation?.difficultyAnalysis,
        difficultyAnalysisKeys: Object.keys(transformedResult.evaluation?.difficultyAnalysis || {})
      });

      setResult(transformedResult)
      console.log('✅ Result state set successfully');
      setLoading(false)
    } catch (err) {
      console.error('❌ Failed to load results from history:', err)
      setError('Failed to load quiz results')
      setLoading(false)
    }
  }

  const fetchAnalytics = async () => {
    try {
      const response = await quizEvaluationService.getStudentAnalytics(user._id)
      setAnalytics(response.analytics)
    } catch (err) {
      console.error('Failed to load analytics:', err)
    }
  }

  const formatTime = (seconds) => {
    if (!seconds) return 'N/A'
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}m ${secs}s`
  }

  const getGradeColor = (grade) => {
    if (['A+', 'A'].includes(grade)) return 'text-green-600'
    if (['B+', 'B'].includes(grade)) return 'text-blue-600'
    if (['C+', 'C'].includes(grade)) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} />
  if (!result) {
    console.log('⚠️ Result is null, not rendering');
    return null
  }

  console.log('📊 Rendering with result:', {
    hasResult: !!result,
    hasSession: !!result.session,
    hasEvaluation: !!result.evaluation,
    hasDetailedAnswers: !!result.detailedAnswers,
    hasQuiz: !!result.quiz,
    detailedAnswersLength: result.detailedAnswers?.length
  });

  const { session, evaluation, detailedAnswers, quiz } = result

  return (
    <>

    <SEOHead title="Quiz Results - Student" noIndex={true} noFollow={true} />

    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <button
          onClick={() => navigate('/student/quizzes')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4 min-h-[44px] px-2 py-1"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm sm:text-base">Back to Quizzes</span>
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
              <span className="meritai-title-gradient">{quiz?.title}</span>
            </h1>
            <p className="mt-1 text-gray-600 text-sm sm:text-base">Quiz Results</p>
          </div>

          {isAutoSubmit && (
            <div className="px-3 py-2 sm:px-4 bg-yellow-100 text-yellow-800 rounded-lg text-xs sm:text-sm w-fit">
              Quiz was auto-submitted due to time expiry
            </div>
          )}
        </div>
      </div>

      {/* Result Summary Card */}
      <div className={`genz-card rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 ${session.passed ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300' : 'bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-300'}`}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 lg:space-x-6">
            <div className={`w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-full flex items-center justify-center flex-shrink-0 shadow-xl ${session.passed ? 'bg-gradient-to-br from-green-400 to-emerald-500 animate-bounce-slow' : 'bg-gradient-to-br from-red-400 to-pink-500'}`}>
              <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                {Math.round(session.percentage)}%
              </span>
            </div>
            <div>
              <h2 className={`text-lg sm:text-xl lg:text-2xl font-bold ${session.passed ? 'text-green-800' : 'text-red-800'}`}>
                {session.passed ? '🎉 Woohoo! You Crushed It!' : '� Almost There! Keep Going!'}
              </h2>
              <p className={`mt-1 text-sm sm:text-base ${session.passed ? 'text-green-600' : 'text-red-600'}`}>
                Passing percentage: {quiz?.passingPercentage}% {session.passed ? '✨' : '🎯'}
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right lg:text-right">
            <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
              {session.score} / {session.totalMarks}
            </div>
            {evaluation?.grade && (
              <div className={`text-lg sm:text-xl lg:text-2xl font-bold ${getGradeColor(evaluation.grade)}`}>
                Grade: {evaluation.grade}
              </div>
            )}
          </div>
        </div>

        {session.pendingManualEvaluation && (
          <div className="mt-4 p-3 bg-yellow-100 rounded-lg text-yellow-800 text-sm">
            ⚠️ Some answers require manual evaluation. Your final score may change.
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex overflow-x-auto sm:overflow-x-visible sm:flex-wrap sm:space-x-8">
          {['overview', 'detailed', 'analysis', 'suggestions'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-1 border-b-2 font-medium text-sm capitalize transition-colors whitespace-nowrap flex-shrink-0 ${
                activeTab === tab
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-sm font-medium text-gray-500">Total Questions</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {evaluation?.overallAnalysis?.totalQuestions || 0}
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-sm font-medium text-gray-500">Correct Answers</h3>
            <p className="mt-2 text-3xl font-bold text-green-600">
              {evaluation?.overallAnalysis?.correct || 0}
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-sm font-medium text-gray-500">Wrong Answers</h3>
            <p className="mt-2 text-3xl font-bold text-red-600">
              {evaluation?.overallAnalysis?.wrong || 0}
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-sm font-medium text-gray-500">Unattempted</h3>
            <p className="mt-2 text-3xl font-bold text-gray-400">
              {evaluation?.overallAnalysis?.unattempted || 0}
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-sm font-medium text-gray-500">Accuracy</h3>
            <p className="mt-2 text-3xl font-bold text-indigo-600">
              {Math.round(evaluation?.overallAnalysis?.accuracy || 0)}%
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-sm font-medium text-gray-500">Time Taken</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {formatTime(session.timeSpent)}
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-sm font-medium text-gray-500">Attempt Number</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {session.attemptNumber}
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-sm font-medium text-gray-500">Time Management</h3>
            <p className={`mt-2 text-xl font-bold capitalize ${
              evaluation?.timeAnalysis?.timeManagementRating === 'excellent' ? 'text-green-600' :
              evaluation?.timeAnalysis?.timeManagementRating === 'good' ? 'text-blue-600' :
              evaluation?.timeAnalysis?.timeManagementRating === 'average' ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {evaluation?.timeAnalysis?.timeManagementRating || 'N/A'}
            </p>
          </div>
        </div>
      )}

      {/* New Achievements Section */}
      {newBadges && newBadges.length > 0 && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border-2 border-yellow-200 p-6 mt-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="text-2xl">🏆</div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Congratulations! New Achievements Unlocked</h3>
              <p className="text-sm text-gray-600">You've earned {newBadges.length} new badge{newBadges.length > 1 ? 's' : ''} for this quiz!</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {newBadges.map((badge, index) => (
              <div
                key={index}
                className="bg-white rounded-lg border-2 border-yellow-300 p-4 shadow-sm hover:shadow-md transition"
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{badge.badgeIcon}</div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 text-sm">{badge.badgeName}</h4>
                    <p className="text-xs text-gray-600">{badge.badgeDescription}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                        badge.level === 'bronze' ? 'text-amber-700 bg-amber-100' :
                        badge.level === 'silver' ? 'text-gray-600 bg-gray-200' :
                        badge.level === 'gold' ? 'text-yellow-600 bg-yellow-100' :
                        badge.level === 'platinum' ? 'text-purple-600 bg-purple-100' :
                        'text-blue-600 bg-blue-100'
                      }`}>
                        {badge.level.toUpperCase()}
                      </span>
                      <span className="text-xs font-bold text-primary-600">+{badge.points} pts</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'detailed' && detailedAnswers && (
        <div className="space-y-4">
          {detailedAnswers.map((answer, index) => (
            <div 
              key={answer.questionId}
              className={`bg-white rounded-lg shadow-sm p-6 border-l-4 ${
                answer.isCorrect === true ? 'border-green-500' :
                answer.isCorrect === false ? 'border-red-500' :
                'border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="font-medium text-gray-900">Q{index + 1}.</span>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      answer.isCorrect === true ? 'bg-green-100 text-green-800' :
                      answer.isCorrect === false ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {answer.isCorrect === true ? 'Correct' : answer.isCorrect === false ? 'Wrong' : 'Pending'}
                    </span>
                  </div>
                  
                  <p className="text-gray-900 font-medium mb-3">{answer.questionText}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Your Answer:</h4>
                      <p className="text-gray-900">
                        {getUserAnswerDisplay(
                          { type: answer.type, options: answer.options },
                          answer.yourAnswer
                        )}
                      </p>
                    </div>
                    
                    {answer.correctAnswer && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Correct Answer:</h4>
                        <p className="text-green-600">
                          {typeof answer.correctAnswer === 'string' 
                            ? answer.correctAnswer
                            : (answer.correctAnswer.options?.map(o => o.text).join(', ') ||
                               answer.correctAnswer.numericalAnswer?.value ||
                               answer.correctAnswer.expectedAnswer ||
                               'N/A')}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {answer.explanation && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <h4 className="text-sm font-medium text-blue-800 mb-1">Explanation:</h4>
                      <p className="text-blue-700 text-sm">{answer.explanation}</p>
                    </div>
                  )}
                  
                  {answer.feedback && (
                    <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                      <h4 className="text-sm font-medium text-yellow-800 mb-1">Tutor Feedback:</h4>
                      <p className="text-yellow-700 text-sm">{answer.feedback}</p>
                    </div>
                  )}
                </div>
                
                <div className="ml-4 text-right">
                  <span className="text-lg font-bold text-gray-900">
                    {answer.marksAwarded || 0}
                  </span>
                  <span className="text-gray-500">
                    /{answer.questionSnapshot?.marks || 0}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'analysis' && (
        <div className="space-y-8">
          {/* Topic Analysis - Using Enhanced Analysis */}
          {enhancedAnalysis?.topicAnalysis && enhancedAnalysis.topicAnalysis.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Topic-wise Performance</h3>
              <div className="space-y-4">
                {enhancedAnalysis.topicAnalysis.map((topic) => (
                  <div key={topic.topic} className="border-b pb-4 last:border-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">{topic.topic}</span>
                      <span className={`font-bold ${
                        topic.accuracy >= 70 ? 'text-green-600' :
                        topic.accuracy >= 40 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {Math.round(topic.accuracy)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className={`h-2.5 rounded-full ${
                          topic.accuracy >= 70 ? 'bg-green-500' :
                          topic.accuracy >= 40 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(100, topic.accuracy)}%` }}
                      ></div>
                    </div>
                    <div className="flex text-sm text-gray-500 mt-1">
                      <span className="mr-4">Correct: {topic.correct}</span>
                      <span className="mr-4">Wrong: {topic.wrong}</span>
                      <span>Unattempted: {topic.unattempted}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Difficulty Analysis - Using Enhanced Analysis */}
          {enhancedAnalysis?.difficultyAnalysis && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Difficulty-wise Performance</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {['easy', 'medium', 'hard'].map((level) => {
                  const data = enhancedAnalysis.difficultyAnalysis[level]
                  return (
                    <div key={level} className="text-center p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 capitalize mb-2">{level}</h4>
                      <div className="text-3xl font-bold mb-1" style={{
                        color: level === 'easy' ? '#22c55e' : level === 'medium' ? '#eab308' : '#ef4444'
                      }}>
                        {Math.round(data.accuracy)}%
                      </div>
                      <p className="text-sm text-gray-500">
                        {data.correct} / {data.total} correct
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Time Management Analysis - NEW */}
          {enhancedAnalysis?.timeAnalysis && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">⏱️ Time Management</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Total Time</h4>
                  <div className="text-2xl font-bold text-gray-900">
                    {Math.floor(enhancedAnalysis.timeAnalysis.totalTimeSpent / 60)}m {enhancedAnalysis.timeAnalysis.totalTimeSpent % 60}s
                  </div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Avg per Question</h4>
                  <div className="text-2xl font-bold text-gray-900">
                    {Math.round(enhancedAnalysis.timeAnalysis.avgTimePerQuestion)}s
                  </div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Time Utilization</h4>
                  <div className="text-2xl font-bold text-indigo-600">
                    {Math.round(Number(enhancedAnalysis.timeAnalysis.timeUtilization || 0))}%
                  </div>
                </div>
              </div>
              <div className={`p-4 rounded-lg ${
                enhancedAnalysis.timeAnalysis.rating === 'excellent' ? 'bg-green-50' :
                enhancedAnalysis.timeAnalysis.rating === 'good' ? 'bg-blue-50' :
                enhancedAnalysis.timeAnalysis.rating === 'rushed' ? 'bg-red-50' :
                'bg-yellow-50'
              }`}>
                <p className={`font-medium capitalize ${
                  enhancedAnalysis.timeAnalysis.rating === 'excellent' ? 'text-green-800' :
                  enhancedAnalysis.timeAnalysis.rating === 'good' ? 'text-blue-800' :
                  enhancedAnalysis.timeAnalysis.rating === 'rushed' ? 'text-red-800' :
                  'text-yellow-800'
                }`}>
                  {enhancedAnalysis.timeAnalysis.rating} Time Management
                </p>
                {enhancedAnalysis.timeAnalysis.recommendations && enhancedAnalysis.timeAnalysis.recommendations.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {enhancedAnalysis.timeAnalysis.recommendations.map((rec, i) => (
                      <li key={i} className="text-sm text-gray-700">• {rec}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* Comparison with Previous Attempts */}
          {evaluation?.comparison && evaluation.comparison.previousAttempts > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Progress</h3>
              <div className="flex items-center space-x-8">
                <div className="flex items-center">
                  <span className={`text-3xl font-bold ${
                    evaluation.comparison.scoreImprovement > 0 ? 'text-green-600' :
                    evaluation.comparison.scoreImprovement < 0 ? 'text-red-600' :
                    'text-gray-600'
                  }`}>
                    {evaluation.comparison.scoreImprovement > 0 ? '+' : ''}
                    {evaluation.comparison.scoreImprovement}
                  </span>
                  <span className="ml-2 text-gray-500">marks vs last attempt</span>
                </div>
                <div className="flex items-center">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    evaluation.comparison.trend === 'improving' ? 'bg-green-100 text-green-800' :
                    evaluation.comparison.trend === 'declining' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {evaluation.comparison.trend}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'suggestions' && (
        <div className="space-y-6">
          {/* Weak Areas - Using Enhanced Analysis */}
          {enhancedAnalysis?.improvementAreas?.weakAreas?.length > 0 && (
            <div className="bg-red-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-red-800 mb-4">🎯 Areas to Improve</h3>
              <div className="space-y-3">
                {enhancedAnalysis.improvementAreas.weakAreas.map((area, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">{area.area}</span>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          area.priority === 'high' ? 'bg-red-100 text-red-800' :
                          area.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {area.priority}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{area.reason}</p>
                      {area.suggestions?.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {area.suggestions.map((suggestion, i) => (
                            <li key={i} className="text-sm text-gray-500 flex items-start">
                              <span className="mr-2">•</span>
                              <span>{suggestion}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    {area.accuracy !== undefined && (
                      <span className="text-red-600 font-bold ml-4">{Math.round(area.accuracy)}%</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Strong Areas - Using Enhanced Analysis */}
          {enhancedAnalysis?.improvementAreas?.strongAreas?.length > 0 && (
            <div className="bg-green-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-800 mb-4">💪 Your Strengths</h3>
              <div className="flex flex-wrap gap-2">
                {enhancedAnalysis.improvementAreas.strongAreas.map((area, index) => (
                  <span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    {area.area} ({Math.round(area.accuracy)}%)
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Next Actions - Using Enhanced Analysis */}
          {enhancedAnalysis?.nextActions?.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📚 Recommended Next Steps</h3>
              <div className="space-y-4">
                {enhancedAnalysis.nextActions.map((action, index) => (
                  <div 
                    key={index}
                    className={`p-4 rounded-lg border-l-4 ${
                      action.priority === 'high' ? 'bg-red-50 border-red-500' :
                      action.priority === 'medium' ? 'bg-yellow-50 border-yellow-500' :
                      'bg-blue-50 border-blue-500'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{action.icon}</span>
                        <span className="font-medium text-gray-900">{action.title}</span>
                      </div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                        action.priority === 'high' ? 'bg-red-100 text-red-800' :
                        action.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {action.priority}
                      </span>
                    </div>
                    <p className="text-gray-700">{action.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-indigo-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-indigo-800 mb-4">🚀 Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={() => navigate('/student/quizzes')}
                className="p-4 bg-white border border-indigo-200 rounded-lg text-left hover:bg-indigo-50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl group-hover:scale-110 transition-transform">📝</span>
                  <div>
                    <span className="font-medium text-indigo-900 block">Take Another Quiz</span>
                    <p className="text-sm text-indigo-600">Practice makes perfect!</p>
                  </div>
                </div>
              </button>
              <button
                onClick={() => navigate('/student/quiz-history')}
                className="p-4 bg-white border border-indigo-200 rounded-lg text-left hover:bg-indigo-50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl group-hover:scale-110 transition-transform">📊</span>
                  <div>
                    <span className="font-medium text-indigo-900 block">View Quiz History</span>
                    <p className="text-sm text-indigo-600">Track your progress</p>
                  </div>
                </div>
              </button>
              <button
                onClick={() => navigate('/student/courses')}
                className="p-4 bg-white border border-indigo-200 rounded-lg text-left hover:bg-indigo-50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl group-hover:scale-110 transition-transform">📚</span>
                  <div>
                    <span className="font-medium text-indigo-900 block">Review Materials</span>
                    <p className="text-sm text-indigo-600">Strengthen understanding</p>
                  </div>
                </div>
              </button>
              <button
                onClick={() => navigate('/student/progress')}
                className="p-4 bg-white border border-indigo-200 rounded-lg text-left hover:bg-indigo-50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl group-hover:scale-110 transition-transform">📈</span>
                  <div>
                    <span className="font-medium text-indigo-900 block">Progress Reports</span>
                    <p className="text-sm text-indigo-600">See overall performance</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  )
}

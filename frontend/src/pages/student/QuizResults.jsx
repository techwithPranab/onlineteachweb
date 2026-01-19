import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { quizService, quizEvaluationService } from '../../services/apiServices'
import { useAuthStore } from '../../store/authStore'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import ErrorMessage from '../../components/common/ErrorMessage'
import {
  calculateQuizScore,
  analyzeByTopic,
  analyzeByDifficulty,
  analyzeTimeManagement,
  identifyImprovementAreas,
  generateNextActions,
  storeQuizAttempt
} from '../../utils/quiz'

export default function QuizResults() {
  const { quizId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuthStore()
  
  const [result, setResult] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  
  // Check if coming from submission
  const submissionResult = location.state?.result
  const isAutoSubmit = location.state?.isAutoSubmit

  useEffect(() => {
    fetchResults()
    fetchAnalytics()
  }, [quizId])

  // Enhanced analysis using quiz utilities
  const enhancedAnalysis = useMemo(() => {
    if (!result || !result.session || !result.quiz) return null

    try {
      const { session, quiz, detailedAnswers } = result
      
      // Prepare questions and answers for analysis
      const questions = detailedAnswers || []
      const answers = {}
      
      questions.forEach(q => {
        answers[q.questionId] = q.yourAnswer
      })

      // Calculate comprehensive score
      const scoreAnalysis = calculateQuizScore(questions, answers, result.evaluation)
      
      // Analyze by topic
      const topicAnalysis = analyzeByTopic(questions, answers)
      
      // Analyze by difficulty
      const difficultyAnalysis = analyzeByDifficulty(questions, answers)
      
      // Analyze time management
      const timeAnalysis = analyzeTimeManagement(
        questions,
        session.timeSpent || 0,
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
  if (!result) return null

  const { session, evaluation, detailedAnswers, quiz } = result

  return (
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
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{quiz?.title}</h1>
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
      <div className={`rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 ${session.passed ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 lg:space-x-6">
            <div className={`w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-full flex items-center justify-center flex-shrink-0 ${session.passed ? 'bg-green-500' : 'bg-red-500'}`}>
              <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                {Math.round(session.percentage)}%
              </span>
            </div>
            <div>
              <h2 className={`text-lg sm:text-xl lg:text-2xl font-bold ${session.passed ? 'text-green-800' : 'text-red-800'}`}>
                {session.passed ? '🎉 Congratulations! You Passed!' : '😔 Keep Trying!'}
              </h2>
              <p className={`mt-1 text-sm sm:text-base ${session.passed ? 'text-green-600' : 'text-red-600'}`}>
                Passing percentage: {quiz?.passingPercentage}%
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
                        {typeof answer.yourAnswer === 'object' 
                          ? JSON.stringify(answer.yourAnswer) 
                          : answer.yourAnswer || 'Not answered'}
                      </p>
                    </div>
                    
                    {answer.correctAnswer && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Correct Answer:</h4>
                        <p className="text-green-600">
                          {answer.correctAnswer.options?.map(o => o.text).join(', ') ||
                           answer.correctAnswer.numericalAnswer?.value ||
                           answer.correctAnswer.expectedAnswer ||
                           'N/A'}
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
                    {Math.round(enhancedAnalysis.timeAnalysis.timeUtilization)}%
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
  )
}

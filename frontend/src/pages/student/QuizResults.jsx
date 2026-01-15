import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { quizService, quizEvaluationService } from '../../services/apiServices'
import { useAuthStore } from '../../store/authStore'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import ErrorMessage from '../../components/common/ErrorMessage'

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/student/quizzes')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Quizzes
        </button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{quiz?.title}</h1>
            <p className="mt-1 text-gray-600">Quiz Results</p>
          </div>
          
          {isAutoSubmit && (
            <div className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg">
              Quiz was auto-submitted due to time expiry
            </div>
          )}
        </div>
      </div>

      {/* Result Summary Card */}
      <div className={`rounded-xl p-6 mb-8 ${session.passed ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center ${session.passed ? 'bg-green-500' : 'bg-red-500'}`}>
              <span className="text-3xl font-bold text-white">
                {Math.round(session.percentage)}%
              </span>
            </div>
            <div>
              <h2 className={`text-2xl font-bold ${session.passed ? 'text-green-800' : 'text-red-800'}`}>
                {session.passed ? '🎉 Congratulations! You Passed!' : '😔 Keep Trying!'}
              </h2>
              <p className={`mt-1 ${session.passed ? 'text-green-600' : 'text-red-600'}`}>
                Passing percentage: {quiz?.passingPercentage}%
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-4xl font-bold text-gray-900">
              {session.score} / {session.totalMarks}
            </div>
            {evaluation?.grade && (
              <div className={`text-2xl font-bold ${getGradeColor(evaluation.grade)}`}>
                Grade: {evaluation.grade}
              </div>
            )}
          </div>
        </div>
        
        {session.pendingManualEvaluation && (
          <div className="mt-4 p-3 bg-yellow-100 rounded-lg text-yellow-800">
            ⚠️ Some answers require manual evaluation. Your final score may change.
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {['overview', 'detailed', 'analysis', 'suggestions'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
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
          {/* Topic Analysis */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Topic-wise Performance</h3>
            <div className="space-y-4">
              {evaluation?.topicAnalysis?.map((topic) => (
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
                    <span className="mr-4">Correct: {topic.correctAnswers}</span>
                    <span className="mr-4">Wrong: {topic.wrongAnswers}</span>
                    <span>Unattempted: {topic.unattempted}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Difficulty Analysis */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Difficulty-wise Performance</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {['easy', 'medium', 'hard'].map((level) => {
                const data = evaluation?.difficultyAnalysis?.[level]
                return (
                  <div key={level} className="text-center p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 capitalize mb-2">{level}</h4>
                    <div className="text-3xl font-bold mb-1" style={{
                      color: level === 'easy' ? '#22c55e' : level === 'medium' ? '#eab308' : '#ef4444'
                    }}>
                      {Math.round(data?.accuracy || 0)}%
                    </div>
                    <p className="text-sm text-gray-500">
                      {data?.correct || 0} / {data?.total || 0} correct
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

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
          {/* Weak Areas */}
          {evaluation?.weakAreas?.length > 0 && (
            <div className="bg-red-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-red-800 mb-4">🎯 Areas to Improve</h3>
              <div className="space-y-3">
                {evaluation.weakAreas.map((area, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg">
                    <div>
                      <span className="font-medium text-gray-900">{area.topic}</span>
                      <p className="text-sm text-gray-500">{area.recommendation}</p>
                    </div>
                    <span className="text-red-600 font-bold">{Math.round(area.accuracy)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Strong Areas */}
          {evaluation?.strongAreas?.length > 0 && (
            <div className="bg-green-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-800 mb-4">💪 Your Strengths</h3>
              <div className="flex flex-wrap gap-2">
                {evaluation.strongAreas.map((area, index) => (
                  <span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    {area.topic} ({Math.round(area.accuracy)}%)
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Improvement Suggestions */}
          {evaluation?.improvementSuggestions?.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📚 Recommendations</h3>
              <div className="space-y-4">
                {evaluation.improvementSuggestions.map((suggestion, index) => (
                  <div 
                    key={index}
                    className={`p-4 rounded-lg border-l-4 ${
                      suggestion.priority === 'high' ? 'bg-red-50 border-red-500' :
                      suggestion.priority === 'medium' ? 'bg-yellow-50 border-yellow-500' :
                      'bg-blue-50 border-blue-500'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm font-medium px-2 py-0.5 rounded ${
                        suggestion.priority === 'high' ? 'bg-red-100 text-red-800' :
                        suggestion.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {suggestion.priority} priority
                      </span>
                      <span className="text-sm text-gray-500 capitalize">{suggestion.type.replace('-', ' ')}</span>
                    </div>
                    
                    <p className="text-gray-900 font-medium">{suggestion.message}</p>
                    
                    {suggestion.actionItems && (
                      <ul className="mt-2 space-y-1">
                        {suggestion.actionItems.map((item, i) => (
                          <li key={i} className="flex items-start text-sm text-gray-600">
                            <svg className="w-4 h-4 mr-2 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}
                    
                    {suggestion.recommendedQuizLevel && (
                      <p className="mt-2 text-sm text-gray-600">
                        Recommended next quiz level: <span className="font-medium capitalize">{suggestion.recommendedQuizLevel}</span>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Next Steps */}
          <div className="bg-indigo-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-indigo-800 mb-4">🚀 Next Steps</h3>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/student/quizzes')}
                className="w-full p-3 bg-white border border-indigo-200 rounded-lg text-left hover:bg-indigo-50 transition-colors"
              >
                <span className="font-medium text-indigo-900">Take Another Quiz</span>
                <p className="text-sm text-indigo-600">Practice makes perfect!</p>
              </button>
              <button
                onClick={() => navigate('/student/courses')}
                className="w-full p-3 bg-white border border-indigo-200 rounded-lg text-left hover:bg-indigo-50 transition-colors"
              >
                <span className="font-medium text-indigo-900">Review Course Materials</span>
                <p className="text-sm text-indigo-600">Strengthen your understanding</p>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

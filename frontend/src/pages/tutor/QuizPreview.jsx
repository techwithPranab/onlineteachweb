import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { quizService, questionService } from '../../services/apiServices'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import ErrorMessage from '../../components/common/ErrorMessage'
import Modal from '../../components/common/Modal'

export default function QuizPreview() {
  const { quizId } = useParams()
  const navigate = useNavigate()
  const [quiz, setQuiz] = useState(null)
  const [sampleQuestions, setSampleQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [showAnswers, setShowAnswers] = useState(false)
  const [previewMode, setPreviewMode] = useState('overview') // 'overview' | 'attempt'

  useEffect(() => {
    fetchQuizDetails()
  }, [quizId])

  const fetchQuizDetails = async () => {
    try {
      setLoading(true)
      const response = await quizService.getQuizById(quizId)
      setQuiz(response.quiz)
      
      // Get sample questions that would be selected
      const questionsResponse = await questionService.getQuestions({
        courseId: response.quiz.courseId,
        limit: response.quiz.questionConfig.totalQuestions
      })
      setSampleQuestions(questionsResponse.questions || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load quiz')
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (minutes) => {
    const hrs = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hrs > 0) return `${hrs}h ${mins}m`
    return `${mins} minutes`
  }

  const getDifficultyBadge = (level) => {
    const styles = {
      easy: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      hard: 'bg-red-100 text-red-800'
    }
    return styles[level] || 'bg-gray-100 text-gray-800'
  }

  const getTypeBadge = (type) => {
    const types = {
      'mcq-single': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'MCQ (Single)' },
      'mcq-multiple': { bg: 'bg-purple-100', text: 'text-purple-800', label: 'MCQ (Multiple)' },
      'true-false': { bg: 'bg-green-100', text: 'text-green-800', label: 'True/False' },
      'numerical': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Numerical' },
      'short-answer': { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Short Answer' },
      'long-answer': { bg: 'bg-pink-100', text: 'text-pink-800', label: 'Long Answer' },
      'case-based': { bg: 'bg-indigo-100', text: 'text-indigo-800', label: 'Case Based' }
    }
    const style = types[type] || { bg: 'bg-gray-100', text: 'text-gray-800', label: type }
    return `${style.bg} ${style.text}`
  }

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} />
  if (!quiz) return null

  const currentQuestion = sampleQuestions[currentQuestionIndex]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">{quiz.title}</h1>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                Preview Mode
              </span>
            </div>
            <p className="mt-1 text-gray-600">{quiz.description}</p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => setPreviewMode(previewMode === 'overview' ? 'attempt' : 'overview')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              {previewMode === 'overview' ? 'Try Quiz Flow' : 'Back to Overview'}
            </button>
            <button
              onClick={() => navigate(`/tutor/quizzes/${quizId}/edit`)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Edit Quiz
            </button>
          </div>
        </div>
      </div>

      {previewMode === 'overview' ? (
        /* Overview Mode */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quiz Settings */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Quiz Settings</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium">{formatTime(quiz.duration)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Marks:</span>
                  <span className="font-medium">{quiz.totalMarks}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Passing:</span>
                  <span className="font-medium">{quiz.passingPercentage}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Attempts Allowed:</span>
                  <span className="font-medium">{quiz.attemptsAllowed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Difficulty:</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${getDifficultyBadge(quiz.difficultyLevel)}`}>
                    {quiz.difficultyLevel}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    quiz.status === 'published' ? 'bg-green-100 text-green-800' :
                    quiz.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {quiz.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Quiz Features</h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  {quiz.settings?.shuffleQuestions ? '✅' : '❌'}
                  <span>Shuffle Questions</span>
                </div>
                <div className="flex items-center gap-2">
                  {quiz.settings?.shuffleOptions ? '✅' : '❌'}
                  <span>Shuffle Options</span>
                </div>
                <div className="flex items-center gap-2">
                  {quiz.settings?.negativeMarking ? '✅' : '❌'}
                  <span>Negative Marking</span>
                </div>
                <div className="flex items-center gap-2">
                  {quiz.settings?.showCorrectAnswers ? '✅' : '❌'}
                  <span>Show Correct Answers</span>
                </div>
                <div className="flex items-center gap-2">
                  {quiz.settings?.showExplanations ? '✅' : '❌'}
                  <span>Show Explanations</span>
                </div>
                <div className="flex items-center gap-2">
                  {quiz.settings?.allowReview ? '✅' : '❌'}
                  <span>Allow Review</span>
                </div>
                <div className="flex items-center gap-2">
                  {quiz.settings?.preventTabSwitch ? '✅' : '❌'}
                  <span>Prevent Tab Switch</span>
                </div>
              </div>
            </div>

            {quiz.scheduling?.isScheduled && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Scheduling</h3>
                
                <div className="space-y-3 text-sm">
                  {quiz.scheduling.startTime && (
                    <div>
                      <span className="text-gray-600">Start:</span>
                      <span className="ml-2 font-medium">
                        {new Date(quiz.scheduling.startTime).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {quiz.scheduling.endTime && (
                    <div>
                      <span className="text-gray-600">End:</span>
                      <span className="ml-2 font-medium">
                        {new Date(quiz.scheduling.endTime).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {quiz.scheduling.visibleFrom && (
                    <div>
                      <span className="text-gray-600">Visible From:</span>
                      <span className="ml-2 font-medium">
                        {new Date(quiz.scheduling.visibleFrom).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {quiz.instructions && quiz.instructions.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Instructions</h3>
                <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
                  {quiz.instructions.map((instruction, idx) => (
                    <li key={idx}>{instruction}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Sample Questions */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  Sample Questions ({sampleQuestions.length})
                </h3>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showAnswers}
                    onChange={(e) => setShowAnswers(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <span className="text-sm text-gray-600">Show Answers</span>
                </label>
              </div>
              
              <div className="divide-y max-h-[600px] overflow-y-auto">
                {sampleQuestions.map((question, idx) => (
                  <div key={question._id} className="p-4">
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-800 rounded-full flex items-center justify-center text-sm font-medium">
                        {idx + 1}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-0.5 rounded text-xs ${getTypeBadge(question.type)}`}>
                            {question.type}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs ${getDifficultyBadge(question.difficultyLevel)}`}>
                            {question.difficultyLevel}
                          </span>
                          <span className="text-xs text-gray-500">
                            {question.marks} mark{question.marks !== 1 ? 's' : ''}
                          </span>
                        </div>
                        
                        <p className="text-gray-900 mb-3">{question.text}</p>
                        
                        {/* Options */}
                        {question.options && (
                          <div className="space-y-2 ml-4">
                            {question.options.map((opt, optIdx) => (
                              <div 
                                key={opt._id || optIdx}
                                className={`p-2 rounded text-sm ${
                                  showAnswers && opt.isCorrect 
                                    ? 'bg-green-100 border border-green-300' 
                                    : 'bg-gray-50'
                                }`}
                              >
                                <span className="font-medium mr-2">
                                  {String.fromCharCode(65 + optIdx)}.
                                </span>
                                {opt.text}
                                {showAnswers && opt.isCorrect && (
                                  <span className="ml-2 text-green-600">✓ Correct</span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Numerical Answer */}
                        {showAnswers && question.numericalAnswer && (
                          <div className="mt-2 p-2 bg-green-100 rounded text-sm">
                            <span className="font-medium">Answer:</span> {question.numericalAnswer.value}
                            {question.numericalAnswer.unit && ` ${question.numericalAnswer.unit}`}
                          </div>
                        )}
                        
                        {/* Expected Answer */}
                        {showAnswers && question.expectedAnswer && (
                          <div className="mt-2 p-2 bg-green-100 rounded text-sm">
                            <span className="font-medium">Expected Answer:</span> {question.expectedAnswer}
                          </div>
                        )}
                        
                        {/* Explanation */}
                        {showAnswers && question.explanation && (
                          <div className="mt-2 p-2 bg-yellow-50 rounded text-sm">
                            <span className="font-medium">Explanation:</span> {question.explanation}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Attempt Mode - Simulates student view */
        <div className="bg-white rounded-lg shadow">
          {/* Timer Bar */}
          <div className="bg-indigo-600 text-white p-4 rounded-t-lg flex justify-between items-center">
            <span className="font-medium">Quiz Preview - Student View</span>
            <span className="text-lg font-mono">
              {formatTime(quiz.duration)} (Preview)
            </span>
          </div>
          
          {/* Question Display */}
          {currentQuestion ? (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-medium">
                    Question {currentQuestionIndex + 1} of {sampleQuestions.length}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs ${getDifficultyBadge(currentQuestion.difficultyLevel)}`}>
                    {currentQuestion.difficultyLevel}
                  </span>
                </div>
                <span className="text-gray-600">
                  {currentQuestion.marks} mark{currentQuestion.marks !== 1 ? 's' : ''}
                </span>
              </div>
              
              <div className="mb-6">
                <p className="text-lg text-gray-900">{currentQuestion.text}</p>
              </div>
              
              {/* Options */}
              {currentQuestion.options && (
                <div className="space-y-3">
                  {currentQuestion.options.map((opt, idx) => (
                    <button
                      key={opt._id || idx}
                      className="w-full text-left p-4 rounded-lg border hover:bg-gray-50 transition-colors"
                    >
                      <span className="font-medium mr-3">
                        {String.fromCharCode(65 + idx)}.
                      </span>
                      {opt.text}
                    </button>
                  ))}
                </div>
              )}
              
              {/* Navigation */}
              <div className="mt-8 flex justify-between">
                <button
                  onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                  disabled={currentQuestionIndex === 0}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
                >
                  Previous
                </button>
                
                <button
                  onClick={() => setCurrentQuestionIndex(Math.min(sampleQuestions.length - 1, currentQuestionIndex + 1))}
                  disabled={currentQuestionIndex === sampleQuestions.length - 1}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              No sample questions available
            </div>
          )}
          
          {/* Question Navigator */}
          <div className="border-t p-4">
            <div className="flex flex-wrap gap-2">
              {sampleQuestions.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`w-10 h-10 rounded-lg text-sm font-medium ${
                    idx === currentQuestionIndex
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

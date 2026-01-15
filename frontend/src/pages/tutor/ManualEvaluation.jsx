import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { quizEvaluationService, quizService } from '../../services/apiServices'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import ErrorMessage from '../../components/common/ErrorMessage'
import EmptyState from '../../components/common/EmptyState'

export default function ManualEvaluation() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  
  // If sessionId is provided, show evaluation form, otherwise show pending list
  if (sessionId) {
    return <EvaluationForm sessionId={sessionId} />
  }
  
  return <PendingEvaluations />
}

// Pending Evaluations List
function PendingEvaluations() {
  const navigate = useNavigate()
  const [pendingSessions, setPendingSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchPendingEvaluations()
  }, [])

  const fetchPendingEvaluations = async () => {
    try {
      setLoading(true)
      const response = await quizEvaluationService.getPendingEvaluations()
      setPendingSessions(response.sessions || [])
    } catch (err) {
      setError('Failed to load pending evaluations')
    } finally {
      setLoading(false)
    }
  }

  const filteredSessions = pendingSessions.filter(session => {
    if (filter === 'all') return true
    return session.quizId?.courseId?._id === filter
  })

  const courses = [...new Set(pendingSessions.map(s => s.quizId?.courseId).filter(Boolean))]

  if (loading) return <LoadingSpinner />

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manual Evaluation</h1>
          <p className="mt-2 text-gray-600">Review and grade subjective answers</p>
        </div>
        <button
          onClick={() => navigate('/tutor/quizzes')}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Back to Quizzes
        </button>
      </div>

      {error && <ErrorMessage message={error} />}

      {/* Filter by course */}
      {courses.length > 0 && (
        <div className="mb-6">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2"
          >
            <option value="all">All Courses</option>
            {courses.map(course => (
              <option key={course._id} value={course._id}>{course.title}</option>
            ))}
          </select>
        </div>
      )}

      {filteredSessions.length === 0 ? (
        <EmptyState
          title="No pending evaluations"
          message="All quiz submissions have been evaluated"
        />
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quiz
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Course
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pending Questions
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSessions.map((session) => (
                <tr key={session._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                          <span className="text-indigo-600 font-medium">
                            {session.studentId?.name?.charAt(0) || 'S'}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {session.studentId?.name || 'Unknown Student'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {session.studentId?.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{session.quizId?.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{session.quizId?.courseId?.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {new Date(session.submittedAt).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      {session.pendingCount || 0} questions
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => navigate(`/tutor/evaluate/${session._id}`)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Evaluate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// Evaluation Form
function EvaluationForm({ sessionId }) {
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [evaluations, setEvaluations] = useState({})
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [overallFeedback, setOverallFeedback] = useState('')

  useEffect(() => {
    fetchSession()
  }, [sessionId])

  const fetchSession = async () => {
    try {
      setLoading(true)
      const response = await quizEvaluationService.getSessionForEvaluation(sessionId)
      setSession(response.session)
      
      // Initialize evaluations for subjective questions
      const initialEvals = {}
      response.session.selectedQuestions?.forEach((q, idx) => {
        if (needsManualEvaluation(q.questionSnapshot?.type)) {
          const answer = response.session.answers?.find(a => a.questionId?.toString() === q.questionId?.toString())
          initialEvals[q.questionId] = {
            marksAwarded: answer?.marksAwarded || 0,
            feedback: answer?.evaluationFeedback || ''
          }
        }
      })
      setEvaluations(initialEvals)
    } catch (err) {
      setError('Failed to load session for evaluation')
    } finally {
      setLoading(false)
    }
  }

  const needsManualEvaluation = (type) => {
    return ['short-answer', 'long-answer', 'case-based'].includes(type)
  }

  const handleEvaluationChange = (questionId, field, value) => {
    setEvaluations(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [field]: value
      }
    }))
  }

  const handleSubmit = async () => {
    try {
      setSubmitting(true)
      setError(null)
      
      const evaluationData = Object.entries(evaluations).map(([questionId, eval_]) => ({
        questionId,
        marksAwarded: parseFloat(eval_.marksAwarded) || 0,
        feedback: eval_.feedback
      }))
      
      await quizEvaluationService.submitManualEvaluation(sessionId, {
        evaluations: evaluationData,
        overallFeedback
      })
      
      navigate('/tutor/evaluate', { 
        state: { message: 'Evaluation submitted successfully' }
      })
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit evaluation')
    } finally {
      setSubmitting(false)
    }
  }

  const getSubjectiveQuestions = () => {
    return session?.selectedQuestions?.filter(q => 
      needsManualEvaluation(q.questionSnapshot?.type)
    ) || []
  }

  if (loading) return <LoadingSpinner />
  if (!session) return <ErrorMessage message="Session not found" />

  const subjectiveQuestions = getSubjectiveQuestions()
  const currentQuestion = subjectiveQuestions[currentQuestionIndex]

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manual Evaluation</h1>
          <p className="mt-2 text-gray-600">
            {session.quizId?.title} • {session.studentId?.name}
          </p>
        </div>
        <button
          onClick={() => navigate('/tutor/evaluate')}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Back to List
        </button>
      </div>

      {error && <ErrorMessage message={error} />}

      {/* Quiz Info */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Student:</span>
            <p className="font-medium">{session.studentId?.name}</p>
          </div>
          <div>
            <span className="text-gray-500">Submitted:</span>
            <p className="font-medium">{new Date(session.submittedAt).toLocaleString()}</p>
          </div>
          <div>
            <span className="text-gray-500">Auto Score:</span>
            <p className="font-medium">{session.autoScore || 0} marks</p>
          </div>
          <div>
            <span className="text-gray-500">Questions to Evaluate:</span>
            <p className="font-medium">{subjectiveQuestions.length}</p>
          </div>
        </div>
      </div>

      {subjectiveQuestions.length === 0 ? (
        <EmptyState
          title="No subjective questions"
          message="All questions in this quiz were auto-graded"
        />
      ) : (
        <>
          {/* Question Navigation */}
          <div className="flex items-center justify-center mb-6 space-x-2">
            {subjectiveQuestions.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentQuestionIndex(idx)}
                className={`w-10 h-10 rounded-full font-medium transition-colors ${
                  idx === currentQuestionIndex
                    ? 'bg-indigo-600 text-white'
                    : evaluations[subjectiveQuestions[idx]?.questionId]?.marksAwarded > 0
                    ? 'bg-green-100 text-green-800 border-2 border-green-500'
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          {/* Current Question Evaluation */}
          {currentQuestion && (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
                  Question {currentQuestionIndex + 1} of {subjectiveQuestions.length}
                </span>
                <span className="text-sm text-gray-500">
                  Max Marks: {currentQuestion.questionSnapshot?.marks}
                </span>
              </div>

              {/* Question */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Question</h3>
                {currentQuestion.questionSnapshot?.caseStudy && (
                  <div className="bg-gray-50 p-4 rounded-lg mb-3 text-sm">
                    <strong>Case Study:</strong>
                    <p className="mt-1">{currentQuestion.questionSnapshot.caseStudy}</p>
                  </div>
                )}
                <p className="text-gray-700">{currentQuestion.questionSnapshot?.text}</p>
              </div>

              {/* Expected Answer */}
              {currentQuestion.questionSnapshot?.expectedAnswer && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Expected Answer (Reference)</h3>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-green-800">{currentQuestion.questionSnapshot.expectedAnswer}</p>
                    {currentQuestion.questionSnapshot?.keywords?.length > 0 && (
                      <div className="mt-2">
                        <span className="text-sm text-green-700">Keywords: </span>
                        {currentQuestion.questionSnapshot.keywords.map((kw, i) => (
                          <span key={i} className="inline-block bg-green-200 text-green-800 text-xs px-2 py-1 rounded mr-1">
                            {kw}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Student's Answer */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Student's Answer</h3>
                {(() => {
                  const answer = session.answers?.find(a => 
                    a.questionId?.toString() === currentQuestion.questionId?.toString()
                  )
                  return answer?.textAnswer ? (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-gray-800 whitespace-pre-wrap">{answer.textAnswer}</p>
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No answer provided</p>
                  )
                })()}
              </div>

              {/* Evaluation */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Your Evaluation</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Marks Awarded (Max: {currentQuestion.questionSnapshot?.marks})
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={currentQuestion.questionSnapshot?.marks || 10}
                      step={0.5}
                      value={evaluations[currentQuestion.questionId]?.marksAwarded || 0}
                      onChange={(e) => handleEvaluationChange(
                        currentQuestion.questionId, 
                        'marksAwarded', 
                        Math.min(parseFloat(e.target.value), currentQuestion.questionSnapshot?.marks || 10)
                      )}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Feedback for Student
                    </label>
                    <textarea
                      value={evaluations[currentQuestion.questionId]?.feedback || ''}
                      onChange={(e) => handleEvaluationChange(
                        currentQuestion.questionId,
                        'feedback',
                        e.target.value
                      )}
                      rows={3}
                      placeholder="Provide feedback for the student's answer..."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
              disabled={currentQuestionIndex === 0}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentQuestionIndex(Math.min(subjectiveQuestions.length - 1, currentQuestionIndex + 1))}
              disabled={currentQuestionIndex === subjectiveQuestions.length - 1}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>

          {/* Overall Feedback & Submit */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Overall Feedback</h3>
            <textarea
              value={overallFeedback}
              onChange={(e) => setOverallFeedback(e.target.value)}
              rows={4}
              placeholder="Provide overall feedback for the student's performance..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4"
            />

            {/* Summary */}
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <h4 className="font-medium text-gray-900 mb-2">Evaluation Summary</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Auto Score:</span>
                  <p className="font-medium">{session.autoScore || 0}</p>
                </div>
                <div>
                  <span className="text-gray-500">Manual Score:</span>
                  <p className="font-medium">
                    {Object.values(evaluations).reduce((sum, e) => sum + (parseFloat(e.marksAwarded) || 0), 0)}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Total Score:</span>
                  <p className="font-bold text-indigo-600">
                    {(session.autoScore || 0) + Object.values(evaluations).reduce((sum, e) => sum + (parseFloat(e.marksAwarded) || 0), 0)}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => navigate('/tutor/evaluate')}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Save & Exit
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Evaluation'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import aiQuestionService from '../../services/aiQuestionService'
import { courseService } from '../../services/apiServices'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import ErrorMessage from '../../components/common/ErrorMessage'
import EmptyState from '../../components/common/EmptyState'
import Modal from '../../components/common/Modal'
import ConfirmDialog from '../../components/common/ConfirmDialog'

export default function AIQuestionReview() {
  const navigate = useNavigate()
  const [drafts, setDrafts] = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  
  // Filters
  const [filters, setFilters] = useState({
    courseId: '',
    status: 'draft'
  })
  
  // Selection
  const [selectedDrafts, setSelectedDrafts] = useState([])
  
  // Modals
  const [viewDraft, setViewDraft] = useState(null)
  const [editDraft, setEditDraft] = useState(null)
  const [showRejectModal, setShowRejectModal] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [showBulkRejectModal, setShowBulkRejectModal] = useState(false)
  const [bulkRejectReason, setBulkRejectReason] = useState('')
  
  // Stats
  const [stats, setStats] = useState(null)

  useEffect(() => {
    fetchCourses()
    fetchStats()
  }, [])

  useEffect(() => {
    fetchDrafts()
  }, [filters])

  const fetchCourses = async () => {
    try {
      const response = await courseService.getCourses()
      setCourses(response.courses || [])
    } catch (err) {
      console.error('Failed to load courses:', err)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await aiQuestionService.getStatistics(filters.courseId || undefined)
      setStats(response.stats)
    } catch (err) {
      console.error('Failed to load stats:', err)
    }
  }

  const fetchDrafts = async (page = 1) => {
    try {
      setLoading(true)
      const params = {
        page,
        limit: 20,
        ...filters
      }
      Object.keys(params).forEach(key => {
        if (params[key] === '') delete params[key]
      })
      
      const response = await aiQuestionService.getDrafts(params)
      setDrafts(response.drafts || [])
      setPagination(response.pagination || { page: 1, pages: 1, total: 0 })
      setSelectedDrafts([])
    } catch (err) {
      setError('Failed to load drafts')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (draftId, edits = null) => {
    try {
      await aiQuestionService.approveDraft(draftId, edits)
      setSuccess('Draft approved and added to question bank!')
      setViewDraft(null)
      setEditDraft(null)
      fetchDrafts(pagination.page)
      fetchStats()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve draft')
    }
  }

  const handleReject = async () => {
    if (!showRejectModal || !rejectReason.trim()) return
    
    try {
      await aiQuestionService.rejectDraft(showRejectModal, rejectReason)
      setSuccess('Draft rejected')
      setShowRejectModal(null)
      setRejectReason('')
      fetchDrafts(pagination.page)
      fetchStats()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject draft')
    }
  }

  const handleBulkApprove = async () => {
    if (selectedDrafts.length === 0) return
    
    try {
      const result = await aiQuestionService.bulkApprove(selectedDrafts)
      setSuccess(`Approved ${result.approved.length} drafts!`)
      setSelectedDrafts([])
      fetchDrafts(pagination.page)
      fetchStats()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to bulk approve')
    }
  }

  const handleBulkReject = async () => {
    if (selectedDrafts.length === 0 || !bulkRejectReason.trim()) return
    
    try {
      const result = await aiQuestionService.bulkReject(selectedDrafts, bulkRejectReason)
      setSuccess(`Rejected ${result.rejected.length} drafts`)
      setSelectedDrafts([])
      setBulkRejectReason('')
      setShowBulkRejectModal(false)
      fetchDrafts(pagination.page)
      fetchStats()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to bulk reject')
    }
  }

  const toggleSelectAll = () => {
    if (selectedDrafts.length === drafts.length) {
      setSelectedDrafts([])
    } else {
      setSelectedDrafts(drafts.map(d => d._id))
    }
  }

  const toggleSelect = (draftId) => {
    setSelectedDrafts(prev =>
      prev.includes(draftId)
        ? prev.filter(id => id !== draftId)
        : [...prev, draftId]
    )
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
      'mcq-single': 'bg-blue-100 text-blue-800',
      'mcq-multiple': 'bg-purple-100 text-purple-800',
      'true-false': 'bg-green-100 text-green-800',
      'numerical': 'bg-yellow-100 text-yellow-800',
      'short-answer': 'bg-orange-100 text-orange-800',
      'long-answer': 'bg-pink-100 text-pink-800',
      'case-based': 'bg-indigo-100 text-indigo-800'
    }
    return types[type] || 'bg-gray-100 text-gray-800'
  }

  const getStatusBadge = (status) => {
    const styles = {
      draft: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    }
    return styles[status] || 'bg-gray-100 text-gray-800'
  }

  const getConfidenceColor = (score) => {
    if (score >= 0.8) return 'text-green-600'
    if (score >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            📋 AI Question Review
          </h1>
          <p className="text-gray-600">Review and approve AI-generated questions</p>
        </div>
        <button
          onClick={() => navigate('/tutor/ai-questions/generate')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          + Generate New Questions
        </button>
      </div>

      {error && <ErrorMessage message={error} onClose={() => setError(null)} />}
      
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 flex items-center justify-between">
          <span>{success}</span>
          <button onClick={() => setSuccess(null)} className="text-green-600 hover:text-green-800">✕</button>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-2xl font-bold text-blue-600">{stats.totalDrafts}</div>
            <div className="text-sm text-gray-600">Total Drafts</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-2xl font-bold text-yellow-600">{stats.approvalRate?.pending || 0}</div>
            <div className="text-sm text-gray-600">Pending Review</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-2xl font-bold text-green-600">{stats.approvalRate?.approved || 0}</div>
            <div className="text-sm text-gray-600">Approved</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-2xl font-bold text-purple-600">{stats.approvalRate?.approvalRate?.toFixed(1) || 0}%</div>
            <div className="text-sm text-gray-600">Approval Rate</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-wrap gap-4">
          <select
            value={filters.courseId}
            onChange={(e) => setFilters(prev => ({ ...prev, courseId: e.target.value }))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Courses</option>
            {courses.map(course => (
              <option key={course._id} value={course._id}>{course.title}</option>
            ))}
          </select>
          
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="draft">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedDrafts.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-4 flex items-center justify-between">
          <span className="font-medium text-blue-800">
            {selectedDrafts.length} draft(s) selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleBulkApprove}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
            >
              ✓ Approve All
            </button>
            <button
              onClick={() => setShowBulkRejectModal(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
            >
              ✕ Reject All
            </button>
            <button
              onClick={() => setSelectedDrafts([])}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Drafts List */}
      {loading ? (
        <LoadingSpinner />
      ) : drafts.length === 0 ? (
        <EmptyState 
          title="No drafts found" 
          message="Generate some questions to get started"
          action={
            <button
              onClick={() => navigate('/tutor/ai-questions/generate')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Generate Questions
            </button>
          }
        />
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedDrafts.length === drafts.length}
                    onChange={toggleSelectAll}
                    className="rounded text-blue-600"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Question</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Topic</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Difficulty</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Confidence</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {drafts.map(draft => (
                <tr key={draft._id} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedDrafts.includes(draft._id)}
                      onChange={() => toggleSelect(draft._id)}
                      className="rounded text-blue-600"
                    />
                  </td>
                  <td className="px-4 py-4">
                    <div 
                      className="text-sm text-gray-900 max-w-md truncate cursor-pointer hover:text-blue-600"
                      onClick={() => setViewDraft(draft)}
                    >
                      {draft.questionPayload?.text || 'No text'}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {draft.courseId?.title || 'Unknown Course'}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">{draft.topic}</td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeBadge(draft.type)}`}>
                      {draft.type}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyBadge(draft.difficultyLevel)}`}>
                      {draft.difficultyLevel}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`font-medium ${getConfidenceColor(draft.confidenceScore)}`}>
                      {(draft.confidenceScore * 100).toFixed(0)}%
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(draft.status)}`}>
                      {draft.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right space-x-2">
                    {draft.status === 'draft' && (
                      <>
                        <button
                          onClick={() => handleApprove(draft._id)}
                          className="text-green-600 hover:text-green-800 text-sm font-medium"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => setEditDraft(draft)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setShowRejectModal(draft._id)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setViewDraft(draft)}
                      className="text-gray-600 hover:text-gray-800 text-sm"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="px-4 py-3 bg-gray-50 border-t flex items-center justify-between">
              <span className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.pages} ({pagination.total} total)
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchDrafts(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => fetchDrafts(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* View Draft Modal */}
      {viewDraft && (
        <Modal
          isOpen={!!viewDraft}
          onClose={() => setViewDraft(null)}
          title="Question Preview"
          size="lg"
        >
          <QuestionPreview 
            draft={viewDraft} 
            onApprove={() => handleApprove(viewDraft._id)}
            onEdit={() => {
              setEditDraft(viewDraft)
              setViewDraft(null)
            }}
            onReject={() => {
              setShowRejectModal(viewDraft._id)
              setViewDraft(null)
            }}
          />
        </Modal>
      )}

      {/* Edit Draft Modal */}
      {editDraft && (
        <Modal
          isOpen={!!editDraft}
          onClose={() => setEditDraft(null)}
          title="Edit Question"
          size="lg"
        >
          <QuestionEditor
            draft={editDraft}
            onSave={(edits) => handleApprove(editDraft._id, edits)}
            onCancel={() => setEditDraft(null)}
          />
        </Modal>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <Modal
          isOpen={!!showRejectModal}
          onClose={() => {
            setShowRejectModal(null)
            setRejectReason('')
          }}
          title="Reject Question"
        >
          <div className="space-y-4">
            <p className="text-gray-600">Please provide a reason for rejection:</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Reason for rejection..."
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowRejectModal(null)
                  setRejectReason('')
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Bulk Reject Modal */}
      {showBulkRejectModal && (
        <Modal
          isOpen={showBulkRejectModal}
          onClose={() => {
            setShowBulkRejectModal(false)
            setBulkRejectReason('')
          }}
          title={`Reject ${selectedDrafts.length} Questions`}
        >
          <div className="space-y-4">
            <p className="text-gray-600">Please provide a reason for rejecting all selected questions:</p>
            <textarea
              value={bulkRejectReason}
              onChange={(e) => setBulkRejectReason(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Reason for rejection..."
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowBulkRejectModal(false)
                  setBulkRejectReason('')
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkReject}
                disabled={!bulkRejectReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                Reject All
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

// Question Preview Component
function QuestionPreview({ draft, onApprove, onEdit, onReject }) {
  const question = draft.questionPayload

  const getDifficultyBadge = (level) => {
    const styles = {
      easy: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      hard: 'bg-red-100 text-red-800'
    }
    return styles[level] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-6">
      {/* Question Text */}
      <div>
        <h4 className="font-medium text-gray-700 mb-2">Question</h4>
        <p className="text-gray-900 bg-gray-50 p-4 rounded-lg">{question.text}</p>
      </div>

      {/* Case Study */}
      {question.caseStudy && (
        <div>
          <h4 className="font-medium text-gray-700 mb-2">Case Study</h4>
          <p className="text-gray-900 bg-blue-50 p-4 rounded-lg">{question.caseStudy}</p>
        </div>
      )}

      {/* Options */}
      {question.options && question.options.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-700 mb-2">Options</h4>
          <div className="space-y-2">
            {question.options.map((opt, idx) => (
              <div 
                key={idx}
                className={`p-3 rounded-lg border ${
                  opt.isCorrect 
                    ? 'bg-green-50 border-green-300' 
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-500">{String.fromCharCode(65 + idx)}.</span>
                  {opt.isCorrect && <span className="text-green-600 font-bold">✓</span>}
                  <span className={opt.isCorrect ? 'font-medium text-green-800' : ''}>{opt.text}</span>
                  {opt.isCorrect && <span className="ml-2 px-2 py-0.5 bg-green-500 text-white text-xs rounded-full">Correct Answer</span>}
                </div>
                {opt.explanation && (
                  <p className="text-sm text-gray-500 mt-1 ml-8">{opt.explanation}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Correct Answer Summary */}
      {question.correctAnswer && (
        <div className="bg-green-100 border border-green-300 rounded-lg p-4">
          <h4 className="font-medium text-green-800 mb-1">✓ Correct Answer</h4>
          <p className="text-green-900 font-medium">{question.correctAnswer}</p>
        </div>
      )}

      {/* Numerical Answer */}
      {question.numericalAnswer && (
        <div className="bg-green-100 border border-green-300 rounded-lg p-4">
          <h4 className="font-medium text-green-800 mb-1">✓ Correct Answer</h4>
          <p className="text-green-900 font-medium text-lg">
            {question.numericalAnswer.value} 
            {question.numericalAnswer.unit && ` ${question.numericalAnswer.unit}`}
            {question.numericalAnswer.tolerance > 0 && (
              <span className="text-sm text-green-700"> (±{question.numericalAnswer.tolerance})</span>
            )}
          </p>
          {question.solutionSteps && question.solutionSteps.length > 0 && (
            <div className="mt-3 pt-3 border-t border-green-300">
              <h5 className="font-medium text-green-800 mb-2">Solution Steps:</h5>
              <ol className="list-decimal list-inside text-sm text-green-900 space-y-1">
                {question.solutionSteps.map((step, idx) => (
                  <li key={idx}>{step}</li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}

      {/* Expected Answer (Short/Long Answer) */}
      {question.expectedAnswer && (
        <div className="bg-green-100 border border-green-300 rounded-lg p-4">
          <h4 className="font-medium text-green-800 mb-1">✓ Model Answer</h4>
          <p className="text-green-900">{question.expectedAnswer}</p>
          {question.sampleAnswer && question.sampleAnswer !== question.expectedAnswer && (
            <div className="mt-3 pt-3 border-t border-green-300">
              <h5 className="font-medium text-green-800 mb-1">Sample Full Answer:</h5>
              <p className="text-sm text-green-800">{question.sampleAnswer}</p>
            </div>
          )}
          {question.keywords && question.keywords.length > 0 && (
            <div className="mt-3 pt-3 border-t border-green-300">
              <h5 className="font-medium text-green-800 mb-2">Required Keywords:</h5>
              <div className="flex flex-wrap gap-2">
                {question.keywords.map((kw, idx) => (
                  <span key={idx} className="px-2 py-1 bg-green-200 text-green-800 text-sm rounded">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Explanation */}
      {question.explanation && (
        <div>
          <h4 className="font-medium text-gray-700 mb-2">Explanation</h4>
          <p className="text-gray-900 bg-yellow-50 p-4 rounded-lg">{question.explanation}</p>
        </div>
      )}

      {/* Metadata */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <span className="text-gray-500">Difficulty:</span>
          <span className={`ml-2 px-2 py-1 rounded-full text-xs ${getDifficultyBadge(question.difficultyLevel)}`}>
            {question.difficultyLevel}
          </span>
        </div>
        <div>
          <span className="text-gray-500">Marks:</span>
          <span className="ml-2 font-medium">{question.marks}</span>
        </div>
        <div>
          <span className="text-gray-500">Negative:</span>
          <span className="ml-2 font-medium">{question.negativeMarks || 0}</span>
        </div>
        <div>
          <span className="text-gray-500">Time:</span>
          <span className="ml-2 font-medium">{question.recommendedTime || 60}s</span>
        </div>
      </div>

      {/* AI Metadata */}
      <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600">
        <div><strong>Model:</strong> {draft.modelUsed}</div>
        <div><strong>Confidence:</strong> {(draft.confidenceScore * 100).toFixed(0)}%</div>
        <div><strong>Generated:</strong> {new Date(draft.createdAt).toLocaleString()}</div>
      </div>

      {/* Actions */}
      {draft.status === 'draft' && (
        <div className="flex gap-3 pt-4 border-t">
          <button
            onClick={onApprove}
            className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
          >
            ✓ Approve
          </button>
          <button
            onClick={onEdit}
            className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            ✎ Edit & Approve
          </button>
          <button
            onClick={onReject}
            className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
          >
            ✕ Reject
          </button>
        </div>
      )}
    </div>
  )
}

// Question Editor Component
function QuestionEditor({ draft, onSave, onCancel }) {
  const [formData, setFormData] = useState({ ...draft.questionPayload })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleOptionChange = (idx, field, value) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => 
        i === idx ? { ...opt, [field]: value } : opt
      )
    }))
  }

  const handleSubmit = () => {
    onSave(formData)
  }

  return (
    <div className="space-y-6">
      {/* Question Text */}
      <div>
        <label className="block font-medium text-gray-700 mb-2">Question Text</label>
        <textarea
          name="text"
          value={formData.text}
          onChange={handleChange}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          rows={3}
        />
      </div>

      {/* Case Study */}
      {formData.caseStudy !== undefined && (
        <div>
          <label className="block font-medium text-gray-700 mb-2">Case Study</label>
          <textarea
            name="caseStudy"
            value={formData.caseStudy}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            rows={4}
          />
        </div>
      )}

      {/* Options */}
      {formData.options && formData.options.length > 0 && (
        <div>
          <label className="block font-medium text-gray-700 mb-2">Options</label>
          <div className="space-y-3">
            {formData.options.map((opt, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  checked={opt.isCorrect}
                  onChange={(e) => handleOptionChange(idx, 'isCorrect', e.target.checked)}
                  className="mt-2 rounded text-green-600"
                />
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={opt.text}
                    onChange={(e) => handleOptionChange(idx, 'text', e.target.value)}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                    placeholder="Option text"
                  />
                  <input
                    type="text"
                    value={opt.explanation || ''}
                    onChange={(e) => handleOptionChange(idx, 'explanation', e.target.value)}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="Explanation (optional)"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Explanation */}
      <div>
        <label className="block font-medium text-gray-700 mb-2">Explanation</label>
        <textarea
          name="explanation"
          value={formData.explanation}
          onChange={handleChange}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          rows={3}
        />
      </div>

      {/* Marks */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block font-medium text-gray-700 mb-2">Marks</label>
          <input
            type="number"
            name="marks"
            value={formData.marks}
            onChange={handleChange}
            min="0"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block font-medium text-gray-700 mb-2">Negative Marks</label>
          <input
            type="number"
            name="negativeMarks"
            value={formData.negativeMarks}
            onChange={handleChange}
            min="0"
            step="0.5"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t">
        <button
          onClick={handleSubmit}
          className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
        >
          Save & Approve
        </button>
        <button
          onClick={onCancel}
          className="flex-1 py-2 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

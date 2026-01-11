import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { UserCheck, UserX, Eye, Search, Filter, CheckCircle2, XCircle, Clock, FileText, Award } from 'lucide-react'
import { adminService } from '@/services/apiServices'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import ErrorMessage from '@/components/common/ErrorMessage'
import Modal from '@/components/common/Modal'
import ConfirmDialog from '@/components/common/ConfirmDialog'

export default function TutorApproval() {
  const queryClient = useQueryClient()

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('pending')
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [selectedTutor, setSelectedTutor] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [selectedTutors, setSelectedTutors] = useState([])

  // Fetch pending tutors
  const { data: tutorsData, isLoading, error, refetch } = useQuery(
    ['pendingTutors', statusFilter],
    () => adminService.getPendingTutors({ status: statusFilter })
  )

  // Approve tutor mutation
  const approveMutation = useMutation(
    (tutorId) => adminService.approveTutor(tutorId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('pendingTutors')
        setShowApproveDialog(false)
        setSelectedTutor(null)
      },
    }
  )

  // Reject tutor mutation
  const rejectMutation = useMutation(
    ({ tutorId, reason }) => adminService.rejectTutor(tutorId, reason),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('pendingTutors')
        setShowRejectDialog(false)
        setSelectedTutor(null)
        setRejectionReason('')
      },
    }
  )

  // Bulk approve mutation
  const bulkApproveMutation = useMutation(
    (tutorIds) => adminService.bulkApproveTutors(tutorIds),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('pendingTutors')
        setSelectedTutors([])
      },
    }
  )

  // Bulk reject mutation
  const bulkRejectMutation = useMutation(
    ({ tutorIds, reason }) => adminService.bulkRejectTutors(tutorIds, reason),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('pendingTutors')
        setSelectedTutors([])
        setRejectionReason('')
      },
    }
  )

  const tutors = tutorsData?.data || []

  const handleViewDetails = (tutor) => {
    setSelectedTutor(tutor)
    setShowDetailsModal(true)
  }

  const handleApproveClick = (tutor) => {
    setSelectedTutor(tutor)
    setShowApproveDialog(true)
  }

  const handleRejectClick = (tutor) => {
    setSelectedTutor(tutor)
    setShowRejectDialog(true)
  }

  const confirmApprove = () => {
    approveMutation.mutate(selectedTutor._id)
  }

  const confirmReject = () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection')
      return
    }
    rejectMutation.mutate({
      tutorId: selectedTutor._id,
      reason: rejectionReason,
    })
  }

  const handleBulkApprove = () => {
    if (selectedTutors.length === 0) return
    bulkApproveMutation.mutate(selectedTutors)
  }

  const handleBulkReject = () => {
    if (selectedTutors.length === 0) return
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection')
      return
    }
    bulkRejectMutation.mutate({
      tutorIds: selectedTutors,
      reason: rejectionReason,
    })
  }

  const toggleTutorSelection = (tutorId) => {
    setSelectedTutors((prev) =>
      prev.includes(tutorId)
        ? prev.filter((id) => id !== tutorId)
        : [...prev, tutorId]
    )
  }

  const toggleAllTutors = () => {
    if (selectedTutors.length === filteredTutors.length) {
      setSelectedTutors([])
    } else {
      setSelectedTutors(filteredTutors.map((t) => t._id))
    }
  }

  const filteredTutors = tutors.filter((tutor) =>
    tutor.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tutor.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tutor.qualifications?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Pending
        </span>
      case 'approved':
        return <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" />
          Approved
        </span>
      case 'rejected':
        return <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 flex items-center gap-1">
          <XCircle className="w-3 h-3" />
          Rejected
        </span>
      default:
        return null
    }
  }

  if (isLoading) return <LoadingSpinner fullScreen />
  if (error) return <ErrorMessage message={error.message || 'Failed to load tutors'} onRetry={refetch} />

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Tutor Approval</h1>
        <p className="text-gray-600">Review and approve tutor applications</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="card">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 mb-1">Pending Review</p>
                <p className="text-xl font-bold text-yellow-600">
                  {tutors.filter(t => t.status === 'pending').length}
                </p>
              </div>
              <div className="p-2 bg-yellow-100 text-yellow-600 rounded-lg">
                <Clock className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 mb-1">Approved</p>
                <p className="text-xl font-bold text-green-600">
                  {tutors.filter(t => t.status === 'approved').length}
                </p>
              </div>
              <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 mb-1">Rejected</p>
                <p className="text-xl font-bold text-red-600">
                  {tutors.filter(t => t.status === 'rejected').length}
                </p>
              </div>
              <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                <XCircle className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tutors..."
                className="input-field w-full pl-10"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setSelectedTutors([])
              }}
              className="input-field"
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="">All Status</option>
            </select>
          </div>

          {selectedTutors.length > 0 && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleBulkApprove}
                disabled={bulkApproveMutation.isLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Approve {selectedTutors.length}
              </button>
              <button
                onClick={handleBulkReject}
                disabled={bulkRejectMutation.isLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Reject {selectedTutors.length}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tutors Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedTutors.length === filteredTutors.length && filteredTutors.length > 0}
                    onChange={toggleAllTutors}
                    className="rounded text-primary-600"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tutor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Qualifications
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Applied On
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTutors.length > 0 ? (
                filteredTutors.map((tutor) => (
                  <tr key={tutor._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedTutors.includes(tutor._id)}
                        onChange={() => toggleTutorSelection(tutor._id)}
                        className="rounded text-primary-600"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-medium">
                          {tutor.name?.charAt(0) || 'T'}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{tutor.name || 'Unknown'}</div>
                          {tutor.expertise && (
                            <div className="text-xs text-gray-500">{tutor.expertise.join(', ')}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {tutor.email}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs line-clamp-2">
                        {tutor.qualifications || 'Not provided'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(tutor.createdAt || Date.now()).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(tutor.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewDetails(tutor)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {tutor.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApproveClick(tutor)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                              title="Approve"
                            >
                              <UserCheck className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRejectClick(tutor)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              title="Reject"
                            >
                              <UserX className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="text-gray-400">
                      <UserCheck className="w-12 h-12 mx-auto mb-3" />
                      <p className="text-sm">No tutors found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tutor Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false)
          setSelectedTutor(null)
        }}
        title="Tutor Application Details"
        size="lg"
      >
        {selectedTutor && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-16 h-16 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-medium text-2xl">
                {selectedTutor.name?.charAt(0) || 'T'}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{selectedTutor.name}</h3>
                <p className="text-sm text-gray-600">{selectedTutor.email}</p>
              </div>
              {getStatusBadge(selectedTutor.status)}
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Phone</label>
                <p className="text-gray-900">{selectedTutor.phone || 'Not provided'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Applied On</label>
                <p className="text-gray-900">
                  {new Date(selectedTutor.createdAt || Date.now()).toLocaleDateString()}
                </p>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-500 mb-1">Expertise Areas</label>
                <div className="flex flex-wrap gap-2">
                  {selectedTutor.expertise?.map((item, index) => (
                    <span key={index} className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
                      {item}
                    </span>
                  )) || <p className="text-gray-400">Not provided</p>}
                </div>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-500 mb-1">Qualifications</label>
                <p className="text-gray-900 whitespace-pre-wrap">
                  {selectedTutor.qualifications || 'Not provided'}
                </p>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-500 mb-1">Experience</label>
                <p className="text-gray-900 whitespace-pre-wrap">
                  {selectedTutor.experience || 'Not provided'}
                </p>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-500 mb-1">Bio</label>
                <p className="text-gray-900 whitespace-pre-wrap">
                  {selectedTutor.bio || 'Not provided'}
                </p>
              </div>

              {selectedTutor.documents && selectedTutor.documents.length > 0 && (
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-500 mb-2">Uploaded Documents</label>
                  <div className="space-y-2">
                    {selectedTutor.documents.map((doc, index) => (
                      <a
                        key={index}
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <FileText className="w-5 h-5 text-gray-400" />
                        <span className="text-sm text-gray-900">{doc.name}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {selectedTutor.status === 'rejected' && selectedTutor.rejectionReason && (
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-500 mb-1">Rejection Reason</label>
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">{selectedTutor.rejectionReason}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            {selectedTutor.status === 'pending' && (
              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={() => {
                    setShowDetailsModal(false)
                    handleRejectClick(selectedTutor)
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
                >
                  <UserX className="w-4 h-4" />
                  Reject Application
                </button>
                <button
                  onClick={() => {
                    setShowDetailsModal(false)
                    handleApproveClick(selectedTutor)
                  }}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  <UserCheck className="w-4 h-4" />
                  Approve Tutor
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Approve Confirmation */}
      <ConfirmDialog
        isOpen={showApproveDialog}
        onClose={() => setShowApproveDialog(false)}
        onConfirm={confirmApprove}
        title="Approve Tutor"
        message={`Are you sure you want to approve ${selectedTutor?.name}? They will be granted full tutor access to the platform.`}
        confirmText="Approve"
        variant="primary"
      />

      {/* Reject Dialog */}
      <Modal
        isOpen={showRejectDialog}
        onClose={() => {
          setShowRejectDialog(false)
          setSelectedTutor(null)
          setRejectionReason('')
        }}
        title="Reject Tutor Application"
      >
        <div className="space-y-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">
              You are about to reject <strong>{selectedTutor?.name}</strong>'s application.
              Please provide a reason that will be sent to the applicant.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rejection Reason *
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              className="input-field w-full"
              placeholder="Explain why this application is being rejected..."
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => {
                setShowRejectDialog(false)
                setRejectionReason('')
              }}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={confirmReject}
              disabled={rejectMutation.isLoading || !rejectionReason.trim()}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {rejectMutation.isLoading ? (
                <><LoadingSpinner size="sm" /> Rejecting...</>
              ) : (
                'Confirm Rejection'
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

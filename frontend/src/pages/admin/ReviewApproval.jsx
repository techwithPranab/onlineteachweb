import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import {
  Star,
  CheckCircle,
  XCircle,
  Bookmark,
  BookmarkCheck,
  Filter,
  RefreshCw,
  MessageSquare,
  User,
  BookOpen,
  Clock,
  AlertCircle,
} from 'lucide-react'
import { adminReviewService } from '@/services/apiServices'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import SEOHead from '@/components/SEO/SEOHead'

// ── API helpers (thin wrappers around adminReviewService) ────────────────────
const reviewAPI = {
  getStats: () => adminReviewService.getReviewStats(),
  getAll: (params) => adminReviewService.getAllReviews(params),
  approve: (reviewId) => adminReviewService.approveReview(reviewId),
  reject: ({ reviewId, adminNotes }) => adminReviewService.rejectReview(reviewId, adminNotes),
  toggleFeatured: (reviewId) => adminReviewService.toggleFeaturedReview(reviewId),
}

// ── Star display ─────────────────────────────────────────────────────────────
function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={13}
          className={s <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
        />
      ))}
    </div>
  )
}

// ── Status badge ─────────────────────────────────────────────────────────────
const statusConfig = {
  pending:  { label: 'Pending',  cls: 'bg-yellow-100 text-yellow-700' },
  approved: { label: 'Approved', cls: 'bg-green-100  text-green-700'  },
  rejected: { label: 'Rejected', cls: 'bg-red-100    text-red-700'    },
}

function StatusBadge({ status }) {
  const cfg = statusConfig[status] || statusConfig.pending
  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${cfg.cls}`}>
      {cfg.label}
    </span>
  )
}

// ── Reject modal ─────────────────────────────────────────────────────────────
function RejectModal({ review, onClose, onConfirm, isLoading }) {
  const [notes, setNotes] = useState('')
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Reject Review</h3>
        <p className="text-sm text-gray-500 mb-4">
          Provide a reason for rejecting this review by{' '}
          <span className="font-medium text-gray-700">
            {review.student?.name || 'Student'}
          </span>.
        </p>
        <textarea
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
          rows={3}
          placeholder="Admin notes (optional)…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(notes)}
            disabled={isLoading}
            className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading && <RefreshCw size={14} className="animate-spin" />}
            Reject Review
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ReviewApproval() {
  const queryClient = useQueryClient()

  const [statusFilter, setStatusFilter] = useState('pending')
  const [page, setPage] = useState(1)
  const [rejectTarget, setRejectTarget] = useState(null)

  // Stats
  const { data: statsData } = useQuery('reviewStats', reviewAPI.getStats)
  const stats = statsData?.stats || {}

  // Reviews list
  const { data, isLoading, error } = useQuery(
    ['reviews', statusFilter, page],
    () => reviewAPI.getAll({ status: statusFilter || undefined, page, limit: 15 }),
    { keepPreviousData: true }
  )

  const reviews = data?.reviews || []
  const pagination = data?.pagination || {}

  // Mutations
  const approveMutation = useMutation(reviewAPI.approve, {
    onSuccess: () => queryClient.invalidateQueries('reviews') && queryClient.invalidateQueries('reviewStats'),
  })
  const rejectMutation = useMutation(reviewAPI.reject, {
    onSuccess: () => {
      setRejectTarget(null)
      queryClient.invalidateQueries('reviews')
      queryClient.invalidateQueries('reviewStats')
    },
  })
  const featuredMutation = useMutation(reviewAPI.toggleFeatured, {
    onSuccess: () => queryClient.invalidateQueries('reviews'),
  })

  const handleApprove = (id) => approveMutation.mutate(id)
  const handleRejectConfirm = (notes) =>
    rejectMutation.mutate({ reviewId: rejectTarget._id, adminNotes: notes })
  const handleToggleFeatured = (id) => featuredMutation.mutate(id)

  const statCards = [
    { label: 'Pending',  value: stats.pending  ?? 0, color: 'bg-yellow-100 text-yellow-700' },
    { label: 'Approved', value: stats.approved ?? 0, color: 'bg-green-100  text-green-700'  },
    { label: 'Rejected', value: stats.rejected ?? 0, color: 'bg-red-100    text-red-700'    },
    { label: 'Featured', value: stats.featured ?? 0, color: 'bg-indigo-100 text-indigo-700' },
  ]

  return (
    <>
      <SEOHead
        title="Review & Rating Approval - Admin"
        description="Moderate and approve student course reviews"
        noIndex={true}
        noFollow={true}
      />

      <div className="space-y-6">

        {/* ── Header ── */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Review & Rating Approval</h1>
          <p className="text-sm text-gray-500 mt-1">
            Moderate student reviews before they appear publicly on courses
          </p>
        </div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {statCards.map((s) => (
            <div key={s.label} className="card p-4 flex items-center gap-3">
              <span className={`text-2xl font-bold ${s.color} px-3 py-1 rounded-lg`}>
                {s.value}
              </span>
              <span className="text-sm text-gray-600 font-medium">{s.label}</span>
            </div>
          ))}
        </div>

        {/* ── Filters ── */}
        <div className="card p-3 flex flex-wrap items-center gap-2">
          <Filter size={16} className="text-gray-400" />
          <span className="text-sm text-gray-600 font-medium mr-1">Filter:</span>
          {['', 'pending', 'approved', 'rejected'].map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1) }}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {/* ── Reviews list ── */}
        {isLoading ? (
          <LoadingSpinner />
        ) : error ? (
          <div className="card p-8 flex flex-col items-center gap-2 text-red-500">
            <AlertCircle size={32} />
            <p className="font-medium">Failed to load reviews</p>
            <p className="text-sm text-gray-500">{error.message}</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="card p-12 flex flex-col items-center gap-3 text-gray-400">
            <MessageSquare size={40} className="opacity-40" />
            <p className="font-medium text-gray-500">No reviews found</p>
            <p className="text-sm">
              {statusFilter === 'pending'
                ? 'There are no pending reviews to moderate.'
                : 'No reviews match the selected filter.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => (
              <div key={review._id} className="card p-4">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">

                  {/* Left: info */}
                  <div className="flex-1 min-w-0">
                    {/* Student + course */}
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <div className="flex items-center gap-1.5 text-sm text-gray-700">
                        <User size={14} className="text-gray-400 flex-shrink-0" />
                        <span className="font-medium">{review.student?.name || '—'}</span>
                        <span className="text-gray-400 text-xs">{review.student?.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <BookOpen size={14} className="text-gray-400 flex-shrink-0" />
                        <span className="truncate max-w-xs">{review.course?.title || '—'}</span>
                      </div>
                    </div>

                    {/* Rating + title + status */}
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <StarRating rating={review.rating} />
                      <span className="text-xs font-semibold text-gray-700">
                        {review.rating}/5
                      </span>
                      {review.reviewTitle && (
                        <span className="text-sm font-semibold text-gray-800">
                          "{review.reviewTitle}"
                        </span>
                      )}
                      <StatusBadge status={review.status} />
                      {review.isFeatured && (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-indigo-100 text-indigo-700">
                          ⭐ Featured
                        </span>
                      )}
                    </div>

                    {/* Review text */}
                    <p className="text-sm text-gray-600 leading-relaxed">{review.reviewText}</p>

                    {/* Admin notes */}
                    {review.adminNotes && (
                      <p className="mt-2 text-xs text-red-600 bg-red-50 rounded px-2 py-1">
                        Admin note: {review.adminNotes}
                      </p>
                    )}

                    {/* Date */}
                    <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                      <Clock size={11} />
                      {new Date(review.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </div>
                  </div>

                  {/* Right: actions */}
                  <div className="flex sm:flex-col items-center gap-2 flex-shrink-0">
                    {review.status !== 'approved' && (
                      <button
                        onClick={() => handleApprove(review._id)}
                        disabled={approveMutation.isLoading}
                        title="Approve"
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                      >
                        <CheckCircle size={14} />
                        Approve
                      </button>
                    )}

                    {review.status !== 'rejected' && (
                      <button
                        onClick={() => setRejectTarget(review)}
                        title="Reject"
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        <XCircle size={14} />
                        Reject
                      </button>
                    )}

                    {review.status === 'approved' && (
                      <button
                        onClick={() => handleToggleFeatured(review._id)}
                        disabled={featuredMutation.isLoading}
                        title={review.isFeatured ? 'Remove from featured' : 'Mark as featured'}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                          review.isFeatured
                            ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700'
                            : 'bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50'
                        }`}
                      >
                        {review.isFeatured ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                        {review.isFeatured ? 'Unfeature' : 'Feature'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Pagination ── */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing {reviews.length} of {pagination.total} reviews
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="px-3 py-1.5 text-sm text-gray-600 font-medium">
                {page} / {pagination.pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                disabled={page === pagination.pages}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Reject modal ── */}
      {rejectTarget && (
        <RejectModal
          review={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onConfirm={handleRejectConfirm}
          isLoading={rejectMutation.isLoading}
        />
      )}
    </>
  )
}

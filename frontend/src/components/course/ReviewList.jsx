import { useState } from 'react'
import { ChevronLeft, ChevronRight, ArrowUpDown, TrendingUp, Clock, Award } from 'lucide-react'
import PropTypes from 'prop-types'
import ReviewCard from './ReviewCard'
import LoadingSpinner from '../common/LoadingSpinner'

/**
 * ReviewList Component - Display list of reviews with pagination and sorting
 */
export default function ReviewList({ 
  reviews = [],
  isLoading = false,
  pagination = null,
  onPageChange = null,
  onSortChange = null,
  currentSort = 'createdAt',
  ownReviewId = null,
  onEditReview = null,
  onDeleteReview = null,
  showCourseInfo = false
}) {
  const [sortBy, setSortBy] = useState(currentSort)

  const sortOptions = [
    { value: 'createdAt', label: 'Most Recent', icon: Clock },
    { value: 'rating', label: 'Highest Rating', icon: TrendingUp },
    { value: 'isFeatured', label: 'Featured First', icon: Award }
  ]

  const handleSortChange = (newSort) => {
    setSortBy(newSort)
    if (onSortChange) {
      onSortChange(newSort)
    }
  }

  const handlePageChange = (newPage) => {
    if (onPageChange && newPage >= 1 && newPage <= pagination.pages) {
      onPageChange(newPage)
      // Scroll to top of reviews
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // Separate own review from others
  const ownReview = reviews.find(r => r._id === ownReviewId)
  const otherReviews = reviews.filter(r => r._id !== ownReviewId)

  // Empty state
  if (!isLoading && reviews.length === 0) {
    return (
      <div className="text-center py-8 sm:py-12 md:py-16">
        <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl sm:text-4xl md:text-5xl">
          ⭐
        </div>
        <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-2">
          No reviews yet
        </h3>
        <p className="text-sm sm:text-base text-gray-600 max-w-md mx-auto">
          Be the first to share your experience with this course! 🌟
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-5 md:space-y-6">
      {/* Sort Options */}
      {reviews.length > 0 && !isLoading && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-3 border-b border-gray-200">
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
            <span>Sort by:</span>
          </h3>
          <div className="flex flex-wrap gap-2">
            {sortOptions.map((option) => {
              const Icon = option.icon
              const isActive = sortBy === option.value
              return (
                <button
                  key={option.value}
                  onClick={() => handleSortChange(option.value)}
                  className={`
                    inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2
                    text-xs sm:text-sm font-medium rounded-lg
                    transition-all active:scale-95 sm:hover:scale-105
                    focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1
                    ${isActive 
                      ? 'bg-emerald-500 text-white shadow-md' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                  `}
                >
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>{option.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="genz-card p-4 sm:p-5 animate-pulse">
              <div className="flex gap-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gray-300 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-gray-300 rounded w-1/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded" />
                    <div className="h-3 bg-gray-200 rounded w-5/6" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reviews List */}
      {!isLoading && (
        <div className="space-y-3 sm:space-y-4">
          {/* Own Review First (if exists) */}
          {ownReview && (
            <div>
              <ReviewCard
                review={ownReview}
                isOwnReview={true}
                onEdit={onEditReview}
                onDelete={onDeleteReview}
                showCourseInfo={showCourseInfo}
              />
            </div>
          )}

          {/* Other Reviews */}
          {otherReviews.map((review) => (
            <ReviewCard
              key={review._id}
              review={review}
              isOwnReview={false}
              showCourseInfo={showCourseInfo}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && !isLoading && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 pt-4 border-t border-gray-200">
          {/* Page Info */}
          <div className="text-xs sm:text-sm text-gray-600">
            Showing <span className="font-semibold">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
            <span className="font-semibold">
              {Math.min(pagination.page * pagination.limit, pagination.total)}
            </span>{' '}
            of <span className="font-semibold">{pagination.total}</span> reviews
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center gap-2">
            {/* Previous Button */}
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className={`
                inline-flex items-center gap-1 px-3 py-2 sm:px-4 sm:py-2
                text-xs sm:text-sm font-medium rounded-lg
                transition-all
                ${pagination.page === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-100 active:scale-95 sm:hover:scale-105 border border-gray-300'
                }
                focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1
              `}
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Previous</span>
            </button>

            {/* Page Numbers */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                let pageNum
                if (pagination.pages <= 5) {
                  pageNum = i + 1
                } else if (pagination.page <= 3) {
                  pageNum = i + 1
                } else if (pagination.page >= pagination.pages - 2) {
                  pageNum = pagination.pages - 4 + i
                } else {
                  pageNum = pagination.page - 2 + i
                }

                const isActive = pageNum === pagination.page

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`
                      w-8 h-8 sm:w-10 sm:h-10
                      flex items-center justify-center
                      text-xs sm:text-sm font-medium rounded-lg
                      transition-all
                      ${isActive
                        ? 'bg-emerald-500 text-white shadow-md'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 active:scale-95 sm:hover:scale-105'
                      }
                      focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1
                    `}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>

            {/* Next Button */}
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
              className={`
                inline-flex items-center gap-1 px-3 py-2 sm:px-4 sm:py-2
                text-xs sm:text-sm font-medium rounded-lg
                transition-all
                ${pagination.page === pagination.pages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-100 active:scale-95 sm:hover:scale-105 border border-gray-300'
                }
                focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1
              `}
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

ReviewList.propTypes = {
  reviews: PropTypes.arrayOf(PropTypes.object),
  isLoading: PropTypes.bool,
  pagination: PropTypes.shape({
    total: PropTypes.number,
    page: PropTypes.number,
    limit: PropTypes.number,
    pages: PropTypes.number
  }),
  onPageChange: PropTypes.func,
  onSortChange: PropTypes.func,
  currentSort: PropTypes.string,
  ownReviewId: PropTypes.string,
  onEditReview: PropTypes.func,
  onDeleteReview: PropTypes.func,
  showCourseInfo: PropTypes.bool
}

import { useState } from 'react'
import { Star, Edit2, Trash2, Award, Calendar } from 'lucide-react'
import PropTypes from 'prop-types'
import StarRating from './StarRating'

/**
 * ReviewCard Component - Display individual course review
 */
export default function ReviewCard({ 
  review, 
  isOwnReview = false,
  onEdit = null,
  onDelete = null,
  showCourseInfo = false
}) {
  const [showFullText, setShowFullText] = useState(false)
  
  const reviewText = review.reviewText || review.comment || ''
  const isLongReview = reviewText.length > 300
  const displayText = showFullText ? reviewText : reviewText.slice(0, 300)
  
  const studentName = review.student?.name || review.studentDetails?.name || 'Anonymous'
  const studentAvatar = review.student?.profilePicture || review.studentDetails?.profilePicture || null
  const createdDate = review.createdAt ? new Date(review.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }) : 'Recently'

  // Get initials for avatar
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Status badge color
  const getStatusColor = (status) => {
    switch(status) {
      case 'approved':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'rejected':
        return 'bg-red-100 text-red-700 border-red-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  return (
    <div className={`
      genz-card p-3 sm:p-4 md:p-5 
      transition-all duration-300
      ${isOwnReview ? 'ring-2 ring-emerald-500 ring-opacity-50' : ''}
      ${review.isFeatured ? 'bg-gradient-to-br from-yellow-50 to-orange-50' : ''}
      active:scale-[0.98] sm:hover:scale-[1.01]
    `}>
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4 mb-3">
        {/* Avatar */}
        <div className="flex-shrink-0 self-center sm:self-start">
          {studentAvatar ? (
            <img 
              src={studentAvatar} 
              alt={studentName}
              className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full object-cover shadow-lg border-2 border-white"
            />
          ) : (
            <div className={`
              w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 
              rounded-full flex items-center justify-center shadow-lg
              ${review.isFeatured 
                ? 'bg-gradient-to-br from-yellow-400 to-orange-500' 
                : 'bg-gradient-to-br from-emerald-500 to-teal-500'
              }
            `}>
              <span className="text-white font-bold text-base sm:text-lg md:text-xl">
                {getInitials(studentName)}
              </span>
            </div>
          )}
        </div>

        {/* Review Info */}
        <div className="flex-1 min-w-0 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <h4 className="font-semibold text-gray-900 text-sm sm:text-base md:text-lg break-words">
                  {studentName}
                </h4>
                {isOwnReview && (
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full whitespace-nowrap">
                    Your Review
                  </span>
                )}
                {review.isFeatured && (
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-bold rounded-full shadow-md whitespace-nowrap">
                    <Award className="w-3 h-3" />
                    <span>Featured</span>
                  </div>
                )}
              </div>
              
              {/* Rating */}
              <div className="flex items-center justify-center sm:justify-start gap-2 mt-1">
                <StarRating rating={review.rating} readOnly size="sm" />
              </div>
            </div>

            {/* Date and Status */}
            <div className="flex flex-col items-center sm:items-end gap-1">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Calendar className="w-3.5 h-3.5" />
                <span>{createdDate}</span>
              </div>
              {review.status && review.status !== 'approved' && (
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getStatusColor(review.status)}`}>
                  {review.status.charAt(0).toUpperCase() + review.status.slice(1)}
                </span>
              )}
            </div>
          </div>

          {/* Course Info (if showing in admin or featured context) */}
          {showCourseInfo && review.course && (
            <div className="mb-2 p-2 bg-gray-50 rounded-lg">
              <p className="text-xs sm:text-sm text-gray-600">
                📚 <span className="font-medium">{review.course.title || review.courseDetails?.title}</span>
              </p>
            </div>
          )}

          {/* Review Title */}
          {review.reviewTitle && (
            <h5 className="font-semibold text-gray-800 text-sm sm:text-base mb-2 break-words">
              "{review.reviewTitle}"
            </h5>
          )}

          {/* Review Text */}
          <div className="text-gray-700 text-xs sm:text-sm md:text-base leading-relaxed break-words">
            <p>{displayText}{isLongReview && !showFullText && '...'}</p>
            {isLongReview && (
              <button
                onClick={() => setShowFullText(!showFullText)}
                className="text-emerald-600 hover:text-emerald-700 font-medium mt-2 underline focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 rounded"
              >
                {showFullText ? 'Show less' : 'Read more'}
              </button>
            )}
          </div>

          {/* Admin Notes (if rejected) */}
          {review.status === 'rejected' && review.adminNotes && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs sm:text-sm text-red-800">
                <strong>Admin Note:</strong> {review.adminNotes}
              </p>
            </div>
          )}

          {/* Action Buttons (for own review) */}
          {isOwnReview && (onEdit || onDelete) && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-200">
              {onEdit && (
                <button
                  onClick={() => onEdit(review)}
                  className="
                    inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2
                    bg-blue-50 hover:bg-blue-100 text-blue-700 
                    text-xs sm:text-sm font-medium rounded-lg
                    transition-all active:scale-95 sm:hover:scale-105
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
                  "
                >
                  <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>Edit Review</span>
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(review)}
                  className="
                    inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2
                    bg-red-50 hover:bg-red-100 text-red-700 
                    text-xs sm:text-sm font-medium rounded-lg
                    transition-all active:scale-95 sm:hover:scale-105
                    focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1
                  "
                >
                  <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>Delete Review</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

ReviewCard.propTypes = {
  review: PropTypes.shape({
    _id: PropTypes.string,
    rating: PropTypes.number.isRequired,
    reviewTitle: PropTypes.string,
    reviewText: PropTypes.string,
    comment: PropTypes.string, // Fallback for old reviews
    status: PropTypes.oneOf(['pending', 'approved', 'rejected']),
    isFeatured: PropTypes.bool,
    createdAt: PropTypes.string,
    adminNotes: PropTypes.string,
    student: PropTypes.shape({
      name: PropTypes.string,
      profilePicture: PropTypes.string
    }),
    studentDetails: PropTypes.shape({
      name: PropTypes.string,
      profilePicture: PropTypes.string
    }),
    course: PropTypes.shape({
      title: PropTypes.string
    }),
    courseDetails: PropTypes.shape({
      title: PropTypes.string
    })
  }).isRequired,
  isOwnReview: PropTypes.bool,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  showCourseInfo: PropTypes.bool
}

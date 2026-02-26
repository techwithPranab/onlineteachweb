import { useState } from 'react'
import { Star } from 'lucide-react'
import PropTypes from 'prop-types'

/**
 * StarRating Component - Interactive and Display modes
 * @param {number} rating - Current rating value
 * @param {function} onRatingChange - Callback when rating changes (interactive mode)
 * @param {boolean} readOnly - Whether to show in read-only mode
 * @param {string} size - Size variant: 'sm', 'md', 'lg'
 */
export default function StarRating({ 
  rating = 0, 
  onRatingChange = null, 
  readOnly = false,
  size = 'md'
}) {
  const [hoverRating, setHoverRating] = useState(0)
  const isInteractive = !readOnly && onRatingChange

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8'
  }

  const starSize = sizeClasses[size] || sizeClasses.md

  const handleClick = (starValue) => {
    if (isInteractive) {
      onRatingChange(starValue)
    }
  }

  const handleMouseEnter = (starValue) => {
    if (isInteractive) {
      setHoverRating(starValue)
    }
  }

  const handleMouseLeave = () => {
    if (isInteractive) {
      setHoverRating(0)
    }
  }

  const displayRating = hoverRating || rating

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => handleClick(star)}
          onMouseEnter={() => handleMouseEnter(star)}
          onMouseLeave={handleMouseLeave}
          disabled={readOnly}
          className={`
            ${isInteractive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}
            ${readOnly ? '' : 'active:scale-95'}
            focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-1 rounded
          `}
          aria-label={`Rate ${star} stars`}
        >
          <Star
            className={`
              ${starSize}
              ${star <= displayRating 
                ? 'text-yellow-400 fill-yellow-400' 
                : 'text-gray-300'
              }
              transition-colors duration-150
            `}
          />
        </button>
      ))}
      {rating > 0 && readOnly && (
        <span className="ml-2 text-sm font-medium text-gray-700">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  )
}

StarRating.propTypes = {
  rating: PropTypes.number,
  onRatingChange: PropTypes.func,
  readOnly: PropTypes.bool,
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl'])
}

import { useState, useEffect } from 'react'
import { Send, Loader2 } from 'lucide-react'
import PropTypes from 'prop-types'
import StarRating from './StarRating'

/**
 * ReviewForm Component - Form to submit/edit course reviews
 */
export default function ReviewForm({ 
  onSubmit, 
  initialData = null, 
  isLoading = false,
  onCancel = null
}) {
  const [formData, setFormData] = useState({
    rating: initialData?.rating || 0,
    reviewTitle: initialData?.reviewTitle || '',
    reviewText: initialData?.reviewText || ''
  })
  const [errors, setErrors] = useState({})
  const [charCount, setCharCount] = useState(initialData?.reviewText?.length || 0)

  useEffect(() => {
    if (initialData) {
      setFormData({
        rating: initialData.rating || 0,
        reviewTitle: initialData.reviewTitle || '',
        reviewText: initialData.reviewText || ''
      })
      setCharCount(initialData.reviewText?.length || 0)
    }
  }, [initialData])

  const validateForm = () => {
    const newErrors = {}

    if (!formData.rating || formData.rating < 1) {
      newErrors.rating = 'Please select a rating'
    }

    if (!formData.reviewText.trim()) {
      newErrors.reviewText = 'Please write a review'
    } else if (formData.reviewText.trim().length < 10) {
      newErrors.reviewText = 'Review must be at least 10 characters'
    } else if (formData.reviewText.length > 1000) {
      newErrors.reviewText = 'Review cannot exceed 1000 characters'
    }

    if (formData.reviewTitle && formData.reviewTitle.length > 100) {
      newErrors.reviewTitle = 'Title cannot exceed 100 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (validateForm()) {
      onSubmit(formData)
    }
  }

  const handleRatingChange = (rating) => {
    setFormData(prev => ({ ...prev, rating }))
    if (errors.rating) {
      setErrors(prev => ({ ...prev, rating: null }))
    }
  }

  const handleTextChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    if (name === 'reviewText') {
      setCharCount(value.length)
    }

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  const isFormValid = formData.rating > 0 && formData.reviewText.trim().length >= 10

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 md:space-y-6">
      {/* Rating Section */}
      <div>
        <label className="block text-sm sm:text-base font-semibold text-gray-900 mb-2 sm:mb-3">
          Your Rating ⭐
        </label>
        <div className="flex items-center gap-3">
          <StarRating 
            rating={formData.rating} 
            onRatingChange={handleRatingChange}
            size="lg"
          />
          {formData.rating > 0 && (
            <span className="text-sm sm:text-base font-medium text-emerald-600">
              {formData.rating} {formData.rating === 1 ? 'star' : 'stars'}
            </span>
          )}
        </div>
        {errors.rating && (
          <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.rating}</p>
        )}
      </div>

      {/* Review Title (Optional) */}
      <div>
        <label htmlFor="reviewTitle" className="block text-sm sm:text-base font-semibold text-gray-900 mb-2">
          Review Title (Optional) 📝
        </label>
        <input
          type="text"
          id="reviewTitle"
          name="reviewTitle"
          value={formData.reviewTitle}
          onChange={handleTextChange}
          maxLength={100}
          placeholder="Sum up your experience in a few words"
          className={`
            w-full px-3 sm:px-4 py-2 sm:py-3 
            border-2 rounded-lg text-sm sm:text-base
            focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent
            transition-all
            ${errors.reviewTitle ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'}
          `}
        />
        {errors.reviewTitle && (
          <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.reviewTitle}</p>
        )}
      </div>

      {/* Review Text */}
      <div>
        <label htmlFor="reviewText" className="block text-sm sm:text-base font-semibold text-gray-900 mb-2">
          Your Review 💭 <span className="text-red-500">*</span>
        </label>
        <textarea
          id="reviewText"
          name="reviewText"
          value={formData.reviewText}
          onChange={handleTextChange}
          rows={5}
          maxLength={1000}
          placeholder="Share your experience with this course. What did you like? What could be improved? (Minimum 10 characters)"
          className={`
            w-full px-3 sm:px-4 py-2 sm:py-3 
            border-2 rounded-lg text-sm sm:text-base
            focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent
            transition-all resize-none
            ${errors.reviewText ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'}
          `}
        />
        <div className="flex justify-between items-center mt-1">
          {errors.reviewText ? (
            <p className="text-xs sm:text-sm text-red-600">{errors.reviewText}</p>
          ) : (
            <p className="text-xs sm:text-sm text-gray-500">
              Minimum 10 characters required
            </p>
          )}
          <p className={`text-xs sm:text-sm ${charCount > 1000 ? 'text-red-600' : 'text-gray-500'}`}>
            {charCount}/1000
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2">
        <button
          type="submit"
          disabled={isLoading || !isFormValid}
          className={`
            flex-1 genz-btn-primary inline-flex items-center justify-center gap-2 
            min-h-[44px] px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg 
            text-sm sm:text-base font-medium
            transition-all
            ${isLoading || !isFormValid 
              ? 'opacity-50 cursor-not-allowed' 
              : 'active:scale-95 sm:hover:scale-105'
            }
          `}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
              <span>Submitting...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>{initialData ? 'Update Review' : 'Submit Review'}</span>
            </>
          )}
        </button>
        
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="
              flex-1 sm:flex-none genz-btn-secondary inline-flex items-center justify-center gap-2 
              min-h-[44px] px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg 
              text-sm sm:text-base font-medium
              transition-all active:scale-95 sm:hover:scale-105
            "
          >
            Cancel
          </button>
        )}
      </div>

      {/* Info Message */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
        <p className="text-xs sm:text-sm text-blue-800 leading-relaxed">
          ℹ️ Your review will be sent to our admin team for approval before being published. 
          Thank you for helping others make informed decisions! ✨
        </p>
      </div>
    </form>
  )
}

ReviewForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  initialData: PropTypes.shape({
    rating: PropTypes.number,
    reviewTitle: PropTypes.string,
    reviewText: PropTypes.string
  }),
  isLoading: PropTypes.bool,
  onCancel: PropTypes.func
}

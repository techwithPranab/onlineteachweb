import React from 'react'
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'
import PropTypes from 'prop-types'

/**
 * Pagination Component
 * Modern, accessible pagination with ellipsis for large page ranges
 */
const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  showFirstLast = true,
  maxVisiblePages = 5,
  className = '',
  size = 'default'
}) => {
  // Don't render if there's only one page
  if (totalPages <= 1) return null

  const sizeClasses = {
    small: 'px-2 py-1 text-sm',
    default: 'px-3 py-2',
    large: 'px-4 py-3 text-lg'
  }

  const buttonClasses = `relative inline-flex items-center justify-center border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:z-10 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200 ${sizeClasses[size]}`

  const activeButtonClasses = `relative inline-flex items-center justify-center border border-primary-500 bg-primary-50 text-sm font-medium text-primary-600 focus:z-10 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 ${sizeClasses[size]}`

  const disabledButtonClasses = `relative inline-flex items-center justify-center border border-gray-300 bg-gray-100 text-sm font-medium text-gray-400 cursor-not-allowed ${sizeClasses[size]}`

  // Calculate visible page range
  const getVisiblePages = () => {
    const halfVisible = Math.floor(maxVisiblePages / 2)
    let startPage = Math.max(1, currentPage - halfVisible)
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

    // Adjust start page if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    return { startPage, endPage }
  }

  const { startPage, endPage } = getVisiblePages()

  const pages = []
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i)
  }

  const showStartEllipsis = startPage > 2
  const showEndEllipsis = endPage < totalPages - 1

  return (
    <nav
      className={`flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6 ${className}`}
      aria-label="Pagination Navigation"
    >
      <div className="flex justify-between flex-1 sm:hidden">
        {/* Mobile pagination - Previous/Next only */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className={`relative inline-flex items-center px-2 py-2 text-sm font-medium rounded-md ${
            currentPage <= 1
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-700 hover:bg-gray-50'
          }`}
          aria-label="Previous page"
        >
          <ChevronLeft className="w-5 h-5" />
          Previous
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className={`relative inline-flex items-center px-2 py-2 text-sm font-medium rounded-md ${
            currentPage >= totalPages
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-700 hover:bg-gray-50'
          }`}
          aria-label="Next page"
        >
          Next
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            Showing page <span className="font-medium">{currentPage}</span> of{' '}
            <span className="font-medium">{totalPages}</span>
          </p>
        </div>

        <div className="flex items-center space-x-1">
          {/* First page button */}
          {showFirstLast && startPage > 1 && (
            <button
              onClick={() => onPageChange(1)}
              className={buttonClasses}
              aria-label="Go to first page"
            >
              1
            </button>
          )}

          {/* Start ellipsis */}
          {showStartEllipsis && (
            <span className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700">
              <MoreHorizontal className="w-5 h-5" />
            </span>
          )}

          {/* Page numbers */}
          {pages.map((page) => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={page === currentPage ? activeButtonClasses : buttonClasses}
              aria-label={`Go to page ${page}`}
              aria-current={page === currentPage ? 'page' : undefined}
            >
              {page}
            </button>
          ))}

          {/* End ellipsis */}
          {showEndEllipsis && (
            <span className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700">
              <MoreHorizontal className="w-5 h-5" />
            </span>
          )}

          {/* Last page button */}
          {showFirstLast && endPage < totalPages && (
            <button
              onClick={() => onPageChange(totalPages)}
              className={buttonClasses}
              aria-label="Go to last page"
            >
              {totalPages}
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}

Pagination.propTypes = {
  currentPage: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  showFirstLast: PropTypes.bool,
  maxVisiblePages: PropTypes.number,
  className: PropTypes.string,
  size: PropTypes.oneOf(['small', 'default', 'large'])
}

export default Pagination

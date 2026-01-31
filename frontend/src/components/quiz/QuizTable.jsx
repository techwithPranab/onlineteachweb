import { ChevronLeft, ChevronRight } from 'lucide-react'

/**
 * Reusable Quiz Table Component
 * 
 * Purpose: Display quiz data in a consistent, sortable, paginated table format
 * 
 * @param {Array} data - Array of quiz objects
 * @param {Array} columns - Column configuration
 * @param {Function} onRowAction - Handler for row actions
 * @param {Boolean} loading - Loading state
 * @param {Object} emptyState - Empty state configuration
 */
export default function QuizTable({
  data,
  columns,
  onRowAction,
  loading = false,
  emptyState = { title: 'No data', description: '' },
  pagination = null,
  onPageChange = null
}) {

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 sm:p-12 text-center">
          <div className="inline-block w-6 h-6 sm:w-8 sm:h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-xs sm:text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 sm:p-12 text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">{emptyState.title}</h3>
          <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6">{emptyState.description}</p>
          {emptyState.action && (
            <button
              onClick={emptyState.action.onClick}
              className="btn-primary"
            >
              {emptyState.action.label}
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Mobile Card View */}
      <div className="block md:hidden">
        <div className="divide-y divide-gray-200">
          {data.map((row, rowIndex) => (
            <div
              key={row.id || rowIndex}
              className="p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="space-y-3">
                {columns
                  .filter(column => !column.className?.includes('hidden') || column.className?.includes('sm:hidden'))
                  .map((column, colIndex) => (
                  <div key={colIndex} className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-500">
                      {column.header}:
                    </span>
                    <div className="text-sm text-gray-900 text-right">
                      {column.render
                        ? column.render(row, rowIndex, onRowAction)
                        : row[column.accessor]
                      }
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  className={`
                    px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider
                    ${column.className || ''}
                  `}
                  style={{ width: column.width }}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, rowIndex) => (
              <tr
                key={row.id || rowIndex}
                className="hover:bg-gray-50 transition-colors"
              >
                {columns.map((column, colIndex) => (
                  <td
                    key={colIndex}
                    className={`
                      px-3 sm:px-6 py-3 sm:py-4 text-sm
                      ${column.className || ''}
                      ${column.cellClassName || ''}
                    `}
                  >
                    {column.render
                      ? column.render(row, rowIndex, onRowAction)
                      : row[column.accessor]
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="bg-gray-50 px-3 sm:px-6 py-3 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs sm:text-sm text-gray-700 text-center sm:text-left">
              Showing <span className="font-medium">{pagination.from}</span> to{' '}
              <span className="font-medium">{pagination.to}</span> of{' '}
              <span className="font-medium">{pagination.total}</span> results
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => onPageChange?.(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className="px-2 sm:px-3 py-1 border border-gray-300 rounded-lg text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Previous</span>
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    // Show first, last, current, and adjacent pages
                    return (
                      page === 1 ||
                      page === pagination.totalPages ||
                      Math.abs(page - pagination.currentPage) <= 1
                    )
                  })
                  .map((page, index, array) => {
                    // Add ellipsis
                    const prevPage = array[index - 1]
                    const showEllipsis = prevPage && page - prevPage > 1

                    return (
                      <div key={page} className="flex items-center gap-1">
                        {showEllipsis && (
                          <span className="px-1 sm:px-2 text-gray-400">...</span>
                        )}
                        <button
                          onClick={() => onPageChange?.(page)}
                          className={`
                            px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium
                            ${page === pagination.currentPage
                              ? 'bg-indigo-600 text-white'
                              : 'text-gray-700 hover:bg-gray-100'
                            }
                          `}
                        >
                          {page}
                        </button>
                      </div>
                    )
                  })}
              </div>

              <button
                onClick={() => onPageChange?.(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
                className="px-2 sm:px-3 py-1 border border-gray-300 rounded-lg text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

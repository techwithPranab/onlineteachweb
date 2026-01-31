import { useMemo } from 'react'
import { Filter, X } from 'lucide-react'

/**
 * Reusable Filter Bar Component
 * 
 * Purpose: Provide consistent filtering across quiz-related pages
 * 
 * @param {Object} filters - Current filter state
 * @param {Function} setFilters - Function to update filters
 * @param {Array} filterConfig - Configuration for filter fields
 * @param {Function} onReset - Optional reset handler
 */
export default function FilterBar({ filters, setFilters, filterConfig, onReset }) {
  
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }))
  }

  const handleReset = () => {
    const resetFilters = {}
    filterConfig.forEach(config => {
      resetFilters[config.field] = config.defaultValue || 'all'
    })
    setFilters(resetFilters)
    onReset?.()
  }

  const hasActiveFilters = useMemo(() => {
    return filterConfig.some(config => {
      const currentValue = filters[config.field]
      const defaultValue = config.defaultValue || 'all'
      return currentValue !== defaultValue
    })
  }, [filters, filterConfig])

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="text-sm font-semibold text-gray-900">Filters</h3>
        </div>
        {hasActiveFilters && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800"
          >
            <X className="w-4 h-4" />
            Reset
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {filterConfig.map(config => (
          <div key={config.field}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {config.label}
            </label>
            {config.type === 'select' ? (
              <select
                value={filters[config.field]}
                onChange={(e) => handleFilterChange(config.field, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              >
                {config.options.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : config.type === 'date' ? (
              <input
                type="date"
                value={filters[config.field]}
                onChange={(e) => handleFilterChange(config.field, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              />
            ) : (
              <input
                type="text"
                placeholder={config.placeholder}
                value={filters[config.field]}
                onChange={(e) => handleFilterChange(config.field, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

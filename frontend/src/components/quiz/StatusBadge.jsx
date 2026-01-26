/**
 * Reusable Status Badge Component
 * 
 * Purpose: Consistent visual representation of quiz statuses across the application
 */

const statusConfig = {
  ACTIVE: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    border: 'border-blue-200',
    label: 'Active'
  },
  IN_PROGRESS: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    border: 'border-yellow-200',
    label: 'In Progress'
  },
  COMPLETED: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-200',
    label: 'Completed'
  },
  PASSED: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-200',
    label: 'Passed'
  },
  FAILED: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-200',
    label: 'Failed'
  },
  SUBMITTED: {
    bg: 'bg-purple-100',
    text: 'text-purple-800',
    border: 'border-purple-200',
    label: 'Submitted'
  },
  AUTO_SUBMITTED: {
    bg: 'bg-orange-100',
    text: 'text-orange-800',
    border: 'border-orange-200',
    label: 'Auto-Submitted'
  },
  EVALUATING: {
    bg: 'bg-indigo-100',
    text: 'text-indigo-800',
    border: 'border-indigo-200',
    label: 'Evaluating'
  }
}

export default function StatusBadge({ status, size = 'md', showIcon = false }) {
  const config = statusConfig[status] || statusConfig.ACTIVE
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  }

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full font-medium border
        ${config.bg} ${config.text} ${config.border}
        ${sizeClasses[size]}
      `}
    >
      {showIcon && (
        <span className="w-1.5 h-1.5 rounded-full bg-current" />
      )}
      {config.label}
    </span>
  )
}

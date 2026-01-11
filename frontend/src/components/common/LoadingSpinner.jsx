import { Loader2 } from 'lucide-react'

export default function LoadingSpinner({ size = 'md', fullScreen = false }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  }

  if (fullScreen) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className={`${sizeClasses[size]} animate-spin text-primary-600`} />
      </div>
    )
  }

  return <Loader2 className={`${sizeClasses[size]} animate-spin text-primary-600`} />
}

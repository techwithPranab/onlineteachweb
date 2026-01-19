import { useEffect, useState, useRef } from 'react'
import { Clock, AlertCircle } from 'lucide-react'

/**
 * Quiz Timer Component
 * 
 * Purpose: Display and manage countdown timer for quiz
 * 
 * Features:
 * - Countdown display in MM:SS format
 * - Warning states (red when < 5 minutes)
 * - Auto-submit callback when time expires
 * - Pause/Resume functionality
 * - Clean interval cleanup
 * 
 * Props:
 * @param {number} duration - Total duration in seconds
 * @param {function} onTimeUp - Callback when time expires
 * @param {boolean} isPaused - Pause timer flag
 * @param {function} onTick - Optional callback on each second
 */
export default function QuizTimer({ 
  duration, 
  onTimeUp, 
  isPaused = false,
  onTick = null 
}) {
  const [remainingTime, setRemainingTime] = useState(duration)
  const intervalRef = useRef(null)

  useEffect(() => {
    setRemainingTime(duration)
  }, [duration])

  useEffect(() => {
    if (isPaused) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    if (remainingTime <= 0) {
      if (onTimeUp) onTimeUp()
      return
    }

    intervalRef.current = setInterval(() => {
      setRemainingTime(prev => {
        const newTime = prev - 1
        
        if (onTick) onTick(newTime)
        
        if (newTime <= 0) {
          clearInterval(intervalRef.current)
          if (onTimeUp) onTimeUp()
          return 0
        }
        
        return newTime
      })
    }, 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isPaused, remainingTime, onTimeUp, onTick])

  /**
   * Format time as MM:SS
   */
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  /**
   * Get timer color based on remaining time
   */
  const getTimerColor = () => {
    if (remainingTime < 60) return 'text-red-600 bg-red-50 border-red-200'
    if (remainingTime < 300) return 'text-amber-600 bg-amber-50 border-amber-200'
    return 'text-gray-700 bg-white border-gray-200'
  }

  /**
   * Calculate percentage for progress bar
   */
  const getPercentage = () => {
    return ((duration - remainingTime) / duration) * 100
  }

  const isWarning = remainingTime < 300
  const isCritical = remainingTime < 60

  return (
    <div className={`rounded-lg border-2 p-3 sm:p-4 transition-all ${getTimerColor()}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Clock className={`w-5 h-5 ${isCritical ? 'animate-pulse' : ''}`} />
          <span className="text-sm font-medium">Time Remaining</span>
        </div>
        
        {isWarning && (
          <AlertCircle className={`w-5 h-5 ${isCritical ? 'animate-pulse' : ''}`} />
        )}
      </div>
      
      <div className="text-2xl sm:text-3xl font-bold font-mono">
        {formatTime(remainingTime)}
      </div>
      
      {/* Progress Bar */}
      <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-1000 ${
            isCritical ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-indigo-500'
          }`}
          style={{ width: `${getPercentage()}%` }}
        />
      </div>
      
      {isPaused && (
        <div className="mt-2 text-sm text-gray-600 flex items-center gap-1">
          <span className="w-2 h-2 bg-gray-400 rounded-full" />
          Timer paused
        </div>
      )}
    </div>
  )
}

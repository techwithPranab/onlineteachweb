import { useEffect, useState, useRef } from 'react'

/**
 * XPEarnPreview — floating "+N XP" that pops up briefly when an answer is selected.
 * Props:
 *   xp      {number}  — how many XP to display
 *   trigger {number}  — increment this counter to fire a new animation
 *   correct {boolean} — green for correct, gray for neutral
 */
export default function XPEarnPreview({ xp = 0, trigger = 0, correct = true }) {
  const [show, setShow] = useState(false)
  const [displayXP, setDisplayXP] = useState(xp)
  const prevTrigger = useRef(0)

  useEffect(() => {
    if (trigger > 0 && trigger !== prevTrigger.current) {
      prevTrigger.current = trigger
      setDisplayXP(xp)
      setShow(true)
      const t = setTimeout(() => setShow(false), 950)
      return () => clearTimeout(t)
    }
  }, [trigger, xp])

  if (!show) return null

  return (
    <div
      key={trigger}
      className={`fixed bottom-24 right-8 z-50 pointer-events-none select-none font-black text-2xl drop-shadow-lg
        ${correct ? 'text-emerald-400' : 'text-gray-400'}
      `}
      style={{ animation: 'xpFloat 0.95s ease-out forwards' }}
    >
      +{displayXP} XP ✨
    </div>
  )
}

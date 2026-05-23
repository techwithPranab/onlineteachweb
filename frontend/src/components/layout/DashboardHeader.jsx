import { useAuthStore } from '../../store/authStore'
import NotificationBell from '../common/NotificationBell'
import { Menu, Sparkles, Sun, Moon } from 'lucide-react'
import { useSubscriptionFeatures } from '@/hooks/useFeatureAccess'
import { Link } from 'react-router-dom'
import { useXPStore } from '@/store/xpStore'
import { LEVEL_BADGE_BG } from '@/utils/xpSystem'
import { useState, useEffect } from 'react'

export default function DashboardHeader({ setSidebarOpen }) {
  const { user } = useAuthStore()
  const { plan } = useSubscriptionFeatures()
  const isStudent = user?.role === 'student'

  // XP / level data — only read for students
  const { totalXP, levelInfo } = useXPStore()
  const { currentLevel } = levelInfo
  const badgeBg = LEVEL_BADGE_BG[currentLevel.level] || LEVEL_BADGE_BG[1]

  // Dark mode toggle
  const [dark, setDark] = useState(() => localStorage.getItem('darkMode') === 'true')
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('darkMode', dark)
  }, [dark])

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen?.(true)}
            className="md:hidden p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all duration-300"
            aria-label="Open sidebar"
          >
            <Menu className="h-6 w-6" />
          </button>

          <div>
            <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span>Welcome back, {user?.name}!</span>
              {plan?.name && user?.role !== 'admin' && (
                <span className="ml-2 px-2 py-0.5 text-xs font-semibold uppercase rounded-full bg-emerald-100 text-emerald-800">
                  {plan.name}
                </span>
              )}
              <Sparkles className="h-5 w-5 text-emerald-600" />
            </h1>
            <div className="flex items-center gap-2">
              <p className="text-gray-600 capitalize text-sm font-medium">
                {user?.role}
              </p>
              {/* Level badge inline under role label */}
              {isStudent && (
                <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border ${badgeBg}`}>
                  {currentLevel.emoji} {currentLevel.title} · Lv.{currentLevel.level}
                  <span className="ml-1 text-[10px] font-medium opacity-70">{totalXP.toLocaleString()} XP</span>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Dark mode toggle */}
          <button
            onClick={() => setDark(d => !d)}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-all"
            title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <NotificationBell />

          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            {plan?.name && user?.role !== 'admin' && (
              <Link
                to="/student/subscription"
                className="px-2 py-1 text-xs font-semibold rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-800 hover:bg-emerald-200 transition-all"
              >
                {plan.name}
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

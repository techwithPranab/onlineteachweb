import { Outlet } from 'react-router-dom'
import { useState } from 'react'
import Sidebar from '../components/layout/Sidebar'
import DashboardHeader from '../components/layout/DashboardHeader'
import Footer from '../components/layout/Footer'
import XPBar from '../components/common/XPBar'
import LevelUpCelebration from '../components/common/LevelUpCelebration'
import { useAuthStore } from '../store/authStore'

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user } = useAuthStore()
  const isStudent = user?.role === 'student'

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex flex-1">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="flex-1 flex flex-col">
          <DashboardHeader setSidebarOpen={setSidebarOpen} />
          {/* XP progress strip — students only */}
          {isStudent && <XPBar />}
          <main className="flex-1 p-4 overflow-auto bg-white">
            <Outlet />
          </main>
        </div>
      </div>
      {/* Show footer for all authenticated users - spans full width */}
      <Footer />

      {/* Level-up celebration overlay — rendered at root so it covers full viewport */}
      {isStudent && <LevelUpCelebration />}
    </div>
  )
}

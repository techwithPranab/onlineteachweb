import { Outlet } from 'react-router-dom'
import { useState } from 'react'
import Sidebar from '../components/layout/Sidebar'
import DashboardHeader from '../components/layout/DashboardHeader'
import StudentFooter from '../components/layout/StudentFooter'
import { useAuthStore } from '../store/authStore'

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user } = useAuthStore()

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col">
        <DashboardHeader setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 p-4 overflow-auto">
          <Outlet />
        </main>
        {/* Show Gen-Z footer only for students */}
        {user?.role === 'student' && <StudentFooter />}
      </div>
    </div>
  )
}

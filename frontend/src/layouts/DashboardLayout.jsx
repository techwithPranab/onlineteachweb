import { Outlet } from 'react-router-dom'
import { useState } from 'react'
import Sidebar from '../components/layout/Sidebar'
import DashboardHeader from '../components/layout/DashboardHeader'
import Footer from '../components/layout/Footer'
import { useAuthStore } from '../store/authStore'

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user } = useAuthStore()

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex flex-1">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="flex-1 flex flex-col">
          <DashboardHeader setSidebarOpen={setSidebarOpen} />
          <main className="flex-1 p-4 overflow-auto bg-white">
            <Outlet />
          </main>
        </div>
      </div>
      {/* Show footer for all authenticated users - spans full width */}
      <Footer />
    </div>
  )
}

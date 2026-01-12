import { NavLink } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  FileText,
  BarChart3,
  Settings,
  Users,
  Video,
  GraduationCap,
  CreditCard,
  CheckSquare,
  DollarSign,
  Monitor,
} from 'lucide-react'

const studentLinks = [
  { to: '/student', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/student/courses', icon: BookOpen, label: 'Courses' },
  { to: '/student/progress', icon: BarChart3, label: 'Progress' },
  { to: '/student/subscription', icon: CreditCard, label: 'Subscription' },
  { to: '/student/profile', icon: Settings, label: 'Settings' },
]

const tutorLinks = [
  { to: '/tutor', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/tutor/schedule', icon: Calendar, label: 'Schedule' },
  { to: '/tutor/materials', icon: FileText, label: 'Materials' },
  { to: '/tutor/evaluation', icon: CheckSquare, label: 'Evaluation' },
  { to: '/tutor/profile', icon: Settings, label: 'Settings' },
]

const adminLinks = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/courses', icon: BookOpen, label: 'Course Management' },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/tutors/approval', icon: GraduationCap, label: 'Tutor Approval' },
  { to: '/admin/payments', icon: DollarSign, label: 'Payments' },
  { to: '/admin/sessions', icon: Monitor, label: 'Sessions' },
  { to: '/admin/subscriptions', icon: CreditCard, label: 'Subscriptions' },
  { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/admin/profile', icon: Settings, label: 'Settings' },
]

export default function Sidebar() {
  const { user, logout } = useAuthStore()

  const links = user?.role === 'student' 
    ? studentLinks 
    : user?.role === 'tutor' 
    ? tutorLinks 
    : adminLinks

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <div className="p-6">
        <div className="flex items-center space-x-2">
          <BookOpen className="h-8 w-8 text-primary-600" />
          <span className="text-xl font-bold text-gray-900">EduPlatform</span>
        </div>
      </div>

      <nav className="px-4 space-y-1">
        {links.map((link) => {
          const Icon = link.icon
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                  isActive
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`
              }
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{link.label}</span>
            </NavLink>
          )
        })}
      </nav>

      <div className="absolute bottom-0 w-64 p-4 border-t border-gray-200">
        <button
          onClick={logout}
          className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition"
        >
          Logout
        </button>
      </div>
    </aside>
  )
}

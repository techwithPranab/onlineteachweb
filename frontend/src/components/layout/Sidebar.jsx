import { NavLink } from 'react-router-dom'
import { useState } from 'react'
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
  ClipboardCheck,
  DollarSign,
  Monitor,
  ClipboardList,
  HelpCircle,
  PenTool,
  TrendingUp,
  Sparkles,
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
  Mail,
  Bell,
  History,
} from 'lucide-react'

const studentLinks = [
  { to: '/student', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/student/courses', icon: BookOpen, label: 'Courses' },
  { to: '/student/sessions', icon: Video, label: 'Sessions' },
  { to: '/student/quizzes', icon: ClipboardList, label: 'Quizzes' },
  { to: '/student/quiz-setup', icon: PenTool, label: 'Quiz Setup' },
  { to: '/student/active-quizzes', icon: ArrowUpDown, label: 'Active Quizzes' },
  { to: '/student/quiz-history', icon: History, label: 'Quiz History' },
  { to: '/student/progress', icon: BarChart3, label: 'Progress' },
  { to: '/student/subscription', icon: CreditCard, label: 'Subscription' },
  { to: '/student/notifications', icon: Bell, label: 'Notifications' },
  { to: '/student/profile', icon: Settings, label: 'Settings' },
]

const tutorLinks = [
  { to: '/tutor', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/tutor/schedule', icon: Calendar, label: 'Schedule' },
  { to: '/tutor/materials', icon: FileText, label: 'Materials' },
  { to: '/tutor/quizzes', icon: ClipboardList, label: 'Quizzes' },
  // AI Questions submenu
  {
    type: 'group',
    label: 'AI Questions',
    items: [
      { to: '/tutor/ai-questions/generate', icon: Sparkles, label: 'Generate Questions' },
      { to: '/tutor/ai-questions/review', icon: ClipboardCheck, label: 'Review Questions' },
    ]
  },
  { to: '/tutor/evaluate', icon: PenTool, label: 'Manual Evaluation' },
  { to: '/tutor/analytics', icon: TrendingUp, label: 'Quiz Analytics' },
  { to: '/tutor/evaluation', icon: ClipboardCheck, label: 'Student Evaluation' },
  { to: '/tutor/profile', icon: Settings, label: 'Settings' },
]

const adminLinks = [
  // Dashboard
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },

  // Content Management
  {
    type: 'group',
    label: 'Content Management',
    items: [
      { to: '/admin/courses', icon: BookOpen, label: 'Course Management' },
      { to: '/admin/quizzes', icon: ClipboardList, label: 'Quiz Management' },
      { to: '/admin/questions', icon: HelpCircle, label: 'Question Bank' },
      { to: '/admin/questions/import-export', icon: ArrowUpDown, label: 'Import/Export' },
      { to: '/admin/ai-questions/generate', icon: Sparkles, label: 'Generate Questions' },
      { to: '/admin/ai-questions/review', icon: ClipboardCheck, label: 'Review Questions' },
      { to: '/admin/offline-prompts', icon: FileText, label: 'Offline Prompts' },
        
      // AI Questions submenu
     
    ]
  },

  // User Management
  {
    type: 'group',
    label: 'User Management',
    items: [
      { to: '/admin/users', icon: Users, label: 'Users' },
      { to: '/admin/contact-messages', icon: Mail, label: 'Contact Messages' },
      { to: '/admin/tutors/approval', icon: GraduationCap, label: 'Tutor Approval' },
    ]
  },

  // Financial
  {
    type: 'group',
    label: 'Financial',
    items: [
      { to: '/admin/payments', icon: DollarSign, label: 'Payments' },
      { to: '/admin/subscriptions', icon: CreditCard, label: 'Subscriptions' },
    ]
  },

  // Analytics & Monitoring
  {
    type: 'group',
    label: 'Analytics & Monitoring',
    items: [
      { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
      { to: '/admin/quiz-analytics', icon: TrendingUp, label: 'Quiz Analytics' },
      { to: '/admin/sessions', icon: Monitor, label: 'Sessions' },
    ]
  },

  // Settings
  {
    type: 'group',
    label: 'Settings',
    items: [
      { to: '/admin/profile', icon: Settings, label: 'Settings' },
    ]
  },
]

export default function Sidebar({ sidebarOpen, setSidebarOpen }) {
  const { user, logout } = useAuthStore()

  const links = user?.role === 'student' 
    ? studentLinks 
    : user?.role === 'tutor' 
    ? tutorLinks 
    : adminLinks

  // State for collapsible admin menu groups
  const [expandedGroups, setExpandedGroups] = useState(() => {
    // Initialize all groups as expanded by default
    if (user?.role === 'admin') {
      return adminLinks
        .filter(link => link.type === 'group')
        .reduce((acc, group, index) => {
          acc[index] = true
          return acc
        }, {})
    }
    return {}
  })

  const toggleGroup = (groupIndex) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupIndex]: !prev[groupIndex]
    }))
  }

  const sidebarInner = (
    <div className="flex flex-col h-full bg-white">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg shadow-md">
            <BookOpen className="h-8 w-8 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">
            MeritAI
          </span>
        </div>
      </div>

      <nav className="px-4 space-y-1 flex-1 overflow-auto py-4">
        {links.map((link, index) => {
          if (link.type === 'group') {
            const isExpanded = expandedGroups[index]
            const ChevronIcon = isExpanded ? ChevronDown : ChevronRight

            return (
              <div key={`group-${index}`}>
                <button
                  onClick={() => toggleGroup(index)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider hover:bg-gray-50 rounded-lg transition-all duration-200"
                >
                  <span>{link.label}</span>
                  <ChevronIcon className="h-4 w-4" />
                </button>

                {isExpanded && (
                  <div className="ml-2 space-y-1 mt-1">
                    {link.items.map((item) => {
                      const Icon = item.icon
                      return (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          end={item.end}
                          className={({ isActive }) =>
                            `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                              isActive
                                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                                : 'text-gray-700 hover:bg-purple-50 hover:text-purple-700'
                            }`
                          }
                          onClick={() => setSidebarOpen?.(false)}
                        >
                          <Icon className="h-4 w-4" />
                          <span className="text-sm font-medium">{item.label}</span>
                        </NavLink>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          }

          const Icon = link.icon
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                    : 'text-gray-700 hover:bg-purple-50 hover:text-purple-700'
                }`
              }
              onClick={() => setSidebarOpen?.(false)}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{link.label}</span>
            </NavLink>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <button
          onClick={logout}
          className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 font-medium"
        >
          Logout
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:block w-64 bg-white border-r border-gray-200 min-h-screen shadow-sm">
        {sidebarInner}
      </aside>

      {/* Mobile drawer */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-64 bg-white border-r border-gray-200 h-full shadow-2xl">
            <div className="p-4 flex items-center justify-between border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg shadow-md">
                  <BookOpen className="h-8 w-8 text-white" />
                </div>
                <span className="text-lg font-bold text-gray-900">
                  MeritAI
                </span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-all duration-200">
                <ChevronRight className="h-5 w-5 text-gray-700" />
              </button>
            </div>
            <div className="h-[calc(100vh-72px)] overflow-auto">
              {sidebarInner}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

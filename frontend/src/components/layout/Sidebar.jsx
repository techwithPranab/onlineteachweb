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
    <div className="flex flex-col h-full">
      <div className="p-6">
        <div className="flex items-center space-x-2">
          <BookOpen className="h-8 w-8 text-primary-600" />
          <span className="text-xl font-bold text-gray-900">MeritAI</span>
        </div>
      </div>

      <nav className="px-4 space-y-1 flex-1 overflow-auto">
        {links.map((link, index) => {
          if (link.type === 'group') {
            const isExpanded = expandedGroups[index]
            const ChevronIcon = isExpanded ? ChevronDown : ChevronRight

            return (
              <div key={`group-${index}`}>
                <button
                  onClick={() => toggleGroup(index)}
                  className="w-full flex items-center justify-between px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors"
                >
                  <span>{link.label}</span>
                  <ChevronIcon className="h-4 w-4" />
                </button>

                {isExpanded && (
                  <div className="ml-2 space-y-1">
                    {link.items.map((item) => {
                      const Icon = item.icon
                      return (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          end={item.end}
                          className={({ isActive }) =>
                            `flex items-center space-x-3 px-4 py-2 rounded-lg transition ${
                              isActive
                                ? 'bg-primary-50 text-primary-600'
                                : 'text-gray-700 hover:bg-gray-50'
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
                `flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                  isActive
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-gray-700 hover:bg-gray-50'
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

      <div className="p-4 border-t">
        <button
          onClick={logout}
          className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition"
        >
          Logout
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:block w-64 bg-white border-r border-gray-200 min-h-screen">
        {sidebarInner}
      </aside>

      {/* Mobile drawer */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-64 bg-white border-r border-gray-200 h-full shadow-lg">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-8 w-8 text-primary-600" />
                <span className="text-lg font-bold text-gray-900">MeritAI</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-md hover:bg-gray-100">
                <ChevronRight className="h-5 w-5" />
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

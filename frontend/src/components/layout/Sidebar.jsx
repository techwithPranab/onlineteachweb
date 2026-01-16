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
  CheckSquare,
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
} from 'lucide-react'

const studentLinks = [
  { to: '/student', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/student/courses', icon: BookOpen, label: 'Courses' },
  { to: '/student/sessions', icon: Video, label: 'Sessions' },
  { to: '/student/quizzes', icon: ClipboardList, label: 'Quizzes' },
  { to: '/student/progress', icon: BarChart3, label: 'Progress' },
  { to: '/student/subscription', icon: CreditCard, label: 'Subscription' },
  { to: '/student/profile', icon: Settings, label: 'Settings' },
]

const tutorLinks = [
  { to: '/tutor', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/tutor/schedule', icon: Calendar, label: 'Schedule' },
  { to: '/tutor/materials', icon: FileText, label: 'Materials' },
  { to: '/tutor/quizzes', icon: ClipboardList, label: 'Quizzes' },
  { to: '/tutor/questions', icon: HelpCircle, label: 'Question Bank' },
  { to: '/tutor/ai-questions/generate', icon: Sparkles, label: 'AI Questions' },
  { to: '/tutor/questions/import-export', icon: ArrowUpDown, label: 'Import/Export' },
  { to: '/tutor/evaluate', icon: PenTool, label: 'Manual Evaluation' },
  { to: '/tutor/analytics', icon: TrendingUp, label: 'Quiz Analytics' },
  { to: '/tutor/evaluation', icon: CheckSquare, label: 'Student Evaluation' },
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
      { to: '/admin/ai-questions', icon: Sparkles, label: 'AI Questions' },
    ]
  },

  // User Management
  {
    type: 'group',
    label: 'User Management',
    items: [
      { to: '/admin/users', icon: Users, label: 'Users' },
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

export default function Sidebar() {
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

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <div className="p-6">
        <div className="flex items-center space-x-2">
          <BookOpen className="h-8 w-8 text-primary-600" />
          <span className="text-xl font-bold text-gray-900">EduPlatform</span>
        </div>
      </div>

      <nav className="px-4 space-y-1">
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

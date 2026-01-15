import { useQuery } from 'react-query'
import { useNavigate } from 'react-router-dom'
import {
  BookOpen,
  Users,
  Calendar,
  IndianRupee,
  TrendingUp,
  Clock,
  Video,
  Plus,
  Brain,
} from 'lucide-react'
import { courseService, sessionService, reportService } from '@/services/apiServices'
import { useAuthStore } from '@/store/authStore'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import ErrorMessage from '@/components/common/ErrorMessage'
import { AIQuestionsDashboardWidget, QuizStatsDashboardWidget } from '@/components/dashboard'

export default function TutorDashboard() {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const { data: coursesData, isLoading: coursesLoading } = useQuery(
    'publishedCourses',
    () => courseService.getCourses({ status: 'published' })
  )

  const { data: sessionsData, isLoading: sessionsLoading } = useQuery(
    ['tutorSessions', user?._id],
    () => sessionService.getSessions({ tutorId: user._id })
  )

  const { data: reportData } = useQuery(
    ['tutorReport', user?._id],
    () => reportService.getTutorReport(user._id)
  )

  if (coursesLoading || sessionsLoading) return <LoadingSpinner fullScreen />

  const courses = coursesData?.courses || []
  const sessions = sessionsData?.sessions || []
  const upcomingSessions = sessions.filter((s) => s.status === 'scheduled').slice(0, 5)

  const stats = [
    {
      label: 'Active Courses',
      value: courses.length,
      icon: BookOpen,
      color: 'primary',
      change: '+2 this month',
    },
    {
      label: 'Total Students',
      value: courses.reduce((acc, c) => acc + (c.enrolledStudents?.length || 0), 0),
      icon: Users,
      color: 'green',
      change: '+12 this week',
    },
    {
      label: 'Upcoming Sessions',
      value: upcomingSessions.length,
      icon: Calendar,
      color: 'blue',
      change: '5 this week',
    },
    {
      label: 'Total Earnings',
      value: '₹2,850',
      icon: IndianRupee,
      color: 'yellow',
      change: '+15% this month',
    },
  ]

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {user?.name}!</h1>
          <p className="text-gray-600">Here's what's happening with your courses today</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="card">
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className={`w-10 h-10 bg-${stat.color}-100 rounded-lg flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 text-${stat.color}-600`} />
                </div>
                <TrendingUp className="w-4 h-4 text-green-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">{stat.value}</h3>
              <p className="text-sm text-gray-600">{stat.label}</p>
              <p className="text-xs text-green-600 mt-1">{stat.change}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Upcoming Sessions */}
        <div className="card">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Upcoming Sessions</h2>
              <button
                onClick={() => navigate('/tutor/schedule')}
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                View All
              </button>
            </div>

            {upcomingSessions.length > 0 ? (
              <div className="space-y-4">
                {upcomingSessions.map((session) => (
                  <div
                    key={session._id}
                    className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                      <Video className="w-6 h-6 text-primary-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{session.title}</h4>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {new Date(session.scheduledAt).toLocaleTimeString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {session.attendees?.length || 0} students
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/tutor/live-class/${session._id}`)}
                      className="btn-primary text-sm"
                    >
                      Start
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-center py-8">No upcoming sessions</p>
            )}
          </div>
        </div>

        {/* Active Courses */}
        <div className="card">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Active Courses</h2>
              <button
                onClick={() => navigate('/tutor/schedule')}
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                View Schedule
              </button>
            </div>

            {courses.length > 0 ? (
              <div className="space-y-4">
                {courses.slice(0, 5).map((course) => (
                  <div
                    key={course._id}
                    className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/student/courses/${course._id}`)}
                  >
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-primary-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{course.title}</h4>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                        <span>{course.grade && `Grade ${course.grade}`}</span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {course.enrolledStudents?.length || 0}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary-600">₹{course.price}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No courses assigned yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI & Quiz Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <AIQuestionsDashboardWidget />
        <QuizStatsDashboardWidget />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <button
          onClick={() => navigate('/tutor/schedule')}
          className="card hover:shadow-lg transition-shadow text-left"
        >
          <div className="p-6">
            <Calendar className="w-8 h-8 text-primary-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Manage Schedule</h3>
            <p className="text-gray-600 text-sm">Create and manage your class schedule</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/tutor/upload-materials')}
          className="card hover:shadow-lg transition-shadow text-left"
        >
          <div className="p-6">
            <BookOpen className="w-8 h-8 text-primary-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Materials</h3>
            <p className="text-gray-600 text-sm">Add learning resources for students</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/tutor/evaluation')}
          className="card hover:shadow-lg transition-shadow text-left"
        >
          <div className="p-6">
            <Users className="w-8 h-8 text-primary-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Student Evaluation</h3>
            <p className="text-gray-600 text-sm">Grade and provide feedback</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/tutor/ai-questions/generate')}
          className="card hover:shadow-lg transition-shadow text-left"
        >
          <div className="p-6">
            <Brain className="w-8 h-8 text-purple-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Question Generator</h3>
            <p className="text-gray-600 text-sm">Generate quiz questions with AI</p>
          </div>
        </button>
      </div>
    </div>
  )
}

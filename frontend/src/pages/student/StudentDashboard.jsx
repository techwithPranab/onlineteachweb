import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useEffect } from 'react'
import { BookOpen, Calendar, TrendingUp, Video, FileText, Play, UserPlus, ArrowRight, Target, Award } from 'lucide-react'
import { courseService, sessionService, materialService, reportService, algorithmQuizService } from '@/services/apiServices'
import { useAuthStore } from '@/store/authStore'
import { Link } from 'react-router-dom'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import SEOHead from '@/components/SEO/SEOHead';
import ErrorMessage from '@/components/common/ErrorMessage'
import { UpcomingQuizzesWidget } from '@/components/dashboard'
import { UpgradePrompt, UsageIndicator } from '@/components/common'
import { useFeatureUsage } from '@/hooks/useFeatureAccess'
import { useXPStore } from '@/store/xpStore'
import { useStreakStore } from '@/store/streakStore'
import StreakWidget from '@/components/dashboard/StreakWidget'
import DailyMissions from '@/components/dashboard/DailyMissions'
import LeaderboardWidget from '@/components/dashboard/LeaderboardWidget'

export default function StudentDashboard() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const { fetchXPFromServer } = useXPStore()
  const { fetchStreak, checkIn } = useStreakStore()

  // Fetch usage data for upgrade prompts
  const { usageData } = useFeatureUsage()
  console.log('[StudentDashboard] Usage Data:', usageData);
  // Fetch enrolled courses
  const { data: coursesData, isLoading: coursesLoading, error: coursesError } = useQuery(
    ['studentCourses', user?._id],
    () => courseService.getCourses({ enrolled: true }),
    { enabled: !!user }
  )

  // Fetch upcoming sessions
  const { data: sessionsData, isLoading: sessionsLoading } = useQuery(
    ['upcomingSessions', user?._id, user?.grade],
    () => sessionService.getSessions({ upcoming: true, limit: 5, grade: user?.grade }),
    { enabled: !!user }
  )

  // Fetch recent materials
  const { data: materialsData, isLoading: materialsLoading } = useQuery(
    ['recentMaterials', user?._id],
    () => materialService.getRecentMaterials({ limit: 6 }),
    { enabled: !!user }
  )

  // Fetch student report for stats
  const { data: reportData } = useQuery(
    ['studentReport', user?._id],
    () => reportService.getStudentReport(user._id),
    { enabled: !!user }
  )

  // Fetch quiz performance data
  const { data: quizPerformanceData } = useQuery(
    ['quizPerformance', user?._id],
    () => algorithmQuizService.getStudentPerformance(),
    { enabled: !!user }
  )

  // Fetch quiz history for total count
  const { data: quizHistoryData } = useQuery(
    ['quizHistory', user?._id],
    () => algorithmQuizService.getQuizHistory({ limit: 1000 }),
    { enabled: !!user }
  )

  const courses = coursesData?.data || []
  const sessions = sessionsData?.sessions || []
  const materials = materialsData?.data || []
  const report = reportData?.data || {}
  const quizPerformance = quizPerformanceData?.performance || {}
  const quizHistory = quizHistoryData?.data || []

  const isLoading = coursesLoading || sessionsLoading || materialsLoading

  // ── Fetch XP + streak from backend when the student dashboard mounts ─────────
  useEffect(() => {
    if (user?._id) {
      fetchXPFromServer()
      fetchStreak()
      checkIn()
    }
  }, [user?._id, fetchXPFromServer, fetchStreak, checkIn])

  // Enrollment mutation
  const enrollMutation = useMutation(
    (sessionId) => sessionService.enrollInSession(sessionId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['upcomingSessions'])
        alert('Successfully enrolled in session!')
      },
      onError: (error) => {
        alert(error.response?.data?.message || 'Failed to enroll in session')
      }
    }
  )

  const handleEnroll = (sessionId) => {
    if (window.confirm('Do you want to enroll in this session?')) {
      enrollMutation.mutate(sessionId)
    }
  }

  if (coursesError) {
    return <ErrorMessage message={coursesError.message || 'Failed to load dashboard'} />
  }

  if (isLoading && !courses.length) {
    return <LoadingSpinner fullScreen />
  }

  // Calculate stats - now focused on quiz performance
  const totalQuizzesTaken = quizHistory.length
  const averageQuizScore = quizPerformance.averageScore || 0
  const averageAccuracy = quizPerformance.averageAccuracy || 0
  const availableCoursesCount = courses.length

  // Check for high usage features
  const highUsageFeatures = usageData?.filter(u => {
    if (u.limit === null || u.limit === undefined) return false
    const percentage = (u.used / u.limit) * 100
    return percentage >= 80
  }) || []

  return (
    <>

    <SEOHead title="Student Dashboard - Student" noIndex={true} noFollow={true} />

    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6 sm:space-y-8">
      {/* Welcome Banner + Streak/Missions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Welcome Banner */}
        <div className="lg:col-span-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-5 sm:p-7 rounded-2xl text-white shadow-lg flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
              Welcome back, {user?.name?.split(' ')[0] || 'Student'}! 👋
            </h1>
            <p className="text-sm sm:text-base text-white/80">
              Level up your skills — your streak is waiting!
            </p>
          </div>
          <div className="hidden sm:block text-5xl select-none">🚀</div>
        </div>

        {/* Streak Widget */}
        <div className="lg:col-span-1">
          <StreakWidget />
        </div>

        {/* Daily Missions */}
        <div className="lg:col-span-2">
          <DailyMissions quizHistory={quizHistory} />
        </div>
      </div>

      {/* Upgrade Banner - Show if approaching limits */}
      {highUsageFeatures.length > 0 && (
        <UpgradePrompt
          type="banner"
          reason={`You're approaching the limit on ${highUsageFeatures.length} feature(s)`}
          showComparison={false}
        />
      )}

      {/* Stats Cards with MeriTai styling - Quiz Focused */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <StatCard
          icon={<Target className="h-6 w-6 sm:h-8 sm:w-8" />}
          label="Quizzes Taken"
          value={totalQuizzesTaken}
          emoji="🎯"
          gradient="from-emerald-500 to-emerald-600"
        />
        <StatCard
          icon={<Award className="h-6 w-6 sm:h-8 sm:w-8" />}
          label="Avg Score"
          value={`${averageQuizScore}%`}
          emoji="🏆"
          gradient="from-blue-500 to-blue-600"
        />
        <StatCard
          icon={<TrendingUp className="h-6 w-6 sm:h-8 sm:w-8" />}
          label="Accuracy"
          value={`${averageAccuracy}%`}
          emoji="📈"
          gradient="from-orange-500 to-orange-600"
        />
        <StatCard
          icon={<BookOpen className="h-6 w-6 sm:h-8 sm:w-8" />}
          label="Courses"
          value={availableCoursesCount}
          emoji="📚"
          gradient="from-purple-500 to-purple-600"
        />
      </div>

      {/* Leaderboard preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-1">
          <LeaderboardWidget />
        </div>
        <div className="md:col-span-1">
          <UpcomingQuizzesWidget />
        </div>
      </div>

      {/* Upcoming Classes */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Upcoming Classes</h2>
          <Link 
            to="/student/sessions"
            className="text-primary-600 hover:text-primary-700 font-medium text-sm flex items-center gap-1 self-start sm:self-auto"
          >
            View All
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        {sessionsLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : sessions.length > 0 ? (
          <div className="space-y-4">
            {sessions.map((session) => (
              <ClassItem
                key={session._id}
                session={session}
                onEnroll={handleEnroll}
                isEnrolling={enrollMutation.isLoading}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>No upcoming classes scheduled</p>
          </div>
        )}
      </div>

      {/* Usage Statistics - Show top 3 limited features */}
      {usageData && usageData.length > 0 && (
        <div className="card">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Feature Usage</h2>
            <Link 
              to="/student/my-features"
              className="text-primary-600 hover:text-primary-700 font-medium text-sm flex items-center gap-1 self-start sm:self-auto"
            >
              View All Features
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {usageData.slice(0, 3).map((usage) => (
              <div key={usage.featureKey} className="p-4 border border-gray-200 rounded-lg">
                <UsageIndicator
                  feature={usage.featureKey}
                  variant="bar"
                  showLabel={true}
                  showRemaining={true}
                  size="sm"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Materials */}
      <div className="card">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">Recent Materials</h2>
        {materialsLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : materials.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {materials.slice(0, 6).map((material) => (
              <MaterialCard
                key={material._id}
                material={material}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>No materials available yet</p>
          </div>
        )}
      </div>
    </div>


    </>)
}

function StatCard({ icon, label, value, emoji, gradient }) {
  return (
    <div className={`genz-card hover:scale-105 transition-transform duration-300 overflow-hidden`}>
      <div className={`bg-gradient-to-br ${gradient} p-4 sm:p-5 text-white`}>
        <div className="flex items-center justify-between mb-2">
          <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
            {icon}
          </div>
          <span className="text-3xl genz-emoji-bounce">{emoji}</span>
        </div>
        <p className="text-white/90 text-xs sm:text-sm font-medium">{label}</p>
        <p className="text-2xl sm:text-3xl font-black mt-1">{value}</p>
      </div>
    </div>
  )
}

function ClassItem({ session, onEnroll, isEnrolling }) {
  const scheduledDate = new Date(session.scheduledAt)
  const now = new Date()
  const isToday = scheduledDate.toDateString() === now.toDateString()
  const isTomorrow = scheduledDate.toDateString() === new Date(now.getTime() + 86400000).toDateString()
  
  let timeText
  if (isToday) {
    timeText = `Today at ${scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
  } else if (isTomorrow) {
    timeText = `Tomorrow at ${scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
  } else {
    timeText = scheduledDate.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isEnrolled = session.attendees?.some(a => a.student === session.userId)

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 sm:p-5 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
      <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
        <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <Video className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{session.title}</h3>
          <p className="text-sm text-gray-600 truncate">
            {session.course?.title || 'Course'} • {session.tutor?.name || 'Tutor'}
          </p>
          <p className="text-sm text-gray-900 mt-1">{timeText}</p>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
        <div className="text-left sm:text-right w-full sm:w-auto">
          <p className="text-sm text-gray-600">{session.duration} min</p>
          <p className="text-xs text-gray-500">
            {session.attendees?.length || 0}/{session.maxStudents} enrolled
          </p>
        </div>
        {!isEnrolled && (
          <button
            onClick={() => onEnroll(session._id)}
            disabled={isEnrolling}
            className="btn-primary text-sm flex items-center justify-center gap-1 whitespace-nowrap w-full sm:w-auto min-h-[44px] sm:min-h-0"
          >
            <UserPlus className="w-4 h-4" />
            Enroll
          </button>
        )}
        {isEnrolled && (
          <span className="px-3 py-2 bg-green-100 text-green-700 text-sm font-medium rounded text-center w-full sm:w-auto">
            Enrolled
          </span>
        )}
      </div>
    </div>
  )
}

function MaterialCard({ material }) {
  const getTypeIcon = () => {
    switch (material.type) {
      case 'video':
        return <Play className="w-4 h-4" />
      case 'pdf':
      case 'document':
        return <FileText className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const getTypeColor = () => {
    switch (material.type) {
      case 'video':
        return 'text-red-600 bg-red-50'
      case 'pdf':
        return 'text-blue-600 bg-blue-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <a
      href={material.fileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="p-4 border border-gray-200 rounded-lg hover:border-primary-600 transition cursor-pointer block"
    >
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold mb-2 ${getTypeColor()}`}>
        {getTypeIcon()}
        <span className="uppercase">{material.type}</span>
      </div>
      <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{material.title}</h3>
      <p className="text-sm text-gray-600 line-clamp-1">{material.course?.title || 'Course'}</p>
    </a>
  )
}

import { useQuery } from 'react-query'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { Users, BookOpen, DollarSign, TrendingUp, UserCheck, AlertCircle, HelpCircle, ClipboardList } from 'lucide-react'
import { adminService, sessionService } from '@/services/apiServices'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import ErrorMessage from '@/components/common/ErrorMessage'

export default function AdminDashboard() {
  const { data: analyticsData, isLoading, error } = useQuery(
    'adminAnalytics',
    () => adminService.getAnalytics()
  )

  const { data: usersData } = useQuery(
    'allUsers',
    () => adminService.getUsers({ limit: 10 })
  )

  const { data: pendingTutorsData } = useQuery(
    'pendingTutors',
    adminService.getPendingTutors
  )

  const { data: pendingSessionsData } = useQuery(
    'pendingSessions',
    () => sessionService.getPendingSessions({ limit: 1 })
  )

  if (isLoading) return <LoadingSpinner fullScreen />
  if (error) return <ErrorMessage message={error.message || 'Failed to load analytics'} />

  const analytics = analyticsData?.data || {}
  const recentUsers = usersData?.data || []
  const pendingTutors = pendingTutorsData?.data || []

  const stats = [
    {
      label: 'Total Users',
      value: analytics.totalUsers?.toLocaleString() || '0',
      change: '+12%',
      icon: Users,
      color: 'primary',
    },
    {
      label: 'Active Courses',
      value: analytics.activeCourses?.toString() || '0',
      change: '+8%',
      icon: BookOpen,
      color: 'blue',
    },
    {
      label: 'Total Questions',
      value: analytics.totalQuestions?.toLocaleString() || '0',
      change: '',
      icon: HelpCircle,
      color: 'purple',
    },
    {
      label: 'Quizzes Taken',
      value: analytics.totalQuizzesTaken?.toLocaleString() || '0',
      change: '',
      icon: ClipboardList,
      color: 'teal',
    },
    {
      label: 'Total Revenue',
      value: `$${analytics.totalRevenue?.toLocaleString() || '0'}`,
      change: '+23%',
      icon: DollarSign,
      color: 'green',
    },
    {
      label: 'Pending Tutors',
      value: analytics.pendingTutors?.toString() || '0',
      change: '',
      icon: UserCheck,
      color: 'yellow',
    },
    {
      label: 'Pending Sessions',
      value: pendingSessionsData?.total?.toString() || '0',
      change: '',
      icon: AlertCircle,
      color: 'orange',
    },
  ]

  const revenueData = analytics.revenueTrend || []

  const userGrowthData = analytics.userGrowth || []

  const subscriptionData = analytics.subscriptionData || []

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">Admin Dashboard</h1>
        <p className="text-sm sm:text-base text-gray-600">Platform overview and key metrics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="card">
            <div className="p-4 sm:p-5 md:p-3">
              <div className="flex items-center justify-between mb-3 sm:mb-2">
                <div className={`w-10 h-10 sm:w-8 sm:h-8 bg-${stat.color}-100 rounded-lg flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 sm:w-4 sm:h-4 text-${stat.color}-600`} />
                </div>
                {stat.change && (
                  <span className="text-xs sm:text-xs font-medium text-green-600">{stat.change}</span>
                )}
              </div>
              <h3 className="text-xl sm:text-lg font-bold text-gray-900 mb-1">{stat.value}</h3>
              <p className="text-sm sm:text-xs text-gray-600">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Revenue Trend */}
        <div className="card">
          <div className="p-4 sm:p-5 md:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Revenue Trend</h3>
            <ResponsiveContainer width="100%" height={250} className="min-h-[200px]">
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* User Growth */}
        <div className="card">
          <div className="p-4 sm:p-5 md:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">User Growth</h3>
            <ResponsiveContainer width="100%" height={250} className="min-h-[200px]">
              <BarChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="students" fill="#6366f1" />
                <Bar dataKey="tutors" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Subscription Distribution */}
        <div className="card">
          <div className="p-4 sm:p-5 md:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Subscription Distribution</h3>
            <ResponsiveContainer width="100%" height={200} className="min-h-[180px]">
              <PieChart>
                <Pie
                  data={subscriptionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={55}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {subscriptionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pending Tutor Approvals */}
        <div className="card lg:col-span-2">
          <div className="p-4 sm:p-5 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Pending Tutor Approvals</h3>
              <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium self-start sm:self-auto">
                {pendingTutors.length} pending
              </span>
            </div>

            {pendingTutors.length > 0 ? (
              <div className="space-y-3 sm:space-y-2">
                {pendingTutors.slice(0, 3).map((tutor) => (
                  <div key={tutor._id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-2 p-3 sm:p-2 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3 sm:gap-2">
                      <div className="w-10 h-10 sm:w-8 sm:h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-primary-600 font-medium text-sm sm:text-xs">
                          {tutor.name?.charAt(0)}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 text-sm truncate">{tutor.name}</p>
                        <p className="text-xs text-gray-600 truncate">{tutor.email}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 sm:gap-1 sm:flex-shrink-0">
                      <button className="flex-1 sm:flex-none px-3 py-2 sm:px-2 sm:py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 min-h-[44px] sm:min-h-0">
                        Approve
                      </button>
                      <button className="flex-1 sm:flex-none px-3 py-2 sm:px-2 sm:py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 min-h-[44px] sm:min-h-0">
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-center py-6 sm:py-4 text-sm">No pending approvals</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Users */}
      <div className="card">
        <div className="p-4 sm:p-5 md:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Recent Users</h3>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle px-4 sm:px-0">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 sm:py-1 px-2 sm:px-2 text-xs font-medium text-gray-600 whitespace-nowrap">User</th>
                    <th className="text-left py-2 sm:py-1 px-2 sm:px-2 text-xs font-medium text-gray-600 whitespace-nowrap">Email</th>
                    <th className="text-left py-2 sm:py-1 px-2 sm:px-2 text-xs font-medium text-gray-600 whitespace-nowrap">Role</th>
                    <th className="text-left py-2 sm:py-1 px-2 sm:px-2 text-xs font-medium text-gray-600 whitespace-nowrap">Status</th>
                    <th className="text-left py-2 sm:py-1 px-2 sm:px-2 text-xs font-medium text-gray-600 whitespace-nowrap">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentUsers.slice(0, 5).map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="py-2 sm:py-1 px-2 sm:px-2 text-xs text-gray-900 whitespace-nowrap">{user.name}</td>
                      <td className="py-2 sm:py-1 px-2 sm:px-2 text-xs text-gray-600 whitespace-nowrap">{user.email}</td>
                      <td className="py-2 sm:py-1 px-2 sm:px-2 whitespace-nowrap">
                        <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs font-medium capitalize">
                          {user.role}
                        </span>
                      </td>
                      <td className="py-2 sm:py-1 px-2 sm:px-2 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                          user.status === 'active' ? 'bg-green-100 text-green-700' :
                          user.status === 'suspended' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="py-2 sm:py-1 px-2 sm:px-2 text-xs text-gray-600 whitespace-nowrap">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

import { useQuery } from 'react-query'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { Users, BookOpen, DollarSign, TrendingUp, UserCheck, AlertCircle } from 'lucide-react'
import { adminService } from '@/services/apiServices'
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

  if (isLoading) return <LoadingSpinner fullScreen />
  if (error) return <ErrorMessage message={error.message || 'Failed to load analytics'} />

  const analytics = analyticsData?.data || {}
  const recentUsers = usersData?.data || []
  const pendingTutors = pendingTutorsData?.data || []

  const stats = [
    {
      label: 'Total Users',
      value: '1,248',
      change: '+12%',
      icon: Users,
      color: 'primary',
    },
    {
      label: 'Active Courses',
      value: '156',
      change: '+8%',
      icon: BookOpen,
      color: 'blue',
    },
    {
      label: 'Total Revenue',
      value: '$45,280',
      change: '+23%',
      icon: DollarSign,
      color: 'green',
    },
    {
      label: 'Pending Approvals',
      value: pendingTutors.length,
      change: '',
      icon: AlertCircle,
      color: 'yellow',
    },
  ]

  const revenueData = [
    { month: 'Jan', revenue: 4200 },
    { month: 'Feb', revenue: 5100 },
    { month: 'Mar', revenue: 4800 },
    { month: 'Apr', revenue: 6200 },
    { month: 'May', revenue: 7500 },
    { month: 'Jun', revenue: 8900 },
  ]

  const userGrowthData = [
    { month: 'Jan', students: 420, tutors: 45 },
    { month: 'Feb', students: 510, tutors: 52 },
    { month: 'Mar', students: 610, tutors: 58 },
    { month: 'Apr', students: 720, tutors: 64 },
    { month: 'May', students: 850, tutors: 71 },
    { month: 'Jun', students: 980, tutors: 78 },
  ]

  const subscriptionData = [
    { name: 'Basic', value: 420, color: '#6366f1' },
    { name: 'Standard', value: 680, color: '#8b5cf6' },
    { name: 'Premium', value: 148, color: '#ec4899' },
  ]

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Platform overview and key metrics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="card">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 bg-${stat.color}-100 rounded-lg flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
                {stat.change && (
                  <span className="text-sm font-medium text-green-600">{stat.change}</span>
                )}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue Trend */}
        <div className="card">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
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
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">User Growth</h3>
            <ResponsiveContainer width="100%" height={300}>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Subscription Distribution */}
        <div className="card">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscription Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={subscriptionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
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
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Pending Tutor Approvals</h3>
              <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                {pendingTutors.length} pending
              </span>
            </div>

            {pendingTutors.length > 0 ? (
              <div className="space-y-3">
                {pendingTutors.slice(0, 3).map((tutor) => (
                  <div key={tutor._id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-primary-600 font-medium">
                          {tutor.name?.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{tutor.name}</p>
                        <p className="text-sm text-gray-600">{tutor.email}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700">
                        Approve
                      </button>
                      <button className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700">
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-center py-8">No pending approvals</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Users */}
      <div className="card">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Users</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">User</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Role</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Joined</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.slice(0, 5).map((user) => (
                  <tr key={user._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-900">{user.name}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{user.email}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs font-medium capitalize">
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                        user.status === 'active' ? 'bg-green-100 text-green-700' :
                        user.status === 'suspended' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
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
  )
}

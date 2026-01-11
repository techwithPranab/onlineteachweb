import { useState } from 'react'
import { useQuery } from 'react-query'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
} from 'recharts'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Users,
  Download,
  Calendar,
} from 'lucide-react'
import { adminService } from '@/services/apiServices'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import ErrorMessage from '@/components/common/ErrorMessage'

export default function RevenueAnalytics() {
  const [dateRange, setDateRange] = useState('month')
  const [selectedMetric, setSelectedMetric] = useState('revenue')

  const { data: analyticsData, isLoading, error } = useQuery(
    ['revenueAnalytics', dateRange],
    () => adminService.getAnalytics({ period: dateRange })
  )

  if (isLoading) return <LoadingSpinner fullScreen />
  if (error) return <ErrorMessage message={error.message || 'Failed to load analytics'} />

  const analytics = analyticsData?.data || {}

  // Use real data from analytics API, fallback to sample data
  const revenueData = analytics.revenueTrend || [
    { date: 'Jan 1', revenue: 1200, subscriptions: 800, courses: 400 },
    { date: 'Jan 8', revenue: 1500, subscriptions: 1000, courses: 500 },
    { date: 'Jan 15', revenue: 1800, subscriptions: 1200, courses: 600 },
    { date: 'Jan 22', revenue: 2200, subscriptions: 1500, courses: 700 },
    { date: 'Jan 29', revenue: 2600, subscriptions: 1800, courses: 800 },
    { date: 'Feb 5', revenue: 3000, subscriptions: 2000, courses: 1000 },
  ]

  const subscriptionBreakdown = analytics.subscriptionData?.map(item => ({
    plan: item.name,
    revenue: item.value,
    users: Math.floor(item.value / 10) // Estimate users based on revenue
  })) || [
    { plan: 'Basic', revenue: 4200, users: 420 },
    { plan: 'Standard', revenue: 20400, users: 680 },
    { plan: 'Premium', revenue: 7400, users: 148 },
  ]

  const topCourses = analytics.topCourses || [
    { name: 'Advanced Mathematics', revenue: 5240, students: 68 },
    { name: 'Physics Fundamentals', revenue: 4580, students: 62 },
    { name: 'Chemistry Grade 10', revenue: 3920, students: 56 },
    { name: 'English Literature', revenue: 3450, students: 51 },
    { name: 'Computer Science', revenue: 3100, students: 48 },
  ]

  const monthlyStats = analytics.monthlyStats || [
    { month: 'Jan', revenue: 28500, growth: 12 },
    { month: 'Feb', revenue: 32100, growth: 15 },
    { month: 'Mar', revenue: 29800, growth: 8 },
    { month: 'Apr', revenue: 38200, growth: 22 },
    { month: 'May', revenue: 42500, growth: 18 },
    { month: 'Jun', revenue: 45280, growth: 12 },
  ]

  const stats = [
    {
      label: 'Total Revenue',
      value: `$${analytics.totalRevenue?.toLocaleString() || '45,280'}`,
      change: '+23%',
      trend: 'up',
      icon: DollarSign,
      color: 'green',
    },
    {
      label: 'Subscription Revenue',
      value: `$${analytics.subscriptionRevenue?.toLocaleString() || '32,000'}`,
      change: '+18%',
      trend: 'up',
      icon: CreditCard,
      color: 'blue',
    },
    {
      label: 'Course Sales',
      value: `$${analytics.courseRevenue?.toLocaleString() || '13,280'}`,
      change: '+35%',
      trend: 'up',
      icon: TrendingUp,
      color: 'purple',
    },
    {
      label: 'Active Subscribers',
      value: analytics.totalUsers?.toLocaleString() || '1,248',
      change: '+12%',
      trend: 'up',
      icon: Users,
      color: 'yellow',
    },
  ]

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Revenue Analytics</h1>
          <p className="text-sm text-gray-600">Track and analyze platform revenue performance</p>
        </div>
        <div className="flex gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="input-field text-sm"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
          <button className="btn-primary flex items-center gap-1 text-sm px-3 py-2">
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {stats.map((stat, index) => (
          <div key={index} className="card">
            <div className="p-3">
              <div className="flex items-center justify-between mb-2">
                <div
                  className={`w-8 h-8 bg-${stat.color}-100 rounded-lg flex items-center justify-center`}
                >
                  <stat.icon className={`w-4 h-4 text-${stat.color}-600`} />
                </div>
                <div
                  className={`flex items-center gap-1 text-xs font-medium ${
                    stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {stat.trend === 'up' ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {stat.change}
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">{stat.value}</h3>
              <p className="text-xs text-gray-600">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue Trend */}
      <div className="card mb-4">
        <div className="p-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-900">Revenue Trend</h2>
            <div className="flex gap-1">
              <button
                onClick={() => setSelectedMetric('revenue')}
                className={`px-2 py-1 text-xs rounded-lg ${
                  selectedMetric === 'revenue'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Total Revenue
              </button>
              <button
                onClick={() => setSelectedMetric('subscriptions')}
                className={`px-2 py-1 text-xs rounded-lg ${
                  selectedMetric === 'subscriptions'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Subscriptions
              </button>
              <button
                onClick={() => setSelectedMetric('courses')}
                className={`px-2 py-1 text-xs rounded-lg ${
                  selectedMetric === 'courses'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Courses
              </button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey={selectedMetric}
                stroke="#6366f1"
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
        {/* Subscription Breakdown */}
        <div className="card">
          <div className="p-3">
            <h2 className="text-base font-semibold text-gray-900 mb-3">
              Revenue by Subscription Plan
            </h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={subscriptionBreakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="plan" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Growth */}
        <div className="card">
          <div className="p-3">
            <h2 className="text-base font-semibold text-gray-900 mb-3">Monthly Growth Rate</h2>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={monthlyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="growth" stroke="#f59e0b" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Performing Courses */}
      <div className="card">
        <div className="p-3">
          <h2 className="text-base font-semibold text-gray-900 mb-3">Top Performing Courses</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-1 px-2 text-xs font-medium text-gray-600">Rank</th>
                  <th className="text-left py-1 px-2 text-xs font-medium text-gray-600">Course</th>
                  <th className="text-left py-1 px-2 text-xs font-medium text-gray-600">
                    Students
                  </th>
                  <th className="text-left py-1 px-2 text-xs font-medium text-gray-600">
                    Revenue
                  </th>
                  <th className="text-left py-1 px-2 text-xs font-medium text-gray-600">
                    Avg. per Student
                  </th>
                </tr>
              </thead>
              <tbody>
                {topCourses.map((course, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-1 px-2">
                      <span className="w-5 h-5 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-semibold text-xs">
                        {index + 1}
                      </span>
                    </td>
                    <td className="py-1 px-2 text-xs font-medium text-gray-900">{course.name}</td>
                    <td className="py-1 px-2 text-xs text-gray-600">{course.students}</td>
                    <td className="py-1 px-2 text-xs font-semibold text-gray-900">
                      ${course.revenue.toLocaleString()}
                    </td>
                    <td className="py-1 px-2 text-xs text-gray-600">
                      ${(course.revenue / course.students).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
        <div className="card">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-6 h-6 text-primary-600" />
              <h3 className="text-base font-semibold text-gray-900">This Month</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-2">
              ${analytics.totalRevenue?.toLocaleString() || '45,280'}
            </p>
            <p className="text-sm text-green-600 font-medium">+23% from last month</p>
          </div>
        </div>

        <div className="card">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-6 h-6 text-green-600" />
              <h3 className="text-base font-semibold text-gray-900">Average Growth</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-2">
              {analytics.averageGrowth || 15.8}%
            </p>
            <p className="text-sm text-gray-600">Monthly average</p>
          </div>
        </div>

        <div className="card">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-6 h-6 text-blue-600" />
              <h3 className="text-base font-semibold text-gray-900">ARPU</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-2">
              ${analytics.arpu?.toFixed(2) || '36.28'}
            </p>
            <p className="text-sm text-gray-600">Average revenue per user</p>
          </div>
        </div>
      </div>
    </div>
  )
}

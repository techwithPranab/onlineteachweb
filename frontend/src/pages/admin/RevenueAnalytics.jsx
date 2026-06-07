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
import SEOHead from '@/components/SEO/SEOHead';
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

  // Revenue trend — backend returns { month, revenue, subscriptions, courses }
  // If no real data yet, show zeroed-out structure (not fake numbers)
  const revenueData = analytics.revenueTrend?.length
    ? analytics.revenueTrend
    : []

  const subscriptionBreakdown = analytics.subscriptionData?.map(item => ({
    plan: item.name,
    revenue: item.value,
    users: item.users ?? Math.round(item.value / 100)
  })) || []

  const topCourses = analytics.topCourses || []

  const monthlyStats = analytics.monthlyStats || []

  // Derive change % from monthlyStats: compare last vs second-to-last month
  const latestGrowth = monthlyStats.length >= 2
    ? monthlyStats[monthlyStats.length - 1]?.growth
    : null
  const fmtChange = (v) => v == null ? '—' : v >= 0 ? `+${v}%` : `${v}%`
  const growthTrend = (v) => v == null ? 'up' : v >= 0 ? 'up' : 'down'

  const stats = [
    {
      label: 'Total Revenue',
      value: analytics.totalRevenue != null
        ? `₹${analytics.totalRevenue.toLocaleString('en-IN')}`
        : '₹0',
      change: fmtChange(latestGrowth),
      trend: growthTrend(latestGrowth),
      icon: DollarSign,
      color: 'green',
    },
    {
      label: 'Subscription Revenue',
      value: analytics.subscriptionRevenue != null
        ? `₹${analytics.subscriptionRevenue.toLocaleString('en-IN')}`
        : '₹0',
      change: '—',
      trend: 'up',
      icon: CreditCard,
      color: 'blue',
    },
    {
      label: 'Course Sales',
      value: analytics.courseRevenue != null
        ? `₹${analytics.courseRevenue.toLocaleString('en-IN')}`
        : '₹0',
      change: '—',
      trend: 'up',
      icon: TrendingUp,
      color: 'purple',
    },
    {
      label: 'Active Subscribers',
      value: analytics.totalSubscribers != null
        ? analytics.totalSubscribers.toLocaleString('en-IN')
        : '0',
      change: '—',
      trend: 'up',
      icon: Users,
      color: 'yellow',
    },
  ]

  return (
    <>

    <SEOHead title="Revenue Analytics - Admin" noIndex={true} noFollow={true} />

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
            <AreaChart data={revenueData.length ? revenueData : [{ month: '', revenue: 0, subscriptions: 0, courses: 0 }]}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(v) => `₹${v.toLocaleString('en-IN')}`} />
              <Tooltip formatter={(v) => [`₹${v.toLocaleString('en-IN')}`, '']} />
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
          {revenueData.length === 0 && (
            <p className="text-center text-gray-400 text-sm -mt-2 pb-2">No revenue data for this period</p>
          )}
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
              <BarChart data={subscriptionBreakdown.length ? subscriptionBreakdown : [{ plan: '', revenue: 0 }]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="plan" />
                <YAxis tickFormatter={(v) => `₹${v.toLocaleString('en-IN')}`} />
                <Tooltip formatter={(v) => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']} />
                <Legend />
                <Bar dataKey="revenue" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
            {subscriptionBreakdown.length === 0 && (
              <p className="text-center text-gray-400 text-sm mt-1">No subscription payments yet</p>
            )}
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
                {topCourses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-gray-400 text-sm">
                      No course payment data for this period
                    </td>
                  </tr>
                ) : topCourses.map((course, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-1 px-2">
                      <span className="w-5 h-5 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-semibold text-xs">
                        {index + 1}
                      </span>
                    </td>
                    <td className="py-1 px-2 text-xs font-medium text-gray-900">{course.name}</td>
                    <td className="py-1 px-2 text-xs text-gray-600">{course.students}</td>
                    <td className="py-1 px-2 text-xs font-semibold text-gray-900">
                      ₹{course.revenue.toLocaleString('en-IN')}
                    </td>
                    <td className="py-1 px-2 text-xs text-gray-600">
                      ₹{course.students > 0 ? (course.revenue / course.students).toFixed(2) : '0.00'}
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
              <h3 className="text-base font-semibold text-gray-900">This Period</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-2">
              ₹{analytics.totalRevenue != null ? analytics.totalRevenue.toLocaleString('en-IN') : '0'}
            </p>
            <p className={`text-sm font-medium ${latestGrowth == null ? 'text-gray-500' : latestGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {fmtChange(latestGrowth)} vs previous month
            </p>
          </div>
        </div>

        <div className="card">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-6 h-6 text-green-600" />
              <h3 className="text-base font-semibold text-gray-900">Average Growth</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-2">
              {analytics.averageGrowth != null ? `${analytics.averageGrowth}%` : '—'}
            </p>
            <p className="text-sm text-gray-600">Monthly average (6 months)</p>
          </div>
        </div>

        <div className="card">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-6 h-6 text-blue-600" />
              <h3 className="text-base font-semibold text-gray-900">ARPU</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-2">
              ₹{analytics.arpu != null ? analytics.arpu.toFixed(2) : '0.00'}
            </p>
            <p className="text-sm text-gray-600">Average revenue per user</p>
          </div>
        </div>
      </div>
    </div>


    </>)
}

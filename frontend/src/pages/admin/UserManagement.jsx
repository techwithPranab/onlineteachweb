import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Search, Filter, MoreVertical, UserCheck, UserX, Edit, Trash2 } from 'lucide-react'
import { adminService } from '@/services/apiServices'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import ErrorMessage from '@/components/common/ErrorMessage'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import EmptyState from '@/components/common/EmptyState'

export default function UserManagement() {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showActionMenu, setShowActionMenu] = useState(null)
  const [selectedUser, setSelectedUser] = useState(null)
  const [showStatusDialog, setShowStatusDialog] = useState(false)
  const [newStatus, setNewStatus] = useState('')

  const { data: usersData, isLoading, error } = useQuery(
    ['users', { search: searchQuery, role: roleFilter, status: statusFilter }],
    () => adminService.getUsers({
      search: searchQuery,
      role: roleFilter,
      status: statusFilter,
    })
  )

  const updateStatusMutation = useMutation(
    ({ userId, status, reason }) => adminService.updateUserStatus(userId, status, reason),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users')
        setShowStatusDialog(false)
        setSelectedUser(null)
      },
    }
  )

  const users = usersData?.data || []

  const handleStatusChange = (user, status) => {
    setSelectedUser(user)
    setNewStatus(status)
    setShowStatusDialog(true)
    setShowActionMenu(null)
  }

  const confirmStatusChange = () => {
    updateStatusMutation.mutate({
      userId: selectedUser._id,
      status: newStatus,
      reason: `Admin ${newStatus} user account`,
    })
  }

  if (isLoading) return <LoadingSpinner fullScreen />
  if (error) return <ErrorMessage message={error.message || 'Failed to load users'} />

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
        <p className="text-gray-600">Manage all platform users and their access</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10 w-full"
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="input-field"
          >
            <option value="">All Roles</option>
            <option value="student">Students</option>
            <option value="tutor">Tutors</option>
            <option value="admin">Admins</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="card">
          <div className="p-4">
            <p className="text-sm text-gray-600 mb-1">Total Users</p>
            <p className="text-2xl font-bold text-gray-900">{users.length}</p>
          </div>
        </div>
        <div className="card">
          <div className="p-4">
            <p className="text-sm text-gray-600 mb-1">Students</p>
            <p className="text-2xl font-bold text-primary-600">
              {users.filter((u) => u.role === 'student').length}
            </p>
          </div>
        </div>
        <div className="card">
          <div className="p-4">
            <p className="text-sm text-gray-600 mb-1">Tutors</p>
            <p className="text-2xl font-bold text-primary-600">
              {users.filter((u) => u.role === 'tutor').length}
            </p>
          </div>
        </div>
        <div className="card">
          <div className="p-4">
            <p className="text-sm text-gray-600 mb-1">Active</p>
            <p className="text-2xl font-bold text-green-600">
              {users.filter((u) => u.status === 'active').length}
            </p>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-600">User</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-600">Email</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-600">Role</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-600">Status</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-600">Joined</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? (
                users.map((user) => (
                  <tr key={user._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-primary-600 font-medium">
                            {user.name?.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-500">ID: {user._id.slice(-6)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-900">{user.email}</td>
                    <td className="py-4 px-6">
                      <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium capitalize">
                        {user.role}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                          user.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : user.status === 'suspended'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6">
                      <div className="relative">
                        <button
                          onClick={() =>
                            setShowActionMenu(showActionMenu === user._id ? null : user._id)
                          }
                          className="p-2 hover:bg-gray-100 rounded-lg"
                        >
                          <MoreVertical className="w-5 h-5 text-gray-600" />
                        </button>

                        {showActionMenu === user._id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                            <button
                              onClick={() => handleStatusChange(user, 'active')}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <UserCheck className="w-4 h-4" />
                              Activate
                            </button>
                            <button
                              onClick={() => handleStatusChange(user, 'suspended')}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <UserX className="w-4 h-4" />
                              Suspend
                            </button>
                            <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                              <Edit className="w-4 h-4" />
                              Edit
                            </button>
                            <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-12">
                    <EmptyState
                      icon={Filter}
                      title="No users found"
                      description="Try adjusting your search or filters"
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {users.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {users.length} user{users.length !== 1 ? 's' : ''}
            </p>
            <div className="flex gap-2">
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
                Previous
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Status Change Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showStatusDialog}
        onClose={() => setShowStatusDialog(false)}
        onConfirm={confirmStatusChange}
        title={`${newStatus === 'active' ? 'Activate' : 'Suspend'} User`}
        message={`Are you sure you want to ${newStatus} ${selectedUser?.name}? ${
          newStatus === 'suspended'
            ? 'This will prevent the user from accessing the platform.'
            : 'This will restore the user\'s access to the platform.'
        }`}
        confirmText={newStatus === 'active' ? 'Activate' : 'Suspend'}
        variant={newStatus === 'suspended' ? 'danger' : 'primary'}
      />
    </div>
  )
}

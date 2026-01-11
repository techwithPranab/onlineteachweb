import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Search, Filter, UserCheck, UserX, Edit, Trash2 } from 'lucide-react'
import { adminService } from '@/services/apiServices'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import ErrorMessage from '@/components/common/ErrorMessage'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import Modal from '@/components/common/Modal'
import EmptyState from '@/components/common/EmptyState'

export default function UserManagement() {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [showStatusDialog, setShowStatusDialog] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [showEditModal, setShowEditModal] = useState(false)
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    role: '',
    status: '',
    bio: '',
    phone: '',
    grade: '',
    subjects: [],
    experience: '',
    notifications: {
      email: true,
      sms: false,
      push: true
    }
  })

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

  const updateUserMutation = useMutation(
    ({ userId, ...userData }) => adminService.updateUser(userId, userData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users')
      },
    }
  )

  const deleteUserMutation = useMutation(
    (userId) => adminService.deleteUser(userId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users')
        alert('User deleted successfully');
      },
      onError: (error) => {
        console.error('Delete user error:', error);
        alert(`Failed to delete user: ${error.response?.data?.message || error.message}`);
      },
    }
  )

  const users = usersData?.data || []

  const handleStatusChange = (user, status) => {
    setSelectedUser(user)
    setNewStatus(status)
    setShowStatusDialog(true)
  }

  const confirmStatusChange = () => {
    updateStatusMutation.mutate({
      userId: selectedUser._id,
      status: newStatus,
      reason: `Admin ${newStatus} user account`,
    })
  }

  const handleEditUser = (user) => {
    setSelectedUser(user)
    setEditFormData({
      name: user.name || '',
      email: user.email || '',
      role: user.role || 'student',
      status: user.status || 'active',
      bio: user.bio || '',
      phone: user.phone || '',
      grade: user.grade || '',
      subjects: user.subjects || [],
      experience: user.experience || '',
      notifications: user.notifications || {
        email: true,
        sms: false,
        push: true
      }
    })
    setShowEditModal(true)
    setShowActionMenu(null)
  }

  const handleDeleteUser = (user) => {
    if (user.role === 'admin') {
      alert('Cannot delete admin users');
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${user.name}? This action cannot be undone.`)) {
      console.log('Deleting user:', user._id);
      deleteUserMutation.mutate(user._id);
    }
  }

  const handleSubmitEdit = () => {
    updateUserMutation.mutate({
      userId: selectedUser._id,
      ...editFormData
    })
    setShowEditModal(false)
    setSelectedUser(null)
  }

  const handleCloseEditModal = () => {
    setShowEditModal(false)
    setSelectedUser(null)
    setEditFormData({
      name: '',
      email: '',
      role: '',
      status: '',
      bio: '',
      phone: '',
      grade: '',
      subjects: [],
      experience: '',
      notifications: {
        email: true,
        sms: false,
        push: true
      }
    })
  }

  if (isLoading) return <LoadingSpinner fullScreen />
  if (error) return <ErrorMessage message={error.message || 'Failed to load users'} />

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">User Management</h1>
        <p className="text-sm text-gray-600">Manage all platform users and their access</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
        <div className="card">
          <div className="p-2">
            <p className="text-xs text-gray-600 mb-1">Total Users</p>
            <p className="text-lg font-bold text-gray-900">{users.length}</p>
          </div>
        </div>
        <div className="card">
          <div className="p-2">
            <p className="text-xs text-gray-600 mb-1">Students</p>
            <p className="text-lg font-bold text-primary-600">
              {users.filter((u) => u.role === 'student').length}
            </p>
          </div>
        </div>
        <div className="card">
          <div className="p-2">
            <p className="text-xs text-gray-600 mb-1">Tutors</p>
            <p className="text-lg font-bold text-primary-600">
              {users.filter((u) => u.role === 'tutor').length}
            </p>
          </div>
        </div>
        <div className="card">
          <div className="p-2">
            <p className="text-xs text-gray-600 mb-1">Active</p>
            <p className="text-lg font-bold text-green-600">
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
                <th className="text-left py-2 px-4 text-xs font-medium text-gray-600">User</th>
                <th className="text-left py-2 px-4 text-xs font-medium text-gray-600">Email</th>
                <th className="text-left py-2 px-4 text-xs font-medium text-gray-600">Role</th>
                <th className="text-left py-2 px-4 text-xs font-medium text-gray-600">Status</th>
                <th className="text-left py-2 px-4 text-xs font-medium text-gray-600">Joined</th>
                <th className="text-left py-2 px-4 text-xs font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? (
                users.map((user) => (
                  <tr key={user._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-primary-600 font-medium text-sm">
                            {user.name?.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{user.name}</p>
                          <p className="text-xs text-gray-500">ID: {user._id.slice(-6)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-2 px-4 text-xs text-gray-900">{user.email}</td>
                    <td className="py-2 px-4">
                      <span className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs font-medium capitalize">
                        {user.role}
                      </span>
                    </td>
                    <td className="py-2 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
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
                    <td className="py-2 px-4 text-xs text-gray-600">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-2 px-4">
                      <div className="flex items-center gap-1">
                        {/* Status Change Buttons */}
                        {user.status === 'active' ? (
                          <button
                            onClick={() => handleStatusChange(user, 'suspended')}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Suspend User"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStatusChange(user, 'active')}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Activate User"
                          >
                            <UserCheck className="w-4 h-4" />
                          </button>
                        )}

                        {/* Edit Button */}
                        <button
                          onClick={() => handleEditUser(user)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit User"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteUser(user)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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

      {/* Edit User Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        title="Edit User"
        size="lg"
      >
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                value={editFormData.name}
                onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                value={editFormData.email}
                onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Role and Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role *
              </label>
              <select
                value={editFormData.role}
                onChange={(e) => setEditFormData({...editFormData, role: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="student">Student</option>
                <option value="tutor">Tutor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status *
              </label>
              <select
                value={editFormData.status}
                onChange={(e) => setEditFormData({...editFormData, status: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={editFormData.phone}
                onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            {editFormData.role === 'student' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Grade
                </label>
                <select
                  value={editFormData.grade}
                  onChange={(e) => setEditFormData({...editFormData, grade: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Select Grade</option>
                  {Array.from({length: 12}, (_, i) => i + 1).map(grade => (
                    <option key={grade} value={grade}>{grade}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bio
            </label>
            <textarea
              value={editFormData.bio}
              onChange={(e) => setEditFormData({...editFormData, bio: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Brief description about the user..."
            />
          </div>

          {/* Tutor-specific fields */}
          {editFormData.role === 'tutor' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Experience (years)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editFormData.experience}
                    onChange={(e) => setEditFormData({...editFormData, experience: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subjects
                  </label>
                  <input
                    type="text"
                    value={editFormData.subjects.join(', ')}
                    onChange={(e) => setEditFormData({
                      ...editFormData, 
                      subjects: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Math, Physics, Chemistry"
                  />
                </div>
              </div>
            </>
          )}

          {/* Notification Settings */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notification Preferences
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={editFormData.notifications.email}
                  onChange={(e) => setEditFormData({
                    ...editFormData,
                    notifications: {...editFormData.notifications, email: e.target.checked}
                  })}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">Email notifications</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={editFormData.notifications.sms}
                  onChange={(e) => setEditFormData({
                    ...editFormData,
                    notifications: {...editFormData.notifications, sms: e.target.checked}
                  })}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">SMS notifications</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={editFormData.notifications.push}
                  onChange={(e) => setEditFormData({
                    ...editFormData,
                    notifications: {...editFormData.notifications, push: e.target.checked}
                  })}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">Push notifications</span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={handleCloseEditModal}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmitEdit}
            disabled={updateUserMutation.isLoading}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {updateUserMutation.isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </Modal>
    </div>
  )
}

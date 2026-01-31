import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery } from 'react-query'
import { 
  User, 
  Mail, 
  Lock, 
  Camera, 
  Save, 
  Bell, 
  Shield, 
  Trash2,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Upload
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { userService } from '@/services/apiServices'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import ErrorMessage from '@/components/common/ErrorMessage'
import ConfirmDialog from '@/components/common/ConfirmDialog'

export default function ProfileSettings() {
  const { user, updateUser } = useAuthStore()
  const [activeTab, setActiveTab] = useState('profile')
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  })
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [qualifications, setQualifications] = useState([])
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false
  })
  const addQualification = () => {
    setQualifications([...qualifications, { degree: '', institution: '', year: '' }])
  }

  const removeQualification = (index) => {
    setQualifications(qualifications.filter((_, i) => i !== index))
  }

  const updateQualification = (index, field, value) => {
    const updated = [...qualifications]
    updated[index][field] = value
    setQualifications(updated)
  }

  // Form for profile information
  const profileForm = useForm({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      bio: user?.bio || '',
      subjects: user?.subjects || [],
      experience: user?.experience || '',
    }
  })

  // Form for password change
  const passwordForm = useForm({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  })

  // Get user profile data
  const { data: profileData, isLoading, error } = useQuery(
    'userProfile',
    () => userService.getProfile(),
    {
      onSuccess: (data) => {
        profileForm.reset(data.user)
        setQualifications(data.user.qualifications || [])
        setNotifications(data.user.notifications || notifications)
      }
    }
  )

  // Update profile mutation
  const updateProfileMutation = useMutation(
    (data) => userService.updateProfile(data),
    {
      onSuccess: (data) => {
        updateUser(data)
        alert('Profile updated successfully!')
      },
      onError: (error) => {
        alert('Failed to update profile: ' + error.message)
      }
    }
  )

  // Change password mutation
  const changePasswordMutation = useMutation(
    (data) => userService.changePassword(data),
    {
      onSuccess: () => {
        passwordForm.reset()
        alert('Password changed successfully!')
      },
      onError: (error) => {
        alert('Failed to change password: ' + error.message)
      }
    }
  )

  // Update notifications mutation
  const updateNotificationsMutation = useMutation(
    (data) => userService.updateNotifications(data),
    {
      onSuccess: () => {
        alert('Notification preferences updated!')
      }
    }
  )

  // Delete account mutation
  const deleteAccountMutation = useMutation(
    () => userService.deleteAccount(),
    {
      onSuccess: () => {
        alert('Account deleted successfully')
        // Logout and redirect
        window.location.href = '/'
      }
    }
  )

  // Upload avatar mutation
  const uploadAvatarMutation = useMutation(
    (file) => userService.uploadAvatar(file),
    {
      onSuccess: (data) => {
        updateUser(data.user)
        setAvatarPreview(null)
        alert('Avatar updated successfully!')
      },
      onError: (error) => {
        alert('Failed to upload avatar: ' + error.message)
      }
    }
  )

  const handleProfileSubmit = (data) => {
    const profileData = {
      ...data,
      qualifications: qualifications.filter(q => q.degree.trim() || q.institution.trim()) // Filter out empty qualifications
    }
    updateProfileMutation.mutate(profileData)
  }

  const handlePasswordSubmit = (data) => {
    if (data.newPassword !== data.confirmPassword) {
      alert('New passwords do not match')
      return
    }
    changePasswordMutation.mutate(data)
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB')
        return
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file')
        return
      }
      
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result)
      }
      reader.readAsDataURL(file)
      
      // Upload avatar to server
      uploadAvatarMutation.mutate(file)
    }
  }

  const handleNotificationChange = (key, value) => {
    const newNotifications = { ...notifications, [key]: value }
    setNotifications(newNotifications)
    updateNotificationsMutation.mutate(newNotifications)
  }

  const handleDeleteAccount = () => {
    deleteAccountMutation.mutate()
    setShowDeleteDialog(false)
  }

  const tabs = [
    { id: 'profile', label: 'Profile Information', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy & Account', icon: Shield }
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorMessage 
          title="Failed to load profile" 
          message={error.message} 
        />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Header */}
      <div className="genz-card mb-4 sm:mb-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
        <div className="p-4 sm:p-5 lg:p-6">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent animate-shimmer mb-2">
            ⚙️ Profile Settings
          </h1>
          <p className="text-gray-600 text-sm sm:text-base lg:text-lg">Manage your account settings and preferences 🚀</p>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="genz-card relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-400"></div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 overflow-x-auto bg-gradient-to-r from-emerald-50 to-teal-50 scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-sm sm:text-base font-semibold transition-all duration-300 whitespace-nowrap hover:bg-white/50 min-h-[44px] ${
                activeTab === tab.id
                  ? 'text-emerald-600 border-b-2 border-emerald-500 bg-white/80 shadow-sm'
                  : 'text-gray-600 hover:text-emerald-600'
              }`}
            >
              <tab.icon className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-5 lg:p-6">
          {/* Profile Information Tab */}
          {activeTab === 'profile' && (
            <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-6">
              {/* Avatar Section */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
                <div className="relative">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 bg-gray-200 rounded-full overflow-hidden">
                    {avatarPreview || user?.avatar ? (
                      <img 
                        src={avatarPreview || user.avatar} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 p-2 bg-primary-600 rounded-full text-white cursor-pointer hover:bg-primary-700 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center">
                    <Camera className="w-4 h-4" />
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>
                </div>
                <div className="text-center sm:text-left">
                  <h3 className="font-medium text-gray-900 text-base sm:text-lg">Profile Photo</h3>
                  <p className="text-sm sm:text-base text-gray-500 mt-1">
                    Choose a photo to represent your profile
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Max 5MB, JPG/PNG only</p>
                </div>
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    {...profileForm.register('name', { required: 'Name is required' })}
                    className="w-full px-3 py-2 sm:px-4 sm:py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all text-sm sm:text-base bg-white min-h-[44px]"
                  />
                  {profileForm.formState.errors.name && (
                    <p className="text-red-500 text-sm mt-1">
                      {profileForm.formState.errors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    {...profileForm.register('email', { required: 'Email is required' })}
                    className="w-full px-3 py-2 sm:px-4 sm:py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all text-sm sm:text-base bg-white min-h-[44px]"
                  />
                  {profileForm.formState.errors.email && (
                    <p className="text-red-500 text-sm mt-1">
                      {profileForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    {...profileForm.register('phone')}
                    className="w-full px-3 py-2 sm:px-4 sm:py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all text-sm sm:text-base bg-white min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <input
                    type="text"
                    value={user?.role}
                    disabled
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-500 text-sm sm:text-base"
                  />
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                </label>
                <textarea
                  {...profileForm.register('bio')}
                  rows="4"
                  placeholder="Tell us about yourself..."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all text-sm sm:text-base bg-white resize-none"
                />
              </div>

              {/* Role-specific fields for tutors */}
              {user?.role === 'tutor' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subjects
                    </label>
                    <input
                      type="text"
                      {...profileForm.register('subjects')}
                      placeholder="Mathematics, Physics, Chemistry..."
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all text-sm sm:text-base bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Experience
                    </label>
                    <textarea
                      {...profileForm.register('experience')}
                      rows="3"
                      placeholder="Describe your teaching experience..."
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all text-sm sm:text-base bg-white resize-none"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Qualifications
                      </label>
                      <button
                        type="button"
                        onClick={addQualification}
                        className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                      >
                        + Add Qualification
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      {qualifications.map((qual, index) => (
                        <div key={index} className="p-3 sm:p-4 border border-gray-200 rounded-xl bg-white">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-3">
                            <div className="sm:col-span-2 lg:col-span-1">
                              <label className="block text-xs font-medium text-gray-700 mb-1">Degree/Certificate</label>
                              <input
                                type="text"
                                placeholder="Degree/Certificate"
                                value={qual.degree}
                                onChange={(e) => updateQualification(index, 'degree', e.target.value)}
                                className="w-full px-3 py-2 sm:px-4 sm:py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all text-sm bg-white min-h-[44px]"
                              />
                            </div>
                            <div className="sm:col-span-2 lg:col-span-1">
                              <label className="block text-xs font-medium text-gray-700 mb-1">Institution</label>
                              <input
                                type="text"
                                placeholder="Institution"
                                value={qual.institution}
                                onChange={(e) => updateQualification(index, 'institution', e.target.value)}
                                className="w-full px-3 py-2 sm:px-4 sm:py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all text-sm bg-white min-h-[44px]"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Year</label>
                              <input
                                type="number"
                                placeholder="Year"
                                value={qual.year}
                                onChange={(e) => updateQualification(index, 'year', e.target.value)}
                                className="w-full px-3 py-2 sm:px-4 sm:py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all text-sm bg-white min-h-[44px]"
                                min="1950"
                                max={new Date().getFullYear()}
                              />
                            </div>
                          </div>
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => removeQualification(index)}
                              className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                      
                      {qualifications.length === 0 && (
                        <p className="text-sm text-gray-500 italic">No qualifications added yet. Click "Add Qualification" to add your educational background.</p>
                      )}
                    </div>
                  </div>
                </>
              )}

              <div className="flex justify-start sm:justify-end">
                <button
                  type="submit"
                  disabled={updateProfileMutation.isLoading}
                  className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm sm:text-base min-h-[44px] flex items-center justify-center"
                >
                  {updateProfileMutation.isLoading ? (
                    <LoadingSpinner size="small" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Changes
                </button>
              </div>
            </form>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-4 sm:space-y-6">
              <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-4 sm:space-y-6">
                <h3 className="text-base sm:text-lg font-medium text-gray-900">Change Password</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword.current ? 'text' : 'password'}
                      {...passwordForm.register('currentPassword', { required: 'Current password is required' })}
                      className="w-full px-3 py-2 sm:px-4 sm:py-3 pr-12 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all text-sm sm:text-base bg-white min-h-[44px]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(prev => ({ ...prev, current: !prev.current }))}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 min-h-[44px] min-w-[44px] flex items-center justify-center"
                    >
                      {showPassword.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword.new ? 'text' : 'password'}
                      {...passwordForm.register('newPassword', { 
                        required: 'New password is required',
                        minLength: { value: 8, message: 'Password must be at least 8 characters' }
                      })}
                      className="w-full px-3 py-2 sm:px-4 sm:py-3 pr-12 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all text-sm sm:text-base bg-white min-h-[44px]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(prev => ({ ...prev, new: !prev.new }))}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 min-h-[44px] min-w-[44px] flex items-center justify-center"
                    >
                      {showPassword.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword.confirm ? 'text' : 'password'}
                      {...passwordForm.register('confirmPassword', { required: 'Please confirm your password' })}
                      className="w-full px-3 py-2 sm:px-4 sm:py-3 pr-12 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all text-sm sm:text-base bg-white min-h-[44px]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(prev => ({ ...prev, confirm: !prev.confirm }))}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 min-h-[44px] min-w-[44px] flex items-center justify-center"
                    >
                      {showPassword.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-start sm:justify-end">
                  <button
                    type="submit"
                    disabled={changePasswordMutation.isLoading}
                    className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm sm:text-base min-h-[44px] flex items-center justify-center"
                  >
                    {changePasswordMutation.isLoading ? (
                      <LoadingSpinner size="small" />
                    ) : (
                      <Lock className="w-4 h-4 mr-2" />
                    )}
                    Update Password
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-4 sm:space-y-6">
              <h3 className="text-base sm:text-lg font-medium text-gray-900">Notification Preferences</h3>
              
              <div className="space-y-4 sm:space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">Email Notifications</h4>
                    <p className="text-xs sm:text-sm text-gray-500">Receive notifications via email</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer self-start sm:self-center">
                    <input
                      type="checkbox"
                      checked={notifications.email}
                      onChange={(e) => handleNotificationChange('email', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">Push Notifications</h4>
                    <p className="text-xs sm:text-sm text-gray-500">Receive browser push notifications</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer self-start sm:self-center">
                    <input
                      type="checkbox"
                      checked={notifications.push}
                      onChange={(e) => handleNotificationChange('push', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">SMS Notifications</h4>
                    <p className="text-xs sm:text-sm text-gray-500">Receive notifications via text message</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer self-start sm:self-center">
                    <input
                      type="checkbox"
                      checked={notifications.sms}
                      onChange={(e) => handleNotificationChange('sms', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">Marketing Communications</h4>
                    <p className="text-xs sm:text-sm text-gray-500">Receive updates about new features and promotions</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer self-start sm:self-center">
                    <input
                      type="checkbox"
                      checked={notifications.marketing}
                      onChange={(e) => handleNotificationChange('marketing', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Privacy & Account Tab */}
          {activeTab === 'privacy' && (
            <div className="space-y-4 sm:space-y-6">
              <h3 className="text-base sm:text-lg font-medium text-gray-900">Privacy & Account</h3>
              
              {/* Account Status */}
              <div className="bg-gray-50 p-3 sm:p-4 rounded-xl">
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mr-2" />
                  <span className="font-medium text-gray-900 text-sm sm:text-base">Account Status: Active</span>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                  Your account is active and in good standing
                </p>
              </div>

              {/* Data Export */}
              <div className="border border-gray-200 rounded-xl p-3 sm:p-4">
                <h4 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">Export Your Data</h4>
                <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                  Download a copy of all your data including profile information, courses, and activities.
                </p>
                <button className="flex items-center px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm">
                  <Upload className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  Request Data Export
                </button>
              </div>

              {/* Delete Account */}
              <div className="border border-red-200 rounded-xl p-3 sm:p-4 bg-red-50">
                <h4 className="font-medium text-red-900 mb-2 text-sm sm:text-base">Delete Account</h4>
                <p className="text-xs sm:text-sm text-red-700 mb-3 sm:mb-4">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                <button
                  onClick={() => setShowDeleteDialog(true)}
                  className="flex items-center px-3 sm:px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all text-sm"
                >
                  <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  Delete Account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Account Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteAccount}
        title="Delete Account"
        message="Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed."
        confirmButtonText="Delete Account"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
        icon={<AlertCircle className="w-6 h-6 text-red-600" />}
      />
    </div>
  )
}

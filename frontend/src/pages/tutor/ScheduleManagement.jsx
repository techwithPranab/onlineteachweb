import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Calendar as CalendarIcon, Plus, Edit, Trash2, Clock, Users, Video, ChevronLeft, ChevronRight, Filter } from 'lucide-react'
import { sessionService, courseService } from '@/services/apiServices'
import { useAuthStore } from '@/store/authStore'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import ErrorMessage from '@/components/common/ErrorMessage'
import Modal from '@/components/common/Modal'
import ConfirmDialog from '@/components/common/ConfirmDialog'

export default function ScheduleManagement() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState('week') // 'day', 'week', 'month'
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedSession, setSelectedSession] = useState(null)
  const [selectedCourse, setSelectedCourse] = useState('')
  const [selectedGrade, setSelectedGrade] = useState('')
  
  const [formData, setFormData] = useState({
    courseId: '',
    title: '',
    description: '',
    scheduledAt: '',
    duration: 60,
    maxStudents: 30,
    isPaid: true,
  })

  // Fetch tutor's courses
  const { data: coursesData } = useQuery(
    ['tutorCourses', user?._id],
    () => courseService.getCourses({ tutorId: user._id })
  )

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : name === 'isPaid' ? value === 'true' : value
    }))
  }

  // Fetch sessions
  const { data: sessionsData, isLoading, error, refetch } = useQuery(
    ['tutorSessions', user?._id, selectedCourse],
    () => sessionService.getSessions({ 
      tutorId: user._id,
      courseId: selectedCourse || undefined
    })
  )

  // Create session mutation
  const createSessionMutation = useMutation(
    (data) => sessionService.createSession(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('tutorSessions')
        setShowCreateModal(false)
        resetForm()
      },
      onError: (error) => {
        console.error('Error creating session:', error)
        alert(`Failed to create session: ${error.response?.data?.message || error.message}`)
      },
    }
  )

  // Update session mutation
  const updateSessionMutation = useMutation(
    ({ id, data }) => sessionService.updateSession(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('tutorSessions')
        setShowEditModal(false)
        setSelectedSession(null)
      },
    }
  )

  // Delete session mutation
  const deleteSessionMutation = useMutation(
    (id) => sessionService.deleteSession(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('tutorSessions')
        setShowDeleteDialog(false)
        setSelectedSession(null)
      },
    }
  )

  const courses = coursesData?.courses || []
  const sessions = sessionsData?.sessions || []

  // Filter courses based on selected grade
  const filteredCourses = selectedGrade
    ? courses.filter(course => course.grade === parseInt(selectedGrade))
    : courses

  // Generate grade options (1-12)
  const gradeOptions = Array.from({ length: 12 }, (_, i) => i + 1)

  const resetForm = () => {
    setFormData({
      courseId: '',
      title: '',
      description: '',
      scheduledAt: '',
      duration: 60,
      maxStudents: 30,
      isPaid: true,
    })
    setSelectedGrade('')
  }

  const handleCreateSession = (e) => {
    e.preventDefault()
    
    // Validate form data
    if (!formData.courseId) {
      alert('Please select a course')
      return
    }
    
    if (!formData.title.trim()) {
      alert('Please enter a session title')
      return
    }
    
    if (!formData.scheduledAt) {
      alert('Please select a date and time')
      return
    }
    
    if (!formData.duration || formData.duration < 15) {
      alert('Duration must be at least 15 minutes')
      return
    }
    
    // Ensure scheduledAt is in the future
    const scheduledDate = new Date(formData.scheduledAt)
    if (scheduledDate <= new Date()) {
      alert('Session must be scheduled in the future')
      return
    }
    
    const sessionData = {
      courseId: formData.courseId,
      title: formData.title.trim(),
      description: formData.description.trim(),
      scheduledAt: scheduledDate.toISOString(),
      duration: parseInt(formData.duration),
      maxStudents: parseInt(formData.maxStudents) || 30,
      isPaid: Boolean(formData.isPaid)
    }
    
    console.log('Creating session with data:', sessionData)
    createSessionMutation.mutate(sessionData)
  }

  const handleUpdateSession = (e) => {
    e.preventDefault()
    updateSessionMutation.mutate({
      id: selectedSession._id,
      data: formData,
    })
  }

  const handleEditClick = (session) => {
    setSelectedSession(session)
    setFormData({
      courseId: session.course._id,
      title: session.title,
      description: session.description,
      scheduledAt: new Date(session.scheduledAt).toISOString().slice(0, 16),
      duration: session.duration,
      maxStudents: session.maxStudents,
      isPaid: session.isPaid,
    })
    setShowEditModal(true)
  }

  const handleDeleteClick = (session) => {
    setSelectedSession(session)
    setShowDeleteDialog(true)
  }

  const confirmDelete = () => {
    deleteSessionMutation.mutate(selectedSession._id)
  }

  // Calendar navigation
  const navigatePrevious = () => {
    const newDate = new Date(currentDate)
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() - 1)
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7)
    } else {
      newDate.setMonth(newDate.getMonth() - 1)
    }
    setCurrentDate(newDate)
  }

  const navigateNext = () => {
    const newDate = new Date(currentDate)
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + 1)
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
  }

  const navigateToday = () => {
    setCurrentDate(new Date())
  }

  // Get sessions for current view
  const getSessionsForView = () => {
    const start = new Date(currentDate)
    const end = new Date(currentDate)
    
    if (viewMode === 'day') {
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)
    } else if (viewMode === 'week') {
      const day = start.getDay()
      start.setDate(start.getDate() - day)
      end.setDate(start.getDate() + 6)
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)
    } else {
      start.setDate(1)
      end.setMonth(end.getMonth() + 1, 0)
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)
    }

    return sessions.filter((session) => {
      const sessionDate = new Date(session.scheduledAt)
      return sessionDate >= start && sessionDate <= end
    })
  }

  const visibleSessions = getSessionsForView()

  if (isLoading) return <LoadingSpinner fullScreen />
  if (error) return <ErrorMessage message={error.message || 'Failed to load schedule'} onRetry={refetch} />

  const SessionForm = ({ onSubmit, isEdit = false }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Grade Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Grade</label>
        <select
          value={selectedGrade}
          onChange={(e) => setSelectedGrade(e.target.value)}
          className="input-field w-full"
        >
          <option value="">All Grades</option>
          {gradeOptions.map((grade) => (
            <option key={grade} value={grade}>
              Grade {grade}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Course *</label>
        <select
          name="courseId"
          value={formData.courseId}
          onChange={handleInputChange}
          required
          className="input-field w-full"
        >
          <option value="">Select Course</option>
          {filteredCourses.map((course) => (
            <option key={course._id} value={course._id}>
              {course.title} - Grade {course.grade}
            </option>
          ))}
        </select>
        {filteredCourses.length === 0 && selectedGrade && (
          <p className="text-sm text-gray-500 mt-1">No courses available for Grade {selectedGrade}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Session Title *</label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          required
          className="input-field w-full"
          placeholder="e.g., Introduction to Algebra"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          rows={3}
          className="input-field w-full"
          placeholder="What will be covered in this session?"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Date & Time *</label>
          <input
            type="datetime-local"
            name="scheduledAt"
            value={formData.scheduledAt}
            onChange={handleInputChange}
            required
            className="input-field w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes) *</label>
          <input
            type="number"
            value={formData.duration}
            onChange={(e) => {
              const value = e.target.value;
              const numValue = value === '' ? '' : parseInt(value);
              setFormData({ ...formData, duration: numValue === '' ? 60 : Math.max(15, numValue) });
            }}
            onBlur={(e) => {
              const value = formData.duration;
              if (value === '' || value < 15) {
                setFormData({ ...formData, duration: 60 });
              }
            }}
            required
            min="15"
            step="15"
            className="input-field w-full"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Max Students</label>
          <input
            type="number"
            name="maxStudents"
            value={formData.maxStudents}
            onChange={handleInputChange}
            min="1"
            className="input-field w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Access</label>
          <select
            name="isPaid"
            value={formData.isPaid.toString()}
            onChange={handleInputChange}
            className="input-field w-full"
          >
            <option value="false">Free</option>
            <option value="true">Paid Only</option>
          </select>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={() => {
            isEdit ? setShowEditModal(false) : setShowCreateModal(false)
            resetForm()
          }}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={createSessionMutation.isLoading || updateSessionMutation.isLoading}
          className="flex-1 btn-primary"
        >
          {createSessionMutation.isLoading || updateSessionMutation.isLoading ? (
            <><LoadingSpinner size="sm" /> Saving...</>
          ) : (
            isEdit ? 'Update Session' : 'Create Session'
          )}
        </button>
      </div>
    </form>
  )

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Schedule Management</h1>
        <p className="text-gray-600">Manage your teaching sessions and availability</p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('day')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                viewMode === 'day' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Day
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                viewMode === 'week' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                viewMode === 'month' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Month
            </button>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-4">
            <button onClick={navigatePrevious} className="p-2 hover:bg-gray-100 rounded-lg">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={navigateToday} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg">
              Today
            </button>
            <button onClick={navigateNext} className="p-2 hover:bg-gray-100 rounded-lg">
              <ChevronRight className="w-5 h-5" />
            </button>
            <span className="text-lg font-semibold text-gray-900 min-w-[180px] text-center">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="input-field"
            >
              <option value="">All Courses</option>
              {courses.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.title}
                </option>
              ))}
            </select>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary flex items-center gap-2 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Create Session
            </button>
          </div>
        </div>
      </div>

      {/* Sessions List */}
      <div className="grid grid-cols-1 gap-4">
        {visibleSessions.length > 0 ? (
          visibleSessions
            .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt))
            .map((session) => (
              <div key={session._id} className="card hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{session.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          session.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                          session.status === 'ongoing' ? 'bg-green-100 text-green-700' :
                          session.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {session.status}
                        </span>
                        {!session.isPaid && (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            Free
                          </span>
                        )}
                      </div>

                      <p className="text-gray-600 mb-3">{session.description}</p>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="w-4 h-4" />
                          <span>{new Date(session.scheduledAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>
                            {new Date(session.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {' '}({session.duration} min)
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>
                            {session.attendees?.length || 0} / {session.maxStudents} students
                          </span>
                        </div>
                        {session.course && (
                          <div className="flex items-center gap-1">
                            <Video className="w-4 h-4" />
                            <span>{session.course.title}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleEditClick(session)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(session)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
        ) : (
          <div className="card">
            <div className="p-12 text-center">
              <CalendarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions scheduled</h3>
              <p className="text-gray-600 mb-6">Create your first session to get started</p>
              <button onClick={() => setShowCreateModal(true)} className="btn-primary">
                <Plus className="w-4 h-4 inline mr-2" />
                Create Session
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Session Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false)
          resetForm()
        }}
        title="Create New Session"
        size="lg"
      >
        <SessionForm onSubmit={handleCreateSession} />
      </Modal>

      {/* Edit Session Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setSelectedSession(null)
          resetForm()
        }}
        title="Edit Session"
        size="lg"
      >
        <SessionForm onSubmit={handleUpdateSession} isEdit />
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={confirmDelete}
        title="Delete Session"
        message={`Are you sure you want to delete "${selectedSession?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  )
}

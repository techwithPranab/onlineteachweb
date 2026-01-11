import { useState } from 'react'
import { useQuery, useMutation } from 'react-query'
import { useNavigate, Link } from 'react-router-dom'
import { Plus, Calendar, Users, BookOpen, Clock } from 'lucide-react'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import ErrorMessage from '@/components/common/ErrorMessage'
import { courseService, sessionService } from '@/services/apiServices'

export default function TutorSessionCreation() {
  const navigate = useNavigate()
  const [selectedCourse, setSelectedCourse] = useState('')
  const [selectedGrade, setSelectedGrade] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    scheduledAt: '',
    duration: '60',
    maxStudents: '30',
    isPaid: true
  })

  const { data: coursesData, isLoading, error } = useQuery(
    'availableCourses',
    () => courseService.getCourses({ status: 'published' })
  )
  
  const createSessionMutation = useMutation(
    (sessionData) => sessionService.createSession(sessionData),
    {
      onSuccess: (data) => {
        console.log('Session created successfully:', data)
        navigate('/tutor/schedule')
      },
      onError: (error) => {
        console.error('Error creating session:', error)
        setSubmitError(error.response?.data?.message || 'Failed to create session')
      }
    }
  )
  
  console.log('Fetched courses data:', coursesData);
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleCourseSelect = (courseId) => {
    setSelectedCourse(courseId)
    const course = coursesData?.courses?.find(c => c._id === courseId)
    if (course) {
      setFormData(prev => ({
        ...prev,
        title: `${course.title} - Session`,
        description: `Live session for ${course.title}`
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError('')
    
    if (!selectedCourse) {
      setSubmitError('Please select a course')
      return
    }
    
    if (!formData.title || !formData.scheduledAt || !formData.duration) {
      setSubmitError('Please fill in all required fields')
      return
    }
    
    // Create session with API call
    createSessionMutation.mutate({
      courseId: selectedCourse,
      title: formData.title,
      description: formData.description,
      scheduledAt: new Date(formData.scheduledAt).toISOString(),
      duration: parseInt(formData.duration),
      maxStudents: parseInt(formData.maxStudents),
      isPaid: formData.isPaid
    })
  }

  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error.message} />

  const courses = coursesData?.courses || []
  console.log('Available courses:', courses);

  // Filter courses based on selected grade
  const filteredCourses = selectedGrade
    ? courses.filter(course => course.grade === parseInt(selectedGrade))
    : courses

  // Generate grade options (1-12)
  const gradeOptions = Array.from({ length: 12 }, (_, i) => i + 1)
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create Session</h1>
        <p className="text-gray-600 mt-2">Schedule a live session for an existing course</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Grade Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Grade
            </label>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Grades</option>
              {gradeOptions.map((grade) => (
                <option key={grade} value={grade}>
                  Grade {grade}
                </option>
              ))}
            </select>
          </div>

          {/* Course Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Course *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCourses.map((course) => (
                <div
                  key={course._id}
                  onClick={() => handleCourseSelect(course._id)}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedCourse === course._id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <BookOpen className="h-6 w-6 text-blue-600 mt-1" />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {course.title}
                      </h3>
                      <p className="text-sm text-gray-500">{course.subject} - Grade {course.grade}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        ₹{course.price} • {course.duration}h
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {filteredCourses.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                {selectedGrade ? (
                  <>
                    <p>No courses available for Grade {selectedGrade}</p>
                    <p className="text-sm">Try selecting a different grade or contact an administrator</p>
                  </>
                ) : (
                  <>
                    <p>No published courses available</p>
                    <p className="text-sm">Contact an administrator to create courses</p>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Session Details */}
          {selectedCourse && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Session Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (minutes) *
                  </label>
                  <select
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">1 hour</option>
                    <option value="90">1.5 hours</option>
                    <option value="120">2 hours</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Scheduled Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    name="scheduledAt"
                    value={formData.scheduledAt}
                    onChange={handleInputChange}
                    required
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Students
                  </label>
                  <input
                    type="number"
                    name="maxStudents"
                    value={formData.maxStudents}
                    onChange={handleInputChange}
                    min="1"
                    max="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Session Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe what will be covered in this session..."
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isPaid"
                  id="isPaid"
                  checked={formData.isPaid}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isPaid" className="ml-2 block text-sm text-gray-900">
                  This is a paid session
                </label>
              </div>

              {/* Error Message */}
              {submitError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{submitError}</p>
                </div>
              )}

              <div className="flex justify-end space-x-4">
                <Link
                  to="/tutor"
                  className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={createSessionMutation.isLoading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center disabled:bg-blue-400 disabled:cursor-not-allowed"
                >
                  {createSessionMutation.isLoading ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Calendar className="h-4 w-4 mr-2" />
                      Schedule Session
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { ArrowLeft, Save, Plus, X } from 'lucide-react'
import { courseService } from '@/services/apiServices'
import { useAuthStore } from '@/store/authStore'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import ErrorMessage from '@/components/common/ErrorMessage'

export default function AdminCourseEdit() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  // Redirect if not admin
  if (user?.role !== 'admin') {
    navigate('/admin')
    return null
  }

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    grade: '',
    price: '',
    syllabus: '',
    topics: '',
    duration: '12',
    level: 'beginner',
    language: 'English',
    maxStudents: '50',
    tags: ''
  })

  const [learningObjectives, setLearningObjectives] = useState([''])
  const [prerequisites, setPrerequisites] = useState([''])

  // Fetch course data
  const { data: courseData, isLoading: isLoadingCourse, error: courseError } = useQuery(
    ['course', id],
    () => courseService.getCourseById(id),
    {
      enabled: !!id,
      onSuccess: (data) => {
        console.log('Course data loaded:', data) // Debug log
        const course = data.course || data // Handle both response formats
        if (course) {
          // Populate form with existing data
          setFormData({
            title: course.title || '',
            description: course.description || '',
            subject: course.subject || '',
            grade: course.grade?.toString() || '',
            price: course.price?.toString() || '',
            syllabus: Array.isArray(course.syllabus) ? course.syllabus.join('\n') : (course.syllabus || ''),
            topics: Array.isArray(course.topics) ? course.topics.join(', ') : (course.topics || ''),
            duration: course.duration?.toString() || '12',
            level: course.level || 'beginner',
            language: course.language || 'English',
            maxStudents: course.maxStudents?.toString() || '50',
            tags: Array.isArray(course.tags) ? course.tags.join(', ') : (course.tags || '')
          })
          setLearningObjectives(course.learningObjectives && course.learningObjectives.length > 0 ? course.learningObjectives : [''])
          setPrerequisites(course.prerequisites && course.prerequisites.length > 0 ? course.prerequisites : [''])
        }
      }
    }
  )

  const updateCourseMutation = useMutation(
    (courseData) => courseService.updateCourse(id, courseData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('adminCourses')
        navigate('/admin/courses')
      },
    }
  )

  const subjects = [
    'Mathematics',
    'Science',
    'English',
    'Social Studies',
    'Physics',
    'Chemistry',
    'Biology',
    'Computer Science',
    'History',
    'Geography',
    'Art',
    'Music',
    'Physical Education'
  ]

  const levels = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' }
  ]

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const addObjective = () => {
    setLearningObjectives([...learningObjectives, ''])
  }

  const removeObjective = (index) => {
    setLearningObjectives(learningObjectives.filter((_, i) => i !== index))
  }

  const updateObjective = (index, value) => {
    const updated = [...learningObjectives]
    updated[index] = value
    setLearningObjectives(updated)
  }

  const addPrerequisite = () => {
    setPrerequisites([...prerequisites, ''])
  }

  const removePrerequisite = (index) => {
    setPrerequisites(prerequisites.filter((_, i) => i !== index))
  }

  const updatePrerequisite = (index, value) => {
    const updated = [...prerequisites]
    updated[index] = value
    setPrerequisites(updated)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const syllabusArray = formData.syllabus.split('\n').filter(item => item.trim())
    const topicsArray = formData.topics.split(',').map(topic => topic.trim()).filter(Boolean)
    const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)

    const courseData = {
      ...formData,
      grade: parseInt(formData.grade),
      price: parseFloat(formData.price),
      duration: parseInt(formData.duration),
      maxStudents: parseInt(formData.maxStudents),
      syllabus: syllabusArray,
      topics: topicsArray,
      tags: tagsArray,
      learningObjectives: learningObjectives.filter(obj => obj.trim()),
      prerequisites: prerequisites.filter(req => req.trim())
    }

    updateCourseMutation.mutate(courseData)
  }

  if (isLoadingCourse) {
    return <LoadingSpinner />
  }

  if (courseError) {
    return <ErrorMessage message="Failed to load course data" />
  }

  if (updateCourseMutation.isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div className="p-4">
      <div className="mb-4">
        <button
          onClick={() => navigate('/admin/courses')}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Courses
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Edit Course</h1>
        <p className="text-gray-600 mt-1">Update course information</p>
      </div>

      {updateCourseMutation.isError && (
        <ErrorMessage message={updateCourseMutation.error?.message || 'Failed to update course'} />
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-3">Basic Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Course Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter course title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject *
              </label>
              <select
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Subject</option>
                {subjects.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grade Level *
              </label>
              <select
                name="grade"
                value={formData.grade}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Grade</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(grade => (
                  <option key={grade} value={grade}>{grade}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price (INR) *
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                required
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration (weeks) *
              </label>
              <input
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                required
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="12"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Difficulty Level *
              </label>
              <select
                name="level"
                value={formData.level}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {levels.map(level => (
                  <option key={level.value} value={level.value}>{level.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Language *
              </label>
              <input
                type="text"
                name="language"
                value={formData.language}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="English"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Students *
              </label>
              <input
                type="number"
                name="maxStudents"
                value={formData.maxStudents}
                onChange={handleInputChange}
                required
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="50"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter course description"
            />
          </div>
        </div>

        {/* Syllabus */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-3">Syllabus</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Syllabus Items (one per line)
            </label>
            <textarea
              name="syllabus"
              value={formData.syllabus}
              onChange={handleInputChange}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Week 1: Introduction&#10;Week 2: Basic Concepts&#10;Week 3: Advanced Topics"
            />
          </div>
        </div>

        {/* Topics and Tags */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-3">Topics & Tags</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Topics (comma-separated)
              </label>
              <input
                type="text"
                name="topics"
                value={formData.topics}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Algebra, Geometry, Calculus"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="math, algebra, high-school"
              />
            </div>
          </div>
        </div>

        {/* Learning Objectives */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-3">Learning Objectives</h2>
          <div className="space-y-2">
            {learningObjectives.map((objective, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  value={objective}
                  onChange={(e) => updateObjective(index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter learning objective"
                />
                {learningObjectives.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeObjective(index)}
                    className="p-2 text-red-600 hover:text-red-800"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addObjective}
              className="flex items-center text-blue-600 hover:text-blue-800"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Objective
            </button>
          </div>
        </div>

        {/* Prerequisites */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-3">Prerequisites</h2>
          <div className="space-y-2">
            {prerequisites.map((prerequisite, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  value={prerequisite}
                  onChange={(e) => updatePrerequisite(index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter prerequisite"
                />
                {prerequisites.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePrerequisite(index)}
                    className="p-2 text-red-600 hover:text-red-800"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addPrerequisite}
              className="flex items-center text-blue-600 hover:text-blue-800"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Prerequisite
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={updateCourseMutation.isLoading}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 flex items-center"
          >
            <Save className="h-4 w-4 mr-2" />
            {updateCourseMutation.isLoading ? 'Updating...' : 'Update Course'}
          </button>
        </div>
      </form>
    </div>
  )
}

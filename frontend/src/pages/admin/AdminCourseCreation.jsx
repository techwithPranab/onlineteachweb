import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from 'react-query'
import { ArrowLeft, Save, Plus, X } from 'lucide-react'
import { courseService } from '@/services/apiServices'
import { useAuthStore } from '@/store/authStore'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import ErrorMessage from '@/components/common/ErrorMessage'

export default function AdminCourseCreation() {
  const navigate = useNavigate()
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

  const createCourseMutation = useMutation(
    (courseData) => courseService.createCourse(courseData),
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
      prerequisites: prerequisites.filter(req => req.trim()),
      status: 'draft' // Default to draft, admin can publish later
    }

    createCourseMutation.mutate(courseData)
  }

  if (createCourseMutation.isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <button
          onClick={() => navigate('/admin/courses')}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Courses
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Create New Course</h1>
        <p className="text-gray-600 mt-2">Create a new course for tutors to teach</p>
      </div>

      {createCourseMutation.isError && (
        <ErrorMessage message={createCourseMutation.error?.message || 'Failed to create course'} />
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
                {[...Array(12)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>Grade {i + 1}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course Duration (hours) *
              </label>
              <input
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                required
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price (USD) *
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Language
              </label>
              <input
                type="text"
                name="language"
                value={formData.language}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="English"
              />
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Course Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Provide a detailed description of the course"
            />
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Topics (comma-separated)
            </label>
            <input
              type="text"
              name="topics"
              value={formData.topics}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="algebra, geometry, calculus"
            />
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="math, advanced, exam-prep"
            />
          </div>
        </div>

        {/* Syllabus */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Syllabus</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Course Syllabus (one topic per line)
            </label>
            <textarea
              name="syllabus"
              value={formData.syllabus}
              onChange={handleInputChange}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={`Week 1: Introduction to Algebra\nWeek 2: Linear Equations\nWeek 3: Quadratic Equations\n...`}
            />
          </div>
        </div>

        {/* Learning Objectives */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Learning Objectives</h2>
          <div className="space-y-3">
            {learningObjectives.map((objective, index) => (
              <div key={index} className="flex items-center gap-3">
                <input
                  type="text"
                  value={objective}
                  onChange={(e) => updateObjective(index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Students will be able to..."
                />
                <button
                  type="button"
                  onClick={() => removeObjective(index)}
                  className="text-red-600 hover:text-red-800"
                  disabled={learningObjectives.length === 1}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addObjective}
            className="mt-3 flex items-center text-blue-600 hover:text-blue-800"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Objective
          </button>
        </div>

        {/* Prerequisites */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Prerequisites</h2>
          <div className="space-y-3">
            {prerequisites.map((prereq, index) => (
              <div key={index} className="flex items-center gap-3">
                <input
                  type="text"
                  value={prereq}
                  onChange={(e) => updatePrerequisite(index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Basic knowledge of..."
                />
                <button
                  type="button"
                  onClick={() => removePrerequisite(index)}
                  className="text-red-600 hover:text-red-800"
                  disabled={prerequisites.length === 1}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addPrerequisite}
            className="mt-3 flex items-center text-blue-600 hover:text-blue-800"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Prerequisite
          </button>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/admin/courses')}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createCourseMutation.isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
          >
            <Save className="h-4 w-4 mr-2" />
            {createCourseMutation.isLoading ? 'Creating...' : 'Create Course'}
          </button>
        </div>
      </form>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { ArrowLeft, Save, Plus, X, Edit, Trash2, BookOpen } from 'lucide-react'
import { courseService } from '@/services/apiServices'
import { useAuthStore } from '@/store/authStore'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import ErrorMessage from '@/components/common/ErrorMessage'
import Modal from '@/components/common/Modal'

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
    board: ['CBSE'],
    syllabus: '',
    duration: '12',
    level: 'beginner',
    language: 'English',
    maxStudents: '50',
    tags: ''
  })

  const [prerequisites, setPrerequisites] = useState([''])
  const [chapters, setChapters] = useState([])

  // Chapter modal state
  const [showChapterModal, setShowChapterModal] = useState(false)
  const [editingChapterIndex, setEditingChapterIndex] = useState(null)
  const [chapterForm, setChapterForm] = useState({
    name: '',
    topics: [''],
    learningObjectives: [''],
    estimatedHours: 0
  })

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
            board: Array.isArray(course.board) && course.board.length > 0 ? course.board : ['CBSE'],
            syllabus: Array.isArray(course.syllabus) ? course.syllabus.join('\n') : (course.syllabus || ''),
            duration: course.duration?.toString() || '12',
            level: course.level || 'beginner',
            language: course.language || 'English',
            maxStudents: course.maxStudents?.toString() || '50',
            tags: Array.isArray(course.tags) ? course.tags.join(', ') : (course.tags || '')
          })
          setPrerequisites(course.prerequisites && course.prerequisites.length > 0 ? course.prerequisites : [''])
          setChapters(course.chapters && course.chapters.length > 0 ? course.chapters : [])
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

  const handleBoardChange = (boardValue) => {
    setFormData(prev => ({
      ...prev,
      board: prev.board.includes(boardValue)
        ? prev.board.filter(b => b !== boardValue)
        : [...prev.board, boardValue]
    }))
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

  // Chapter Management Functions
  const handleOpenChapterModal = (chapterIndex = null) => {
    if (chapterIndex !== null) {
      // Edit existing chapter
      setEditingChapterIndex(chapterIndex)
      setChapterForm(chapters[chapterIndex])
    } else {
      // Add new chapter
      setEditingChapterIndex(null)
      setChapterForm({
        name: '',
        topics: [''],
        learningObjectives: [''],
        estimatedHours: 0
      })
    }
    setShowChapterModal(true)
  }

  const handleCloseChapterModal = () => {
    setShowChapterModal(false)
    setEditingChapterIndex(null)
    setChapterForm({
      name: '',
      topics: [''],
      learningObjectives: [''],
      estimatedHours: 0
    })
  }

  const handleSaveChapter = () => {
    if (editingChapterIndex !== null) {
      // Update existing chapter
      const updatedChapters = [...chapters]
      updatedChapters[editingChapterIndex] = chapterForm
      setChapters(updatedChapters)
    } else {
      // Add new chapter
      setChapters([...chapters, chapterForm])
    }
    handleCloseChapterModal()
  }

  const handleDeleteChapter = (chapterIndex) => {
    if (window.confirm('Are you sure you want to delete this chapter?')) {
      setChapters(chapters.filter((_, index) => index !== chapterIndex))
    }
  }

  const handleAddChapterArrayItem = (field) => {
    setChapterForm({
      ...chapterForm,
      [field]: [...chapterForm[field], '']
    })
  }

  const handleUpdateChapterArrayItem = (field, index, value) => {
    const updated = [...chapterForm[field]]
    updated[index] = value
    setChapterForm({
      ...chapterForm,
      [field]: updated
    })
  }

  const handleRemoveChapterArrayItem = (field, index) => {
    setChapterForm({
      ...chapterForm,
      [field]: chapterForm[field].filter((_, i) => i !== index)
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const syllabusArray = formData.syllabus.split('\n').filter(item => item.trim())
    const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)

    const courseData = {
      ...formData,
      grade: parseInt(formData.grade),
      maxStudents: parseInt(formData.maxStudents),
      syllabus: syllabusArray,
      tags: tagsArray,
      prerequisites: prerequisites.filter(req => req.trim()),
      chapters: chapters
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Board *
              </label>
              <div className="space-y-2">
                {['CBSE', 'ICSE', 'State Board', 'Other'].map(board => (
                  <label key={board} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.board.includes(board)}
                      onChange={() => handleBoardChange(board)}
                      className="mr-2"
                    />
                    {board}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration *
              </label>
              <input
                type="text"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="12 weeks"
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

        {/* Chapters */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold flex items-center">
              <BookOpen className="h-5 w-5 mr-2" />
              Chapters
            </h2>
            <button
              type="button"
              onClick={() => handleOpenChapterModal()}
              className="flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Chapter
            </button>
          </div>
          
          {chapters.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <BookOpen className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p>No chapters added yet</p>
              <p className="text-sm">Click "Add Chapter" to create your first chapter</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chapter Name</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Topics</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Objectives</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {chapters.map((chapter, index) => (
                    <tr key={index}>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                      <td className="px-3 py-2 text-sm text-gray-900">{chapter.name}</td>
                      <td className="px-3 py-2 text-sm text-gray-500">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          {chapter.topics.filter(t => t.trim()).length} topics
                        </span>
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-500">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          {chapter.learningObjectives.filter(o => o.trim()).length} objectives
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{chapter.estimatedHours}h</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenChapterModal(index)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Edit chapter"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteChapter(index)}
                            className="text-red-600 hover:text-red-800"
                            title="Delete chapter"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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

      {/* Chapter Modal */}
      <Modal
        isOpen={showChapterModal}
        onClose={handleCloseChapterModal}
        title={editingChapterIndex !== null ? 'Edit Chapter' : 'Add Chapter'}
      >
        <div className="space-y-4">
          {/* Chapter Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Chapter Name *
            </label>
            <input
              type="text"
              value={chapterForm.name}
              onChange={(e) => setChapterForm({ ...chapterForm, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter chapter name"
            />
          </div>

          {/* Topics */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Topics *
            </label>
            <div className="space-y-2">
              {chapterForm.topics.map((topic, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => handleUpdateChapterArrayItem('topics', index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter topic"
                  />
                  {chapterForm.topics.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveChapterArrayItem('topics', index)}
                      className="p-2 text-red-600 hover:text-red-800"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => handleAddChapterArrayItem('topics')}
                className="flex items-center text-blue-600 hover:text-blue-800 text-sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Topic
              </button>
            </div>
          </div>

          {/* Learning Objectives */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Learning Objectives *
            </label>
            <div className="space-y-2">
              {chapterForm.learningObjectives.map((objective, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={objective}
                    onChange={(e) => handleUpdateChapterArrayItem('learningObjectives', index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter learning objective"
                  />
                  {chapterForm.learningObjectives.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveChapterArrayItem('learningObjectives', index)}
                      className="p-2 text-red-600 hover:text-red-800"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => handleAddChapterArrayItem('learningObjectives')}
                className="flex items-center text-blue-600 hover:text-blue-800 text-sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Objective
              </button>
            </div>
          </div>

          {/* Estimated Hours */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estimated Hours *
            </label>
            <input
              type="number"
              value={chapterForm.estimatedHours}
              onChange={(e) => setChapterForm({ ...chapterForm, estimatedHours: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter estimated hours"
              min="0"
            />
          </div>

          {/* Modal Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <button
              type="button"
              onClick={handleCloseChapterModal}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveChapter}
              disabled={!chapterForm.name.trim() || chapterForm.topics.filter(t => t.trim()).length === 0 || chapterForm.learningObjectives.filter(o => o.trim()).length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {editingChapterIndex !== null ? 'Update Chapter' : 'Add Chapter'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

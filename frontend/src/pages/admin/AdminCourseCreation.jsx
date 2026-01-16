import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from 'react-query'
import { ArrowLeft, Save, Plus, X, Edit, Trash2, BookOpen } from 'lucide-react'
import { courseService } from '@/services/apiServices'
import { useAuthStore } from '@/store/authStore'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import ErrorMessage from '@/components/common/ErrorMessage'
import Modal from '@/components/common/Modal'

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

  // Chapter management functions
  const handleOpenChapterModal = (chapterIndex = null) => {
    if (chapterIndex !== null) {
      const chapter = chapters[chapterIndex]
      setEditingChapterIndex(chapterIndex)
      setChapterForm({
        name: chapter.name || '',
        topics: chapter.topics && chapter.topics.length > 0 ? chapter.topics : [''],
        learningObjectives: chapter.learningObjectives && chapter.learningObjectives.length > 0 ? chapter.learningObjectives : [''],
        estimatedHours: chapter.estimatedHours || 0
      })
    } else {
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

  const handleChapterFormChange = (field, value) => {
    setChapterForm(prev => ({ ...prev, [field]: value }))
  }

  const handleAddChapterArrayItem = (field) => {
    setChapterForm(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }))
  }

  const handleUpdateChapterArrayItem = (field, index, value) => {
    setChapterForm(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }))
  }

  const handleRemoveChapterArrayItem = (field, index) => {
    setChapterForm(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }))
  }

  const handleSaveChapter = () => {
    const chapterData = {
      ...chapterForm,
      topics: chapterForm.topics.filter(t => t.trim()),
      learningObjectives: chapterForm.learningObjectives.filter(o => o.trim())
    }

    if (editingChapterIndex !== null) {
      const updatedChapters = [...chapters]
      updatedChapters[editingChapterIndex] = chapterData
      setChapters(updatedChapters)
    } else {
      setChapters([...chapters, chapterData])
    }

    handleCloseChapterModal()
  }

  const handleDeleteChapter = (chapterIndex) => {
    if (window.confirm('Are you sure you want to delete this chapter?')) {
      setChapters(chapters.filter((_, i) => i !== chapterIndex))
    }
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
      chapters: chapters,
      status: 'draft' // Default to draft, admin can publish later
    }

    createCourseMutation.mutate(courseData)
  }

  if (createCourseMutation.isLoading) {
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
        <h1 className="text-2xl font-bold text-gray-900">Create New Course</h1>
        <p className="text-gray-600 mt-1">Create a new course for tutors to teach</p>
      </div>

      {createCourseMutation.isError && (
        <ErrorMessage message={createCourseMutation.error?.message || 'Failed to create course'} />
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
                {[...Array(12)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>Grade {i + 1}</option>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Course Duration *
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

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
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
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-3">Syllabus</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
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

        {/* Chapters */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Chapters</h2>
            <button
              type="button"
              onClick={() => handleOpenChapterModal()}
              className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Chapter
            </button>
          </div>

          {chapters.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Chapter Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Topics</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Objectives</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {chapters.map((chapter, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{chapter.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {chapter.topics.length > 0 ? (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {chapter.topics.length} topic{chapter.topics.length !== 1 ? 's' : ''}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic text-xs">No topics</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {chapter.learningObjectives.length > 0 ? (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            {chapter.learningObjectives.length} objective{chapter.learningObjectives.length !== 1 ? 's' : ''}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic text-xs">No objectives</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{chapter.estimatedHours}h</td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => handleOpenChapterModal(index)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteChapter(index)}
                            className="text-red-600 hover:text-red-900"
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
          ) : (
            <div className="text-center py-6 text-gray-500">
              <BookOpen className="h-10 w-10 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No chapters added yet</p>
              <button
                type="button"
                onClick={() => handleOpenChapterModal()}
                className="mt-2 text-sm text-blue-600 hover:text-blue-800"
              >
                Add your first chapter
              </button>
            </div>
          )}
        </div>

        {/* Prerequisites */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-3">Prerequisites</h2>
          <div className="space-y-2">
            {prerequisites.map((prereq, index) => (
              <div key={index} className="flex items-center gap-2">
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
            className="mt-2 flex items-center text-blue-600 hover:text-blue-800"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Prerequisite
          </button>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/admin/courses')}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createCourseMutation.isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
          >
            <Save className="h-4 w-4 mr-2" />
            {createCourseMutation.isLoading ? 'Creating...' : 'Create Course'}
          </button>
        </div>
      </form>

      {/* Chapter Modal */}
      {showChapterModal && (
        <Modal
          isOpen={showChapterModal}
          onClose={handleCloseChapterModal}
          title={editingChapterIndex !== null ? 'Edit Chapter' : 'Add New Chapter'}
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
                onChange={(e) => handleChapterFormChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter chapter name"
              />
            </div>

            {/* Topics */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Topics
              </label>
              <div className="space-y-2">
                {chapterForm.topics.map((topic, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={topic}
                      onChange={(e) => handleUpdateChapterArrayItem('topics', index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter a topic"
                    />
                    {chapterForm.topics.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveChapterArrayItem('topics', index)}
                        className="p-2 text-red-500 hover:text-red-700"
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
                Learning Objectives
              </label>
              <div className="space-y-2">
                {chapterForm.learningObjectives.map((objective, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={objective}
                      onChange={(e) => handleUpdateChapterArrayItem('learningObjectives', index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter a learning objective"
                    />
                    {chapterForm.learningObjectives.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveChapterArrayItem('learningObjectives', index)}
                        className="p-2 text-red-500 hover:text-red-700"
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
                Estimated Hours
              </label>
              <input
                type="number"
                value={chapterForm.estimatedHours}
                onChange={(e) => handleChapterFormChange('estimatedHours', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                placeholder="0"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
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
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                disabled={!chapterForm.name.trim()}
              >
                {editingChapterIndex !== null ? 'Update Chapter' : 'Add Chapter'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

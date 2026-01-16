import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { ArrowLeft, Edit, Calendar, Users, IndianRupee, BookOpen, Clock, Globe, Target, CheckCircle, Plus, Trash2, X } from 'lucide-react'
import { courseService } from '@/services/apiServices'
import { useAuthStore } from '@/store/authStore'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import ErrorMessage from '@/components/common/ErrorMessage'
import Modal from '@/components/common/Modal'

export default function AdminCourseView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  // State for chapter modal
  const [showChapterModal, setShowChapterModal] = useState(false)
  const [editingChapter, setEditingChapter] = useState(null)
  const [chapterForm, setChapterForm] = useState({
    name: '',
    topics: [''],
    learningObjectives: [''],
    estimatedHours: 0
  })

  // Redirect if not admin
  if (user?.role !== 'admin') {
    navigate('/admin')
    return null
  }

  const { data: courseResponse, isLoading, error } = useQuery(
    ['course', id],
    () => courseService.getCourseById(id),
    {
      enabled: !!id
    }
  )

  const course = courseResponse?.course || courseResponse

  // Mutation to update course
  const updateCourseMutation = useMutation(
    (updatedData) => courseService.updateCourse(id, updatedData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['course', id])
        setShowChapterModal(false)
        setEditingChapter(null)
      }
    }
  )

  // Handle adding/editing chapters
  const handleOpenChapterModal = (chapter = null, chapterIndex = null) => {
    if (chapter) {
      setEditingChapter(chapterIndex)
      setChapterForm({
        name: chapter.name || '',
        topics: chapter.topics && chapter.topics.length > 0 ? chapter.topics : [''],
        learningObjectives: chapter.learningObjectives && chapter.learningObjectives.length > 0 ? chapter.learningObjectives : [''],
        estimatedHours: chapter.estimatedHours || 0
      })
    } else {
      setEditingChapter(null)
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
    setEditingChapter(null)
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

  const handleAddArrayItem = (field) => {
    setChapterForm(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }))
  }

  const handleUpdateArrayItem = (field, index, value) => {
    setChapterForm(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }))
  }

  const handleRemoveArrayItem = (field, index) => {
    setChapterForm(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }))
  }

  const handleSaveChapter = () => {
    const updatedChapters = [...(course.chapters || [])]
    
    const chapterData = {
      ...chapterForm,
      topics: chapterForm.topics.filter(t => t.trim()),
      learningObjectives: chapterForm.learningObjectives.filter(o => o.trim())
    }

    if (editingChapter !== null) {
      updatedChapters[editingChapter] = chapterData
    } else {
      updatedChapters.push(chapterData)
    }

    updateCourseMutation.mutate({ chapters: updatedChapters })
  }

  const handleDeleteChapter = (chapterIndex) => {
    if (window.confirm('Are you sure you want to delete this chapter?')) {
      const updatedChapters = course.chapters.filter((_, i) => i !== chapterIndex)
      updateCourseMutation.mutate({ chapters: updatedChapters })
    }
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (error) {
    return <ErrorMessage message="Failed to load course details" />
  }

  if (!course) {
    return <ErrorMessage message="Course not found" />
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800'
      case 'draft':
        return 'bg-yellow-100 text-yellow-800'
      case 'archived':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getDifficultyColor = (level) => {
    switch (level) {
      case 'beginner':
        return 'bg-green-100 text-green-800'
      case 'intermediate':
        return 'bg-blue-100 text-blue-800'
      case 'advanced':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="p-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/admin/courses')}
              className="flex items-center text-blue-600 hover:text-blue-800"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Courses
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
              <p className="text-gray-600 mt-1">{course.description}</p>
            </div>
          </div>
          <Link
            to={`/admin/courses/${course._id}/edit`}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Course
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Course Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Course Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <BookOpen className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Subject</p>
                  <p className="font-medium">{course.subject}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Users className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Grade Level</p>
                  <p className="font-medium">Grade {course.grade}</p>
                </div>
              </div>
              <div className="flex items-center">
                <BookOpen className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Board</p>
                  <p className="font-medium">{Array.isArray(course.board) ? course.board.join(', ') : course.board || 'CBSE'}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Duration</p>
                  <p className="font-medium">{course.duration || '12 weeks'}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Users className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Max Students</p>
                  <p className="font-medium">{course.maxStudents}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Globe className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Language</p>
                  <p className="font-medium">{course.language}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Target className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Difficulty</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(course.level)}`}>
                    {course.level}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Syllabus */}
          {course.syllabus && course.syllabus.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Syllabus</h2>
              <div className="space-y-2">
                {course.syllabus.map((item, index) => (
                  <div key={index} className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-700">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Learning Objectives */}
          {course.learningObjectives && course.learningObjectives.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Learning Objectives</h2>
              <div className="space-y-2">
                {course.learningObjectives.map((objective, index) => (
                  <div key={index} className="flex items-start">
                    <Target className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-700">{objective}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chapters Table */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Chapters</h2>
              <button
                onClick={() => handleOpenChapterModal()}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Chapter
              </button>
            </div>

            {course.chapters && course.chapters.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Chapter Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Topics
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Learning Objectives
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Est. Hours
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {course.chapters.map((chapter, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {chapter.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          <div className="max-w-xs">
                            {chapter.topics && chapter.topics.length > 0 ? (
                              <div className="space-y-1">
                                {chapter.topics.slice(0, 2).map((topic, i) => (
                                  <div key={i} className="text-xs">• {topic}</div>
                                ))}
                                {chapter.topics.length > 2 && (
                                  <div className="text-xs text-blue-600">
                                    +{chapter.topics.length - 2} more
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400 italic">No topics</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          <div className="max-w-xs">
                            {chapter.learningObjectives && chapter.learningObjectives.length > 0 ? (
                              <div className="space-y-1">
                                {chapter.learningObjectives.slice(0, 2).map((obj, i) => (
                                  <div key={i} className="text-xs">• {obj}</div>
                                ))}
                                {chapter.learningObjectives.length > 2 && (
                                  <div className="text-xs text-blue-600">
                                    +{chapter.learningObjectives.length - 2} more
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400 italic">No objectives</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {chapter.estimatedHours || 0}h
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleOpenChapterModal(chapter, index)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Edit chapter"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteChapter(index)}
                              className="text-red-600 hover:text-red-900"
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
            ) : (
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No chapters added yet</p>
                <button
                  onClick={() => handleOpenChapterModal()}
                  className="mt-3 text-blue-600 hover:text-blue-800"
                >
                  Add your first chapter
                </button>
              </div>
            )}
          </div>

          {/* Prerequisites */}
          {course.prerequisites && course.prerequisites.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Prerequisites</h2>
              <div className="space-y-2">
                {course.prerequisites.map((prereq, index) => (
                  <div key={index} className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-orange-500 mr-3 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-700">{prereq}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status & Pricing */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Course Status</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500 mb-1">Status</p>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(course.status)}`}>
                  {course.status}
                </span>
              </div>
            </div>
          </div>

          {/* Topics & Tags */}
          {(course.topics || course.tags) && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Topics & Tags</h3>
              {course.topics && course.topics.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-2">Topics</p>
                  <div className="flex flex-wrap gap-2">
                    {course.topics.map((topic, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {course.tags && course.tags.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {course.tags.map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Creator Info */}
          {course.createdBy && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Created By</h3>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 font-medium">
                      {course.createdBy.name?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">{course.createdBy.name}</p>
                  <p className="text-sm text-gray-500">{course.createdBy.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Enrollment Stats */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Enrollment Statistics</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Total Enrolled</span>
                <span className="text-sm font-medium">{course.enrolledCount || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Available Spots</span>
                <span className="text-sm font-medium">
                  {Math.max(0, course.maxStudents - (course.enrolledCount || 0))}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Created</span>
                <span className="text-sm font-medium">
                  {new Date(course.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chapter Modal */}
      {showChapterModal && (
        <Modal
          isOpen={showChapterModal}
          onClose={handleCloseChapterModal}
          title={editingChapter !== null ? 'Edit Chapter' : 'Add New Chapter'}
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
                required
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
                      onChange={(e) => handleUpdateArrayItem('topics', index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter a topic"
                    />
                    {chapterForm.topics.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveArrayItem('topics', index)}
                        className="p-2 text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => handleAddArrayItem('topics')}
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
                      onChange={(e) => handleUpdateArrayItem('learningObjectives', index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter a learning objective"
                    />
                    {chapterForm.learningObjectives.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveArrayItem('learningObjectives', index)}
                        className="p-2 text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => handleAddArrayItem('learningObjectives')}
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
                disabled={updateCourseMutation.isLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveChapter}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400"
                disabled={updateCourseMutation.isLoading || !chapterForm.name.trim()}
              >
                {updateCourseMutation.isLoading ? 'Saving...' : (editingChapter !== null ? 'Update Chapter' : 'Add Chapter')}
              </button>
            </div>

            {updateCourseMutation.isError && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                {updateCourseMutation.error?.message || 'Failed to save chapter'}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}

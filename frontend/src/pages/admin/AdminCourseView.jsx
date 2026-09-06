import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { ArrowLeft, Edit, Calendar, Users, IndianRupee, BookOpen, Clock, Globe, Target, CheckCircle, Plus, Trash2, X, BarChart2, ChevronDown, ChevronRight, Sparkles, AlertCircle, FileText, Eye } from 'lucide-react'
import { courseService, materialService, questionService } from '@/services/apiServices'
import { useAuthStore } from '@/store/authStore'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import SEOHead from '@/components/SEO/SEOHead';
import ErrorMessage from '@/components/common/ErrorMessage'
import Modal from '@/components/common/Modal'
import MaterialViewer from '@/components/course/MaterialViewer'

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
  const [selectedMaterial, setSelectedMaterial] = useState(null)
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false)
  // Question snapshot: which chapters are expanded
  const [expandedChapters, setExpandedChapters] = useState({})
  const toggleChapter = (chName) =>
    setExpandedChapters(prev => ({ ...prev, [chName]: !prev[chName] }))

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

  const {
    data: materialsData,
    isLoading: materialsLoading,
    error: materialsError
  } = useQuery(
    ['adminCourseMaterials', id],
    () => materialService.getMaterials({ courseId: id }),
    { enabled: !!id && user?.role === 'admin' }
  )

  const materials = materialsData?.data || []

  // Question snapshot
  const { data: snapshotData, isLoading: snapshotLoading } = useQuery(
    ['questionSnapshot', id],
    () => questionService.getQuestionSnapshot(id),
    { enabled: !!id, staleTime: 30000 }
  )

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

  const openMaterialModal = (material) => {
    setSelectedMaterial(material)
    setIsMaterialModalOpen(true)
  }

  const closeMaterialModal = () => {
    setIsMaterialModalOpen(false)
    setSelectedMaterial(null)
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
    <>

    <SEOHead title="Admin Course View - Admin" noIndex={true} noFollow={true} />

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

          {/* Materials */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold">Materials</h2>
                {materials.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold">
                    {materials.length}
                  </span>
                )}
              </div>
              <Link
                to={`/admin/courses/${course._id}/edit`}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Manage Materials
              </Link>
            </div>

            {materialsLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="sm" />
              </div>
            ) : materialsError ? (
              <p className="text-sm text-red-600">Failed to load materials.</p>
            ) : materials.length > 0 ? (
              <div className="space-y-3">
                {materials.map(material => (
                  <div key={material._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900 break-words">{material.title}</h3>
                          <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs capitalize">
                            {material.type}
                          </span>
                          {material.isFree && (
                            <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs">
                              Free
                            </span>
                          )}
                        </div>
                        {material.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">{material.description}</p>
                        )}
                        <div className="flex flex-wrap gap-2 mt-2">
                          {material.difficulty && (
                            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs capitalize">
                              {material.difficulty}
                            </span>
                          )}
                          {material.category && (
                            <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-xs capitalize">
                              {material.category.replace('-', ' ')}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => openMaterialModal(material)}
                        className="inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No materials added yet for this course.</p>
                <Link
                  to={`/admin/courses/${course._id}/edit`}
                  className="mt-3 inline-block text-blue-600 hover:text-blue-800"
                >
                  Add material
                </Link>
              </div>
            )}
          </div>

          {/* Question Snapshot */}
          {(() => {
            const DIFFICULTIES = ['easy', 'medium', 'hard', 'olympiad']
            const DIFF_LABELS  = { easy: 'Easy', medium: 'Medium', hard: 'Hard', olympiad: 'Olympiad' }
            const DIFF_COLORS  = {
              easy:     'bg-green-100 text-green-800',
              medium:   'bg-yellow-100 text-yellow-800',
              hard:     'bg-red-100 text-red-800',
              olympiad: 'bg-purple-100 text-purple-800'
            }
            const TYPE_LABELS = {
              'mcq-single':   'MCQ (Single)',
              'mcq-multiple': 'MCQ (Multi)',
              'true-false':   'True/False',
              'numerical':    'Numerical',
              'short-answer': 'Short Ans.',
              'long-answer':  'Long Ans.',
              'case-based':   'Case-Based'
            }

            const snapshot = snapshotData?.snapshot
            const rows = snapshot?.rows || []

            // Group rows by chapter → topic
            const grouped = {}
            rows.forEach(r => {
              const ch = r.chapterName || 'Uncategorised'
              const tp = r.topic || 'Uncategorised'
              if (!grouped[ch]) grouped[ch] = {}
              if (!grouped[ch][tp]) grouped[ch][tp] = {}
              if (!grouped[ch][tp][r.difficultyLevel]) grouped[ch][tp][r.difficultyLevel] = {}
              grouped[ch][tp][r.difficultyLevel][r.type] = r.count
            })

            // Derive all unique types present in the data
            const typesPresent = [...new Set(rows.map(r => r.type))].sort()

            return (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <BarChart2 className="h-5 w-5 text-blue-600" />
                    <h2 className="text-xl font-semibold">Question Snapshot</h2>
                    {snapshot && (
                      <span className="ml-2 px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold">
                        {snapshot.totalQuestions} total
                      </span>
                    )}
                  </div>
                  <Link
                    to={`/admin/ai-questions/generate`}
                    className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-md hover:bg-indigo-700"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Generate Questions
                  </Link>
                </div>

                {snapshotLoading ? (
                  <div className="flex items-center justify-center py-10 text-gray-500">
                    <LoadingSpinner />
                  </div>
                ) : !snapshot || snapshot.totalQuestions === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                    <AlertCircle className="h-10 w-10 mb-3 text-gray-300" />
                    <p className="text-sm font-medium">No questions generated yet for this course.</p>
                    <p className="text-xs mt-1">Use "Generate Questions" to get started with AI-powered question creation.</p>
                  </div>
                ) : (
                  <>
                    {/* Summary pills */}
                    <div className="flex flex-wrap gap-3 mb-5">
                      <div className="text-xs text-gray-500 font-medium self-center">By Difficulty:</div>
                      {DIFFICULTIES.map(d => snapshot.byDifficulty[d] > 0 && (
                        <span key={d} className={`px-2.5 py-1 rounded-full text-xs font-semibold ${DIFF_COLORS[d]}`}>
                          {DIFF_LABELS[d]}: {snapshot.byDifficulty[d]}
                        </span>
                      ))}
                      <div className="ml-3 text-xs text-gray-500 font-medium self-center">By Type:</div>
                      {typesPresent.map(t => (
                        <span key={t} className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                          {TYPE_LABELS[t] || t}: {snapshot.byType[t] || 0}
                        </span>
                      ))}
                    </div>

                    {/* Detailed breakdown table */}
                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-52">
                              Chapter / Topic
                            </th>
                            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              Question Type
                            </th>
                            {DIFFICULTIES.map(d => (
                              <th key={d} className={`px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider ${DIFF_COLORS[d]}`}>
                                {DIFF_LABELS[d]}
                              </th>
                            ))}
                            <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-100">
                              Total
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {Object.entries(grouped).map(([chapterName, topics]) => {
                            const chTotal = Object.values(topics).reduce((s, tRows) =>
                              s + Object.values(tRows).reduce((ss, diffRows) =>
                                ss + Object.values(diffRows).reduce((sss, c) => sss + c, 0), 0), 0)
                            const isOpen = !!expandedChapters[chapterName]

                            return [
                              // Chapter header row
                              <tr
                                key={`ch-${chapterName}`}
                                className="bg-blue-50 cursor-pointer hover:bg-blue-100 transition-colors"
                                onClick={() => toggleChapter(chapterName)}
                              >
                                <td className="px-4 py-2.5 font-semibold text-blue-900 flex items-center gap-1.5" colSpan={2}>
                                  {isOpen
                                    ? <ChevronDown className="h-4 w-4 flex-shrink-0" />
                                    : <ChevronRight className="h-4 w-4 flex-shrink-0" />}
                                  {chapterName}
                                </td>
                                {DIFFICULTIES.map(d => {
                                  const cnt = Object.values(topics).reduce((s, tRows) =>
                                    s + Object.values(tRows[d] || {}).reduce((ss, c) => ss + c, 0), 0)
                                  return (
                                    <td key={d} className="px-3 py-2.5 text-center">
                                      {cnt > 0
                                        ? <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${DIFF_COLORS[d]}`}>{cnt}</span>
                                        : <span className="text-gray-300 text-xs">—</span>}
                                    </td>
                                  )
                                })}
                                <td className="px-3 py-2.5 text-center font-bold text-blue-800 bg-blue-100">
                                  {chTotal}
                                </td>
                              </tr>,

                              // Topic rows (visible only when chapter expanded)
                              ...(isOpen ? Object.entries(topics).flatMap(([topicName, diffRows]) => {
                                const topicTotal = Object.values(diffRows).reduce((s, typeRows) =>
                                  s + Object.values(typeRows).reduce((ss, c) => ss + c, 0), 0)

                                // Collect all question types present in this topic
                                const typesInTopic = [...new Set(
                                  Object.values(diffRows).flatMap(typeRows => Object.keys(typeRows))
                                )].sort()

                                return typesInTopic.map((qType, qIdx) => {
                                  const rowTotal = DIFFICULTIES.reduce((s, d) =>
                                    s + (diffRows[d]?.[qType] || 0), 0)
                                  return (
                                    <tr
                                      key={`tp-${chapterName}-${topicName}-${qType}`}
                                      className="hover:bg-gray-50"
                                    >
                                      {/* Topic cell — only show on first type row */}
                                      {qIdx === 0 ? (
                                        <td
                                          rowSpan={typesInTopic.length}
                                          className="px-4 py-2 text-gray-700 border-l-4 border-blue-200 align-top"
                                        >
                                          <div className="font-medium text-xs text-gray-800 leading-snug pl-3">
                                            {topicName}
                                          </div>
                                          <div className="pl-3 text-xs text-gray-400 mt-0.5">
                                            {topicTotal} question{topicTotal !== 1 ? 's' : ''}
                                          </div>
                                        </td>
                                      ) : null}
                                      {/* Question type */}
                                      <td className="px-3 py-2 text-xs text-gray-600">
                                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded font-medium">
                                          {TYPE_LABELS[qType] || qType}
                                        </span>
                                      </td>
                                      {/* Per-difficulty counts */}
                                      {DIFFICULTIES.map(d => {
                                        const cnt = diffRows[d]?.[qType] || 0
                                        return (
                                          <td key={d} className="px-3 py-2 text-center">
                                            {cnt > 0
                                              ? <span className={`px-2 py-0.5 rounded text-xs font-semibold ${DIFF_COLORS[d]}`}>{cnt}</span>
                                              : <span className="text-gray-200 text-xs">—</span>}
                                          </td>
                                        )
                                      })}
                                      {/* Row total */}
                                      <td className="px-3 py-2 text-center text-xs font-semibold text-gray-600 bg-gray-50">
                                        {rowTotal}
                                      </td>
                                    </tr>
                                  )
                                })
                              }) : [])
                            ]
                          })}
                        </tbody>
                        {/* Grand-total footer */}
                        <tfoot>
                          <tr className="bg-gray-100 border-t-2 border-gray-300 font-bold">
                            <td className="px-4 py-3 text-gray-800 text-xs uppercase" colSpan={2}>
                              Grand Total
                            </td>
                            {DIFFICULTIES.map(d => (
                              <td key={d} className="px-3 py-3 text-center text-sm">
                                <span className={snapshot.byDifficulty[d] > 0 ? `px-2 py-0.5 rounded-full text-xs font-bold ${DIFF_COLORS[d]}` : 'text-gray-300 text-xs'}>
                                  {snapshot.byDifficulty[d] > 0 ? snapshot.byDifficulty[d] : '—'}
                                </span>
                              </td>
                            ))}
                            <td className="px-3 py-3 text-center text-sm font-bold text-gray-900 bg-gray-200">
                              {snapshot.totalQuestions}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                    <p className="mt-2 text-xs text-gray-400">
                      Click a chapter row to expand topic-level breakdown. Only active questions are counted.
                    </p>
                  </>
                )}
              </div>
            )
          })()}

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
                <span className="text-sm text-gray-500">Created</span>
                <span className="text-sm font-medium">
                  {new Date(course.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isMaterialModalOpen}
        onClose={closeMaterialModal}
        title={selectedMaterial?.title || 'Material'}
        size="lg"
      >
        {selectedMaterial && <MaterialViewer material={selectedMaterial} showPreview={false} />}
      </Modal>

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


    </>)
}

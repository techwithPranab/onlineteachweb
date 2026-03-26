import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useQuery } from 'react-query'
import aiQuestionService from '../../services/aiQuestionService'
import { courseService, questionService } from '../../services/apiServices'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import SEOHead from '../../components/SEO/SEOHead';
import ErrorMessage from '../../components/common/ErrorMessage'
import Modal from '../../components/common/Modal'

export default function AIQuestionGenerator() {
  const navigate = useNavigate()
  const location = useLocation()
  // Derive base path so this component works for both /tutor and /admin routes
  const basePath = location.pathname.startsWith('/admin') ? '/admin' : '/tutor'
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [showResultModal, setShowResultModal] = useState(false)
  const [generationResult, setGenerationResult] = useState(null)

  // Progress popup state
  const [showProgressModal, setShowProgressModal] = useState(false)
  const [progressSteps, setProgressSteps] = useState([])
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [progressDots, setProgressDots] = useState('')
  const progressTimerRef = useRef(null)
  const dotsTimerRef = useRef(null)

  // Form state
  const [formData, setFormData] = useState({
    grade: '',
    subject: '',
    courseId: '',
    chapterId: '',
    chapterName: '',
    topic: '',
    topics: [],
    difficultyLevels: ['easy', 'medium', 'hard', 'olympiad'],
    questionTypes: ['mcq-single'],
    questionsPerTopic: 5,
    sources: ['syllabus']
  })

  // Course details for cascading dropdowns
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [chapters, setChapters] = useState([])
  const [availableTopics, setAvailableTopics] = useState([])
  const [grades, setGrades] = useState([])
  const [subjects, setSubjects] = useState([])
  const [filteredCourses, setFilteredCourses] = useState([])

  // Fetch grades
  const { data: gradesData, isLoading: loadingGrades } = useQuery(
    'grades',
    () => courseService.getGrades(),
    {
      onSuccess: (data) => {
        setGrades(data.grades || [])
      }
    }
  )

  // Fetch subjects by grade
  const { data: subjectsData, isLoading: loadingSubjects } = useQuery(
    ['subjects', formData.grade],
    () => courseService.getSubjectsByGrade(formData.grade),
    {
      enabled: !!formData.grade,
      onSuccess: (data) => {
        setSubjects(data.subjects || [])
      }
    }
  )

  // Fetch courses by grade and subject
  const { data: coursesData, isLoading: loadingCourses } = useQuery(
    ['courses', formData.grade, formData.subject],
    () => courseService.getCoursesByGradeAndSubject(formData.grade, formData.subject),
    {
      enabled: !!formData.grade && !!formData.subject,
      onSuccess: (data) => {
        setFilteredCourses(data.courses || [])
      }
    }
  )

  // Fetch course structure when courseId changes
  const { data: courseStructure, isLoading: loadingStructure } = useQuery(
    ['courseStructure', formData.courseId],
    () => questionService.getCourseStructure(formData.courseId),
    {
      enabled: !!formData.courseId,
      onSuccess: (data) => {
        setChapters(data.chapters || [])
      }
    }
  )

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked
          ? [...prev[name], value]
          : prev[name].filter(item => item !== value)
      }))
    } else if (name === 'questionsPerTopic') {
      setFormData(prev => ({
        ...prev,
        [name]: parseInt(value) || 1
      }))
    } else if (name === 'grade') {
      // Reset subject, course, chapter and topics when grade changes
      setSubjects([])
      setFilteredCourses([])
      setChapters([])
      setAvailableTopics([])
      setFormData(prev => ({
        ...prev,
        grade: value,
        subject: '',
        courseId: '',
        chapterId: '',
        chapterName: '',
        topic: '',
        topics: []
      }))
    } else if (name === 'subject') {
      // Reset course, chapter and topics when subject changes
      setFilteredCourses([])
      setChapters([])
      setAvailableTopics([])
      setFormData(prev => ({
        ...prev,
        subject: value,
        courseId: '',
        chapterId: '',
        chapterName: '',
        topic: '',
        topics: []
      }))
    } else if (name === 'courseId') {
      // Reset chapter and topics when course changes
      setChapters([])
      setAvailableTopics([])
      setFormData(prev => ({
        ...prev,
        courseId: value,
        chapterId: '',
        chapterName: '',
        topic: '',
        topics: []
      }))
    } else if (name === 'chapterId') {
      // Update topics when chapter changes
      const selectedChapter = chapters.find(c => c._id === value)
      if (selectedChapter) {
        setAvailableTopics(selectedChapter.topics || [])
        setFormData(prev => ({
          ...prev,
          chapterId: value,
          chapterName: selectedChapter.name,
          topic: '',
          topics: []
        }))
      } else {
        setAvailableTopics([])
        setFormData(prev => ({
          ...prev,
          chapterId: '',
          chapterName: '',
          topic: '',
          topics: []
        }))
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleGenerate = async () => {
    if (!formData.courseId) {
      setError('Please select a course')
      return
    }

    if (formData.difficultyLevels.length === 0) {
      setError('Please select at least one difficulty level')
      return
    }

    if (formData.questionTypes.length === 0) {
      setError('Please select at least one question type')
      return
    }

    // Calculate estimated question count for progress messaging
    const topicCount = formData.topics.length || availableTopics.length || 1
    const totalEstimated = topicCount * formData.difficultyLevels.length * formData.questionTypes.length * formData.questionsPerTopic

    // Build dynamic progress steps based on selections
    const steps = [
      { id: 'init',       icon: '🔌', label: 'Connecting to AI provider',          detail: 'Establishing secure connection...',              duration: 1200 },
      { id: 'course',     icon: '📚', label: 'Loading course content',             detail: `Fetching syllabus and materials for ${selectedCourse?.title || 'course'}...`, duration: 1500 },
      { id: 'topics',     icon: '🗂️',  label: `Preparing ${topicCount} topic${topicCount > 1 ? 's' : ''}`, detail: 'Organising topics and difficulty combinations...', duration: 1000 },
      { id: 'generating', icon: '🤖', label: `Generating ~${totalEstimated} questions`, detail: `AI is crafting ${formData.difficultyLevels.join(', ')} level questions...`, duration: null }, // holds until API resolves
      { id: 'validating', icon: '✅', label: 'Validating & filtering questions',   detail: 'Checking quality, removing duplicates...',         duration: 1200 },
      { id: 'saving',     icon: '💾', label: 'Saving drafts',                      detail: 'Storing question drafts for your review...',       duration: 800  },
    ]

    setProgressSteps(steps.map(s => ({ ...s, status: 'pending' })))
    setCurrentStepIndex(0)
    setShowProgressModal(true)
    setGenerating(true)
    setError(null)
    setSuccess(null)

    // Animate dots
    dotsTimerRef.current = setInterval(() => {
      setProgressDots(d => d.length >= 3 ? '' : d + '.')
    }, 400)

    // Advance through timed steps (all except the 'generating' step which waits for API)
    let stepIdx = 0
    const advanceStep = (index) => {
      setProgressSteps(prev => prev.map((s, i) => ({
        ...s,
        status: i < index ? 'done' : i === index ? 'active' : 'pending'
      })))
      setCurrentStepIndex(index)
    }

    // Steps 0–2 play out automatically before API call resolves
    let elapsed = 0
    for (let i = 0; i < 3; i++) {
      const delay = elapsed
      progressTimerRef.current = setTimeout(() => advanceStep(i), delay)
      elapsed += steps[i].duration
    }
    // Step 3 (generating) activates after step 2 finishes
    progressTimerRef.current = setTimeout(() => advanceStep(3), elapsed)

    try {
      const result = await aiQuestionService.generateQuestions({
        courseId: formData.courseId,
        topics: formData.topics.length > 0 ? formData.topics : undefined,
        difficultyLevels: formData.difficultyLevels,
        questionTypes: formData.questionTypes,
        questionsPerTopic: formData.questionsPerTopic,
        sources: formData.sources
      })

      // API returned — advance through validating → saving → done
      advanceStep(4)
      await new Promise(r => setTimeout(r, steps[4].duration))
      advanceStep(5)
      await new Promise(r => setTimeout(r, steps[5].duration))

      // All done
      setProgressSteps(prev => prev.map(s => ({ ...s, status: 'done' })))
      await new Promise(r => setTimeout(r, 500))

      setShowProgressModal(false)
      setGenerationResult(result)
      setShowResultModal(true)
      setSuccess(`Generated ${result.summary.draftsCreated} question drafts!`)
    } catch (err) {
      // Mark current step as errored
      setProgressSteps(prev => prev.map((s, i) => ({
        ...s,
        status: i < currentStepIndex ? 'done' : i === currentStepIndex ? 'error' : 'pending'
      })))
      await new Promise(r => setTimeout(r, 800))
      setShowProgressModal(false)
      setError(err.response?.data?.message || 'Failed to generate questions')
    } finally {
      setGenerating(false)
      clearInterval(dotsTimerRef.current)
      clearTimeout(progressTimerRef.current)
    }
  }

  const questionTypes = [
    { value: 'mcq-single', label: 'Multiple Choice (Single)' },
    { value: 'mcq-multiple', label: 'Multiple Choice (Multiple)' },
    { value: 'true-false', label: 'True/False' },
    { value: 'numerical', label: 'Numerical' },
    { value: 'short-answer', label: 'Short Answer' },
    { value: 'long-answer', label: 'Long Answer' },
    { value: 'case-based', label: 'Case Based' }
  ]

  const difficultyLevels = [
    { value: 'easy', label: 'Easy', color: 'text-green-600' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
    { value: 'hard', label: 'Hard', color: 'text-red-600' },
    { value: 'olympiad', label: 'Olympiad', color: 'text-purple-600' }
  ]

  const sources = [
    { value: 'syllabus', label: 'Course Syllabus' },
    { value: 'materials', label: 'Uploaded Materials' },
    { value: 'external', label: 'External Knowledge' }
  ]

  if (loadingCourses && courses.length === 0) return <LoadingSpinner />

  return (
    <>

    <SEOHead title="A I Question Generator - Tutor" noIndex={true} noFollow={true} />

    <div className="p-6 w-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-3">
          <span className="text-4xl">🤖</span>
          AI Question Generator
        </h1>
        <p className="mt-2 text-gray-600">
          Generate high-quality quiz questions automatically using AI
        </p>
      </div>

      {error && <ErrorMessage message={error} onClose={() => setError(null)} />}
      
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <span className="text-green-500 text-xl">✓</span>
          <span className="text-green-800">{success}</span>
          <button 
            onClick={() => navigate(`${basePath}/ai-questions/review`)}
            className="ml-auto text-green-700 hover:text-green-900 font-medium"
          >
            Review Drafts →
          </button>
        </div>
      )}

      {/* Configuration Form */}
      <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
        
        {/* Grade, Subject, Course Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Grade Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Grade *
            </label>
            <select
              name="grade"
              value={formData.grade}
              onChange={handleInputChange}
              disabled={loadingGrades}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">
                {loadingGrades ? 'Loading grades...' : '-- Select grade --'}
              </option>
              {grades.map(grade => (
                <option key={grade} value={grade}>
                  Grade {grade}
                </option>
              ))}
            </select>
          </div>

          {/* Subject Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Subject *
            </label>
            <select
              name="subject"
              value={formData.subject}
              onChange={handleInputChange}
              disabled={!formData.grade || loadingSubjects}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">
                {!formData.grade ? 'Select grade first' : loadingSubjects ? 'Loading subjects...' : '-- Select subject --'}
              </option>
              {subjects.map(subject => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>

          {/* Course Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Course *
            </label>
            <select
              name="courseId"
              value={formData.courseId}
              onChange={handleInputChange}
              disabled={!formData.subject || loadingCourses}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">
                {!formData.subject ? 'Select subject first' : loadingCourses ? 'Loading courses...' : '-- Select course --'}
              </option>
              {filteredCourses.map(course => (
                <option key={course._id} value={course._id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Chapter Selection */}
        {formData.courseId && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Select Chapter *
            </label>
            <select
              name="chapterId"
              value={formData.chapterId}
              onChange={handleInputChange}
              disabled={loadingStructure}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">
                {loadingStructure ? 'Loading chapters...' : '-- Select a chapter --'}
              </option>
              {chapters.map(chapter => (
                <option key={chapter._id} value={chapter._id}>
                  {chapter.name}
                </option>
              ))}
            </select>
            {!loadingStructure && chapters.length === 0 && (
              <p className="text-amber-600 text-xs mt-1">No chapters available for this course</p>
            )}
          </div>
        )}

        {/* Topics Selection */}
        {formData.chapterId && availableTopics.length > 0 && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Select Topics (leave empty for all topics in chapter)
            </label>
            <select
              multiple
              value={formData.topics}
              onChange={(e) => {
                const selectedOptions = Array.from(e.target.selectedOptions, option => option.value)
                setFormData(prev => ({ ...prev, topics: selectedOptions }))
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-32"
            >
              {availableTopics.map(topic => (
                <option key={topic} value={topic}>
                  {topic}
                </option>
              ))}
            </select>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-500">
                {formData.topics.length > 0 ? `${formData.topics.length} topic(s) selected` : 'No topics selected (will use all topics in chapter)'}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, topics: [] }))}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Clear All
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, topics: [...availableTopics] }))}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Select All
                </button>
              </div>
            </div>
          </div>
        )}

        {formData.chapterId && availableTopics.length === 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-amber-800 text-sm">No topics available for this chapter</p>
          </div>
        )}

        {/* Difficulty Levels, Questions per Topic, and Content Sources - Same Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Difficulty Levels */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Difficulty Levels *
            </label>
            <div className="flex flex-wrap gap-4">
              {difficultyLevels.map(level => (
                <label 
                  key={level.value}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    name="difficultyLevels"
                    value={level.value}
                    checked={formData.difficultyLevels.includes(level.value)}
                    onChange={handleInputChange}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className={`font-medium ${level.color}`}>{level.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Questions per Topic */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Questions per Topic
            </label>
            <input
              type="number"
              name="questionsPerTopic"
              value={formData.questionsPerTopic}
              onChange={handleInputChange}
              min="1"
              max="20"
              className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">
              Estimated total: ~{(formData.topics.length || availableTopics.length || 1) * formData.difficultyLevels.length * formData.questionTypes.length * formData.questionsPerTopic} questions
            </p>
          </div>

          {/* Content Sources */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Content Sources
            </label>
            <div className="flex flex-wrap gap-4">
              {sources.map(source => (
                <label 
                  key={source.value}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    name="sources"
                    value={source.value}
                    checked={formData.sources.includes(source.value)}
                    onChange={handleInputChange}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{source.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Question Types */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Question Types *
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {questionTypes.map(type => (
              <label 
                key={type.value}
                className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-all ${
                  formData.questionTypes.includes(type.value)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="checkbox"
                  name="questionTypes"
                  value={type.value}
                  checked={formData.questionTypes.includes(type.value)}
                  onChange={handleInputChange}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{type.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <div className="pt-4 border-t">
          <button
            onClick={handleGenerate}
            disabled={generating || !formData.courseId}
            className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-all flex items-center justify-center gap-2 ${
              generating || !formData.courseId
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
            }`}
          >
            {generating ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Generating Questions...
              </>
            ) : (
              <>
                <span>🚀</span>
                Generate Questions with AI
              </>
            )}
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 flex gap-4">
        <button
          onClick={() => navigate(`${basePath}/ai-questions/review`)}
          className="flex-1 py-3 px-4 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
        >
          📋 Review Pending Drafts
        </button>
        <button
          onClick={() => navigate('/tutor/questions')}
          className="flex-1 py-3 px-4 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
        >
          📚 Question Bank
        </button>
      </div>

      {/* ── AI Generation Progress Modal ── */}
      {showProgressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-gray-900 bg-opacity-60 backdrop-blur-sm" />

          {/* Panel */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 overflow-hidden">

            {/* Animated gradient top bar */}
            <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 bg-[length:200%_100%] animate-[shimmer_1.5s_linear_infinite]" />
            </div>

            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                <svg className="animate-spin w-5 h-5 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Generating Questions</h3>
                <p className="text-sm text-gray-500">Please wait, this may take a moment{progressDots}</p>
              </div>
            </div>

            {/* Steps */}
            <div className="space-y-3">
              {progressSteps.map((step, idx) => {
                const isActive  = step.status === 'active'
                const isDone    = step.status === 'done'
                const isError   = step.status === 'error'
                const isPending = step.status === 'pending'

                return (
                  <div
                    key={step.id}
                    className={`flex items-start gap-3 p-3 rounded-xl transition-all duration-500 ${
                      isActive  ? 'bg-blue-50 border border-blue-200 shadow-sm' :
                      isDone    ? 'bg-green-50 border border-green-100' :
                      isError   ? 'bg-red-50 border border-red-200' :
                      'bg-gray-50 border border-transparent opacity-50'
                    }`}
                  >
                    {/* Status icon */}
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                      isActive  ? 'bg-blue-500 text-white shadow-md shadow-blue-200' :
                      isDone    ? 'bg-green-500 text-white' :
                      isError   ? 'bg-red-500 text-white' :
                      'bg-gray-200 text-gray-400'
                    }`}>
                      {isActive  ? <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> :
                       isDone    ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg> :
                       isError   ? '✕' :
                       <span className="text-xs">{idx + 1}</span>}
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-semibold leading-tight ${
                        isActive ? 'text-blue-800' : isDone ? 'text-green-800' : isError ? 'text-red-800' : 'text-gray-400'
                      }`}>
                        <span className="mr-1.5">{step.icon}</span>
                        {step.label}
                      </div>
                      {(isActive || isError) && (
                        <div className={`text-xs mt-0.5 ${isError ? 'text-red-600' : 'text-blue-600'}`}>
                          {isError ? 'An error occurred. Please try again.' : step.detail}
                        </div>
                      )}
                    </div>

                    {/* Done checkmark pulse */}
                    {isDone && (
                      <div className="flex-shrink-0 text-green-500 text-sm">✓</div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Overall progress bar */}
            <div className="mt-5">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Progress</span>
                <span>{progressSteps.filter(s => s.status === 'done').length} / {progressSteps.length} steps</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-700"
                  style={{ width: `${(progressSteps.filter(s => s.status === 'done').length / progressSteps.length) * 100}%` }}
                />
              </div>
            </div>

            <p className="mt-4 text-center text-xs text-gray-400">
              ✨ Do not close this window while questions are being generated
            </p>
          </div>
        </div>
      )}

      {/* Result Modal */}
      {showResultModal && generationResult && (
        <Modal 
          isOpen={showResultModal} 
          onClose={() => setShowResultModal(false)}
          title="Generation Complete"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {generationResult.summary.totalGenerated}
                </div>
                <div className="text-sm text-blue-800">Total Generated</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-green-600">
                  {generationResult.summary.draftsCreated}
                </div>
                <div className="text-sm text-green-800">Drafts Created</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-yellow-600">
                  {generationResult.summary.duplicatesFound}
                </div>
                <div className="text-sm text-yellow-800">Duplicates Skipped</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {generationResult.summary.duration}
                </div>
                <div className="text-sm text-purple-800">Time Taken</div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Job ID:</strong> {generationResult.jobId}
              </p>
              <p className="text-sm text-gray-600">
                <strong>AI Provider:</strong> {generationResult.provider.name} v{generationResult.provider.version}
              </p>
            </div>

            {generationResult.errors.length > 0 && (
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="font-medium text-red-800 mb-2">Some errors occurred:</p>
                <ul className="text-sm text-red-600 list-disc list-inside">
                  {generationResult.errors.slice(0, 5).map((err, idx) => (
                    <li key={idx}>{err.topic}: {err.error}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => {
                  setShowResultModal(false)
                  navigate(`${basePath}/ai-questions/review`)
                }}
                className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Review Drafts
              </button>
              <button
                onClick={() => setShowResultModal(false)}
                className="flex-1 py-2 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
              >
                Generate More
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>


    </>)
}

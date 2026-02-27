import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { quizService, courseService, algorithmQuizService, questionService } from '@/services/apiServices'
import { useAuthStore } from '@/store/authStore'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import SEOHead from '@/components/SEO/SEOHead';
import ErrorMessage from '@/components/common/ErrorMessage'
import { BookOpen, Clock, Target, AlertCircle, CheckCircle, ArrowRight, Layers } from 'lucide-react'
import { UsageIndicator } from '@/components/common'

/**
 * Quiz Setup Page
 * 
 * Purpose: Allow students to configure their assessment before starting
 * 
 * Features:
 * - Select Subject/Course (when accessed directly)
 * - Select Difficulty Level
 * - Configure number of questions
 * - Set quiz duration
 * - Display quiz rules
 * - Start quiz with configuration
 */
export default function QuizSetup() {
  const { quizId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  
  // State management
  const [quiz, setQuiz] = useState(null)
  const [courses, setCourses] = useState([])
  const [subjects, setSubjects] = useState([])
  const [filteredCourses, setFilteredCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCourseSelection, setShowCourseSelection] = useState(false)
  const [courseQuestionCounts, setCourseQuestionCounts] = useState({}) // Track question counts per course
  const [courseQuizCounts, setCourseQuizCounts] = useState({}) // Track completed quiz counts per course
  
  // Quiz configuration state
  const [config, setConfig] = useState({
    subject: '',
    courseId: '',
    difficulty: 'medium',
    questionCount: 10,
    duration: 30, // minutes
    timePerQuestion: null, // optional alternative to total duration
    strategyName: 'algorithm', // Use our custom algorithm
    questionSelectionStrategy: 'adaptive' // Default to adaptive strategy
  })
  
  const [acceptedRules, setAcceptedRules] = useState(false)

  // Load quiz and courses on mount
  useEffect(() => {
    loadInitialData()
  }, [quizId])

  /**
   * Load quiz details and available courses
   */
  const loadInitialData = async () => {
    try {
      setLoading(true)
      
      // Load quiz details if quizId is provided
      if (quizId) {
        const quizResponse = await quizService.getQuizById(quizId)
        setQuiz(quizResponse.quiz)
        
        // Pre-fill configuration from quiz
        setConfig(prev => ({
          ...prev,
          courseId: quizResponse.quiz.courseId?._id || quizResponse.quiz.courseId,
          difficulty: quizResponse.quiz.difficulty || 'medium',
          questionCount: quizResponse.quiz.questions?.length || 10,
          duration: quizResponse.quiz.duration || 30
        }))
        setShowCourseSelection(false) // Hide course selection when quiz is pre-selected
      } else {
        setShowCourseSelection(true) // Show course selection when accessed directly
      }
      
      // Load subjects using the dedicated subjects endpoint (filtered by user's grade)
      // This ensures we get ALL subjects, not just the first 10 from a paginated courses call
      const studentGrade = user?.grade
      const courseParams = { limit: 1000, ...(studentGrade ? { grade: studentGrade } : {}) }

      const [subjectsResponse, courseResponse] = await Promise.all([
        courseService.getSubjects().catch(() => null), // already filtered by grade on backend
        courseService.getCourses(courseParams)         // filter by student's grade
      ])

      const allCourses = courseResponse.courses || []
      setCourses(allCourses)

      // Use dedicated subjects endpoint first; fall back to extracting from courses
      let uniqueSubjects
      if (subjectsResponse?.subjects?.length > 0) {
        uniqueSubjects = subjectsResponse.subjects.map(s => s.name || s).filter(Boolean).sort()
      } else {
        uniqueSubjects = [...new Set(allCourses.map(c => c.subject))].filter(Boolean).sort()
      }

      console.log('[QuizSetup] Student grade:', studentGrade, '| Subjects loaded:', uniqueSubjects)
      setSubjects(uniqueSubjects)

      // Fetch question counts for all courses
      await fetchQuestionCounts(allCourses)
      
    } catch (err) {
      setError(err.message || 'Failed to load quiz configuration')
      console.error('Quiz setup error:', err)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Fetch question counts and completed quiz counts for all courses
   */
  const fetchQuestionCounts = async (coursesToCheck) => {
    const questionCounts = {}
    const quizCounts = {}

    // Fetch both question counts and quiz counts in parallel for all courses
    await Promise.allSettled(
      coursesToCheck.map(async (course) => {
        const [qCountRes, quizCountRes] = await Promise.allSettled([
          questionService.getQuestionCount(course._id),
          courseService.getCourseQuizCount(course._id)
        ])
        questionCounts[course._id] = qCountRes.status === 'fulfilled' ? (qCountRes.value?.count || 0) : 0
        quizCounts[course._id] = quizCountRes.status === 'fulfilled' ? (quizCountRes.value?.count || 0) : 0
      })
    )

    setCourseQuestionCounts(questionCounts)
    setCourseQuizCounts(quizCounts)
  }

  // Filter courses when subject changes
  useEffect(() => {
    if (config.subject) {
      const filtered = courses.filter(c => c.subject === config.subject)
      setFilteredCourses(filtered)
      // Reset course selection if current course doesn't match new subject
      if (config.courseId) {
        const currentCourse = courses.find(c => c._id === config.courseId)
        if (currentCourse?.subject !== config.subject) {
          setConfig(prev => ({ ...prev, courseId: '' }))
        }
      }
    } else {
      setFilteredCourses([])
    }
  }, [config.subject, courses])

  // Scroll to top when transitioning between steps
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [showCourseSelection])

  /**
   * Handle configuration changes
   */
  const handleConfigChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Auto-calculate time per question if duration changes
    if (field === 'duration') {
      setConfig(prev => ({
        ...prev,
        timePerQuestion: Math.floor((value * 60) / prev.questionCount)
      }))
    }
    
    // Auto-calculate duration if question count changes
    if (field === 'questionCount' && config.timePerQuestion) {
      setConfig(prev => ({
        ...prev,
        duration: Math.ceil((value * prev.timePerQuestion) / 60)
      }))
    }
  }

  /**
   * Start the quiz with current configuration
   */
  const handleStartQuiz = async () => {
    if (!acceptedRules) {
      setError('Please accept the quiz rules before starting')
      return
    }

    if (!config.courseId && !quizId) {
      setError('Please select both subject and course')
      return
    }

    try {
      setLoading(true)

      // Check if sufficient questions are available for the course
      const questionCountResponse = await algorithmQuizService.getQuestionCount(config.courseId)
      const availableQuestions = questionCountResponse.count || 0

      if (availableQuestions < config.questionCount) {
        setError(`Insufficient questions available. Required: ${config.questionCount}, Available: ${availableQuestions}. Please reduce the number of questions or contact your tutor.`)
        setLoading(false)
        return
      }

      // Fetch all questions for the course
      console.log('[QuizSetup] Fetching questions for courseId:', config.courseId)
      const questionsResponse = await questionService.getQuestions({
        courseId: config.courseId,
        limit: 500 // Fetch up to 500 questions for better selection
      })

      console.log('[QuizSetup] Questions fetched:', questionsResponse.questions?.length || 0)

      if (!questionsResponse.questions || questionsResponse.questions.length === 0) {
        setError('No questions found for this course. Please contact your tutor to add questions.')
        setLoading(false)
        return
      }

      if (questionsResponse.questions.length < config.questionCount) {
        setError(`Not enough questions available. Required: ${config.questionCount}, Available: ${questionsResponse.questions.length}. Please reduce the number of questions.`)
        setLoading(false)
        return
      }

      // Get course and subject information
      const selectedCourse = courses.find(c => c._id === config.courseId)
      const subjectName = config.subject || selectedCourse?.subject || 'General'
      const courseName = selectedCourse?.title || 'Quiz'

      // Get student's past performance from backend API
      let pastPerformance = null
      try {
        const performanceResponse = await algorithmQuizService.getStudentPerformance()
        if (performanceResponse.success && performanceResponse.performance) {
          pastPerformance = performanceResponse.performance
          console.log('[QuizSetup] Loaded performance from backend:', pastPerformance)
        }
      } catch (perfError) {
        console.warn('[QuizSetup] Could not load performance data:', perfError)
        // Continue without performance data
      }

      // Call backend to select questions using configured strategy
      console.log('[QuizSetup] Requesting questions from backend with strategy:', config.questionSelectionStrategy)

      try {
        // Create active quiz via API - backend will handle question selection
        const quizData = {
          subject: subjectName,
          courseName,
          courseId: config.courseId,
          difficulty: config.difficulty,
          questionCount: config.questionCount,
          duration: config.duration,
          algorithmUsed: 'algorithm',
          questionSelectionStrategy: config.questionSelectionStrategy
        }

        console.log('[QuizSetup] Sending quiz data to backend:', quizData)
        const response = await algorithmQuizService.createActiveQuiz(quizData)

        console.log('[QuizSetup] Active quiz created successfully:', response.data.quizId)

        // Store configuration in session storage for quiz page
        sessionStorage.setItem('quizConfig', JSON.stringify({
          ...config,
          sessionId: response.data.sessionId,
          quizId: response.data.quizId,
          startTime: Date.now()
        }))

        // Navigate to active quiz list
        navigate('/student/active-quizzes', {
          state: {
            message: 'Quiz created successfully! Click Start to begin.',
            newQuizId: response.data.quizId
          }
        })

      } catch (backendError) {
        console.error('[QuizSetup] Error creating quiz:', backendError)
        console.error('[QuizSetup] Error response:', backendError.response?.data)
        console.error('[QuizSetup] Error status:', backendError.response?.status)
        console.error('[QuizSetup] Error message:', backendError.message)
        
        let errorMsg = 'Failed to create quiz'
        
        // Check for validation errors
        if (backendError.response?.data?.errors && Array.isArray(backendError.response.data.errors)) {
          errorMsg = backendError.response.data.errors.map(e => e.msg).join(', ')
        } else if (backendError.response?.data?.message) {
          errorMsg = backendError.response.data.message
        } else if (backendError.response?.data?.error) {
          errorMsg = backendError.response.data.error
        } else if (backendError.message) {
          errorMsg = backendError.message
        }
        
        setError(errorMsg)
        setLoading(false)
        return
      }

    } catch (err) {
      setError(err.message || 'Failed to create quiz')
      console.error('Quiz creation error:', err)
      setLoading(false)
    }
  }

  /**
   * Quiz rules configuration
   */
  const quizRules = [
    'Answer all questions to the best of your ability',
    'The timer will start as soon as you begin',
    'You can navigate between questions freely',
    'Mark questions for review if needed',
    'Auto-submit will occur when time expires',
    'No external resources or assistance allowed',
    'Ensure stable internet connection',
    'Your progress is saved automatically'
  ]

  /**
   * Get difficulty badge color
   */
  const getDifficultyColor = (level) => {
    const colors = {
      easy: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      hard: 'bg-red-100 text-red-800',
      olympiad: 'bg-purple-100 text-purple-800'
    }
    return colors[level] || colors.medium
  }

  if (loading) return <LoadingSpinner fullScreen />
  if (error && !quiz) return <ErrorMessage message={error} />

  return (
    <>

    <SEOHead title="Quiz Setup - Student" noIndex={true} noFollow={true} />

    <div className="min-h-screen bg-white">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* Header with MeriTai styling */}
        <div className="mb-6 sm:mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-3">
            {quiz ? quiz.title : '✨ Quiz Setup ✨'}
          </h1>
          <p className="text-base sm:text-lg text-gray-600 font-medium">
            Configure your awesome quiz settings before you begin! 🚀
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-300 rounded-2xl shadow-lg">
            <p className="text-sm font-semibold text-red-800 flex items-center">
              <span className="text-2xl mr-2">⚠️</span>
              {error}
            </p>
          </div>
        )}

        <UsageIndicator feature="quiz.take" variant="badge" showLabel={true} />

        {showCourseSelection ? (
          /* Subject & Course Selection Step */
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Layers className="w-8 h-8 text-indigo-600" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Create Your Quiz</h2>
              <p className="text-gray-600">Select subject and course to generate personalized quiz</p>
            </div>
            
            {/* Subject Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Step 1: Select Subject ({subjects.length} available)
              </label>
              {subjects.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">No subjects available at the moment.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {subjects.sort().map(subject => {
                    // Count courses for this subject
                    const coursesForSubject = courses.filter(c => c.subject === subject).length
                    const questionsForSubject = courses
                      .filter(c => c.subject === subject)
                      .reduce((sum, c) => sum + (courseQuestionCounts[c._id] || 0), 0)
                    
                    return (
                      <button
                        key={subject}
                        onClick={() => setConfig(prev => ({ ...prev, subject }))}
                        className={`p-4 border-2 rounded-lg transition-all ${
                          config.subject === subject
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}
                        title={`${coursesForSubject} courses, ${questionsForSubject} questions available`}
                      >
                        <BookOpen className="w-6 h-6 mx-auto mb-2" />
                        <p className="font-medium text-sm">{subject}</p>
                        <p className="text-xs text-gray-500 mt-1">{coursesForSubject} course{coursesForSubject !== 1 ? 's' : ''}</p>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
            
            {/* Course Selection */}
            {config.subject && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Step 2: Select Course
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredCourses.map(course => {
                    const questionCount = courseQuestionCounts[course._id] || 0
                    const hasQuestions = questionCount > 0
                    const completedQuizzes = courseQuizCounts[course._id] || 0

                    return (
                      <div
                        key={course._id}
                        onClick={() => {
                          if (hasQuestions) {
                            setConfig(prev => ({ ...prev, courseId: course._id }))
                            setShowCourseSelection(false)
                          }
                        }}
                        className={`p-4 border-2 rounded-lg transition-all relative ${
                          !hasQuestions
                            ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                            : config.courseId === course._id
                            ? 'border-indigo-600 bg-indigo-50 cursor-pointer'
                            : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 cursor-pointer'
                        }`}
                      >
                        <h3 className="font-semibold text-gray-900 mb-1">{course.title}</h3>
                        <p className="text-sm text-gray-500">Grade {course.grade} • {course.subject}</p>
                        {course.description && (
                          <p className="text-xs text-gray-400 mt-2 line-clamp-2">{course.description}</p>
                        )}

                        {/* Counts row */}
                        <div className="mt-3 flex items-center gap-2 flex-wrap">
                          {hasQuestions ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {questionCount} {questionCount === 1 ? 'question' : 'questions'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              No questions available
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                            🏆 {completedQuizzes} {completedQuizzes === 1 ? 'quiz' : 'quizzes'} done
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
                
                {filteredCourses.length === 0 && (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">No courses available for {config.subject}.</p>
                  </div>
                )}
              </div>
            )}
            
            {!config.subject && courses.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No courses available at the moment.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Main Configuration */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Selected Subject & Course */}
              {!quizId && config.subject && config.courseId && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-semibold text-gray-900">Selected Course</h2>
                      <p className="text-xs sm:text-sm text-gray-500">
                        {config.subject} - {courses.find(c => c._id === config.courseId)?.title}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowCourseSelection(true)}
                    className="text-sm text-indigo-600 hover:text-indigo-800"
                  >
                    Change course
                  </button>
                </div>
              )}

              {/* Difficulty Level */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <Target className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-semibold text-gray-900">Difficulty Level</h2>
                    <p className="text-xs sm:text-sm text-gray-500">Select challenge level</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {['easy', 'medium', 'hard', 'olympiad'].map(level => (
                    <button
                      key={level}
                      onClick={() => handleConfigChange('difficulty', level)}
                      disabled={quiz && quiz.difficulty}
                      className={`px-3 sm:px-4 py-2 sm:py-3 rounded-lg border-2 transition-all text-sm sm:text-base capitalize ${
                        config.difficulty === level
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      } ${quiz && quiz.difficulty ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {config.difficulty === 'easy' && 'Basic concepts and direct recall questions'}
                  {config.difficulty === 'medium' && 'Conceptual understanding and application'}
                  {config.difficulty === 'hard' && 'Complex problem-solving and critical thinking'}
                  {config.difficulty === 'olympiad' && '🏆 Competition-level advanced problem-solving'}
                </p>
              </div>

              {/* Question Configuration */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-semibold text-gray-900">Quiz Configuration</h2>
                    <p className="text-xs sm:text-sm text-gray-500">Customize your quiz experience</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Questions
                    </label>
                    <select
                      value={config.questionCount}
                      onChange={(e) => handleConfigChange('questionCount', parseInt(e.target.value))}
                      disabled={quiz && quiz.questions}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
                    >
                      {[5, 10, 15, 20, 25, 30].map(count => (
                        <option key={count} value={count}>{count} Questions</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duration (Minutes)
                    </label>
                    <select
                      value={config.duration}
                      onChange={(e) => handleConfigChange('duration', parseInt(e.target.value))}
                      disabled={quiz && quiz.duration}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
                    >
                      {[15, 30, 45, 60, 90, 120].map(duration => (
                        <option key={duration} value={duration}>{duration} Minutes</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Question Selection Strategy
                    </label>
                    <select
                      value={config.questionSelectionStrategy}
                      onChange={(e) => handleConfigChange('questionSelectionStrategy', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="adaptive">Adaptive (Personalized) 🎯</option>
                      <option value="default">Default (Balanced) ⚖️</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      {config.questionSelectionStrategy === 'adaptive'
                        ? 'Questions personalized based on your performance'
                        : 'Questions balanced across all topics'}
                    </p>
                  </div>
                </div>

                {config.timePerQuestion && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      <Clock className="w-4 h-4 inline mr-1" />
                      Approximately {config.timePerQuestion} seconds per question
                    </p>
                  </div>
                )}
              </div>

              {/* Quiz Rules */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-semibold text-gray-900">Quiz Rules</h2>
                    <p className="text-xs sm:text-sm text-gray-500">Please read carefully before starting</p>
                  </div>
                </div>

                <ul className="space-y-2 mb-4">
                  {quizRules.map((rule, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      {rule}
                    </li>
                  ))}
                </ul>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="acceptRules"
                    checked={acceptedRules}
                    onChange={(e) => setAcceptedRules(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <label htmlFor="acceptRules" className="text-sm text-gray-700 cursor-pointer">
                    I have read and accept the quiz rules
                  </label>
                </div>
              </div>

              {/* Create Quiz Button - Moved below rules */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleStartQuiz}
                    disabled={!acceptedRules || (!config.courseId && !quizId) || loading}
                    className="flex-1 btn-primary flex items-center justify-center gap-2 min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                  >
                    {loading ? 'Creating Quiz...' : 'Create Quiz'}
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  
                  <button
                    onClick={() => navigate('/student/quizzes')}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 min-h-[44px] text-sm sm:text-base"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>

            {/* Sidebar - Quiz Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 sticky top-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Quiz Summary</h3>
                
                <div className="space-y-4 mb-6">
                  {quiz && (
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500 mb-1">Quiz Title</p>
                      <p className="text-sm sm:text-base font-medium text-gray-900">{quiz.title}</p>
                    </div>
                  )}
                  
                  {config.courseId && (
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500 mb-1">Course</p>
                      <p className="text-sm sm:text-base font-medium text-gray-900">
                        {courses.find(c => c._id === config.courseId)?.title || 'Selected Course'}
                      </p>
                    </div>
                  )}
                  
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500 mb-1">Difficulty</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(config.difficulty)}`}>
                      {config.difficulty}
                    </span>
                  </div>
                  
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500 mb-1">Questions</p>
                    <p className="text-sm sm:text-base font-medium text-gray-900">{config.questionCount} questions</p>
                  </div>
                  
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500 mb-1">Duration</p>
                    <p className="text-sm sm:text-base font-medium text-gray-900">{config.duration} minutes</p>
                  </div>
                  
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500 mb-1">Selection Strategy</p>
                    <p className="text-sm sm:text-base font-medium text-gray-900 capitalize">
                      {config.questionSelectionStrategy === 'adaptive' ? '🎯 Adaptive' : '⚖️ Default'}
                    </p>
                  </div>
                  
                  {quiz && quiz.totalMarks && (
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500 mb-1">Total Marks</p>
                      <p className="text-sm sm:text-base font-medium text-gray-900">{quiz.totalMarks}</p>
                    </div>
                  )}
                  
                  {quiz && quiz.passingPercentage && (
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500 mb-1">Passing Score</p>
                      <p className="text-sm sm:text-base font-medium text-gray-900">{quiz.passingPercentage}%</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>


    </>)
}

import { useState, useEffect, useMemo } from 'react'
import { useQuery } from 'react-query'
import Modal from '../common/Modal'
import { questionService, courseService } from '@/services/apiServices'

const QUESTION_TYPES = [
  { value: 'mcq-single', label: 'Multiple Choice (Single Answer)', hasOptions: true },
  { value: 'mcq-multiple', label: 'Multiple Choice (Multiple Answers)', hasOptions: true },
  { value: 'true-false', label: 'True/False', hasOptions: true },
  { value: 'numerical', label: 'Numerical', hasOptions: false },
  { value: 'short-answer', label: 'Short Answer', hasOptions: false },
  { value: 'long-answer', label: 'Long Answer', hasOptions: false },
  { value: 'case-based', label: 'Case Study Based', hasOptions: true }
]

const DIFFICULTY_LEVELS = [
  { value: 'easy', label: 'Easy', color: 'bg-green-100 text-green-800' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'hard', label: 'Hard', color: 'bg-red-100 text-red-800' },
  { value: 'olympiad', label: 'Olympiad 🏆', color: 'bg-purple-100 text-purple-800' }
]

export default function QuestionFormModal({
  isOpen,
  onClose,
  onSave,
  question = null,
  courses = [],
  defaultCourseId = ''
}) {
  const [formData, setFormData] = useState({
    grade: '',
    subject: '',
    courseId: defaultCourseId,
    chapterId: '',
    chapterName: '',
    topic: '',
    difficultyLevel: 'medium',
    type: 'mcq-single',
    text: '',
    caseStudy: '',
    options: [
      { text: '', isCorrect: false, explanation: '' },
      { text: '', isCorrect: false, explanation: '' },
      { text: '', isCorrect: false, explanation: '' },
      { text: '', isCorrect: false, explanation: '' }
    ],
    numericalAnswer: { value: 0, tolerance: 0, unit: '' },
    expectedAnswer: '',
    correctAnswer: '',
    keywords: [],
    explanation: '',
    hint: '',
    marks: 1,
    negativeMarks: 0,
    recommendedTime: 60,
    tags: []
  })

  const [errors, setErrors] = useState({})
  const [tagInput, setTagInput] = useState('')
  const [keywordInput, setKeywordInput] = useState('')
  const [chapters, setChapters] = useState([])
  const [topics, setTopics] = useState([])
  const [selectedCourse, setSelectedCourse] = useState(null)

  // Fetch courses if not provided
  const { data: coursesData, isLoading: loadingCourses } = useQuery(
    'courses',
    () => questionService.getCourses(),
    {
      enabled: isOpen && courses.length === 0
    }
  )

  // Fetch grades separately
  const { data: gradesData, isLoading: loadingGrades, error: gradesError } = useQuery(
    'grades',
    () => courseService.getGrades(),
    {
      enabled: isOpen
    }
  )

  const availableCourses = courses.length > 0 ? courses : (coursesData?.courses || [])
  
  // Use grades from dedicated API, with fallback to computing from courses
  const availableGrades = useMemo(() => {
    // Try to use grades from API first
    if (gradesData?.grades && gradesData.grades.length > 0) {
      const grades = gradesData.grades.sort((a, b) => a - b).map(grade => ({
        value: grade,
        label: `Class ${grade}`
      }));
      return grades;
    }
    
    // Fallback: compute from available courses
    if (availableCourses.length > 0) {
      const gradeSet = new Set(availableCourses.map(course => course.grade).filter(Boolean));
      const grades = Array.from(gradeSet).sort((a, b) => a - b).map(grade => ({
        value: grade,
        label: `Class ${grade}`
      }));
      return grades;
    }
    
    return []
  }, [gradesData, gradesError, availableCourses])

  const availableSubjects = useMemo(() => {
    const subjectSet = new Set(availableCourses.map(course => course.subject).filter(Boolean))
    return Array.from(subjectSet).sort().map(subject => ({
      value: subject,
      label: subject
    }))
  }, [availableCourses])
  
  // Filter courses based on selected grade and subject
  const filteredCourses = availableCourses.filter(course => {
    const gradeMatch = !formData.grade || course.grade === parseInt(formData.grade)
    const subjectMatch = !formData.subject || course.subject === formData.subject
    return gradeMatch && subjectMatch
  })

  // Fetch course structure when courseId changes
  const { data: courseStructure, isLoading: loadingStructure } = useQuery(
    ['courseStructure', formData.courseId],
    () => questionService.getCourseStructure(formData.courseId),
    {
      enabled: !!formData.courseId,
      onSuccess: (data) => {
        setChapters(data.chapters || [])
        
        // If we're editing and have a chapterName, set the chapterId and topics
        if (question && question.chapterName && data.chapters) {
          const chapter = data.chapters.find(c => c.name === question.chapterName || c.title === question.chapterName)
          if (chapter) {
            setTopics(chapter.topics || [])
            setFormData(prev => ({
              ...prev,
              chapterId: chapter._id
            }))
          }
        }
      }
    }
  )

  useEffect(() => {
    if (!isOpen) return;
    
    if (question) {
      // Find the course to get grade/subject if not available in question
      // courseId might be an object (populated) or string
      const courseId = typeof question.courseId === 'object' ? question.courseId?._id : question.courseId;
      const course = availableCourses.find(c => c._id === courseId);
      
      // Set form data with courseId first so course structure can be loaded
      setFormData({
        grade: question.grade || course?.grade || '',
        subject: question.subject || course?.subject || '',
        courseId: courseId || '',
        chapterId: '', // Will be set when course structure loads
        chapterName: question.chapterName || '',
        topic: question.topic || '',
        difficultyLevel: question.difficultyLevel || 'medium',
        type: question.type || 'mcq-single',
        text: question.text || '',
        caseStudy: question.caseStudy || '',
        options: question.options || [
          { text: '', isCorrect: false, explanation: '' },
          { text: '', isCorrect: false, explanation: '' },
          { text: '', isCorrect: false, explanation: '' },
          { text: '', isCorrect: false, explanation: '' }
        ],
        numericalAnswer: question.numericalAnswer || { value: 0, tolerance: 0, unit: '' },
        expectedAnswer: question.expectedAnswer || '',
        correctAnswer: question.correctAnswer || '',
        keywords: question.keywords || [],
        explanation: question.explanation || '',
        hint: question.hint || '',
        marks: question.marks || 1,
        negativeMarks: question.negativeMarks || 0,
        recommendedTime: question.recommendedTime || 60,
        tags: question.tags || []
      })
      
      // Set selected course and populate grade/subject
      if (course) {
        setSelectedCourse(course)
      }
    } else {
      // Reset form for new question
      setFormData({
        grade: '',
        subject: '',
        courseId: defaultCourseId || '',
        chapterId: '',
        chapterName: '',
        topic: '',
        difficultyLevel: 'medium',
        type: 'mcq-single',
        text: '',
        caseStudy: '',
        options: [
          { text: '', isCorrect: false, explanation: '' },
          { text: '', isCorrect: false, explanation: '' },
          { text: '', isCorrect: false, explanation: '' },
          { text: '', isCorrect: false, explanation: '' }
        ],
        numericalAnswer: { value: 0, tolerance: 0, unit: '' },
        expectedAnswer: '',
        correctAnswer: '',
        keywords: [],
        explanation: '',
        hint: '',
        marks: 1,
        negativeMarks: 0,
        recommendedTime: 60,
        tags: []
      })
      setTopics([])
      setChapters([])
      
      // Set selected course for new question
      if (defaultCourseId && availableCourses.length > 0) {
        const course = availableCourses.find(c => c._id === defaultCourseId)
        if (course) {
          setSelectedCourse(course)
          setFormData(prev => ({
            ...prev,
            grade: course.grade || '',
            subject: course.subject || ''
          }))
        }
      } else {
        setSelectedCourse(null)
      }
    }
  }, [question, defaultCourseId, isOpen, availableCourses.length])

  // Separate effect to handle course structure loading when editing
  useEffect(() => {
    if (question && question.courseId && availableCourses.length > 0) {
      // Ensure courseId is set to trigger course structure loading
      const courseId = typeof question.courseId === 'object' ? question.courseId?._id : question.courseId;
      setFormData(prev => ({
        ...prev,
        courseId: courseId
      }))
    }
  }, [question, availableCourses])

  // Effect to handle chapter and topic population when editing - REMOVED
  // Now handled in course structure query onSuccess callback

  const handleChange = (field, value) => {
    let updatedFormData = { ...formData, [field]: value }
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }))
    }
    
    // Handle chapter change - populate topics
    if (field === 'chapterId') {
      const selectedChapter = chapters.find(c => c._id === value)
      if (selectedChapter) {
        setTopics(selectedChapter.topics || [])
        updatedFormData = {
          ...updatedFormData,
          chapterId: value,
          chapterName: selectedChapter.name,
          topic: '' // Reset topic when chapter changes
        }
      } else {
        setTopics([])
        updatedFormData = {
          ...updatedFormData,
          chapterId: '',
          chapterName: '',
          topic: ''
        }
      }
    }
    
    // Handle course change - reset chapter and topic, update selected course
    if (field === 'courseId') {
      const course = availableCourses.find(c => c._id === value)
      setSelectedCourse(course || null)
      setChapters([])
      setTopics([])
      updatedFormData = {
        ...updatedFormData,
        courseId: value,
        chapterId: '',
        chapterName: '',
        topic: ''
      }
    }
    
    // Handle grade change - reset course, chapter, topic
    if (field === 'grade') {
      setSelectedCourse(null)
      setChapters([])
      setTopics([])
      updatedFormData = {
        ...updatedFormData,
        grade: value,
        courseId: '',
        chapterId: '',
        chapterName: '',
        topic: ''
      }
    }
    
    // Handle subject change - reset course, chapter, topic
    if (field === 'subject') {
      setSelectedCourse(null)
      setChapters([])
      setTopics([])
      updatedFormData = {
        ...updatedFormData,
        subject: value,
        courseId: '',
        chapterId: '',
        chapterName: '',
        topic: ''
      }
    }

    setFormData(updatedFormData)
  }

  const handleOptionChange = (index, field, value) => {
    const newOptions = [...formData.options]
    newOptions[index] = { ...newOptions[index], [field]: value }
    
    // For MCQ-single, ensure only one correct answer
    if (field === 'isCorrect' && value && formData.type === 'mcq-single') {
      newOptions.forEach((opt, idx) => {
        if (idx !== index) opt.isCorrect = false
      })
    }
    
    setFormData(prev => ({ ...prev, options: newOptions }))
  }

  const addOption = () => {
    if (formData.options.length < 6) {
      setFormData(prev => ({
        ...prev,
        options: [...prev.options, { text: '', isCorrect: false, explanation: '' }]
      }))
    }
  }

  const removeOption = (index) => {
    if (formData.options.length > 2) {
      setFormData(prev => ({
        ...prev,
        options: prev.options.filter((_, idx) => idx !== index)
      }))
    }
  }

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }))
      setTagInput('')
    }
  }

  const removeTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }))
  }

  const addKeyword = () => {
    if (keywordInput.trim() && !formData.keywords.includes(keywordInput.trim())) {
      setFormData(prev => ({
        ...prev,
        keywords: [...prev.keywords, keywordInput.trim()]
      }))
      setKeywordInput('')
    }
  }

  const removeKeyword = (keyword) => {
    setFormData(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keyword)
    }))
  }

  const validate = () => {
    const newErrors = {}
    
    if (!formData.grade) newErrors.grade = 'Grade is required'
    if (!formData.subject) newErrors.subject = 'Subject is required'
    if (!formData.courseId) newErrors.courseId = 'Course is required'
    if (!formData.chapterId) newErrors.chapterId = 'Chapter is required'
    if (!formData.topic?.trim()) newErrors.topic = 'Topic is required'
    if (!formData.text?.trim()) newErrors.text = 'Question text is required'
    
    // Type-specific validation
    const typeConfig = QUESTION_TYPES.find(t => t.value === formData.type)
    
    if (typeConfig?.hasOptions) {
      const filledOptions = formData.options.filter(o => o.text?.trim())
      if (filledOptions.length < 2) {
        newErrors.options = 'At least 2 options are required'
      }
      
      const correctCount = formData.options.filter(o => o.isCorrect).length
      if (formData.type === 'mcq-single' && correctCount !== 1) {
        newErrors.correct = 'Exactly one correct answer is required'
      }
      if (formData.type === 'mcq-multiple' && correctCount < 2) {
        newErrors.correct = 'At least 2 correct answers are required'
      }
      if (formData.type === 'true-false' && correctCount !== 1) {
        newErrors.correct = 'Select the correct answer (True or False)'
      }
    }
    
    if (formData.type === 'numerical') {
      if (formData.numericalAnswer.value === undefined || formData.numericalAnswer.value === '') {
        newErrors.numericalAnswer = 'Numerical answer value is required'
      }
    }
    
    if (formData.type === 'short-answer' || formData.type === 'long-answer') {
      if (!formData.expectedAnswer?.trim()) {
        newErrors.expectedAnswer = 'Expected answer is required'
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return
    
    // Build correct answer
    let correctAnswer = formData.correctAnswer
    if (formData.type.startsWith('mcq') || formData.type === 'true-false') {
      const correct = formData.options.find(o => o.isCorrect)
      correctAnswer = correct?.text || ''
    } else if (formData.type === 'numerical') {
      correctAnswer = `${formData.numericalAnswer.value}${formData.numericalAnswer.unit ? ' ' + formData.numericalAnswer.unit : ''}`
    } else if (formData.type === 'short-answer' || formData.type === 'long-answer') {
      correctAnswer = formData.expectedAnswer
    }
    
    onSave({
      ...formData,
      correctAnswer
    })
  }

  const typeConfig = QUESTION_TYPES.find(t => t.value === formData.type)

  // Compute correct answer for display
  const getCorrectAnswerDisplay = () => {
    if (formData.type === 'mcq-single' || formData.type === 'mcq-multiple' || formData.type === 'true-false') {
      const correctOptions = formData.options.filter(o => o.isCorrect && o.text?.trim())
      if (correctOptions.length === 0) return 'Not set'
      return correctOptions.map(o => o.text).join(', ')
    } else if (formData.type === 'numerical') {
      if (!formData.numericalAnswer.value && formData.numericalAnswer.value !== 0) return 'Not set'
      return `${formData.numericalAnswer.value}${formData.numericalAnswer.unit ? ' ' + formData.numericalAnswer.unit : ''}`
    } else if (formData.type === 'short-answer' || formData.type === 'long-answer' || formData.type === 'case-based') {
      if (!formData.expectedAnswer?.trim()) return 'Not set'
      return formData.expectedAnswer.length > 100 
        ? formData.expectedAnswer.substring(0, 100) + '...' 
        : formData.expectedAnswer
    }
    return 'Not set'
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={question ? 'Edit Question' : 'Create New Question'}
      size="xl"
    >
      <div className="space-y-6 max-h-[70vh] overflow-y-auto p-1">
        {/* Grade and Subject Selection */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Grade *</label>
            <select
              value={formData.grade}
              onChange={(e) => handleChange('grade', e.target.value)}
              disabled={loadingGrades}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${errors.grade ? 'border-red-500' : 'border-gray-300'} ${loadingGrades ? 'bg-gray-100' : ''}`}
            >
              <option value="">
                {loadingGrades ? 'Loading grades...' : 'Select Grade'}
              </option>
              {availableGrades.map(grade => (
                <option key={grade.value} value={grade.value}>{grade.label}</option>
              ))}
            </select>
            {errors.grade && <p className="text-red-500 text-xs mt-1">{errors.grade}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
            <select
              value={formData.subject}
              onChange={(e) => handleChange('subject', e.target.value)}
              disabled={loadingCourses}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${errors.subject ? 'border-red-500' : 'border-gray-300'} ${loadingCourses ? 'bg-gray-100' : ''}`}
            >
              <option value="">
                {loadingCourses ? 'Loading subjects...' : 'Select Subject'}
              </option>
              {availableSubjects.map(subject => (
                <option key={subject.value} value={subject.value}>{subject.label}</option>
              ))}
            </select>
            {errors.subject && <p className="text-red-500 text-xs mt-1">{errors.subject}</p>}
          </div>
        </div>

        {/* Course Information Display */}
        {selectedCourse && (
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg p-4 mb-4">
            <h3 className="text-sm font-semibold text-indigo-900 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Course Information
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-600 mb-1">Grade</p>
                <p className="text-sm font-semibold text-gray-900 bg-white px-3 py-1.5 rounded border border-gray-200">
                  Class {selectedCourse.grade}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Subject</p>
                <p className="text-sm font-semibold text-gray-900 bg-white px-3 py-1.5 rounded border border-gray-200">
                  {selectedCourse.subject}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Course</p>
                <p className="text-sm font-semibold text-gray-900 bg-white px-3 py-1.5 rounded border border-gray-200 truncate" title={selectedCourse.title}>
                  {selectedCourse.title}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Course *</label>
            <select
              value={formData.courseId}
              onChange={(e) => handleChange('courseId', e.target.value)}
              disabled={loadingCourses || (!formData.grade || !formData.subject)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${errors.courseId ? 'border-red-500' : 'border-gray-300'} ${(!formData.grade || !formData.subject) ? 'bg-gray-100' : ''}`}
            >
              <option value="">
                {loadingCourses ? 'Loading courses...' : (!formData.grade || !formData.subject) ? 'Select grade and subject first' : 'Select Course'}
              </option>
              {filteredCourses.map(course => (
                <option key={course._id} value={course._id}>{course.title}</option>
              ))}
            </select>
            {errors.courseId && <p className="text-red-500 text-xs mt-1">{errors.courseId}</p>}
            {formData.grade && formData.subject && filteredCourses.length === 0 && (
              <p className="text-amber-600 text-xs mt-1">No courses available for selected grade and subject</p>
            )}
            {(!formData.grade || !formData.subject) && <p className="text-gray-500 text-xs mt-1">Please select grade and subject first</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chapter *</label>
            <select
              value={formData.chapterId}
              onChange={(e) => handleChange('chapterId', e.target.value)}
              disabled={!formData.courseId || loadingStructure}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${errors.chapterId ? 'border-red-500' : 'border-gray-300'} ${!formData.courseId ? 'bg-gray-100' : ''}`}
            >
              <option value="">
                {loadingStructure ? 'Loading chapters...' : 'Select Chapter'}
              </option>
              {chapters.map(chapter => (
                <option key={chapter._id} value={chapter._id}>{chapter.name}</option>
              ))}
            </select>
            {errors.chapterId && <p className="text-red-500 text-xs mt-1">{errors.chapterId}</p>}
            {!formData.courseId && <p className="text-gray-500 text-xs mt-1">Please select a course first</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Topic *</label>
            <select
              value={formData.topic}
              onChange={(e) => handleChange('topic', e.target.value)}
              disabled={!formData.chapterId}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${errors.topic ? 'border-red-500' : 'border-gray-300'} ${!formData.chapterId ? 'bg-gray-100' : ''}`}
            >
              <option value="">
                {!formData.chapterId ? 'Select a chapter first' : 'Select Topic'}
              </option>
              {topics.map((topic, index) => (
                <option key={index} value={topic}>{topic}</option>
              ))}
            </select>
            {errors.topic && <p className="text-red-500 text-xs mt-1">{errors.topic}</p>}
            {formData.chapterId && topics.length === 0 && (
              <p className="text-amber-600 text-xs mt-1">No topics available for this chapter</p>
            )}
            {!formData.chapterId && <p className="text-gray-500 text-xs mt-1">Please select a chapter first</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Question Type *</label>
            <select
              value={formData.type}
              onChange={(e) => {
                handleChange('type', e.target.value)
                // Set default options for true-false
                if (e.target.value === 'true-false') {
                  handleChange('options', [
                    { text: 'True', isCorrect: false, explanation: '' },
                    { text: 'False', isCorrect: false, explanation: '' }
                  ])
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              {QUESTION_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty *</label>
          <div className="flex gap-2">
            {DIFFICULTY_LEVELS.map(level => (
              <button
                key={level.value}
                type="button"
                onClick={() => handleChange('difficultyLevel', level.value)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${
                  formData.difficultyLevel === level.value
                    ? level.color + ' ring-2 ring-offset-2 ring-gray-400'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {level.label}
              </button>
            ))}
          </div>
        </div>

        {/* Case Study (for case-based questions) */}
        {formData.type === 'case-based' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Case Study</label>
            <textarea
              value={formData.caseStudy}
              onChange={(e) => handleChange('caseStudy', e.target.value)}
              rows={4}
              placeholder="Enter the case study or scenario..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        )}

        {/* Question Text */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Question Text *</label>
          <textarea
            value={formData.text}
            onChange={(e) => handleChange('text', e.target.value)}
            rows={3}
            placeholder="Enter the question..."
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${errors.text ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.text && <p className="text-red-500 text-xs mt-1">{errors.text}</p>}
        </div>

        {/* Options (for MCQ, True/False, Case-based) */}
        {typeConfig?.hasOptions && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Options * {formData.type === 'mcq-single' && '(Select one correct answer)'}
                {formData.type === 'mcq-multiple' && '(Select multiple correct answers)'}
              </label>
              {formData.type !== 'true-false' && formData.options.length < 6 && (
                <button
                  type="button"
                  onClick={addOption}
                  className="text-sm text-indigo-600 hover:text-indigo-800"
                >
                  + Add Option
                </button>
              )}
            </div>
            
            {errors.options && <p className="text-red-500 text-xs mb-2">{errors.options}</p>}
            {errors.correct && <p className="text-red-500 text-xs mb-2">{errors.correct}</p>}
            
            <div className="space-y-3">
              {formData.options.map((option, idx) => (
                <div key={idx} className={`p-3 border rounded-lg ${option.isCorrect ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-gray-500 w-6">{String.fromCharCode(65 + idx)}.</span>
                    
                    <input
                      type={formData.type === 'mcq-multiple' ? 'checkbox' : 'radio'}
                      name="correctOption"
                      checked={option.isCorrect}
                      onChange={(e) => handleOptionChange(idx, 'isCorrect', e.target.checked)}
                      className="w-4 h-4 text-green-600"
                    />
                    
                    <input
                      type="text"
                      value={option.text}
                      onChange={(e) => handleOptionChange(idx, 'text', e.target.value)}
                      placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                      className="flex-1 px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                      disabled={formData.type === 'true-false'}
                    />
                    
                    {formData.type !== 'true-false' && formData.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(idx)}
                        className="text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    )}
                  </div>
                  
                  <div className="mt-2 ml-14">
                    <input
                      type="text"
                      value={option.explanation || ''}
                      onChange={(e) => handleOptionChange(idx, 'explanation', e.target.value)}
                      placeholder="Explanation (why this is correct/incorrect)"
                      className="w-full px-3 py-1 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Numerical Answer */}
        {formData.type === 'numerical' && (
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Answer Value *</label>
              <input
                type="number"
                value={formData.numericalAnswer.value}
                onChange={(e) => handleChange('numericalAnswer', { ...formData.numericalAnswer, value: parseFloat(e.target.value) })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${errors.numericalAnswer ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.numericalAnswer && <p className="text-red-500 text-xs mt-1">{errors.numericalAnswer}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tolerance (±)</label>
              <input
                type="number"
                value={formData.numericalAnswer.tolerance}
                onChange={(e) => handleChange('numericalAnswer', { ...formData.numericalAnswer, tolerance: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
              <input
                type="text"
                value={formData.numericalAnswer.unit}
                onChange={(e) => handleChange('numericalAnswer', { ...formData.numericalAnswer, unit: e.target.value })}
                placeholder="e.g., meters, kg"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        )}

        {/* Expected Answer (Short/Long Answer) */}
        {(formData.type === 'short-answer' || formData.type === 'long-answer') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expected Answer *</label>
            <textarea
              value={formData.expectedAnswer}
              onChange={(e) => handleChange('expectedAnswer', e.target.value)}
              rows={formData.type === 'long-answer' ? 5 : 2}
              placeholder="Enter the model answer..."
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${errors.expectedAnswer ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.expectedAnswer && <p className="text-red-500 text-xs mt-1">{errors.expectedAnswer}</p>}
            
            {/* Keywords */}
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Keywords (for auto-grading)</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                  placeholder="Add keyword"
                  className="flex-1 px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={addKeyword}
                  className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.keywords.map((keyword, idx) => (
                  <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded flex items-center gap-1">
                    {keyword}
                    <button type="button" onClick={() => removeKeyword(keyword)} className="text-blue-600 hover:text-blue-800">×</button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Explanation */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Explanation</label>
          <textarea
            value={formData.explanation}
            onChange={(e) => handleChange('explanation', e.target.value)}
            rows={2}
            placeholder="Explain the correct answer and concept..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Correct Answer Display */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-semibold text-green-900 mb-1">Correct Answer</label>
              <p className="text-sm text-green-800 bg-white px-3 py-2 rounded border border-green-200 min-h-[40px]">
                {getCorrectAnswerDisplay()}
              </p>
              <p className="text-xs text-green-700 mt-1 italic">
                {formData.type === 'mcq-single' && 'Select the correct option above'}
                {formData.type === 'mcq-multiple' && 'Select all correct options above'}
                {formData.type === 'true-false' && 'Select True or False above'}
                {formData.type === 'numerical' && 'Enter the numerical answer value above'}
                {(formData.type === 'short-answer' || formData.type === 'long-answer' || formData.type === 'case-based') && 'Enter the expected answer above'}
              </p>
            </div>
          </div>
        </div>

        {/* Hint */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Hint (optional)</label>
          <input
            type="text"
            value={formData.hint || ''}
            onChange={(e) => handleChange('hint', e.target.value)}
            placeholder="A helpful hint for students..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Marks and Time */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Marks</label>
            <input
              type="number"
              value={formData.marks}
              onChange={(e) => handleChange('marks', parseInt(e.target.value) || 1)}
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Negative Marks</label>
            <input
              type="number"
              value={formData.negativeMarks}
              onChange={(e) => handleChange('negativeMarks', parseFloat(e.target.value) || 0)}
              min="0"
              step="0.5"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time (seconds)</label>
            <input
              type="number"
              value={formData.recommendedTime}
              onChange={(e) => handleChange('recommendedTime', parseInt(e.target.value) || 60)}
              min="10"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              placeholder="Add tag"
              className="flex-1 px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={addTag}
              className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.tags.map((tag, idx) => (
              <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded flex items-center gap-1">
                {tag}
                <button type="button" onClick={() => removeTag(tag)} className="text-gray-500 hover:text-gray-700">×</button>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t mt-4">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          {question ? 'Update Question' : 'Create Question'}
        </button>
      </div>
    </Modal>
  )
}

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { quizService, questionService, courseService } from '../../services/apiServices'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import ErrorMessage from '../../components/common/ErrorMessage'

export default function QuizCreate() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [courses, setCourses] = useState([])
  const [topics, setTopics] = useState([])
  const [questionStats, setQuestionStats] = useState(null)
  const [step, setStep] = useState(1)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    courseId: '',
    difficultyLevel: 'medium',
    duration: 30,
    totalMarks: 100,
    passingPercentage: 40,
    attemptsAllowed: 1,
    questionConfig: {
      totalQuestions: 20,
      topicWeightage: {},
      typeDistribution: {},
      difficultyDistribution: {
        easy: 0,
        medium: 0,
        hard: 0
      }
    },
    settings: {
      shuffleQuestions: true,
      shuffleOptions: true,
      negativeMarking: false,
      showCorrectAnswers: true,
      showExplanations: true,
      allowReview: true,
      preventTabSwitch: false,
      allowResume: true,
      autoSaveInterval: 30
    },
    instructions: ['Read each question carefully before answering.']
  })

  useEffect(() => {
    fetchCourses()
  }, [])

  useEffect(() => {
    if (formData.courseId) {
      fetchTopics()
      fetchQuestionStats()
    }
  }, [formData.courseId])

  const fetchCourses = async () => {
    try {
      const response = await courseService.getCourses()
      setCourses(response.courses || [])
    } catch (err) {
      setError('Failed to load courses')
    }
  }

  const fetchTopics = async () => {
    try {
      const response = await questionService.getTopicsForCourse(formData.courseId)
      setTopics(response.topics || [])
    } catch (err) {
      console.error('Failed to load topics:', err)
    }
  }

  const fetchQuestionStats = async () => {
    try {
      const response = await questionService.getQuestionStats(formData.courseId)
      setQuestionStats(response.stats)
    } catch (err) {
      console.error('Failed to load question stats:', err)
    }
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleConfigChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      questionConfig: {
        ...prev.questionConfig,
        [field]: value
      }
    }))
  }

  const handleSettingsChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [field]: value
      }
    }))
  }

  const handleTopicWeightageChange = (topic, weight) => {
    setFormData(prev => ({
      ...prev,
      questionConfig: {
        ...prev.questionConfig,
        topicWeightage: {
          ...prev.questionConfig.topicWeightage,
          [topic]: parseInt(weight) || 0
        }
      }
    }))
  }

  const handleAddInstruction = () => {
    setFormData(prev => ({
      ...prev,
      instructions: [...prev.instructions, '']
    }))
  }

  const handleInstructionChange = (index, value) => {
    const newInstructions = [...formData.instructions]
    newInstructions[index] = value
    setFormData(prev => ({
      ...prev,
      instructions: newInstructions
    }))
  }

  const handleRemoveInstruction = (index) => {
    setFormData(prev => ({
      ...prev,
      instructions: prev.instructions.filter((_, i) => i !== index)
    }))
  }

  const validateStep = (stepNumber) => {
    switch (stepNumber) {
      case 1:
        return formData.title && formData.courseId && formData.difficultyLevel
      case 2:
        return formData.questionConfig.totalQuestions > 0 && 
               formData.questionConfig.totalQuestions <= (questionStats?.totalQuestions || 0)
      case 3:
        return formData.duration > 0 && formData.totalMarks > 0
      default:
        return true
    }
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Clean up empty topic weightages
      const cleanedTopicWeightage = Object.fromEntries(
        Object.entries(formData.questionConfig.topicWeightage).filter(([_, v]) => v > 0)
      )
      
      const submitData = {
        ...formData,
        questionConfig: {
          ...formData.questionConfig,
          topicWeightage: cleanedTopicWeightage
        },
        instructions: formData.instructions.filter(i => i.trim() !== '')
      }
      
      await quizService.createQuiz(submitData)
      navigate('/tutor/quizzes')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create quiz')
    } finally {
      setLoading(false)
    }
  }

  const renderStep1 = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Quiz Title *</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder="e.g., Chapter 1: Linear Equations Quiz"
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Brief description of the quiz"
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Course *</label>
        <select
          value={formData.courseId}
          onChange={(e) => handleChange('courseId', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Select a course</option>
          {courses.map(course => (
            <option key={course._id} value={course._id}>
              {course.title} (Grade {course.grade})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty Level *</label>
        <div className="flex space-x-4">
          {['easy', 'medium', 'hard'].map(level => (
            <label key={level} className="flex items-center">
              <input
                type="radio"
                name="difficultyLevel"
                value={level}
                checked={formData.difficultyLevel === level}
                onChange={(e) => handleChange('difficultyLevel', e.target.value)}
                className="h-4 w-4 text-indigo-600"
              />
              <span className="ml-2 capitalize">{level}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Question Configuration</h2>

      {/* Question Stats Display */}
      {questionStats && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-medium text-blue-800 mb-2">Available Questions</h3>
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-blue-600">Total: </span>
              <span className="font-bold">{questionStats.totalQuestions}</span>
            </div>
            <div>
              <span className="text-green-600">Easy: </span>
              <span className="font-bold">{questionStats.byDifficulty?.easy || 0}</span>
            </div>
            <div>
              <span className="text-yellow-600">Medium: </span>
              <span className="font-bold">{questionStats.byDifficulty?.medium || 0}</span>
            </div>
            <div>
              <span className="text-red-600">Hard: </span>
              <span className="font-bold">{questionStats.byDifficulty?.hard || 0}</span>
            </div>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Total Questions * (max: {questionStats?.totalQuestions || 0})
        </label>
        <input
          type="number"
          min={1}
          max={questionStats?.totalQuestions || 100}
          value={formData.questionConfig.totalQuestions}
          onChange={(e) => handleConfigChange('totalQuestions', parseInt(e.target.value))}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Topic Weightage */}
      {topics.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Topic Weightage (optional - leave blank for equal distribution)
          </label>
          <div className="space-y-3">
            {topics.map(topic => (
              <div key={topic.topic} className="flex items-center space-x-4">
                <span className="w-48 text-sm text-gray-600">{topic.topic}</span>
                <span className="text-xs text-gray-400">({topic.questionCount} questions)</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={formData.questionConfig.topicWeightage[topic.topic] || ''}
                  onChange={(e) => handleTopicWeightageChange(topic.topic, e.target.value)}
                  placeholder="0"
                  className="w-20 border border-gray-300 rounded-lg px-3 py-1 text-center"
                />
                <span className="text-sm text-gray-400">%</span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Percentages should add up to 100. If left blank, questions will be selected randomly.
          </p>
        </div>
      )}
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Quiz Settings</h2>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes) *</label>
          <input
            type="number"
            min={1}
            max={300}
            value={formData.duration}
            onChange={(e) => handleChange('duration', parseInt(e.target.value))}
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Total Marks *</label>
          <input
            type="number"
            min={1}
            value={formData.totalMarks}
            onChange={(e) => handleChange('totalMarks', parseInt(e.target.value))}
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Passing Percentage</label>
          <input
            type="number"
            min={0}
            max={100}
            value={formData.passingPercentage}
            onChange={(e) => handleChange('passingPercentage', parseInt(e.target.value))}
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Attempts Allowed</label>
          <input
            type="number"
            min={1}
            max={10}
            value={formData.attemptsAllowed}
            onChange={(e) => handleChange('attemptsAllowed', parseInt(e.target.value))}
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
          />
        </div>
      </div>

      {/* Toggle Settings */}
      <div className="space-y-4">
        <h3 className="font-medium text-gray-900">Quiz Options</h3>
        
        {[
          { key: 'shuffleQuestions', label: 'Shuffle Questions', desc: 'Randomize question order for each attempt' },
          { key: 'shuffleOptions', label: 'Shuffle Options', desc: 'Randomize option order for MCQs' },
          { key: 'negativeMarking', label: 'Negative Marking', desc: 'Deduct marks for wrong answers' },
          { key: 'showCorrectAnswers', label: 'Show Correct Answers', desc: 'Display correct answers after submission' },
          { key: 'showExplanations', label: 'Show Explanations', desc: 'Display explanations after submission' },
          { key: 'allowReview', label: 'Allow Review', desc: 'Let students mark questions for review' },
          { key: 'allowResume', label: 'Allow Resume', desc: 'Allow resuming quiz if browser is closed' },
          { key: 'preventTabSwitch', label: 'Prevent Tab Switch', desc: 'Track when student switches tabs' }
        ].map(setting => (
          <label key={setting.key} className="flex items-start">
            <input
              type="checkbox"
              checked={formData.settings[setting.key]}
              onChange={(e) => handleSettingsChange(setting.key, e.target.checked)}
              className="h-4 w-4 text-indigo-600 mt-1"
            />
            <div className="ml-3">
              <span className="font-medium text-gray-900">{setting.label}</span>
              <p className="text-sm text-gray-500">{setting.desc}</p>
            </div>
          </label>
        ))}
      </div>
    </div>
  )

  const renderStep4 = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Instructions</h2>
      <p className="text-sm text-gray-500">Add instructions that will be shown to students before starting the quiz.</p>

      <div className="space-y-3">
        {formData.instructions.map((instruction, index) => (
          <div key={index} className="flex items-center space-x-2">
            <span className="text-gray-500">{index + 1}.</span>
            <input
              type="text"
              value={instruction}
              onChange={(e) => handleInstructionChange(index, e.target.value)}
              placeholder="Enter instruction"
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2"
            />
            {formData.instructions.length > 1 && (
              <button
                onClick={() => handleRemoveInstruction(index)}
                className="p-2 text-red-500 hover:text-red-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        ))}
        <button
          onClick={handleAddInstruction}
          className="flex items-center text-indigo-600 hover:text-indigo-800"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Instruction
        </button>
      </div>

      {/* Review Summary */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-4">Quiz Summary</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-gray-500">Title:</span> {formData.title}</div>
          <div><span className="text-gray-500">Course:</span> {courses.find(c => c._id === formData.courseId)?.title}</div>
          <div><span className="text-gray-500">Difficulty:</span> {formData.difficultyLevel}</div>
          <div><span className="text-gray-500">Questions:</span> {formData.questionConfig.totalQuestions}</div>
          <div><span className="text-gray-500">Duration:</span> {formData.duration} minutes</div>
          <div><span className="text-gray-500">Total Marks:</span> {formData.totalMarks}</div>
          <div><span className="text-gray-500">Passing:</span> {formData.passingPercentage}%</div>
          <div><span className="text-gray-500">Attempts:</span> {formData.attemptsAllowed}</div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={() => navigate('/tutor/quizzes')}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Quizzes
      </button>

      <h1 className="text-3xl font-bold text-gray-900 mb-8">Create Quiz</h1>

      {error && <ErrorMessage message={error} />}

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {['Basic Info', 'Questions', 'Settings', 'Review'].map((label, index) => (
            <div key={label} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step > index + 1 ? 'bg-green-500 text-white' :
                step === index + 1 ? 'bg-indigo-600 text-white' :
                'bg-gray-200 text-gray-600'
              }`}>
                {step > index + 1 ? '✓' : index + 1}
              </div>
              <span className={`ml-2 text-sm ${step === index + 1 ? 'text-indigo-600 font-medium' : 'text-gray-500'}`}>
                {label}
              </span>
              {index < 3 && (
                <div className={`w-24 h-0.5 mx-4 ${step > index + 1 ? 'bg-green-500' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={() => setStep(Math.max(1, step - 1))}
          disabled={step === 1}
          className="px-6 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
        >
          Previous
        </button>

        {step < 4 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={!validateStep(step)}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Quiz'}
          </button>
        )}
      </div>
    </div>
  )
}

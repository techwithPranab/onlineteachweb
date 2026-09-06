import { useState, useEffect } from 'react'
import { useQuery, useMutation } from 'react-query'
import Modal from '../common/Modal'
import { questionService } from '@/services/apiServices'
import { Sparkles, AlertCircle, CheckCircle, Loader } from 'lucide-react'
import { DIAGRAM_CATALOG, getRelevantDiagramTypes } from '../diagrams/diagramCatalog'
import MathDiagram from '../diagrams/MathDiagram'

const DIFFICULTY_LEVELS = [
  { value: 'easy', label: 'Easy', color: 'bg-green-100 text-green-800' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'hard', label: 'Hard', color: 'bg-red-100 text-red-800' },
  { value: 'olympiad', label: 'Olympiad 🏆', color: 'bg-purple-100 text-purple-800' }
]

const QUESTION_TYPES = [
  { value: 'mcq-single', label: 'Multiple Choice (Single Answer)' },
  { value: 'mcq-multiple', label: 'Multiple Choice (Multiple Answers)' },
  { value: 'true-false', label: 'True/False' },
  { value: 'numerical', label: 'Numerical' },
  { value: 'short-answer', label: 'Short Answer' },
  { value: 'long-answer', label: 'Long Answer' },
  { value: 'case-based', label: 'Case Study Based' }
]

const AI_PROVIDERS = [
  { value: 'openai', label: 'OpenAI GPT', models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'] },
  { value: 'anthropic', label: 'Anthropic Claude', models: ['claude-3', 'claude-2'] },
  { value: 'rule-based', label: 'Rule-Based (Free)', models: ['default'] }
]

export default function AIGenerationModal({ isOpen, onClose, onSuccess, courseId }) {
  const [formData, setFormData] = useState({
    courseId: courseId || '',
    chapterId: '',
    chapterName: '',
    topic: '',
    difficultyLevel: 'medium',
    questionType: 'mcq-single',
    count: 5,
    aiProvider: 'openai',
    model: 'gpt-4',
    imageBased: false
  })

  const [chapters, setChapters] = useState([])
  const [topics, setTopics] = useState([])
  const [availableModels, setAvailableModels] = useState([])

  // Fetch courses
  const { data: courses, isLoading: loadingCourses } = useQuery(
    'courses',
    () => questionService.getCourses(),
    {
      enabled: isOpen
    }
  )

  // Fetch course structure
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

  // AI generation mutation
  const generateMutation = useMutation(
    (params) => questionService.generateQuestionsWithAI(params),
    {
      onSuccess: (data) => {
        onSuccess?.(data)
        onClose()
      }
    }
  )

  useEffect(() => {
    if (formData.courseId !== courseId) {
      setFormData(prev => ({ ...prev, courseId: courseId || '' }))
    }
  }, [courseId])

  useEffect(() => {
    const provider = AI_PROVIDERS.find(p => p.value === formData.aiProvider)
    setAvailableModels(provider?.models || [])
    if (provider && !provider.models.includes(formData.model)) {
      setFormData(prev => ({ ...prev, model: provider.models[0] }))
    }
  }, [formData.aiProvider])

  const handleChange = (field, value) => {
    let updatedFormData = { ...formData, [field]: value }
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }))
    }

    // Handle chapter change
    if (field === 'chapterId') {
      const selectedChapter = chapters.find(c => c._id === value)
      if (selectedChapter) {
        setTopics(selectedChapter.topics || [])
        updatedFormData = {
          ...updatedFormData,
          chapterId: value,
          chapterName: selectedChapter.name,
          topic: ''
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

    // Handle course change
    if (field === 'courseId') {
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

    setFormData(updatedFormData)
  }

  const validate = () => {
    const newErrors = {}
    
    if (!formData.courseId) newErrors.courseId = 'Course is required'
    if (!formData.chapterId) newErrors.chapterId = 'Chapter is required'
    if (!formData.topic) newErrors.topic = 'Topic is required'
    if (formData.count < 1 || formData.count > 20) newErrors.count = 'Count must be between 1 and 20'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleGenerate = () => {
    if (!validate()) return

    // Auto-resolve diagram types from the selected topic and chapter
    const autoTypes = formData.imageBased
      ? getRelevantDiagramTypes(
          formData.topic ? [formData.topic] : topics.map(t => typeof t === 'string' ? t : t.name),
          null
        )
      : []

    generateMutation.mutate({
      ...formData,
      diagramTypes: autoTypes
    })
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-indigo-600" />
          <span>Generate Questions with AI</span>
        </div>
      }
      size="xl"
    >
      <div className="space-y-4">
        {/* Info Banner */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-indigo-800">
            <p className="font-medium">AI will generate questions based on your selection</p>
            <p className="mt-1">Select course, chapter, and topic to create contextual questions automatically.</p>
          </div>
        </div>

        {/* Selection Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Course *</label>
            <select
              value={formData.courseId}
              onChange={(e) => handleChange('courseId', e.target.value)}
              disabled={loadingCourses}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${
                errors.courseId ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">
                {loadingCourses ? 'Loading courses...' : 'Select Course'}
              </option>
              {courses?.map(course => (
                <option key={course._id} value={course._id}>{course.title}</option>
              ))}
            </select>
            {errors.courseId && <p className="text-red-500 text-xs mt-1">{errors.courseId}</p>}
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Chapter *</label>
            <select
              value={formData.chapterId}
              onChange={(e) => handleChange('chapterId', e.target.value)}
              disabled={!formData.courseId || loadingStructure}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${
                errors.chapterId ? 'border-red-500' : 'border-gray-300'
              } ${!formData.courseId ? 'bg-gray-100' : ''}`}
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

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Topic *</label>
            <select
              value={formData.topic}
              onChange={(e) => handleChange('topic', e.target.value)}
              disabled={!formData.chapterId}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${
                errors.topic ? 'border-red-500' : 'border-gray-300'
              } ${!formData.chapterId ? 'bg-gray-100' : ''}`}
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
              value={formData.questionType}
              onChange={(e) => handleChange('questionType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              {QUESTION_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty Level *</label>
            <select
              value={formData.difficultyLevel}
              onChange={(e) => handleChange('difficultyLevel', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              {DIFFICULTY_LEVELS.map(level => (
                <option key={level.value} value={level.value}>{level.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">AI Provider *</label>
            <select
              value={formData.aiProvider}
              onChange={(e) => handleChange('aiProvider', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              {AI_PROVIDERS.map(provider => (
                <option key={provider.value} value={provider.value}>{provider.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Model *</label>
            <select
              value={formData.model}
              onChange={(e) => handleChange('model', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              {availableModels.map(model => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Number of Questions * (1-20)
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={formData.count}
              onChange={(e) => handleChange('count', parseInt(e.target.value))}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${
                errors.count ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.count && <p className="text-red-500 text-xs mt-1">{errors.count}</p>}
          </div>

          {/* ── Image Based Option ── */}
          <div className="col-span-2">
            <div className={`rounded-xl border-2 transition-all p-3 ${formData.imageBased ? 'border-purple-400 bg-purple-50' : 'border-dashed border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🖼️</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Image Based Questions</p>
                    <p className="text-xs text-gray-500">SVG diagrams are auto-selected from the chapter topic</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.imageBased}
                    onChange={(e) => handleChange('imageBased', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-gray-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600" />
                </label>
              </div>

              {formData.imageBased && (() => {
                const autoTypes = getRelevantDiagramTypes(
                  formData.topic ? [formData.topic] : topics.map(t => typeof t === 'string' ? t : t.name),
                  null
                )
                const matchedDiagrams = DIAGRAM_CATALOG.filter(d => autoTypes.includes(d.type))
                return (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-semibold text-purple-800">Auto-matched diagram types:</p>
                    {matchedDiagrams.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {matchedDiagrams.map(d => (
                          <span
                            key={d.type}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-800 border border-purple-300 rounded-full text-xs font-medium"
                          >
                            {d.emoji} {d.label}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
                        ⚠️ Select a topic first — diagrams will be matched automatically.
                      </p>
                    )}
                  </div>
                )
              })()}
            </div>
          </div>
        </div>

        {/* Error/Success Messages */}
        {generateMutation.isError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">
              {generateMutation.error?.response?.data?.message || 'Failed to generate questions'}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            disabled={generateMutation.isLoading}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generateMutation.isLoading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-50"
          >
            {generateMutation.isLoading ? (
              <>
                <Loader className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate Questions
              </>
            )}
          </button>
        </div>

        {/* Generation Progress */}
        {generateMutation.isLoading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Loader className="h-5 w-5 text-blue-600 animate-spin" />
              <div>
                <p className="text-sm font-medium text-blue-900">Generating questions...</p>
                <p className="text-xs text-blue-700 mt-1">This may take a few moments. Please wait.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

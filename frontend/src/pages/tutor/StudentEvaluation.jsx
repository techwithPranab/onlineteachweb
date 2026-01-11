import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Award, TrendingUp, Star, Search, Filter, Send, Save, Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import { evaluationService, courseService, sessionService } from '@/services/apiServices'
import { useAuthStore } from '@/store/authStore'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import ErrorMessage from '@/components/common/ErrorMessage'
import Modal from '@/components/common/Modal'

export default function StudentEvaluation() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  const [selectedCourse, setSelectedCourse] = useState('')
  const [selectedSession, setSelectedSession] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showEvaluateModal, setShowEvaluateModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [selectedStudents, setSelectedStudents] = useState([])

  const [evaluationForm, setEvaluationForm] = useState({
    grade: '',
    feedback: '',
    strengths: '',
    improvements: '',
    achievements: [],
  })

  const achievementOptions = [
    'Excellent Participation',
    'Outstanding Performance',
    'Significant Improvement',
    'Punctuality',
    'Homework Completion',
    'Active Learning',
    'Helping Others',
    'Creative Thinking',
    'Problem Solving',
    'Leadership',
  ]

  // Fetch tutor's courses
  const { data: coursesData } = useQuery(
    ['tutorCourses', user?._id],
    () => courseService.getCourses({ tutorId: user._id })
  )

  // Fetch sessions for selected course
  const { data: sessionsData } = useQuery(
    ['courseSessions', selectedCourse],
    () => sessionService.getSessions({ courseId: selectedCourse }),
    { enabled: !!selectedCourse }
  )

  // Fetch enrolled students for selected course
  const { data: studentsData, isLoading, error, refetch } = useQuery(
    ['courseStudents', selectedCourse],
    () => courseService.getCourseStudents(selectedCourse),
    { enabled: !!selectedCourse }
  )

  // Fetch evaluations history
  const { data: evaluationsData } = useQuery(
    ['evaluations', selectedStudent?._id],
    () => evaluationService.getStudentEvaluations(selectedStudent._id),
    { enabled: !!selectedStudent }
  )

  // Submit evaluation mutation
  const submitEvaluationMutation = useMutation(
    (data) => evaluationService.createEvaluation(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('evaluations')
        setShowEvaluateModal(false)
        setSelectedStudent(null)
        resetForm()
      },
    }
  )

  // Bulk evaluation mutation
  const bulkEvaluationMutation = useMutation(
    (data) => evaluationService.createBulkEvaluation(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('evaluations')
        setShowBulkModal(false)
        setSelectedStudents([])
        resetForm()
      },
    }
  )

  const courses = coursesData?.data || []
  const sessions = sessionsData?.data || []
  const students = studentsData?.data || []
  const evaluations = evaluationsData?.data || []

  const resetForm = () => {
    setEvaluationForm({
      grade: '',
      feedback: '',
      strengths: '',
      improvements: '',
      achievements: [],
    })
  }

  const handleEvaluateClick = (student) => {
    setSelectedStudent(student)
    setShowEvaluateModal(true)
  }

  const handleSubmitEvaluation = (e, saveAsDraft = false) => {
    e.preventDefault()
    submitEvaluationMutation.mutate({
      studentId: selectedStudent._id,
      courseId: selectedCourse,
      sessionId: selectedSession,
      ...evaluationForm,
      status: saveAsDraft ? 'draft' : 'submitted',
    })
  }

  const handleBulkEvaluate = (e) => {
    e.preventDefault()
    bulkEvaluationMutation.mutate({
      studentIds: selectedStudents,
      courseId: selectedCourse,
      sessionId: selectedSession,
      ...evaluationForm,
    })
  }

  const toggleStudentSelection = (studentId) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    )
  }

  const toggleAllStudents = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([])
    } else {
      setSelectedStudents(filteredStudents.map((s) => s._id))
    }
  }

  const toggleAchievement = (achievement) => {
    setEvaluationForm((prev) => ({
      ...prev,
      achievements: prev.achievements.includes(achievement)
        ? prev.achievements.filter((a) => a !== achievement)
        : [...prev.achievements, achievement],
    }))
  }

  const filteredStudents = students.filter((student) =>
    student.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getGradeColor = (grade) => {
    if (grade >= 90) return 'text-green-600 bg-green-100'
    if (grade >= 80) return 'text-blue-600 bg-blue-100'
    if (grade >= 70) return 'text-yellow-600 bg-yellow-100'
    if (grade >= 60) return 'text-orange-600 bg-orange-100'
    return 'text-red-600 bg-red-100'
  }

  const EvaluationForm = ({ onSubmit, isBulk = false }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Course *</label>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            required
            className="input-field w-full"
          >
            <option value="">Select Course</option>
            {courses.map((course) => (
              <option key={course._id} value={course._id}>
                {course.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Session</label>
          <select
            value={selectedSession}
            onChange={(e) => setSelectedSession(e.target.value)}
            className="input-field w-full"
            disabled={!selectedCourse}
          >
            <option value="">General Evaluation</option>
            {sessions.map((session) => (
              <option key={session._id} value={session._id}>
                {session.title} - {new Date(session.scheduledAt).toLocaleDateString()}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Grade (0-100) *</label>
        <input
          type="number"
          value={evaluationForm.grade}
          onChange={(e) => setEvaluationForm({ ...evaluationForm, grade: e.target.value })}
          required
          min="0"
          max="100"
          className="input-field w-full"
          placeholder="Enter grade (0-100)"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Overall Feedback *</label>
        <textarea
          value={evaluationForm.feedback}
          onChange={(e) => setEvaluationForm({ ...evaluationForm, feedback: e.target.value })}
          required
          rows={4}
          className="input-field w-full"
          placeholder="Provide detailed feedback about student's performance..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Strengths</label>
        <textarea
          value={evaluationForm.strengths}
          onChange={(e) => setEvaluationForm({ ...evaluationForm, strengths: e.target.value })}
          rows={3}
          className="input-field w-full"
          placeholder="What did the student do well?"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Areas for Improvement</label>
        <textarea
          value={evaluationForm.improvements}
          onChange={(e) => setEvaluationForm({ ...evaluationForm, improvements: e.target.value })}
          rows={3}
          className="input-field w-full"
          placeholder="What can the student improve on?"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Achievements</label>
        <div className="grid grid-cols-2 gap-2">
          {achievementOptions.map((achievement) => (
            <label
              key={achievement}
              className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={evaluationForm.achievements.includes(achievement)}
                onChange={() => toggleAchievement(achievement)}
                className="rounded text-primary-600"
              />
              <span className="text-sm text-gray-700">{achievement}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={() => {
            isBulk ? setShowBulkModal(false) : setShowEvaluateModal(false)
            resetForm()
          }}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        {!isBulk && (
          <button
            type="button"
            onClick={(e) => handleSubmitEvaluation(e, true)}
            disabled={submitEvaluationMutation.isLoading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Draft
          </button>
        )}
        <button
          type="submit"
          disabled={submitEvaluationMutation.isLoading || bulkEvaluationMutation.isLoading}
          className="flex-1 btn-primary"
        >
          {submitEvaluationMutation.isLoading || bulkEvaluationMutation.isLoading ? (
            <><LoadingSpinner size="sm" /> Submitting...</>
          ) : (
            <>
              <Send className="w-4 h-4 inline mr-2" />
              Submit Evaluation
            </>
          )}
        </button>
      </div>
    </form>
  )

  if (!selectedCourse) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Student Evaluation</h1>
          <p className="text-gray-600">Grade and provide feedback to your students</p>
        </div>

        <div className="card">
          <div className="p-12 text-center">
            <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Course to Start</h3>
            <p className="text-gray-600 mb-6">Choose a course to view enrolled students and start evaluating</p>
            
            <div className="max-w-md mx-auto">
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="input-field w-full"
              >
                <option value="">Select Course</option>
                {courses.map((course) => (
                  <option key={course._id} value={course._id}>
                    {course.title} - Grade {course.grade}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) return <LoadingSpinner fullScreen />
  if (error) return <ErrorMessage message={error.message || 'Failed to load students'} onRetry={refetch} />

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Student Evaluation</h1>
        <p className="text-gray-600">
          Evaluating: <span className="font-medium">{courses.find(c => c._id === selectedCourse)?.title}</span>
        </p>
      </div>

      {/* Filters & Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search students..."
                className="input-field w-full pl-10"
              />
            </div>

            <select
              value={selectedCourse}
              onChange={(e) => {
                setSelectedCourse(e.target.value)
                setSelectedStudents([])
              }}
              className="input-field"
            >
              {courses.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            {selectedStudents.length > 0 && (
              <button
                onClick={() => setShowBulkModal(true)}
                className="btn-primary flex items-center gap-2"
              >
                <Award className="w-4 h-4" />
                Bulk Evaluate ({selectedStudents.length})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                    onChange={toggleAllStudents}
                    className="rounded text-primary-600"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Enrolled
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Evaluation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => {
                  const lastEval = evaluations.find(e => e.studentId === student._id)
                  return (
                    <tr key={student._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(student._id)}
                          onChange={() => toggleStudentSelection(student._id)}
                          className="rounded text-primary-600"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-medium">
                            {student.name?.charAt(0) || 'S'}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">{student.name || 'Unknown'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {student.email}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(student.enrolledAt || Date.now()).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        {lastEval ? (
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getGradeColor(lastEval.grade)}`}>
                              {lastEval.grade}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(lastEval.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Not evaluated</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {lastEval ? (
                          <span className="flex items-center gap-1 text-sm text-green-600">
                            <CheckCircle2 className="w-4 h-4" />
                            Evaluated
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-sm text-orange-600">
                            <AlertCircle className="w-4 h-4" />
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleEvaluateClick(student)}
                          className="text-primary-600 hover:text-primary-800 font-medium text-sm"
                        >
                          Evaluate
                        </button>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="text-gray-400">
                      <AlertCircle className="w-12 h-12 mx-auto mb-3" />
                      <p className="text-sm">No students found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Evaluate Single Student Modal */}
      <Modal
        isOpen={showEvaluateModal}
        onClose={() => {
          setShowEvaluateModal(false)
          setSelectedStudent(null)
          resetForm()
        }}
        title={`Evaluate ${selectedStudent?.name || 'Student'}`}
        size="lg"
      >
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-medium text-lg">
              {selectedStudent?.name?.charAt(0) || 'S'}
            </div>
            <div>
              <div className="font-medium text-gray-900">{selectedStudent?.name}</div>
              <div className="text-sm text-gray-600">{selectedStudent?.email}</div>
            </div>
          </div>

          {/* Previous Evaluations */}
          {evaluations.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Previous Evaluations</h4>
              <div className="space-y-2">
                {evaluations.slice(0, 3).map((evaluation) => (
                  <div key={evaluation._id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      {new Date(evaluation.createdAt).toLocaleDateString()}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getGradeColor(evaluation.grade)}`}>
                      {evaluation.grade}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <EvaluationForm onSubmit={(e) => handleSubmitEvaluation(e, false)} />
      </Modal>

      {/* Bulk Evaluate Modal */}
      <Modal
        isOpen={showBulkModal}
        onClose={() => {
          setShowBulkModal(false)
          setSelectedStudents([])
          resetForm()
        }}
        title={`Bulk Evaluate ${selectedStudents.length} Students`}
        size="lg"
      >
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            You are about to evaluate {selectedStudents.length} students with the same grade and feedback.
          </p>
        </div>

        <EvaluationForm onSubmit={handleBulkEvaluate} isBulk />
      </Modal>
    </div>
  )
}
